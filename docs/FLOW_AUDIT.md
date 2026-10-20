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

---

## 5. Feature Addendum 2 Audit — User Supporting Documents & Annexures

**Specification Reference:** `docs/FEATURE_USER_DOCUMENTS_UPLOAD.md` (Amends `PRD.md`, `TRD.md`)

| ID | Criterion | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|
| **UD-01** | Signed-in Upload Gate | Anonymous users can create from blank forms; only signed-in citizens upload | Guest upload returns 401 `UNAUTHORIZED`; blank form creation passes without sign-in | PASS |
| **UD-02** | Granular DPDP Consent | Upload requires recorded `process` consent; otherwise blocked | Returns 400 `CONSENT_REQUIRED` if process consent is missing or revoked | PASS |
| **UD-03** | Safety Scanner Gate | Reject non-PDF/JPG/PNG, >10MB, encrypted, PDF active JS/launch, malware EICAR | Magic-byte MIME detection rejects fake headers; EICAR signature blocked; zero disk storage | PASS |
| **UD-04** | Per-Field Human Confirmation | Never auto-apply extracted values to document form | Review modal requires per-field accept/discard/edit; confirmed list sent to backend | PASS |
| **UD-05** | Pre-fill Tagging & Editable | Filled fields show "from your document" badge; remain 100% editable | Tag badge rendered on input label; manual typing and clearing fully supported | PASS |
| **UD-06** | Session End Deletion (Default) | Default is no permanent storage; non-kept files have short TTL | Non-kept files expire after 2h TTL; kept files retain for 30 days under explicit consent | PASS |
| **UD-07** | My Documents & Erasure | Expiry date displayed; immediate delete; Right to Erasure (`DELETE /me/data`) | Immediate deletion from disk storage and DB; "Delete all my data" purges all user files | PASS |
| **UD-08** | IDOR Isolation | User A cannot read, download, or delete User B's file or extraction | Verified across `/me/documents/:id`, `/me/documents/:id/file`, `/me/documents/:id/extraction` | PASS |
| **UD-09** | Admin Access Boundary | Admins and staff cannot browse citizen files outside audited break-glass | Admin template routes completely isolated from `/me/*` user documents | PASS |
| **UD-10** | Minimal AI Assist | AI off by default; minimal masked text only; never images or full IDs | Local OCR + rules default; AI assist guarded by config flag + explicit consent | PASS |
| **UD-11** | Sensitive ID Masking | Aadhaar, PAN masked by default in UI (`XXXX-XXXX-1234`), excluded from logs & audits | Sensitive fields masked with show/hide toggle; excluded from pino logs & audit events | PASS |
| **UD-12** | Annexure Bundling | Merge affidavit with selected annexures into one PDF with Annexure A/B markers | Cover page generated with annexure index; each annexure labeled; single PDF output | PASS |
| **UD-13** | XSS & Sanitization | Extracted text and filenames HTML-escaped before preview and PDF | XSS payloads (`<script>`, `onerror=`) neutralized via `escapeHtml()` in renderer | PASS |
| **UD-14** | Gujarati Extraction Fallback | Gujarati ID/address regex patterns extract accurately or fall back to manual | Rule engine parses Gujarati DOB (`જન્મ તારીખ`) and name patterns gracefully | PASS |
| **UD-15** | Single Render Path | Both preview and PDF use the identical sandboxed rendering engine | Shared Playwright and HTML generator compile identical layout for affidavit and bundles | PASS |

