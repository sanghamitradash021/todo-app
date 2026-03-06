import { Pool } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('connect', () => {
  logger.info('PostgreSQL pool: new client connected');
});

pool.on('error', (err: Error) => {
  logger.error('PostgreSQL pool: unexpected error on idle client', { error: err });
  process.exit(1);
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  client.release();
  logger.info('PostgreSQL connection established');
}
