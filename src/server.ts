import { createApp } from './app';
import { env } from './env';
import { sequelize } from './models';
import { logger } from './utils/logger';

/** Entry point: verify DB → start HTTP → handle shutdown signals. */
async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
  } catch (err) {
    logger.error({ err }, 'Unable to connect to the database — aborting startup');
    process.exit(1);
  }

  const server = createApp().listen(env.PORT, () => {
    logger.info(`HTTP server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      sequelize
        .close()
        .catch((err) => logger.error({ err }, 'Error closing DB connection'))
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

void main();
