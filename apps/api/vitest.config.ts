import { defineConfig } from 'vitest/config';
import path from 'node:path';
import fs from 'node:fs';

const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(rootEnv);
  } catch {
    // Ignore if unreadable
  }
}

// Use local MongoDB for isolated unit tests
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/jandastavej';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
