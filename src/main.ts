import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { OpenHimSetup } from './openhim.setup.js';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const openHim = app.get<OpenHimSetup>(OpenHimSetup);
  const configService = app.get<ConfigService>(ConfigService);
  const PORT = configService.get<number>('port') as number;

  await app.listen(PORT).then(() => {
    // openHim.mediatorSetup();
  });
}

bootstrap().then();
