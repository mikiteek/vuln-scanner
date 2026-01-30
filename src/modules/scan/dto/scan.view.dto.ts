import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScanStatus } from '../types/scan';
import { TrivyVulnerability } from './trivy.vulnerability.view.dto';

export class ScanViewDto {
  @ApiProperty({
    type: 'string',
    description: 'Scan ID',
  })
  id: string;

  @ApiProperty({
    type: 'string',
    enum: Object.values(ScanStatus),
    description: 'Scan status',
  })
  status: ScanStatus;

  @ApiProperty({
    type: [TrivyVulnerability],
    description: 'Critical vulnerabilities found during scan',
  })
  @Type(() => TrivyVulnerability)
  criticalVulnerabilities: TrivyVulnerability[];
}
