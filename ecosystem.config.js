import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = fs.existsSync('.env') ? '.env' : undefined;

export const apps = [
  {
    name: 'jandastavej-api',
    script: 'apps/api/dist/server.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    ...(envFile ? { env_file: envFile } : {}),
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 4000,
    },
    max_memory_restart: '500M',
    autorestart: true,
    time: true,
    error_file: 'logs/api-error.log',
    out_file: 'logs/api-out.log',
    merge_logs: true,
  },
  {
    name: 'jandastavej-api-dev',
    script: 'node_modules/.bin/tsx',
    args: 'watch apps/api/src/server.ts',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    ...(envFile ? { env_file: envFile } : {}),
    env: {
      NODE_ENV: 'development',
      PORT: 4000,
    },
    autorestart: true,
    time: true,
    error_file: 'logs/api-dev-error.log',
    out_file: 'logs/api-dev-out.log',
    merge_logs: true,
  },
];

export default {
  apps,
};
