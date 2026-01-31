import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { ScanResponse, ScanStatus } from './types/scan';
import { SCAN_MODEL_NAME, ScanDocument, ScanSchemaDef } from './scan.schema';

@Injectable()
export class ScanService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectQueue('scan') private readonly scanQueue: Queue,
    @InjectModel(SCAN_MODEL_NAME)
    private readonly scanModel: Model<ScanSchemaDef>,
  ) {}

  async storeQueuedScan(repoUrl: string): Promise<ScanDocument> {
    try {
      return await this.scanModel.create({
        repoUrl,
        status: ScanStatus.Queued,
        criticalVulnerabilities: [],
      });
    } catch (error) {
      this.logger.error(`Error on storing queued scanning, repoUrl=${repoUrl}`);
      this.logger.error(error);
      throw error;
    }
  }

  async updateScanToFailed(scanId: string): Promise<void> {
    try {
      await this.scanModel.findByIdAndUpdate(scanId, {
        status: ScanStatus.Failed,
      });
    } catch (error) {
      this.logger.error(`Error on updating scanIdToFailed=${scanId}`);
      this.logger.error(error);
      throw error;
    }
  }

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
    this.logger.debug(`ScanService scan: ${repoUrl}`);

    const scanDoc = await this.storeQueuedScan(repoUrl);
    const scanId = scanDoc.id;

    this.logger.info(`Scan id=${scanId}`);
    try {
      await this.addScanJobToQueue(scanId, repoUrl);
    } catch (error) {
      this.logger.warn('Failed to add scanJobToQueue');

      await this.updateScanToFailed(scanId);
      throw error;
    }

    return {
      id: scanId,
      status: ScanStatus.Queued,
      repoUrl,
      criticalVulnerabilities: [],
    };
  }
}
