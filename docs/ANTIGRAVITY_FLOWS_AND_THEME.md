# JanDastavej (PS000221) — Flow Audit + Theme Fix
### Task brief for Antigravity agent

> Source of truth: `JanDastavej_PRD_TRD_PS000221.md` (PRD + TRD v1.0).
> Stack: React + Vite + TypeScript, Tailwind v4, shadcn/ui, React Router, TanStack Query, react-hook-form + zod · Express + Mongoose + Playwright PDF worker.
> Deadline: demo-ready before **6 Nov 2026**. Prefer fixing over adding. Do not add new features.

---

## 0. Mission

1. **Find flows** — walk the existing codebase and running app, map every user/admin flow in the PRD, and find which are broken, missing, dead-ended or inconsistent.
2. **Fix theme** — replace the current ad-hoc styling with one consistent, accessible, government-service theme built on Tailwind v4 + shadcn/ui tokens, including correct Gujarati rendering.
3. Produce a short written report of what you found and changed.

## 1. Working rules (read first)

- Work in this order: **Phase A (audit, no edits) → Phase B (fix flows) → Phase C (theme) → Phase D (verify)**.
- Do **not** start editing before the Phase A report exists at `docs/FLOW_AUDIT.md`.
- Keep changes small and reviewable. One commit per logical fix.
- Use Tailwind **v4** syntax only (`@import "tailwindcss"`, `@theme inline`, CSS variables). Do not mix v3 config (`tailwind.config.js`, `@tailwind base`).
- shadcn/ui components live in `apps/web/src/components/ui`. Edit them through tokens first; touch component files only when tokens can't solve it.
- Do **not** add a second component library.
- Do **not** invent official seals, logos, emblems, signatures or stamps. Use a plain text wordmark.
- Never log, persist or put form answers in audit/metrics. Don't "fix" a flow by storing answers.
- All unapproved templates must visibly say **"Demo only — not for official use."**
- No AI-generated legal text. Template text + deterministic field substitution only.

---

## 2. PHASE A — Find the flows

### 2.1 How to audit
For each flow below: (a) locate the route/component/API handler, (b) run it in the browser at **360×800 mobile** and **1280×800 desktop**, (c) record pass/fail with the exact file + line of the problem, (d) note the severity (P0 blocks demo, P1 should fix, P2 polish).

Write results to `docs/FLOW_AUDIT.md` using this table per flow:

| Step | Expected | Actual | Status | Severity | File:line |
|---|---|---|---|---|---|

### 2.2 Flow inventory

**F1 — Citizen: generate a document (main demo path, P0)**
`/` → `/documents` → `/documents/:slug` → `/create/:templateId` → `/preview/:sessionId` → PDF/print

- Step indicator shows: **Select document → Enter details → Preview → Download**, and the current step is correct on every route.
- Language choice is explicit and persists across the whole flow.
- Detail page shows: purpose, required info, limitations, next steps, version + effective date, **Start** button.
- Form is rendered from the versioned schema (no per-template hard-coded UI).
- Inline, field-level errors; values are **kept** after a validation error.
- "Back/Edit" from preview returns to the form **with values intact**, regenerates preview.
- Disclaimer is visible **before** download (not footer-only) and says the file is a prepared document, not notarized / stamped / submitted.
- PDF opens, text is selectable, nothing clipped, matches preview.
- Print works from browser.

**F2 — Browse / search (P0)**
- Search by title, filter by category and language; works by keyboard and touch.
- Retired/unpublished templates never appear as current.
- Empty state ("no documents found") and loading skeleton exist.

**F3 — Session reuse & privacy (P0)**
- Reuse of earlier details is **opt-in** (explicit checkbox/button), editable, clearable.
- A visible **Clear my data** control exists on form and preview.
- Session expires (`expiresAt`); expired session shows a friendly message and a way to restart.
- No answers in console logs, server logs, URLs or analytics payloads.

**F4 — Error / empty / loading states (P0)**
- Network failure, PDF service down, 404 template, expired session, rate-limited (429): each has a clear message, a retry action, and **does not erase entered data**.
- API error shape follows `{ error: { code, message, fields, requestId } }` and the UI maps `fields` to inline errors.

