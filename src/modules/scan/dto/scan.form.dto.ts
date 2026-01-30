import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanFormDto {
  @ApiProperty({
    type: 'string',
    description: 'Github repo URL to scan',
    example: 'https://github.com/mikiteek/NodeGoat',
  })
  @Length(10, 300)
  @IsString()
  repoUrl: string;
}
