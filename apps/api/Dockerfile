# syntax=docker/dockerfile:1.7

# ==============================================================================
# JanDastavej API Production Dockerfile
# Multi-stage, non-root, Playwright Chromium & Gujarati fonts configured
# ==============================================================================

# Stage 1: Base image
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Stage 2: Dependencies & Build
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=development

# Install build dependencies for native modules (e.g. argon2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace package manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies using clean lockfile
RUN npm ci

# Copy shared package source and compile
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Copy API source and compile
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

# Prune devDependencies to keep production image lean
RUN npm prune --omit=dev

# Stage 3: Production Runner
FROM base AS runner
WORKDIR /app

# Install system dependencies:
# - dumb-init: PID 1 signal handler for graceful shutdown
# - fonts: Noto Sans Gujarati & Indic fonts for PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    ca-certificates \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-noto-extra \
    fonts-noto-cjk \
    fonts-indic \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and built code from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install Playwright Chromium browser and its system shared libraries
RUN npx playwright install --with-deps chromium \
    && chmod -R 755 /ms-playwright \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root security context
USER node

# Default runtime configuration
ENV PORT=4000 \
    NODE_ENV=production \
    LOG_FORMAT=pretty \
    LOG_LEVEL=info

EXPOSE 4000

# Native Node.js healthcheck (no curl required)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/v1/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]
