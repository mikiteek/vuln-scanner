import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './core/logger/logger.module';
import { MongooseDBModule } from './database/mongoose.module';

@Module({
  imports: [ConfigModule, LoggerModule, MongooseDBModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
