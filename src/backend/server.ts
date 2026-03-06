import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import app from './app';

async function start(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, {
      port: env.PORT,
      env: env.NODE_ENV,
    });
  });
}

start().catch((err: unknown) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
