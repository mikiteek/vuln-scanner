import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { PinoLogger } from 'nestjs-pino';
import type { Job } from 'bull';

type ScanJobOptions = {
  scanId: string;
  repoUrl: string;
};

@Processor('scan')
export class ScanProcessor {
  constructor(private readonly logger: PinoLogger) {}

  @Process('scan-repo')
  async handleScan(job: Job<ScanJobOptions>): Promise<void> {
    const { scanId, repoUrl } = job.data;

    this.logger.info({ scanId, repoUrl });
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ScanJobOptions>): void {
    this.logger.info('Job completed', {
      scanId: job.data?.scanId,
      jobId: job.id,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job<ScanJobOptions>, err: Error): void {
    this.logger.error('Job failed', {
      scanId: job.data?.scanId,
      jobId: job.id,
      err: err.message,
    });
  }
}
