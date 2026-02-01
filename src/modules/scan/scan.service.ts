import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ScanRepository } from './scan.repository';
import { ScanResponse, ScanStatus } from './types/scan';

@Injectable()
export class ScanService {
  constructor(
    private readonly logger: PinoLogger,

    private readonly scanRepository: ScanRepository,

    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  async addScanJobToQueue(scanId: string, repoUrl: string): Promise<void> {
    try {
      await this.scanQueue.add('scan-repo', {
        scanId,
        repoUrl,
      });
    } catch (error) {
      this.logger.error(
        `Error on adding job to queue scanId=${scanId}, repoUrl=${repoUrl}`,
      );
      this.logger.error(error);
      throw error;
    }
  }

  async scan(repoUrl: string): Promise<ScanResponse> {
    const scanDoc = await this.scanRepository.storeQueuedScan(repoUrl);
    const scanId = scanDoc.id;

    try {
      await this.addScanJobToQueue(scanId, repoUrl);
    } catch (error) {
      this.logger.warn('Failed to add scanJobToQueue');

      await this.scanRepository.updateStatus(scanId, ScanStatus.Failed);
      throw error;
    }

    return {
      id: scanId,
      status: ScanStatus.Queued,
      repoUrl,
      criticalVulnerabilities: [],
    };
  }

  async fetchScan(scanId: string): Promise<ScanResponse | null> {
    const scanDoc = await this.scanRepository.fetchScan(scanId);
    if (!scanDoc) {
      return null;
    }

    const { status, repoUrl, criticalVulnerabilities } = scanDoc.toObject();

    return {
      id: scanId,
      status,
      repoUrl,
      criticalVulnerabilities,
    };
  }
}
