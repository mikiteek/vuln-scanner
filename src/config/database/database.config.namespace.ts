import { registerAs } from '@nestjs/config';
import type { DatabaseConfig } from './database.config';

export default registerAs('database', (): DatabaseConfig => {
  const { DB_URI } = process.env;
  if (!DB_URI) {
    throw new Error('DB_URI environment variable is not set');
  }

  return {
    dbUri: DB_URI,
  };
});
