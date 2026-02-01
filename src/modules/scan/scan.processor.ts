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
import type { TrivyVulnerability } from './types/trivy';
import { RemoteRepoHelper } from '../../helpers/remote-repo/remote-repo.helper';
import { TrivyScanHelper } from '../../helpers/trivy/trivy.scan.helper';
import { TrivyReadReportsHelper } from '../../helpers/trivy/trivy.read-reports.helper';
import { CleanupHelper } from '../../helpers/cleanup/cleanup.helper';

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

    private readonly trivyScanner: TrivyScanHelper,

    private readonly trivyReader: TrivyReadReportsHelper,

    private readonly cleanupHelper: CleanupHelper,
  ) {}

  @Process('scan-repo')
  async handleScan(job: Job<ScanJobOptions>): Promise<void> {
    const { scanId, repoUrl } = job.data;
    this.logger.debug(
      `Scan processor handle scan started for scanId=${scanId}, repoUrl=${repoUrl}`,
    );

    let localRepoPath: string = '';
    let reportPath: string = '';

    try {
      this.logger.debug('Updating scan status to Scanning...');
      await this.scanRepository.updateStatus(scanId, ScanStatus.Scanning);

      this.logger.debug(`Cloning remote repo: ${repoUrl}`);
      localRepoPath = await this.cloneRemoteRepo(repoUrl);

      this.logger.debug(`Generating trivy report, dir path: ${localRepoPath}`);
      reportPath = await this.generateTrivyReport(scanId, localRepoPath);

      this.logger.debug(
        `Parsing report and storing critical vulnerabilities, report path: ${reportPath}`,
      );
      await this.readReport(scanId, reportPath);

      this.logger.debug('Updating scan status to Finished...');
      await this.scanRepository.updateStatus(scanId, ScanStatus.Finished);
    } catch (error) {
      this.logger.error('Failed to handle scan repo');
      this.logger.error(error);
      await this.scanRepository.updateStatus(scanId, ScanStatus.Failed);

      throw error;
    } finally {
      this.logger.debug('Cleaning up repo files');
      await this.cleanupRepo(localRepoPath);
      this.logger.debug('Cleaning up report files');
      await this.cleanupReport(reportPath);
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

      const { reportPath } = await this.trivyScanner.scanDirectory(
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

  private async readReport(scanId: string, reportPath: string): Promise<void> {
    try {
      const criticalVulnerabilities: TrivyVulnerability[] =
        await this.trivyReader.readCriticalVulnerabilities(reportPath);

      this.logger.debug(
        `Parsed report and found critical vulnerabilities: ${criticalVulnerabilities.length}`,
      );

      await this.scanRepository.storeCriticalVulnerabilities(
        scanId,
        criticalVulnerabilities,
      );
    } catch (error: unknown) {
      this.logger.error(`Failed to read report for scanId=${scanId}`);
      this.logger.error(error);
      throw error;
    }
  }

  private async cleanupRepo(localRepoPath: string): Promise<void> {
    try {
      await this.cleanupHelper.cleanupDir(localRepoPath);

      this.logger.debug(`Cleanup completed for localRepoPath=${localRepoPath}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to cleanup localRepoPath=${localRepoPath}`);
      this.logger.error(error);
      throw error;
    }
  }

  private async cleanupReport(reportPath: string): Promise<void> {
    try {
      await this.cleanupHelper.cleanupFile(reportPath);

      this.logger.debug(`Cleanup completed for reportPath=${reportPath}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to cleanup reportPath=${reportPath}`);
      this.logger.error(error);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ScanJobOptions>): void {
    const { id: jobId, data: { scanId, repoUrl } = {} } = job;
    this.logger.info(
      `Job completed, scanId=${scanId}, repoUrl=${repoUrl}, jobId=${jobId}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<ScanJobOptions>, error: Error): void {
    const { id: jobId, data: { scanId, repoUrl } = {} } = job;
    this.logger.error(
      `Job failed, scanId=${scanId}, repoUrl=${repoUrl}, jobId=${jobId}`,
    );
    this.logger.error(error);
  }
}