**F5 — Admin login / logout (P1)**
- `/admin/login` → secure cookie auth (no JWT in localStorage), rate-limited.
- Unauthenticated access to any `/admin/*` redirects to login; citizens never see admin links.
- Logout invalidates the session.

**F6 — Template lifecycle (P1)**
`Draft → Submitted for review → Approved → Published → Retired`
- Admin can create/edit **draft only**; published versions are immutable (edit = new version).
- Approve and Publish are role-gated; approver ≠ author where possible; rejection requires a reason.
- Preview with synthetic data works before submit.
- Retired template shows a notice if someone opens an old link.

**F7 — Audit history (P1)**
- Every create/edit/submit/approve/reject/publish/retire writes an AuditEvent (actor, timestamp, version, reason) with **no document content**.
- `/admin/audit` is filterable and paginated.

**F8 — Language switch EN ⇄ GU (P1)**
- Switching language does not lose form state.
- Gujarati labels, validation messages, buttons, disclaimer are all translated (no mixed or key-name leakage like `form.fullName.label`).
- Gujarati glyphs render in both preview **and** PDF (conjuncts, vowel signs, wrapping).

**F9 — Navigation integrity (P0)**
- Every button/link goes somewhere valid. No dead links, no `href="#"`, no console 404s.
- Browser back/forward and page refresh on `/create/*` and `/preview/*` behave sanely.
- Breadcrumbs correct; logo returns to `/`.

### 2.3 Known-risk checklist (hunt for these specifically)
- [ ] Preview HTML and PDF HTML come from **different** render paths (must be the same template component).
- [ ] User input injected as raw HTML (XSS / template injection) in preview or PDF.
- [ ] Client-only validation with no server-side zod validation.
- [ ] `/api/v1/templates` leaks draft or unapproved versions.
- [ ] Admin endpoints rely on frontend hiding instead of server role checks.
- [ ] Form state lost on route change or language toggle.
- [ ] Step indicator hard-coded or out of sync with route.
- [ ] Gujarati font not embedded in PDF (tofu boxes / missing glyphs).
- [ ] Horizontal scroll on mobile in any primary page.
- [ ] Multiple conflicting colour systems (hard-coded hex, inline styles, mixed Tailwind palettes, leftover v3 config).
- [ ] Disclaimer only in footer, or missing on preview.
- [ ] Missing loading/empty/error state on any data fetch.

### 2.4 Phase A output
`docs/FLOW_AUDIT.md` containing: flow-by-flow tables, a ranked defect list (P0/P1/P2), and a list of routes in the PRD (§10) that do **not** exist yet. **Stop and summarise before moving to Phase B.**

---

## 3. PHASE B — Fix the flows

Fix in this order, committing each:
1. All **P0** defects in F1, F2, F3, F4, F9.
2. Server-side validation + published-only exposure + admin role checks (security P0s from §2.3).
3. Preview/PDF single render path.
4. **P1** defects in F5–F8.
5. P2 only if time remains.

Rules for fixes:
- Smallest change that satisfies the PRD acceptance criteria (FR-01 … FR-14).
- Add or update a test for every P0 fix (vitest / testing-library / supertest / Playwright e2e as appropriate).
- Keep API envelope and error codes stable.

---

## 4. PHASE C — Fix the theme

### 4.1 Design intent
Calm, trustworthy, restrained. Government-service clarity over decoration. Mobile-first. One obvious primary action per screen. Preview ("paper") is visually distinct from editable controls. Colour is never the only signal.

### 4.2 Palette (design tokens)

| Role | Light | Notes |
|---|---|---|
| Primary | deep indigo-navy `#1F3A5F` | buttons, links, active step |
| Primary hover | `#17304F` | |
| Accent | muted saffron `#C9741A` | used sparingly (highlights, step "current" ring, badges) — **not** as a large fill |
| Background | warm off-white `#F7F6F3` | app canvas |
| Card / surface | `#FFFFFF` | |
| Foreground | `#1B1F24` | body text |
| Muted text | `#5B6470` | must still be ≥ 4.5:1 on background |
| Border | `#D9DCE1` | |
| Success | `#1E7B4C` | |
| Warning | `#9A6200` on `#FFF4DB` | disclaimers |
| Destructive | `#B3261E` | errors, with icon + text |
| Focus ring | `#1F3A5F` 2px + 2px offset | always visible |

