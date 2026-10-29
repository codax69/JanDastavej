# syntax=docker/dockerfile:1.7

# ==============================================================================
# JanDastavej Web - Lightweight Production Dockerfile
# Minimal multi-stage Vite builder -> 25MB Nginx Alpine runner
# ==============================================================================

# --- Stage 1: Build Static Assets ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci --no-audit --prefer-offline

# Compile shared library
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Environment arguments for Vite build
ARG VITE_API_URL=/api/v1
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy web app source and build optimized Vite bundle
COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web \
    && rm -rf /root/.npm

# --- Stage 2: Ultra-lean Nginx Runner (~25MB) ---
FROM nginx:1.27-alpine AS runner

# Remove default nginx boilerplate
RUN rm -rf /usr/share/nginx/html/*

# Copy pre-compressed/built SPA distribution
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy hardened production Nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Lightweight healthcheck using wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
