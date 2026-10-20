# JanDastavej — Technical Requirements Document (TRD)

**Problem ID:** PS000221 · **Authority:** Collector Office, Gandhinagar
**Version:** 1.1 · **Prepared:** 20 October 2026
**Companion document:** `PRD.md` (product requirements)

> Prototype specification. Validate official templates before public use.

---

## 1. Technical overview

A React/Vite SPA talks to a TypeScript/Express REST API. The API validates requests, reads **published** template versions from MongoDB, renders a controlled template, and sends the HTML to a sandboxed Chromium/Playwright worker to produce a PDF. Admin template edits go through a draft → review → approve → publish lifecycle. The frontend is never the authority for access control, template publication or validation.

## 2. Architecture

| Layer | Responsibilities | Tools |
|---|---|---|
| Web client | Navigation, dynamic forms, validation feedback, preview, downloads, admin UI | React, Vite, TypeScript, Tailwind v4, shadcn/ui, React Router, TanStack Query |
| API | Authentication, authorization, schema validation, template/version lifecycle, generation sessions | Node.js, Express, TypeScript, Zod, Mongoose |
| Database | Templates, immutable versions, users, audit events, short-lived sessions | MongoDB with indexes and backups |
| PDF renderer | Render controlled HTML to PDF; isolate CPU/memory | Playwright/Chromium in a separate worker/process |
| Observability | Structured logs, request IDs, error monitoring, metrics | Pino or Winston; platform logs; optional error tracker |
| Deployment | TLS, reverse proxy, env config, backups, health checks | Nginx, PM2 or Docker; secrets outside source control |

### 2.1 Core design rule: one render path
Preview and PDF **must** come from the same template component and the same CSS. Preview returns preview-safe HTML; the PDF worker renders that same HTML with print CSS. Two separate render paths are a defect.

## 3. Repository structure

```
jandastavej/
  apps/
    web/
      src/
        app/            # routes, providers, layout shell
        features/
          documents/
          generation/
          preview/
          admin/
        components/
          ui/           # shadcn/ui components
          shared/
        lib/
        hooks/
        types/
        api/
    api/
      src/
        config/
        middleware/
        modules/
          auth/
          templates/
          generations/
          pdf/
          audit/
          metrics/
        services/
        utils/
        app.ts
        server.ts
  packages/
    shared/
      schemas/          # zod schemas shared by web + api
      types/
  docs/
    PRD.md
    TRD.md
    API.md
    SECURITY.md
    FLOW_AUDIT.md
  .env.example
  README.md
```

## 4. Data model (MongoDB / Mongoose)

| Collection | Important fields | Notes |
|---|---|---|
| User | `_id`, name, email/username, passwordHash, role, status, createdAt, lastLoginAt | Admin/staff only for MVP; citizens use guest flow |
| Template | `_id`, slug, title, description, category, supportedLanguages, status, currentPublishedVersionId, createdBy, updatedAt | Stable identity; published versions immutable |
| TemplateVersion | `_id`, templateId, version, language, schema, layoutKey, sourceReference, status, createdBy, reviewedBy, approvedAt, publishedAt | Approval required before public publication |
| GenerationSession | `_id`, templateVersionId, answers, language, createdAt, expiresAt, status | Short-lived; minimize PII; never log answers; TTL index on `expiresAt` |
| AuditEvent | `_id`, actorUserId, action, entityType, entityId, version, timestamp, reason, metadata | Never store document content in metadata |
| UsageMetric | `_id`, eventType, templateId, language, durationMs, success, createdAt | Aggregate/low-PII; no raw answers |

**Template version status:** `draft → in_review → approved → published → retired` (plus `rejected` with reason).

## 5. Template schema

Templates are data-driven. The published schema describes fields and validation; controlled HTML/React template components define layout. **Never** allow administrator-supplied JavaScript or executable HTML.

```json
{
  "slug": "sample-declaration",
  "version": 1,
  "language": "gu",
  "fields": [
    { "key": "fullName",        "label": "પૂર્ણ નામ", "type": "text",     "required": true, "maxLength": 120 },
    { "key": "address",         "label": "સરનામું",   "type": "textarea", "required": true, "maxLength": 500 },
    { "key": "declarationDate", "label": "તારીખ",     "type": "date",     "required": true }
  ]
}
```

Rules:
- Field `key` values are unique and match `^[a-zA-Z][a-zA-Z0-9]*$`.
- Allowed types: `text`, `textarea`, `date`, `select`, `radio`, `checkbox`, `number`.
- Every field has a bounded `maxLength` / range.
- Substitution is deterministic and **escapes** all values; values never become HTML, CSS, URLs or template code.