Provide a **dark mode only if time allows**; light mode is the demo target.

### 4.3 Implement as CSS variables (Tailwind v4 + shadcn)
In `apps/web/src/index.css` (or `app/globals.css`) — one source of truth, no hard-coded hex elsewhere:

```css
@import "tailwindcss";

:root {
  --radius: 0.5rem;

  --background: #F7F6F3;
  --foreground: #1B1F24;

  --card: #FFFFFF;
  --card-foreground: #1B1F24;
  --popover: #FFFFFF;
  --popover-foreground: #1B1F24;

  --primary: #1F3A5F;
  --primary-foreground: #FFFFFF;
  --secondary: #E8ECF2;
  --secondary-foreground: #1F3A5F;

  --muted: #EFEEEA;
  --muted-foreground: #5B6470;

  --accent: #FBEBD7;
  --accent-foreground: #7A4510;

  --destructive: #B3261E;
  --border: #D9DCE1;
  --input: #C4C9D1;
  --ring: #1F3A5F;

  --success: #1E7B4C;
  --warning: #9A6200;
  --warning-bg: #FFF4DB;

  --paper: #FFFFFF;          /* document preview sheet */
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
  html { -webkit-text-size-adjust: 100%; }
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    line-height: 1.6;           /* Gujarati needs extra line height */
    font-feature-settings: "kern", "liga";
  }
  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  h1,h2,h3 { line-height: 1.3; letter-spacing: 0; }
}
```

> If the project already has shadcn's generated `:root` / `.dark` blocks, **replace the values**, keep the variable names.

### 4.4 Typography & Gujarati
- Load **Noto Sans Gujarati** (400, 500, 600, 700) + **Noto Sans** for Latin, self-hosted via `@fontsource` (preferred — no external requests, also needed for the PDF worker).
- Body 16px minimum; form inputs 16px (prevents iOS zoom). Line-height ≥ 1.6 for Gujarati text.
- Don't use letter-spacing or `uppercase` on Gujarati text.
- **PDF**: embed the same font in the print HTML (`@font-face` with local file, no remote URLs — also required by the SSRF rule). Verify with the test string set in §4.8.

### 4.5 Component rules
| Component | Rule |
|---|---|
| Button | One `primary` per screen. `secondary`/`outline` for the rest. Min height 44px on mobile. |
| Input / Textarea / Select | Visible border (`--input`), label always above field, never placeholder-as-label. Required marked with text "(required)" / "(આવશ્યક)", not just `*`. |
| Field error | Red text + alert icon + `aria-describedby`; border turns `--destructive`. Never colour alone. |
| Card | White surface, 1px border, subtle radius; no heavy shadows. |
| Alert | Disclaimer = `warning` style with icon. Info = secondary. Error = destructive. |
| Badge | Template status: Draft (muted), In review (secondary), Approved (success outline), Published (success), Retired (muted + strikethrough/label). |
| Step indicator | Numbered steps with labels; current = primary fill, done = check icon, upcoming = muted. Collapses to "Step 2 of 4" on mobile. |
| Toast (sonner) | Success/error only; important errors also shown inline. |
| Skeleton | Use for template list and detail loading. |
| Table (admin) | Sticky header, horizontal scroll inside container (never page-level). |

### 4.6 Layout
- Container `max-w-6xl`, padding `px-4 sm:px-6`.
- Mobile: single-column forms. Two columns only ≥ `md` and only where it improves reading.
- Header: text wordmark **JanDastavej**, language toggle (EN | ગુજરાતી), Help, Privacy. No fake emblem.
- Footer: privacy link, help/contact placeholder, "Prototype — validate official templates before public use".
- No horizontal scroll at 360px on any primary page.

