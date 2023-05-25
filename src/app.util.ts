import { Injectable } from '@nestjs/common';

@Injectable()
export class AppUtil {
  private urn: string;

  public setMediatorUrn(mediatorUrn: string): void {
    this.urn = mediatorUrn;
  }

  // The OpenHIM accepts a specific response structure which allows transactions to display correctly
  // The openhimTransactionStatus can be one of the following values:
  // Successful, Completed, Completed with Errors, Failed, or Processing
  public buildReturnObject(
    openhimTransactionStatus: string,
    httpResponseStatusCode: number,
    responseBody: any,
  ): OpenHimResponseObject {
    const response = {
      status: httpResponseStatusCode,
      headers: { 'content-type': 'application/json' },
      body: responseBody,
      timestamp: new Date(),
    };
    return {
      'x-mediator-urn': this.urn,
      status: openhimTransactionStatus,
      response,
      properties: { property: 'Primary Route' },
    };
  }
}

export type OpenHimResponseObject = {
  'x-mediator-urn': string;
  status: string;
  response: {
    status: number;
    headers: {
      'content-type': string;
    };
    body: any;
    timestamp: Date;
  };
  properties: {
    property: string;
  };
};
