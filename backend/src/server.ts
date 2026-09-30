import app from './app';
import { config } from './config';
import logger from './common/logger';
import db from './db';

async function start(): Promise<void> {
  try {
    // Check if external PostgreSQL is running; if not, fall back to embedded in-memory PostgreSQL
    try {
      await Promise.race([
        db.raw('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PostgreSQL connection timeout')), 2500)
        ),
      ]);
      logger.info('Connected to PostgreSQL database');
    } catch (connErr) {
      logger.warn(
        'External PostgreSQL not detected. Initializing embedded in-memory PostgreSQL engine (pg-mem)...'
      );
      await db.initMemoryDb();
      logger.info(
        'Embedded PostgreSQL initialized with schema migrations and demo seed scenarios'
      );
    }

    app.listen(config.port, () => {
      logger.info(`Newtonite Operations Backend running on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
        apiUrl: `http://localhost:${config.port}/api`,
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await db.destroy();
  process.exit(0);
});

start();
