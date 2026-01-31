import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { ScanStatus } from '../types/scan';
import { TrivyVulnerability } from './trivy.vulnerability.view.dto';

export class ScanViewDto {
  @ApiProperty({
    type: 'string',
    description: 'Scan ID',
  })
  @Expose()
  id: string;

  @ApiProperty({
    type: 'string',
    enum: Object.values(ScanStatus),
    description: 'Scan status',
  })
  @Expose()
  status: ScanStatus;

  @ApiProperty({
    type: 'string',
    description: 'Repository url',
  })
  @Expose()
  repoUrl: string;

  @ApiProperty({
    type: [TrivyVulnerability],
    description: 'Critical vulnerabilities found during scan',
  })
  @Expose()
  @Type(() => TrivyVulnerability)
  criticalVulnerabilities: TrivyVulnerability[];
}