## 6. API design

Base path `/api/v1`. All responses use a JSON envelope; errors use stable machine-readable codes.

| Method | Endpoint | Purpose / access |
|---|---|---|
| GET | `/templates` | List published templates; public |
| GET | `/templates/:slug` | Public metadata and current published version |
| GET | `/templates/:id/versions/:version` | Public schema/metadata for a **published** version only |
| POST | `/generations/validate` | Validate answers against a published schema; size limits |
| POST | `/generations/preview` | Create short-lived session; return preview-safe content |
| POST | `/generations/pdf` | Generate PDF for a valid session; rate/resource limits |
| POST | `/admin/auth/login` | Authenticate admin; secure cookie; rate limited |
| POST | `/admin/auth/logout` | Invalidate session |
| GET | `/admin/templates` | List templates; admin/staff permission |
| POST | `/admin/templates` | Create draft; template-admin permission |
| PATCH | `/admin/templates/:id` | Edit **draft only**; cannot mutate published version |
| POST | `/admin/templates/:id/submit-review` | Submit draft for approval |
| POST | `/admin/template-versions/:id/approve` | Approver-only; audit event |
| POST | `/admin/template-versions/:id/publish` | Publish approved version; separation of duties where possible |
| GET | `/admin/audit-events` | Authorized, paginated audit history |

### 6.1 Conventions
- Validate every request server-side with Zod (or equivalent).
- Set max body size, rate limits and PDF concurrency limits.
- Paginate and filter admin lists.
- Never return password hashes, secrets or unnecessary personal data.
- Document with OpenAPI/Swagger.

### 6.2 Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": { "fullName": "This field is required." },
    "requestId": "generated-request-id"
  }
}
```

Standard codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `SESSION_EXPIRED`, `RATE_LIMITED`, `PDF_UNAVAILABLE`, `INTERNAL_ERROR`. The UI maps `fields` to inline errors and must not erase entered data on any error.

## 7. Package recommendations

### 7.1 Frontend

| Package | Reason |
|---|---|
| react, react-dom, typescript, vite | Core UI and build |
| react-router-dom | Routes |
| tailwindcss, @tailwindcss/vite | Tailwind v4 |
| shadcn/ui | Accessible primitives copied into project |
| lucide-react | Icons |
| @tanstack/react-query | Server state |
| react-hook-form, zod, @hookform/resolvers | Forms and validation |
| sonner | Toasts |
| date-fns | Date formatting |
| @fontsource/noto-sans-gujarati, @fontsource/noto-sans | Self-hosted fonts |
| vitest, @testing-library/react, @testing-library/user-event | Unit/component tests |
| playwright | E2E tests |

Use the current shadcn CLI with the official Vite + Tailwind v4 setup. Don't mix Tailwind v3 instructions.

### 7.2 Backend

| Package | Reason |
|---|---|
| express, typescript, tsx | API server and dev workflow |
| mongoose | MongoDB modeling |
| zod | Request, env and template-schema validation |
| cookie-parser | Auth cookies |
| helmet, cors, express-rate-limit | Security headers, explicit CORS, rate limiting |
| argon2 or bcrypt | Password hashing |
| pino, pino-http | Structured logs with request IDs |
| playwright | HTML-to-PDF via Chromium |
| vitest or node:test, supertest | Service/API tests |
| OpenAPI tooling | Contract and Swagger docs |

## 8. Security and privacy requirements

- HTTPS everywhere; secure, HttpOnly, SameSite cookies; CSRF protection with cookie auth.
- Modern password hash; never plaintext passwords; **no JWTs in localStorage**.
- Least-privilege roles; authorization enforced on every admin endpoint server-side.
- XSS and template-injection protection: escape user values; render only controlled templates.
- User values never become arbitrary HTML, CSS, URLs or code.
- PDF worker: no arbitrary external URLs, restricted file access, restricted network egress (SSRF/local-file protection). Fonts and assets loaded from local files only.
- Upload limits and type validation only if uploads are introduced (not in MVP).
- Never log form answers, document contents, passwords, tokens or sensitive identifiers.
- Prefer in-memory or short-lived sessions with expiry and a clear/reset control.
- Env vars or secret manager; commit only `.env.example` with dummy values.
- Rate limits on login, preview and PDF endpoints; cap PDF concurrency and execution time.
- Audit admin changes without copying document PII.
- Back up configuration and template metadata; test restore before any real pilot.
- Before public use: security review, privacy review, legal/template approval, accessibility testing.

## 9. Frontend theme implementation

Single source of truth in `apps/web/src/index.css`. No hard-coded hex elsewhere.

```css
@import "tailwindcss";

