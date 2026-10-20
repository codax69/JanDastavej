import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[JanDastavej API] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[JanDastavej API] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
