import { registerAs } from '@nestjs/config';
import { LoggerConfig } from './logger.config';

export default registerAs(
  'logger',
  (): LoggerConfig => ({
    level: process.env.LOG_LEVEL || 'info',
  }),
);
