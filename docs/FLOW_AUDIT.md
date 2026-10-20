# JanDastavej (PS000221) — Flow Audit Report

**Date:** 20 October 2026 · **Authority:** Collector Office, Gandhinagar
**Target:** Demo-ready prototype before 6 November 2026
**Environment:** Linux, Node.js v24.22, MongoDB, React + Vite + Tailwind v4

---

## 1. Executive Summary

A comprehensive automated and manual flow audit was conducted across mobile (360×800) and desktop (1280×800) viewports covering user flows F1–F4 and F9, theme token conformance, Gujarati typography rendering, and single-path PDF generation.

- **P0 Defects:** 0 remaining.
- **P1 Defects:** 0 remaining.
- **Mobile Horizontal Scroll:** None detected at 360px viewport (`document.documentElement.scrollWidth === window.innerWidth`).
- **Render Divergence:** 0 divergence (preview and PDF use the identical `renderDocumentHtml` and `getDocumentStyles` module).

---

## 2. Flow Audit Results Table

| ID | Step / Flow | Expected Behavior | Actual Observed | Status | Severity | File:Line |
|---|---|---|---|---|---|---|
| F1.1 | Landing to Library (`/` → `/documents`) | Step indicator Step 1 active; search query passes to library | Redirects smoothly; search query filters templates | PASS | P0 | `apps/web/src/features/documents/LandingPage.tsx:28` |
| F1.2 | Document Detail (`/documents/:slug`) | Displays purpose, required docs, next steps, source reference, and "Start" button | Purpose, docs checklist, disclaimer, and CTA rendered properly | PASS | P0 | `apps/web/src/features/documents/DocumentDetailPage.tsx:75` |
| F1.3 | Dynamic Form (`/create/:templateId`) | Form fields generated from versioned schema; Step 2 active | Renders schema inputs, textareas, selects, and dates without hardcoded UI | PASS | P0 | `apps/web/src/features/generation/DynamicFormPage.tsx:180` |
| F1.4 | Inline Validation on Form | Inline field errors next to inputs; entered values preserved | Inline errors displayed with alert icons; no values erased | PASS | P0 | `apps/web/src/features/generation/DynamicFormPage.tsx:112` |
| F1.5 | Preview Generation (`/preview/:sessionId`) | Renders A4 paper sheet on muted canvas; Step 3 active | Clean A4 canvas with authentic document structure and demo banner | PASS | P0 | `apps/web/src/features/preview/PreviewPage.tsx:180` |
| F1.6 | Edit / Return from Preview | "Edit Answers" returns to form with all entered values intact | Form pre-populates with state from session answers | PASS | P0 | `apps/web/src/features/preview/PreviewPage.tsx:30` |
| F1.7 | Pre-download Disclaimer Check | PDF download button disabled until explicit checkbox acknowledgment | Checkbox controls download button disabled state; server rejects if false | PASS | P0 | `apps/web/src/features/preview/PreviewPage.tsx:145` |
| F1.8 | PDF Generation & Download | Playwright worker compiles identical HTML to A4 PDF | 62KB PDF downloaded with correct margins and Gujarati fonts | PASS | P0 | `apps/api/src/modules/generations/generations.router.ts:245` |
| F2.1 | Browse / Search / Filters | Search by title/desc, filter by category and language | Instant reactive filtering with empty state when no match | PASS | P0 | `apps/web/src/features/documents/LibraryPage.tsx:40` |
| F2.2 | Unpublished Leakage Protection | Drafts or retired templates never returned by public endpoint | Public query strictly enforces `status = 'published'` | PASS | P0 | `apps/api/src/modules/templates/templates.router.ts:16` |
| F3.1 | Session Reuse Opt-in | User explicitly chooses to remember details for session | Checkbox opts in/out; data never persisted across users | PASS | P0 | `apps/web/src/context/SessionReuseContext.tsx:32` |
| F3.2 | Clear My Data | Visible control clears stored data immediately | Confirmation dialog triggers full session cleanup | PASS | P0 | `apps/web/src/components/layout/Header.tsx:38` |
| F3.3 | Session Expiry & Privacy | Generation sessions expire via MongoDB TTL index (30 min) | TTL index `expiresAfterSeconds: 0` removes documents automatically | PASS | P0 | `apps/api/src/models/GenerationSession.ts:33` |
| F4.1 | Standard Error Envelope | All errors follow `{ error: { code, message, fields, requestId } }` | Verified on 400, 404, 410, 500 error responses | PASS | P0 | `apps/api/src/middleware/errorHandler.ts:14` |
| F8.1 | Language Switch EN ⇄ GU | Switching language does not lose form state | LanguageContext toggles dictionary while react-hook-form state remains intact | PASS | P1 | `apps/web/src/context/LanguageContext.tsx:18` |
| F9.1 | Navigation & Links | No dead links, no `href="#"`, logo returns to `/` | All links verified; responsive mobile hamburger menu | PASS | P0 | `apps/web/src/components/layout/Header.tsx:30` |

---

## 3. Known-Risk Verification Checklist

- [x] **Preview HTML and PDF HTML use the same render path:** Implemented in `@jandastavej/shared/src/renderers/documentRenderer.ts` (`renderDocumentHtml`).
- [x] **XSS & Template Injection Protection:** User values are strictly HTML-escaped via `escapeHtml()`.
- [x] **Server-side validation:** Enforced on `/generations/validate`, `/generations/preview`, and `/generations/pdf`.
- [x] **No draft leakage:** Verified in automated integration test `templates.test.ts`.
- [x] **No JWTs in localStorage:** Guest citizen flows use short-lived session IDs; admin uses HttpOnly cookies.
- [x] **No PII in logs:** Pino redaction paths strip passwords and form answers; request IDs only.
- [x] **No fake seals or logos:** Text wordmark "JanDastavej" only.
- [x] **Demo notice:** "Demo only — not for official use." / "માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી." prominently visible on cards, form, preview, and PDF.

---

## 4. Visual Evidence Captured

Captured at 360×800 (mobile) and 1280×800 (desktop):
- `docs/screenshots/desktop_01_landing.png`
- `docs/screenshots/desktop_02_library.png`
- `docs/screenshots/desktop_03_detail.png`
- `docs/screenshots/desktop_04_form_errors.png`
- `docs/screenshots/desktop_05_preview.png`
- `docs/screenshots/mobile_01_landing.png`
- `docs/screenshots/mobile_02_library.png`
- `docs/screenshots/mobile_03_detail.png`
- `docs/screenshots/mobile_04_form_errors.png`
- `docs/screenshots/mobile_05_preview.png`

**Conclusion:** All P0 requirements for Stages 1–5 are satisfied. Proceeding to Stage 6 (Gujarati/English verification with test strings) and Stage 7 (Admin flows).
