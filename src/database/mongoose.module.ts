import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseConfig } from '../config/database/database.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        if (!dbConfig) {
          throw new Error('Missing database mongo config');
        }

        return {
          uri: dbConfig.dbUri,
        };
      },
    }),
  ],
})
export class MongooseDBModule {}
