import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import serverConfig from './server/server.config.namespace';
import loggerConfig from './logger/logger.config.namespace';
import databaseConfig from './database/database.config.namespace';
import redisConfig from './redis/redis.config.namespace';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [serverConfig, loggerConfig, databaseConfig, redisConfig],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
