import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';

// The OpenHIM Mediator Utils is an essential package for quick mediator setup.
// It handles the OpenHIM authentication, mediator registration, and mediator heartbeat.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { activateHeartbeat, registerMediator } from 'openhim-mediator-utils';

import { AppUtil } from './app.util';
import { ConfigService } from '@nestjs/config';
import { OpenHimCore } from './config/configuration';

@Injectable()
export class OpenHimSetup {
  constructor(private appUtil: AppUtil, private configService: ConfigService) {}

  public mediatorSetup(): void {
    // The mediatorConfig file contains some basic configuration settings about the mediator
    // as well as details about the default channel setup.
    const mediatorConfigFile = fs.readFileSync(
      path.resolve(__dirname, '..', 'mediatorConfig.json'),
      'utf-8',
    );

    let mediatorConfig;
    try {
      mediatorConfig = JSON.parse(mediatorConfigFile);
    } catch (error) {
      Logger.error(
        `Failed to parse JSON in mediatorConfig.json`,
        OpenHimSetup.name,
      );
      throw error;
    }

    this.appUtil.setMediatorUrn(mediatorConfig.urn);

    const openHIM = this.configService.get<OpenHimCore>('openHIM');

    const openHimConfig = {
      apiURL: openHIM?.core.baseURL,
      password: openHIM?.core.password,
      username: openHIM?.core.username,
      trustSelfSigned: true,
      urn: mediatorConfig.urn,
    };

    // The purpose of registering the mediator is to allow easy communication between the mediator and the OpenHIM.
    // The details received by the OpenHIM will allow quick channel setup which will allow tracking of requests from
    // the client through any number of mediators involved and all the responses along the way(if the mediators are
    // properly configured). Moreover, if the request fails for any reason all the details are recorded and it can
    // be replayed at a later date to prevent data loss.
    registerMediator(openHimConfig, mediatorConfig, (err: Error) => {
      if (err) {
        throw new Error(
          `Failed to register mediator. Check your Config: ${err.message}`,
        );
      }

      Logger.log('Successfully registered mediator!', OpenHimSetup.name);

      // The activateHeartbeat method returns an Event Emitter which allows the mediator to attach listeners waiting
      // for specific events triggered by OpenHIM responses to the mediator posting its heartbeat.
      const emitter = activateHeartbeat(openHimConfig);
      emitter.on('error', (err: Error) => {
        Logger.error(
          `Heartbeat failed: ${JSON.stringify(err)}`,
          OpenHimSetup.name,
        );
      });
    });
  }
}
