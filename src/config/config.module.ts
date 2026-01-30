import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import serverConfig from './server/server.config.namespace';
import loggerConfig from './logger/logger.config.namespace';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [serverConfig, loggerConfig],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
