import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './core/logger/logger.module';
import { MongooseDBModule } from './database/mongoose.module';
import { ScanModule } from './modules/scan/scan.module';

@Module({
  imports: [ConfigModule, LoggerModule, MongooseDBModule, ScanModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
