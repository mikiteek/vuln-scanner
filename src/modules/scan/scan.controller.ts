import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ScanFormDto, ScanViewDto } from './dto';
import { ScanService } from './scan.service';

@Controller('api/scan')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe())
  @ApiOkResponse({
    type: ScanViewDto,
    description: 'Scan initiated successfully',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'Wallet or transaction already exists' })
  @Post('/')
  async scan(@Body() dto: ScanFormDto): Promise<ScanViewDto> {
    const { repoUrl } = dto;
    const result = await this.scanService.scan(repoUrl.trim());

    return plainToInstance(ScanViewDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @HttpCode(HttpStatus.OK)
  @ApiNotFoundResponse({ description: 'Scan with the id does not exist' })
  @ApiOkResponse({
    type: ScanViewDto,
  })
  @Get('/:scanId')
  async fetchScan(@Param('scanId') scanId: string): Promise<ScanViewDto> {
    const scan = await this.scanService.fetchScan(scanId);
    if (!scan) {
      throw new NotFoundException();
    }

    return plainToInstance(ScanViewDto, scan, {
      excludeExtraneousValues: true,
    });
  }
}
