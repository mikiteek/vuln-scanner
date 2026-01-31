import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { ScanRepository } from './scan.repository';
import { ScanProcessor } from './scan.processor';
import { SCAN_MODEL_NAME, ScanSchema } from './scan.schema';
import { RemoteRepoHelper } from '../../helpers/remote-repo/remote-repo.helper';
import { TrivyHelper } from '../../helpers/trivy/trivy.helper';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scan',
    }),
    MongooseModule.forFeature([{ name: SCAN_MODEL_NAME, schema: ScanSchema }]),
  ],
  controllers: [ScanController],
  providers: [
    ScanService,
    ScanProcessor,
    ScanRepository,
    RemoteRepoHelper,
    TrivyHelper,
  ],
})
export class ScanModule {}
