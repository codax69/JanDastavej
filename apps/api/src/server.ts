import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`JanDastavej API server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start JanDastavej API server');
    process.exit(1);
  }
}

startServer();
