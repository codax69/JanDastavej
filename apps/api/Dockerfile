# syntax=docker/dockerfile:1.7

# ==============================================================================
# JanDastavej API - Lightweight & Fast Production Dockerfile
# Optimized multi-stage, system chromium (no 400MB playwright download), ~70% smaller
# ==============================================================================

# --- Stage 1: Build & Compile ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV NODE_ENV=development

# Copy dependency manifests first for maximum Docker layer caching
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Fast clean install without audit/fund bloat
RUN npm ci --no-audit --prefer-offline

# Compile shared library
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Compile API TypeScript
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

# Strip development dependencies & clean npm cache
RUN npm prune --omit=dev --workspace=apps/api --workspace=packages/shared \
    && rm -rf /root/.npm

# --- Stage 2: Minimal Production Runner ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Configure lean Playwright: use system chromium, skip duplicate browser downloads
ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=4000 \
    LOG_FORMAT=pretty \
    LOG_LEVEL=info

# Install only minimal headless chromium, Gujarati fonts, and dumb-init
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-extra \
    fonts-indic \
    dumb-init \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* /var/log/*

# Copy built dist files & production node_modules from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Security: non-root user
USER node

EXPOSE 4000

# Native fetch healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/v1/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]
