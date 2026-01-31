import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { PinoLogger } from 'nestjs-pino';
import type { Job } from 'bull';
import { ScanRepository } from './scan.repository';
import { ScanStatus } from './types/scan';

type ScanJobOptions = {
  scanId: string;
  repoUrl: string;
};

@Processor('scan')
export class ScanProcessor {
  constructor(
    private readonly logger: PinoLogger,

    private readonly scanRepository: ScanRepository,
  ) {}

  @Process('scan-repo')
  async handleScan(job: Job<ScanJobOptions>): Promise<void> {
    const { scanId, repoUrl } = job.data;
    this.logger.debug(
      `Scan processor handle scan started for scanId=${scanId}, repoUrl=${repoUrl}`,
    );

    // update status to SCANNING
    await this.scanRepository.updateStatus(scanId, ScanStatus.Scanning);

    // clone repo implementation
    
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ScanJobOptions>): void {
    const { id: jobId, data: { scanId, repoUrl } = {} } = job;
    this.logger.debug('Job completed', {
      scanId,
      repoUrl,
      jobId,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job<ScanJobOptions>, error: Error): void {
    const { id: jobId, data: { scanId, repoUrl } = {} } = job;
    this.logger.error('Job failed', {
      scanId,
      repoUrl,
      jobId,
      error,
    });
  }
}
