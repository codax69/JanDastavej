# JanDastavej (જનદસ્તાવેજ) — Agent Operating Guide (`AGENT.md`)

> **Repository:** JanDastavej — Citizen-Centric Digital Affidavit & Declaration Generator  
> **Problem Statement:** PS000221 · Collector Office, Gandhinagar · SSIP 2.0 / SFIC 2026  
> **License:** MIT Open Source  
> **Audience:** AI Coding Agents, Autonomous Pair Programmers, Human Maintainers

---

## 1. System Mission & Product Context

JanDastavej is an open-source, bilingual (Gujarati & English) digital public infrastructure that streamlines citizen interactions with district and taluka administration in Gujarat. 

### The Problem It Solves
- **Eliminates Curb-side Exploitation:** Citizens visiting Jan Seva Kendras often lack authoritative guidance on required affidavits/declarations and are forced to pay ₹150–₹500 to roadside typists.
- **Prevents Scrutiny Rejections:** 30–40% of physical submissions face initial scrutiny rejection due to outdated wording or non-standard formatting.
- **Ends Redundant Data Entry:** Citizens entering multiple documents for a service (e.g., electricity meter transfer, income certificate) repeatedly handwrite identical demographic information (Aadhaar, parentage, age, address).
- **Protects Citizen Privacy:** Commercial legal tools store sensitive citizen PII on third-party cloud servers. JanDastavej implements an ephemeral zero-trust architecture compliant with India's **Digital Personal Data Protection (DPDP) Act 2023**.

---

## 2. Monorepo Architecture & Directory Map

The repository is organized as an `npm` workspace monorepo:

```
JanDastavej/
├── apps/
│   ├── api/                     # Node.js + Express 4 + TypeScript REST API
│   │   ├── src/
│   │   │   ├── config/          # Environment variables & constants
│   │   │   ├── middleware/      # Auth (Argon2 / HttpOnly), RBAC, Helmet, rate-limiting
│   │   │   ├── models/          # Mongoose models: Template, TemplateVersion, GenerationSession, AuditEvent, Service
│   │   │   ├── modules/
│   │   │   │   ├── admin/       # Template management, draft-to-publish lifecycle, audit ledger
│   │   │   │   ├── auth/        # Admin cookie authentication & guest session handling
│   │   │   │   ├── generations/ # Playwright PDF generator worker & docx OpenXML builder
│   │   │   │   ├── services/    # Citizen service catalog & multi-document bundle generator
│   │   │   │   └── templates/   # Template retrieval, canonical field mapper, HTML rendering
│   │   │   ├── scripts/seed.ts  # Database seed script for services and demo templates
│   │   │   └── server.ts        # Server entrypoint
│   │   └── vitest.config.ts     # API test suite
│   └── web/                     # React 19 + Vite + TypeScript frontend
│       ├── src/
│       │   ├── api/             # API client & fetchers (TanStack Query)
│       │   ├── app/             # Application shell, layout providers, React Router v7 routes
│       │   ├── components/      # UI components (Tailwind v4 tokens, Lucide React icons)
│       │   ├── context/         # CitizenAuthContext, LanguageContext, SessionReuseContext
│       │   ├── features/
│       │   │   ├── admin/       # Template editor, draft approval flow, audit trail inspector
│       │   │   ├── documents/   # Document library, category filters, single-doc wizard
│       │   │   ├── preview/     # Faithful A4 live preview canvas, print CSS, export modal
│       │   │   └── services/    # Service directory, checklist drawer, bundle wizard
│       │   └── index.css        # Tailwind v4 (@import "tailwindcss", CSS custom properties)
│       └── vite.config.ts       # Web build configuration
├── packages/
│   └── shared/                  # Common TypeScript library shared by apps/web and apps/api
│       └── src/
│           ├── renderers/       # Layout engines, HTML generators & canonical answer normalizers
│           ├── schemas/         # Shared Zod schemas (templates, services, sessions, DPDP consent)
│           └── types/           # Core TypeScript type definitions
├── docs/                        # Specifications, PRD, TRD, audit logs, demo scripts
├── scripts/                     # Operational scripts (dev runner, flow audit, PPTX generator)
├── ecosystem.config.js          # PM2 process configuration for API clustering
└── docker-compose.yml           # Multi-container Docker deployment configuration
```

---

## 3. Inviolable Engineering Rules (The "Red Lines")

Whenever modifying this codebase, agents **MUST** strictly adhere to the following architectural rules:

### Rule 1: Single Render Path (Absolute Invariant)
- **Preview HTML and PDF HTML MUST originate from the exact same template component, normalizer, and CSS.**
- The web preview renders safe HTML; the Playwright headless Chromium worker renders that *exact same HTML* with print CSS.
- **Never** implement separate preview and PDF template logic. Two divergent render paths constitute an architectural defect.

### Rule 2: Zero AI-Generated Legal Text
- Templates are **100% deterministic** data structures maintained by authorized administrators.
- The generation engine only performs canonical variable substitution and field normalization.
- **Never** introduce LLMs or autonomous generative text into document content. Legal wording must be gazetted and authorized.

