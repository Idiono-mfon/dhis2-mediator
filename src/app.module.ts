import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  dhis2Config,
  fhirConfig,
  openHimConfig,
  serverConfig,
} from './config/configuration';
import { AppUtil } from './app.util';
import { OpenHimSetup } from './openhim.setup';

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
