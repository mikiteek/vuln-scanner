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
import { RemoteRepoHelper } from '../../helpers/remote-repo/remote-repo.helper';
import { TrivyHelper } from '../../helpers/trivy/trivy.helper';

type ScanJobOptions = {
  scanId: string;
  repoUrl: string;
};

@Processor('scan')
export class ScanProcessor {
  constructor(
    private readonly logger: PinoLogger,

    private readonly scanRepository: ScanRepository,

    private readonly remoteRepoHelper: RemoteRepoHelper,

    private readonly trivyHelper: TrivyHelper,
  ) {}

  @Process('scan-repo')
  async handleScan(job: Job<ScanJobOptions>): Promise<void> {
    const { scanId, repoUrl } = job.data;
    this.logger.debug(
      `Scan processor handle scan started for scanId=${scanId}, repoUrl=${repoUrl}`,
    );

    try {
      this.logger.debug('Updating scan status to Scanning...');
      await this.scanRepository.updateStatus(scanId, ScanStatus.Scanning);

      this.logger.debug(`Cloning remote repo: ${repoUrl}`);
      const localRepoPath = await this.cloneRemoteRepo(repoUrl);

      this.logger.debug(`Generating trivy report, dir path: ${localRepoPath}`);
      const reportPath = await this.generateTrivyReport(scanId, localRepoPath);

      this.logger.debug(
        `Parsing report and storing critical vulnerabilities, report path: ${reportPath}`,
      );

      // TODO read report storing critical vulnerabilities
    } catch (error) {
      this.logger.error('Failed to handle scan repo');
      this.logger.error(error);
      await this.scanRepository.updateStatus(scanId, ScanStatus.Failed);

      throw error;
    }
  }

  private async cloneRemoteRepo(repoUrl: string) {
    try {
      const localRepoPath = await this.remoteRepoHelper.clone(repoUrl);
      this.logger.debug(
        `Repository cloned into localRepoPath=${localRepoPath}, repoUrl=${repoUrl}`,
      );

      return localRepoPath;
    } catch (error: unknown) {
      this.logger.error(`Failed to clone repository for repoUrl=${repoUrl}`);
      this.logger.error(error);
      throw error;
    }
  }

  private async generateTrivyReport(scanId: string, localRepoPath: string) {
    try {
      this.logger.debug(
        `Generating Trivy report for scanId=${scanId}, localRepoPath=${localRepoPath}`,
      );

      const { reportPath } = await this.trivyHelper.scanDirectory(
        scanId,
        localRepoPath,
      );

      this.logger.debug(`Trivy report generated: ${reportPath}`);

      return reportPath;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate Trivy report for scanId=${scanId}`);
      this.logger.error(error);
      throw error;
    }
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
