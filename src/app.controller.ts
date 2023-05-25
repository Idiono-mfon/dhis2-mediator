import { Body, Controller, Post } from '@nestjs/common';
import { AppService, Dhis2ToFhirDataOptions } from './app.service.js';

@Controller('/dhis2-to-fhir')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  public dhis2ToFhir(@Body() data: Dhis2ToFhirDataOptions) {
    return this.appService.dhis2ToFhir(data);
  }
}
