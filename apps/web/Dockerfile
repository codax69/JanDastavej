# syntax=docker/dockerfile:1.7

# ==============================================================================
# JanDastavej Web Production Dockerfile
# Multi-stage, high performance Nginx static bundle runner
# ==============================================================================

# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy monorepo manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Clean install
RUN npm ci

# Copy shared package and build
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Build args for frontend environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy web app source and build Vite bundle
COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web

# Stage 2: Minimal Production Nginx Runner
FROM nginx:1.27-alpine AS runner

# Remove default static pages
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom hardened Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check using lightweight wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
