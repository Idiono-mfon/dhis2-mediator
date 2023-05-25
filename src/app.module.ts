import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import {
  dhis2Config,
  fhirConfig,
  openHimConfig,
  serverConfig,
} from './config/configuration.js';
import { AppUtil } from './app.util.js';
import { OpenHimSetup } from './openhim.setup.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, fhirConfig, dhis2Config, openHimConfig],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppUtil, OpenHimSetup],
})
export class AppModule {}
