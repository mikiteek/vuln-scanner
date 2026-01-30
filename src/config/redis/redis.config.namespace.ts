import { registerAs } from '@nestjs/config';
import { RedisConfig } from './redis.config';

export default registerAs(
  'logger',
  (): RedisConfig => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  }),
);
