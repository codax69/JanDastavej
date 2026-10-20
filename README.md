# JanDastavej (PS000221)

**Digital Affidavit / Declaration Generator**
Authority: Collector Office, Gandhinagar
Status: Prototype specification. Demo only — not for official use.

## Architecture & Monorepo Structure

- `apps/web`: React + Vite + TypeScript, Tailwind v4, shadcn/ui tokens, TanStack Query, React Router, react-hook-form + zod, self-hosted Noto Sans Gujarati & Noto Sans.
- `apps/api`: Node.js + Express + TypeScript, Zod, Mongoose, Helmet, CORS, Rate Limit, Argon2, Pino, Playwright Chromium PDF worker.
- `packages/shared`: Shared Zod schemas, TypeScript types, validation logic, error envelopes.
- `docs/`: PRD, TRD, ASSUMPTIONS, FLOW_AUDIT.

## Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB running locally on port 27017

### Install Dependencies
```bash
npm install
```

### Run Development
```bash
npm run dev
# or individually:
npm run dev:api
npm run dev:web
```

- Web UI: http://localhost:5173
- API Server: http://localhost:4000
- Health Endpoint: http://localhost:4000/api/v1/health

### Tests & Quality Checks
```bash
npm run test
npm run typecheck
npm run lint
npm run build
```
