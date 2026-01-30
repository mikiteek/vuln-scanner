import { Injectable } from '@nestjs/common';
import { ScanStatus } from './types/scan';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Injectable()
export class ScanService {
  constructor(private readonly logger: PinoLogger) {}

  async scan(repoUrl: string): Promise<{
    id: string;
    status: ScanStatus;
    criticalVulnerabilities: any[];
  }> {
    this.logger.debug(`ScanService scan: ${repoUrl}`);

    // temporary mock the response
    return Promise.resolve({
      id: randomUUID(),
      status: ScanStatus.Queued,
      criticalVulnerabilities: [],
    });
  }
}
