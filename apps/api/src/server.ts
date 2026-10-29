import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';
import { seed } from './scripts/seed.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();

    if (process.env.AUTO_SEED !== 'false') {
      try {
        logger.info('Auto-seeding database...');
        await seed();
        logger.info('Auto-seed completed successfully.');
      } catch (seedErr) {
        logger.warn({ err: seedErr }, 'Auto-seed failed or skipped, proceeding with server startup');
      }
    }

    app.listen(PORT, () => {
      logger.info(`JanDastavej API server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start JanDastavej API server');
    process.exit(1);
  }
}

startServer();