### 4.7 Document preview ("paper")
- Preview sits on a muted canvas as an A4-proportion white sheet (`--paper`, `--paper-shadow`), centered, scrollable inside a `ScrollArea` on small screens.
- Preview typography and margins must be identical to the PDF (same component, same CSS file). Print CSS: `@page { size: A4; margin: 20mm; }`, hide app chrome with `@media print`.
- Show a clear "Preview" label **outside** the sheet; the sheet itself must contain only the document.
- Demo templates show a "Demo only — not for official use." line (in the sheet's margin/footer, per template layout).

### 4.8 Accessibility checks tied to theme
- Text contrast ≥ 4.5:1 (large text ≥ 3:1); UI component borders ≥ 3:1. Fix any token that fails.
- Visible focus on every interactive element, including inside Dialog/Sheet.
- Respect `prefers-reduced-motion`.
- Touch targets ≥ 44×44px on mobile.
- Gujarati test strings to render in UI **and** PDF with no tofu, clipping, or broken conjuncts:
  - `પૂર્ણ નામ`, `સરનામું`, `તારીખ`, `પ્રતિજ્ઞાપત્ર`, `ઘોષણાપત્ર`, `શ્રીમતી`, `ક્ષત્રિય`, `જ્ઞાન`, `દસ્તાવેજ`
  - Long name + long multi-line address (wrapping test).

### 4.9 Theme clean-up checklist
- [ ] Grep and remove hard-coded hex / `bg-[#…]` / `text-[#…]` / inline `style={{color…}}` outside the token file.
- [ ] Remove unused Tailwind v3 config/plugins and any duplicate global CSS.
- [ ] Remove default Vite starter CSS (`App.css`, centred `#root`, etc.).
- [ ] Replace non-token colours (`blue-500`, `gray-300`, …) with token classes (`bg-primary`, `text-muted-foreground`, `border-border`).
- [ ] One icon set (`lucide-react`), consistent size (16/20/24).
- [ ] Consistent spacing scale (multiples of 4); consistent radius.
- [ ] Every page uses the same header/footer/layout shell.

---

## 5. PHASE D — Verify

Run and record results in `docs/FLOW_AUDIT.md` (append a "After fixes" section):

1. `pnpm lint && pnpm typecheck && pnpm test` (use the repo's actual scripts) — all pass.
2. Playwright e2e: **select template → fill → preview → edit → regenerate → download PDF → open PDF** passes in English and Gujarati.
3. Manual at 360×800 and 1280×800: F1, F2, F3, F9 pass with no horizontal scroll.
4. PDF check: Gujarati strings from §4.8 render correctly; preview content == PDF content.
5. Security smoke: unauthenticated `/api/v1/admin/*` → 401/403; `/api/v1/templates` returns published only; `<script>` in a field is escaped in preview and PDF.
6. Privacy smoke: grep server logs after a run — no form values.
7. Screenshots (mobile + desktop) of: landing, library, detail, form with errors, preview, admin templates → `docs/screenshots/`.

### MVP release gate (from PRD §20.1)
- [ ] ≥ 3 demo templates work end to end; none presented as official.
- [ ] All required fields validated **server-side**.
- [ ] Preview and PDF contain the same data and layout-critical content.
- [ ] Gujarati passes manual PDF rendering check.
- [ ] Public users can't reach admin functions or unpublished versions.
- [ ] Privacy notice and document-limitation notice visible.
- [ ] Clean deploy + 3–4 min demo script verified.

---

## 6. Deliverables

1. `docs/FLOW_AUDIT.md` — findings (before) + results (after).
2. Code fixes, one commit per logical change.
3. Single theme source of truth in `index.css` as specified in §4.3.
4. Updated tests covering every P0 fix.
5. `docs/screenshots/*`.
6. Final summary message: what was broken, what you fixed, what remains (with severity), and anything that needs a **department decision** (official templates, approved Gujarati wording, disclaimer/help contact text).

## 7. Do NOT

- Add features outside the PRD MVP (no payments, e-sign, e-stamp, notarization, user vault, AI legal text).
- Claim any generated document is legally valid or accepted.
- Store form answers beyond the short-lived session, or log them.
- Allow admin-supplied JS / raw HTML in templates.
- Load fonts, images or scripts from external URLs in the PDF renderer.
- Leave TODOs that hide a broken flow — if something can't be fixed, record it in the audit as an open defect.