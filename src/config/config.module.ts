import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import serverConfig from './server/server.config.namespace';
import databaseConfig from './database/database.config.namespace';
import redisConfig from './redis/redis.config.namespace';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [serverConfig, databaseConfig, redisConfig],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
