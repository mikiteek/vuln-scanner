import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerConfig } from '../../config/logger/logger.config';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const loggerConfig = configService.get<LoggerConfig>('logger');
        if (!loggerConfig) {
          throw new Error('Missing logger config');
        }

        return {
          pinoHttp: {
            level: loggerConfig.level,
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            },
            autoLogging: false,
            serializers: {
              req: () => undefined,
            },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
