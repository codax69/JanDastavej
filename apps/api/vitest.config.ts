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

// In tests, ensure we use a local MongoDB instance and never remote Atlas
const envMongo = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
if (envMongo && !envMongo.startsWith('mongodb+srv://')) {
  process.env.MONGODB_URI = envMongo;
} else {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/jandastavej';
}
process.env.TEST_MONGODB_URI = process.env.MONGODB_URI;

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
    env: {
      MONGODB_URI: process.env.MONGODB_URI,
      TEST_MONGODB_URI: process.env.TEST_MONGODB_URI,
      NODE_ENV: 'test',
    },
    fileParallelism: false,
    globalSetup: ['./src/test/globalSetup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