### Rule 3: Strict DPDP Act 2023 Compliance & Ephemeral Sessions
- **Zero Answer Persistence in Logs:** Never log, store, or serialize citizen form answers in `pino` server logs, console logs, URLs, or `AuditEvent` metadata.
- **15-Minute Session TTL:** Citizen generation sessions (`GenerationSession`) use MongoDB TTL indexes (`expiresAt`) to automatically purge all citizen data after 15 minutes.
- **Client-Side Opt-in Only:** Reusing entered details across documents is strictly opt-in via client-side storage, with a prominent, accessible "Clear My Data" (`ડેટા સાફ કરો`) control.

### Rule 4: Bilingual Integrity & Typography
- The platform supports **English** and **Gujarati (`ગુજરાતી`)**.
- Switching languages must preserve form state and user answers without resetting inputs.
- Fonts: `Noto Sans Gujarati` and `Noto Sans Devanagari` are locally bundled. Do not introduce external CDN dependencies (e.g. Google Fonts) for server-side PDF generation.
- Never allow raw i18n keys (e.g., `form.fullName.placeholder`) to leak into the UI.

### Rule 5: Immutable Template Governance
- Template version status flow: `draft → in_review → approved → published → retired` (or `rejected` with reason).
- Published template versions are **immutable**. Any edit to a published template must create a new `draft` version.
- Unapproved demo templates must visibly display: *"Demo only — not for official use."* (`માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી`).

### Rule 6: No Fake Government Seals or Emblems
- Do not generate or embed fake State emblems, National seals, or synthetic digital notary stamps.
- Use clean text wordmarks and explicit watermarks until official authority sign-off is completed.

---

## 4. Key Workflows & Common CLI Commands

Always run commands from the repository root:

### Development
```bash
# Install all dependencies across workspaces
npm install

# Build shared package (MANDATORY before running api or web)
npm run build:shared

# Run full development environment (API on :4000, Web on :5173)
npm run dev

# Run individual workspaces
npm run dev:api
npm run dev:web
```

### Build & Verification
```bash
# Typecheck all packages and apps
npm run typecheck

# Run test suites across monorepo (Vitest)
npm run test

# Run linter
npm run lint

# Build entire monorepo for production
npm run build
```

### Database Seeding & Setup
Ensure MongoDB is running locally on `mongodb://127.0.0.1:27017/jandastavej`.
```bash
# Seed initial templates and services
node apps/api/dist/scripts/seed.js
```

### PM2 Process Management
```bash
npm run pm2:start      # Start API via PM2
npm run pm2:status     # Check status
npm run pm2:logs       # Stream API logs
npm run pm2:stop       # Stop processes
```

### Docker Multi-Arch Builds
Dockerfiles support `linux/amd64` and `linux/arm64`:
```bash
docker compose up -d --build
```

---

## 5. Coding Standards & Conventions

### Frontend (`apps/web`)
- **Styling:** Tailwind CSS **v4** syntax only (`@import "tailwindcss"`, CSS variables, `@theme inline`). Do not introduce legacy `tailwind.config.js` or Tailwind v3 directives.
- **UI Components:** Built on accessible, tokenized components in `apps/web/src/components/ui`. Avoid adding secondary component libraries.
- **Forms & Validation:** Controlled dynamic forms driven by Zod schemas from `packages/shared`. Inline errors must provide actionable Gujarati and English feedback.
- **Accessibility:** Minimum WCAG 2.1 AA standard; full keyboard navigation, high contrast, and screen-reader accessible ARIA tags.

### Backend (`apps/api`)
- **Validation:** Validate all incoming HTTP payloads at the boundary using Zod schemas.
- **Authentication:** Admin authentication uses secure, HttpOnly, SameSite cookies with Argon2 password hashing. Guest citizen sessions are stateless / short-lived.
- **PDF Generation:** Executed via isolated Playwright Chromium workers with strict concurrency limits and timeouts (`PDF_CONCURRENCY_LIMIT`, `PAGE_RENDER_TIMEOUT_MS`).
- **Error Handling:** Standardized error response format:
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Field 'applicantName' is required.",
      "fields": { "applicantName": "આ માહિતી ભરવી આવશ્યક છે." },
      "requestId": "req_xyz123"
    }
  }
  ```

### Shared Package (`packages/shared`)
- Any schema, type, or normalization logic used by both API and frontend **must** live in `packages/shared`.
- Always run `npm run build:shared` after editing files in `packages/shared`.

---

## 6. Testing Strategy

- **Unit Tests:** `packages/shared` schema parsers, canonical field normalizers, and layout compilers.
- **Integration Tests:** `apps/api` REST endpoints, auth flows, template approval lifecycles, and TTL session invalidation.
- **Render Tests:** PDF generation smoke tests verifying that Playwright produces valid PDF buffers with correct byte signatures and Gujarati font glyphs.
- **Run Tests:** `npm run test` executes Vitest across all workspaces. Ensure all tests pass before committing changes.

---

## 7. Synopsis Presentation & Evaluation Deck

For competitive hackathons (SFIC 2026, Smart India Hackathon, SSIP 2.0):
- **Template & Presentation:** `SFIC 2026 Synopsis Presentation Template.pptx`
- **Automation Script:** `scripts/populate_sfic_ppt.py`
- When updating problem statements, metrics, or team composition, modify `scripts/populate_sfic_ppt.py` and run:
  ```bash
  python3 scripts/populate_sfic_ppt.py
  ```

