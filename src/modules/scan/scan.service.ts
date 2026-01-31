import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ScanStatus } from './types/scan';
import { TrivyVulnerability } from './types/trivy';

@Injectable()
export class ScanService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  async scan(repoUrl: string): Promise<{
    id: string;
    status: ScanStatus;
    criticalVulnerabilities: TrivyVulnerability[];
  }> {
    this.logger.debug(`ScanService scan: ${repoUrl}`);

    const scanId = randomUUID();

    await this.scanQueue.add('scan-repo', {
      scanId,
      repoUrl,
    });

    return {
      id: scanId,
      status: ScanStatus.Queued,
      criticalVulnerabilities: [],
    };
  }
}
