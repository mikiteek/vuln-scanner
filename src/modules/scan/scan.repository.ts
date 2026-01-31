import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { ScanStatus } from './types/scan';
import type { TrivyVulnerability } from './types/trivy';
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

  async updateStatus(scanId: string, status: ScanStatus): Promise<void> {
    try {
      const updated = await this.scanModel.findByIdAndUpdate(
        scanId,
        {
          status: status,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updated) {
        throw new Error(`Scan record with id=${scanId} not found`);
      }
    } catch (error) {
      this.logger.error(`Error on updating scanId=${scanId}, status=${status}`);
      this.logger.error(error);
      throw error;
    }
  }

  async storeCriticalVulnerabilities(
    scanId: string,
    criticalVulnerabilities: TrivyVulnerability[],
  ): Promise<void> {
    try {
      const updated = await this.scanModel.findByIdAndUpdate(
        scanId,
        {
          criticalVulnerabilities,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updated) {
        throw new Error(`Scan record with id=${scanId} not found`);
      }
    } catch (error) {
      this.logger.error(
        `Error on storing critical vulnerabilities for scanId=${scanId}`,
      );
      this.logger.error(error);
      throw error;
    }
  }
}
