import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './core/logger/logger.module';
import { MongooseDBModule } from './database/mongoose.module';
import { BullQueueModule } from './core/bull-queue/bull-queue.module';
import { ScanModule } from './modules/scan/scan.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    MongooseDBModule,
    BullQueueModule,
    ScanModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
