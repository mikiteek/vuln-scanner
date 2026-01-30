import { registerAs } from '@nestjs/config';
import { ServerConfig } from './server.config';

export default registerAs(
  'database',
  (): ServerConfig => ({
    port: Number(process.env.APP_PORT) || 3000,
  }),
);
