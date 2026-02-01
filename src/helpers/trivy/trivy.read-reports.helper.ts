import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import {
  TrivySeverityType,
  TrivyVulnerability,
} from '../../modules/scan/types/trivy';

@Injectable()
export class TrivyReadReportsHelper {
  async readCriticalVulnerabilities(
    reportPath: string,
  ): Promise<TrivyVulnerability[]> {
    const critical: TrivyVulnerability[] = [];

    const reportStream = createReadStream(reportPath, {
      encoding: 'utf8',
      highWaterMark: 128 * 1024, // 128kb chunk
    });

    const resultsStream = reportStream
      .pipe(parser())
      .pipe(pick({ filter: 'Results' }))
      .pipe(streamArray());

    try {
      for await (const chunk of resultsStream as AsyncIterable<unknown>) {
        if (!this.isRecord(chunk)) {
          continue;
        }

        const result = chunk.value;
        if (!this.isRecord(result)) {
          continue;
        }

        const vulnerabilities = result.Vulnerabilities;
        if (!Array.isArray(vulnerabilities)) {
          continue;
        }

        for (const vulnerability of vulnerabilities) {
          if (
            this.isTrivyVulnerability(vulnerability) &&
            vulnerability.Severity === TrivySeverityType.CRITICAL
          ) {
            critical.push(vulnerability);
          }
        }
      }

      return critical;
    } catch (error) {
      reportStream.destroy();
      resultsStream.destroy();
      throw error;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isTrivySeverity(
    value: unknown,
  ): value is TrivyVulnerability['Severity'] {
    return (
      value === TrivySeverityType.UNKNOWN ||
      value === TrivySeverityType.LOW ||
      value === TrivySeverityType.MEDIUM ||
      value === TrivySeverityType.HIGH ||
      value === TrivySeverityType.CRITICAL
    );
  }

  private isTrivyVulnerability(value: unknown): value is TrivyVulnerability {
    if (!this.isRecord(value)) {
      return false;
    }

    if (typeof value.VulnerabilityID !== 'string') {
      return false;
    }

    return this.isTrivySeverity(value.Severity);
  }
}