:root {
  --radius: 0.5rem;
  --background: #F7F6F3;   --foreground: #1B1F24;
  --card: #FFFFFF;         --card-foreground: #1B1F24;
  --popover: #FFFFFF;      --popover-foreground: #1B1F24;
  --primary: #1F3A5F;      --primary-foreground: #FFFFFF;
  --secondary: #E8ECF2;    --secondary-foreground: #1F3A5F;
  --muted: #EFEEEA;        --muted-foreground: #5B6470;
  --accent: #FBEBD7;       --accent-foreground: #7A4510;
  --destructive: #B3261E;
  --border: #D9DCE1;       --input: #C4C9D1;   --ring: #1F3A5F;
  --success: #1E7B4C;
  --warning: #9A6200;      --warning-bg: #FFF4DB;
  --paper: #FFFFFF;
  --paper-shadow: 0 1px 2px rgb(0 0 0 / .08), 0 8px 24px rgb(0 0 0 / .08);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-warning-bg: var(--warning-bg);
  --color-paper: var(--paper);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --font-sans: "Noto Sans Gujarati", "Noto Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

@layer base {
  * { border-color: var(--border); }
  body { background: var(--background); color: var(--foreground); font-family: var(--font-sans); line-height: 1.6; }
  :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
}
```

Print CSS for the document sheet: `@page { size: A4; margin: 20mm; }`, hide app chrome under `@media print`, embed the same self-hosted fonts via local `@font-face`.

Accessibility targets: text contrast ≥ 4.5:1, UI borders ≥ 3:1, touch targets ≥ 44px, visible focus everywhere, respect `prefers-reduced-motion`.

## 10. Testing strategy and acceptance

| Test area | Test cases / acceptance |
|---|---|
| Unit | Schema validation, required fields, formatting, template-version selection, permission rules, error mapping |
| Component | Dynamic fields, Gujarati labels, inline errors, reset/clear, language switching, accessible focus |
| API integration | Public endpoints expose only published templates; admin endpoints reject unauthorized users; PDF errors safe |
| PDF regression | Page size, margins, line breaks, font embedding, Gujarati rendering, long names/addresses, overflow |
| End-to-end | Select template → fill → preview → edit → download → open PDF (EN and GU) |
| Security | Unauthorized admin actions, XSS payloads in fields, oversized requests, rate-limit bypass, malicious template input |
| Cross-device | Common Android viewport (360×800), desktop Chrome, print output |
| Data privacy | Session expiry/clear behaviour; logs contain no form values |
| Content review | Compare each published template with the approved source; confirm fields and disclaimer |

Gujarati test strings: `પૂર્ણ નામ`, `સરનામું`, `તારીખ`, `પ્રતિજ્ઞાપત્ર`, `ઘોષણાપત્ર`, `શ્રીમતી`, `ક્ષત્રિય`, `જ્ઞાન`, `દસ્તાવેજ`, plus a long multi-line address.

### 10.1 MVP release gate

- At least three demo templates work end to end; none represented as official without approval.
- All required fields validated server-side.
- Preview and PDF contain the same user data and layout-critical content.
- Gujarati text passes a manual PDF rendering check.
- Public users cannot access admin functions or unpublished versions.
- Privacy notice and document-limitation notice visible.
- Clean deployment and short demo script verified.

## 11. Technical risks

| Risk | Mitigation |
|---|---|
| Preview and PDF diverge | Single render path (§2.1) |
| Gujarati glyph issues in PDF | Embedded local Noto Sans Gujarati; regression strings in CI |
| PDF worker overload / hang | Separate process, timeouts, concurrency cap, queue |
| Template injection / XSS | Escaped substitution, no admin-supplied HTML/JS |
| Draft leakage via public API | Public endpoints filter `status = published` at query level; tested |
| PII in logs | Pino redaction, no answer bodies logged, log audit in tests |

## 12. Open technical questions

- Hosting, data residency and approved security standards from the department?
- Prescribed fonts or page layouts for official documents?
- Is any government-system integration required, and is API access documented?
- Who holds the approver and template-admin roles for separation of duties?

*Confirm legal, operational and hosting requirements with the responsible authority before production use.*