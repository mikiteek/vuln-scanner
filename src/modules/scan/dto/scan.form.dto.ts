import { IsString, IsUrl, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanFormDto {
  @ApiProperty({
    type: 'string',
    description: 'Github repo URL to scan',
    example: 'https://github.com/mikiteek/NodeGoat',
  })
  @Length(10, 300)
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    host_whitelist: ['github.com'],
  })
  repoUrl: string;
}
