# JanDastavej (PS000221) — Deployment & Operations Guide

## System Requirements
- OS: Ubuntu 22.04 LTS / Debian 12 / Linux
- Node.js: >= 20.x LTS (tested on Node v24.22)
- Database: MongoDB >= 7.0 (Docker or local mongod)
- Memory: Minimum 2 GB RAM (Chromium PDF worker requires >= 1 GB available)

## Environment Configuration
Create `.env` based on `.env.example`:
```ini
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://jandastavej.gujarat.gov.in
MONGODB_URI=mongodb://127.0.0.1:27017/jandastavej
SESSION_SECRET=strong-random-session-secret-min-32-chars
COOKIE_SECRET=strong-random-cookie-secret-min-32-chars

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
PDF_CONCURRENCY_LIMIT=3

VITE_API_URL=/api/v1
```

## Quick Start Setup
```bash
# 1. Install dependencies
npm install

# 2. Install Playwright Chromium headless binary
npx playwright install chromium

# 3. Build all workspace packages
npm run build

# 4. Seed initial database templates and admin users
npm run seed --workspace=apps/api

# 5. Run automated test suite
npm run test
```

## Production Process Management (PM2)
```json
{
  "apps": [
    {
      "name": "jandastavej-api",
      "script": "apps/api/dist/server.js",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 4000
      }
    }
  ]
}
```

## Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name jandastavej.local;

    # Static frontend SPA
    location / {
        root /var/www/jandastavej/apps/web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
