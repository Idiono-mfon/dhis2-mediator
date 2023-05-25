export const serverConfig = (): ServerConfig => ({
  port: Number(process.env.PORT) || 9078,
  environment: String(process.env.NODE_ENV) || 'production',
});

export const fhirConfig = (): FhirConfig => ({
  fhir: {
    baseURL:
      String(process.env.FHIR_SERVER_URL) ||
      'https://fhir-server-service.lafia.io/fhir',
  },
});

export const openHimConfig = (): OpenHimConfig => ({
  openHIM: {
    core: {
      baseURL:
        String(process.env.OPENHIM_CORE_URL) || 'https://146.190.184.187:8080',
      username: String(process.env.OPENHIM_CORE_USERNAME) || 'root@openhim.org',
      password: passRequiredCheck('OPENHIM_CORE_PASSWORD'),
    },
  },
});

export const dhis2Config = (): Dhis2Config => ({
  dhis2: {
    baseURL: String(process.env.DHIS2_BASE_URL) || 'https://play.dhis2.org/dev',
    username: String(process.env.DHIS2_USERNAME) || 'admin',
    password: passRequiredCheck('DHIS2_PASSWORD'),
    orgUnit:
      String(process.env.DHIS2_ORG_UNIT_PATH) ||
      '/api/organisationUnits.json?fields=id,code,name,description,parent[id]&paging=false',
    optionSet:
      String(process.env.DHIS2_OPTION_SET_PATH) ||
      '/api/optionSets.json?fields=id,code,name,description,version,options[id,code,name]&paging=false&filter=id:eq:HB33RvLvVZe',
    trackedEntityInstance:
      String(process.env.DHIS2_TRACKED_ENTITY_INSTANCE_PATH) ||
      '/api/trackedEntityInstances.json?ou=DiszpKrYNg8&program=IpHINAT79UW',
  },
});

function passRequiredCheck(passEnvName: string): string {
  const password = String(process.env[passEnvName]);
  if (!password) {
    throw new Error(`Missing required environment variable: ${passEnvName}`);
  }

  return password;
}

export type ServerConfig = {
  port: number;
  environment: string;
};

type FhirConfig = {
  fhir: FhirBaseURL;
};

export type FhirBaseURL = BaseURL;

type OpenHimConfig = {
  openHIM: OpenHimCore;
};

export type OpenHimCore = {
  core: AuthCredentials & BaseURL;
};

type Dhis2Config = {
  dhis2: Dhis2;
};

export type Dhis2 = AuthCredentials & ResourcePath & BaseURL;

type BaseURL = {
  baseURL: string;
};

type AuthCredentials = {
  username: string;
  password: string;
};

type ResourcePath = {
  orgUnit: string;
  optionSet: string;
  trackedEntityInstance: string;
};
