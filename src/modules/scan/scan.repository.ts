import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { ScanStatus } from './types/scan';
import { SCAN_MODEL_NAME, ScanDocument, ScanSchemaDef } from './scan.schema';

@Injectable()
export class ScanRepository {
  constructor(
    private readonly logger: PinoLogger,

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
}
