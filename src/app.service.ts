import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppUtil } from './app.util.js';
import axios from 'axios';
import { Dhis2 } from './config/configuration.js';

@Injectable()
export class AppService {
  private readonly dhis2Config: Dhis2;

  constructor(private configService: ConfigService, private appUtil: AppUtil) {
    this.dhis2Config = this.configService.get<Dhis2>('dhis2') as Dhis2;
  }

  private getTeiAttributeValue(
    attrKey: string,
    attributes: [{ attribute: string; value: string }],
  ): string {
    let value = '';

    for (const tEntity of attributes) {
      if (tEntity.attribute === attrKey) {
        value = tEntity.value;
      }
    }

    return value;
  }

  private async dhis2TrackedEntityInstanceToFhirPatients(): Promise<any[]> {
    const {
      baseURL,
      trackedEntityInstance: trackedEntityInstancePath,
      password,
      username,
    } = this.dhis2Config;
    const axiosResponse = await axios.get(
      `${baseURL}/${trackedEntityInstancePath}`,
      {
        headers: {
          'content-type': 'application/json',
        },
        auth: {
          username,
          password,
        },
      },
    );

    const trackedEntityInstances = axiosResponse.data.trackedEntityInstances;
    const patients: any[] = [];

    for (const tei of trackedEntityInstances) {
      const patient = {
        resource: {
          resourceType: 'Patient',
          id: tei.trackedEntityInstance,
          identifier: [
            {
              system: `${baseURL}/api/trackedEntityInstances`,
              value: tei.trackedEntityInstance,
            },
          ],
          name: [
            {
              family: this.getTeiAttributeValue('tkgQSC11g4f', tei.attributes),
              given: [this.getTeiAttributeValue('fyCOYaKMuLq', tei.attributes)],
            },
          ],
          gender: this.getTeiAttributeValue(
            'raVYuwca9Ry',
            tei.attributes,
          ).toLowerCase(),
          managingOrganization: {
            reference: `Organization?identifier=${tei.orgUnit}`,
          },
        },
        request: {
          method: 'PUT',
          url: `Patient?identifier=${tei.trackedEntityInstance}`,
        },
      };

      patients.push(patient);
    }
    return patients;
  }

  private async dhis2OrganisationUnitsToFhirOrganizations(): Promise<any[]> {
    const {
      baseURL,
      orgUnit: orgUnitPath,
      password,
      username,
    } = this.dhis2Config;
    const axiosResponse = await axios.get(`${baseURL}/${orgUnitPath}`, {
      headers: {
        'content-type': 'application/json',
      },
      auth: {
        username,
        password,
      },
    });

    const orgUnits = axiosResponse.data.organisationUnits;
    const organizations: any[] = [];

    for (const orgUnit of orgUnits) {
      const organization = {
        resource: {
          resourceType: 'Organization',
          id: orgUnit.id,
          identifier: [
            {
              system: `${baseURL}/api/organisationUnits`,
              value: orgUnit.id,
            },
          ],
          type: [
            {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/organization-type',
                  code: 'prov',
                  display: 'Facility',
                },
              ],
            },
          ],
          name: orgUnit.name,
        },
        request: {
          method: 'POST',
          url: `Organization?identifier=${orgUnit.id}`,
          ifNoneExist: `identifier=${orgUnit.id}`,
        },
      };

      if (orgUnit.code) {
        organization.resource.identifier.push({
          system: 'https://play.dhis2.org/40.0.0/api/organisationUnits',
          value: orgUnit.code,
        });
      }

      const location = {
        resource: {
          resourceType: 'Location',
          id: orgUnit.id,
          identifier: [
            {
              system: `${baseURL}/api/organisationUnits`,
              value: orgUnit.id,
            },
            {
              system: 'https://play.dhis2.org/40.0.0/api/organisationUnits',
              value: orgUnit.code || 'orgUnit_code',
            },
          ],
          status: 'active',
          name: orgUnit.name,
          mode: 'instance',
          type: [
            {
              text: 'OF',
            },
          ],
          physicalType: {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/location-physical-type',
                code: 'si',
              },
            ],
          },
          managingOrganization: {
            reference: `Organization/${orgUnit.id}`,
          },
        },
        request: {
          method: 'POST',
          url: `Location?identifier=${orgUnit.id}`,
          ifNoneExist: `identifier=${orgUnit.id}`,
        },
      };

      if (orgUnit.parent) {
        // @ts-ignore
        location.resource.partOf = {
          reference: `Location/${orgUnit?.parent?.id}`,
        };
      }

      organizations.push(organization, location);
    }

    return organizations;
  }

  public async dhis2ToFhir(data: Dhis2ToFhirDataOptions) {
    const resources: any[] = [];
    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [],
    };

    if (data.organisationUnits) {
      const org = await this.dhis2OrganisationUnitsToFhirOrganizations();

      if (org) {
        resources.push(...org);
      }
    }

    if (data.trackedEntityInstances) {
      const patients = await this.dhis2TrackedEntityInstanceToFhirPatients();

      if (patients) {
        resources.push(...patients);
      }
    }

    if (resources.length < 1) {
      Logger.log(
        'No data was pulled from DHIS2. Ensure that you select a resource',
        AppService.name,
      );

      return this.appUtil.buildReturnObject('Completed', 200, {
        message:
          'No data was pulled from DHIS2. Ensure that you select a resource',
        data: [],
      });
    } else {
      // @ts-ignore
      fhirBundle.entry.push(...resources);

      const axiosResponse = await axios.post(
        this.configService.get<string>('fhir.baseURL') as string,
        fhirBundle,
      );

      Logger.log('DHIS2 data to FHIR successful ', AppService.name);

      return this.appUtil.buildReturnObject(
        'Successful',
        axiosResponse.status,
        axiosResponse.data,
      );
    }
  }
}

export type Dhis2ToFhirDataOptions = {
  optionSets: boolean;
  organisationUnits: boolean;
  trackedEntityInstances: boolean;
};
