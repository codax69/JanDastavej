# JanDastavej (જનદસ્તાવેજ) — Presentation Slide Deck Content

> **Problem Statement:** PS000221 — Digital Document Generator  
> **Authority:** Collector Office, Gandhinagar  
> **Format:** 15-Slide Pitch, Product & Architecture Deck (with Speaker Notes & Visual Cues)

---

## Slide 1: Title Slide

**Title:** **JanDastavej (જનદસ્તાવેજ)**  
**Subtitle:** Citizen-Centric Digital Affidavit, Declaration & Service Bundle Generator  
**Metadata:**  
- Problem ID: **PS000221** · Collector Office, Gandhinagar  
- Bilingual Support: **English & ગુજરાતી**  
- Open-Source Prototype (MIT License)

**Visual Cue:**  
- Clean deep indigo-navy (`#1F3A5F`) title banner with warm off-white (`#F7F6F3`) background and muted saffron (`#C9741A`) accent.  
- Screenshot: `docs/screenshots/desktop_01_landing.png`

> **Speaker Notes:**  
> "Namaste. Today we present JanDastavej — a citizen-centric digital document generator built for PS000221 (Collector Office, Gandhinagar). It helps citizens and office staff prepare standardized affidavits, self-declarations, undertakings, and service document bundles in both English and Gujarati, without repetitive data entry or unverified formats."

---

## Slide 2: The Problem — Citizen & Administrative Bottlenecks

**Headline:** Preparing routine government documents is slow, confusing, and error-prone.

- **Checklist Confusion:** Citizens visiting Taluka or District Seva Kendras often do not know which affidavits, self-declarations, or physical proofs are mandatory vs. conditional for a service.
- **Redundant Data Entry:** Applicants repeatedly write or type the same personal details (Name, Father/Spouse Name, Age, Address) across 2–4 separate forms for a single service.
- **Unverified & Costly Formats:** Dependence on external typists leads to outdated wording, inconsistent layouts, extra typing/notary costs, and counter rejections.
- **Language & Typography Friction:** Broken Gujarati Unicode fonts and clipped text in manually prepared PDFs delay processing.

**Visual Cue:**  
- 4-quadrant problem breakdown icons (Checklist, Repeat Typing, Rejection/Cost, Font Issues).

> **Speaker Notes:**  
> "Every week, thousands of citizens visit Collector and Taluka offices for Income, Domicile, or Senior Citizen certificates. Most delays happen before submission—citizens don't know the exact document checklist, re-enter the same data across multiple forms, and rely on informal typists with outdated formats."

---

## Slide 3: The Solution — JanDastavej Overview

**Headline:** One guided portal from service discovery to print-ready legal layouts.

1. **Service-to-Document Mapping:** Browse services to see exact mandatory declarations and physical proof checklists upfront.
2. **Fill Once, Generate All:** Enter personal details once; a canonical mapper populates every required declaration in the service bundle simultaneously.
3. **Bilingual Citizen UX (EN ⇄ GU):** Instant switching between English and Gujarati without losing entered form state.
4. **Shared A4 Renderer & Dual Export:** Browser preview and downloadable **PDF** use the same renderer; long-document Gujarati page breaks require separate verification (plus editable **Word `.docx`**).
5. **Privacy-First & Governed:** Ephemeral sessions, opt-in data reuse, and role-based template versioning with full audit trails.

**Visual Cue:**  
- High-level 4-step workflow diagram: **Select Service / Format → Enter Details Once → A4 Preview & Disclaimer → Download PDF / DOCX**.

> **Speaker Notes:**  
> "JanDastavej solves this with a guided four-step experience. Citizens pick either a single document or an entire government service, enter their details once, inspect an A4 preview, acknowledge a clear preparation disclaimer, and download a print-ready PDF or editable DOCX. Long Gujarati documents should be checked against the PDF using Chromium print settings."

---

## Slide 4: Core Design Principles (What Makes It Trustworthy)

**Headline:** Built for public-sector reliability, not AI guesswork.

| Principle | How JanDastavej Implements It |
|---|---|
| **Zero AI Legal Hallucination** | Legal wording comes **strictly from versioned, admin-approved templates** with deterministic escaped substitution—never LLM-generated clauses. |
| **Shared Render Source** | Browser preview and Chromium PDF use the same HTML/CSS renderer (`@jandastavej/shared`), but pagination and page breaks can differ. Verify preview-to-PDF fidelity for long Gujarati documents in the browser preview and with Chromium print settings. |
| **Honest Legal Boundaries** | Prominent *"Demo only — not for official use"* watermark/banner; explicit pre-download disclaimer clarifying preparation ≠ notarization or submission. |
| **Zero Fake Official Seals** | Clean text wordmark only—no fabricated government emblems, stamps, or signatures. |

**Visual Cue:**  
- Flow: `Shared HTML/CSS → Browser Preview / Chromium PDF` *(verify long-document pagination separately)*.

> **Speaker Notes:**  
> "In government workflows, accuracy and trust matter more than flashy AI text. We strictly forbid AI from inventing legal clauses. Browser preview and PDF share a renderer, while pagination is handled separately; long Gujarati documents must be checked in the browser preview and against Chromium print settings."

---

## Slide 5: Citizen Journey — Single Document Flow (4 Steps)

**Headline:** Guided, schema-driven forms designed for every level of digital literacy.

- **Step 1 — Discover (`/documents`):** Search and filter standardized templates (Self-Declarations, Affidavits, Undertakings) by category and language.
- **Step 2 — Format Info (`/documents/:slug`):** Plain-language purpose, required fields, supporting proof notes, and active published version badge.
- **Step 3 — Dynamic Form (`/create/:templateId`):**
  - Rendered dynamically from template Zod schemas (no hard-coded per-form UI).
  - Inline field validation that **never erases user input** on errors.
  - **Opt-in Session Reuse** across documents + prominent **"Clear My Data"** button.
- **Step 4 — Preview & Export (`/preview/:sessionId`):** Paper-sheet A4 canvas, edit-return loop, mandatory disclaimer checkbox, then **PDF / DOCX / Print**.

**Visual Cue:**  
- Filmstrip of `desktop_02_library.png` → `desktop_03_detail.png` → `desktop_04_form_errors.png` → `desktop_05_preview.png`.

> **Speaker Notes:**  
> "Let's walk through a citizen's flow. From the library, they check the document's purpose and required proofs before typing a single word. Our schema-driven form validates inline without clearing answers, supports opt-in reuse within the session, and leads to an A4 preview where download unlocks only after reading the preparation notice."

---

## Slide 6: Service-to-Document Bundles (Zero Redundant Entry)

**Headline:** Enter personal details once—generate an entire service packet.

| Seeded Citizen Service | Category | Declarations Generated Together | Physical Proofs Checklist |
|---|---|---|---|
| **Income Certificate** *(આવક પ્રમાણપત્ર)* | Revenue | Self-Declaration, Income Declaration, Address Declaration | Ration Card, Electricity Bill, Salary Slip / Talati Report |
| **Domicile Certificate** *(ડોમિસાઇલ પ્રમાણપત્ર)* | General Admin | Address Declaration, General Affidavit, Self-Declaration | School LC (10+ yrs), Electricity Bills, Tax Receipts |
| **Name Change Declaration** *(નામ સુધારણા સોગંદનામું)* | Legal Affairs | General Affidavit, Self-Declaration | Old Govt Photo ID, Birth Cert / School LC, Gazette / Marriage Cert |
| **Senior Citizen Certificate** *(વરિષ્ઠ નાગરિક પ્રમાણપત્ર)* | Social Welfare | Self-Declaration, Address Declaration | Age Proof (Birth Cert / Voter ID), Address Proof, Photos |
| **New Utility Connection** *(નવું જોડાણ બાંહેધરી)* | Urban Dev | Utility Undertaking, Address Declaration | Property Tax Bill, Index-2 Copy, Ownership Proof |

- **Output:** Single **Combined Bundle PDF** containing all required declarations in sequence, plus individual document downloads.

**Visual Cue:**  
- Diagram showing **1 Unified Citizen Form** fanning out into **3 Standardized Declarations + 1 Physical Proof Checklist**.

> **Speaker Notes:**  
> "Real citizen services rarely need just one paper. For an Income or Domicile Certificate, our Service Bundle flow collects common fields like name, age, and address once, generates all required declarations together in a single combined PDF, and gives a clear checklist of physical proofs to carry to the office."

---

## Slide 7: Optional Smart Pre-Fill from Citizen Documents

**Headline:** Signed-in citizens can scan supporting documents to pre-fill forms—with full human control.

- **Optional & Consent-Gated:** Anonymous users can always use blank forms. Signed-in citizens (OTP auth) can upload ID/address proofs (PDF/JPG/PNG).
- **Safety Gate (`SafetyScanner`):** Magic-byte MIME verification, 10 MB limit, malware/EICAR check, and PDF active-content/macro rejection.
- **Text-Based Extraction (`DocumentExtractor`):** Rules & regex patterns process PDF text streams or text-bearing buffers for English and Gujarati fields. JPG/PNG uploads are not OCR-converted, so image-based name extraction is not supported.
- **Human-in-the-Loop Review (`ExtractionReviewModal`):** Extracted values are **never auto-applied**—citizens inspect, edit, accept, or reject each field.
- **Ephemeral by Default (`My Documents`):** Files auto-expire unless explicitly saved with granular consent; instant one-click delete.

**Visual Cue:**  
- Pipeline bar: `Upload → Safety Scan → Text Extraction + Rules → Review`; JPG/PNG image content is not OCR-extracted.

> **Speaker Notes:**  
> "To reduce typing even further, signed-in citizens can optionally upload a supporting ID or address proof. Every file passes safety checks. Text extraction and English/Gujarati rules can prefill text-bearing documents for review; image uploads are not OCR'd and should not be expected to provide extracted fields."

---

## Slide 8: Bilingual Typography & Dual Export Engine

**Headline:** Crisp Gujarati & English output in both print-ready PDF and editable DOCX.

- **Verified Unicode Font Stack:** Self-hosted `@fontsource/noto-sans-gujarati` and `@fontsource/noto-sans` plus Linux Indic fonts (`fonts-indic`, `fonts-noto-extra`) prevent broken conjuncts (`જોડાક્ષર`) and vowel signs.
- **Sandboxed PDF Worker (`Playwright Chromium`):**
  - Renders controlled HTML/CSS from `@jandastavej/shared` to A4 PDF.
  - `javaScriptEnabled: false` and `offline: true` prevent XSS execution and SSRF/network egress.
  - Concurrency-capped worker (`PDF_CONCURRENCY_LIMIT`) protects server stability.
- **Editable Word Export (`docx` OpenXML):**
  - Generates native `.docx` files for citizens or advocates needing offline formatting adjustments.

**Visual Cue:**  
- Split visual: Left = Gujarati A4 PDF render (`Noto Sans Gujarati`); Right = Native `.docx` editable layout.

> **Speaker Notes:**  
> "Regional language rendering often breaks in server-side PDF tools. We embed Noto Sans Gujarati directly and render via headless Chromium inside a strict offline, JavaScript-disabled sandbox. And for citizens or advocates who need to make local edits, we also export clean OpenXML Word documents."

---

## Slide 9: Administrative Governance & Template Lifecycle

**Headline:** Controlled publishing workflow with immutable versions and operational audit logging.

- **Strict Version Lifecycle:**
  `Draft` → `In Review` → `Approved` → `Published` → `Retired` *(or `Rejected` with reason)*
- **Version Immutability:** Published template versions cannot be edited in place; updates create a new draft version.
- **Role-Based Access Control (RBAC):** Server-enforced roles (`ADMIN`, `OFFICER`, `VIEWER` / approver separation) backed by HttpOnly signed cookies and Argon2 password hashing.
- **Citizen Format Submissions (`/submit-format`):** Citizens/staff can propose new blank formats; `AiScannerService` masks PII first (`piiMasker`) before structural & suitability checks for admin review.
- **Audit Log (`/admin/audit`):** Tracks actor, action, entity, version, and timestamp. It is not tamper-evident; it is designed not to store document contents or citizen answers, but may contain actor identifiers.

**Visual Cue:**  
- Screenshots: `desktop_07_admin_templates.png` & `desktop_08_admin_audit.png` + Lifecycle state diagram.

> **Speaker Notes:**  
> "On the governance side, admins cannot arbitrarily alter live legal forms. Templates move through Draft, Review, Approval, and Published states, and published versions are immutable. State changes are recorded in an operational audit log; it is not cryptographically protected against database-level edits."

---

## Slide 10: System Architecture (Monorepo)

**Headline:** Modular TypeScript monorepo sharing one schema & render engine across client and server.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        apps/web (React 19 + Vite)                       │
│  Citizen Portal · Service Bundles · My Documents · Admin Governance     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST JSON (/api/v1) + HttpOnly Cookies
┌───────────────────────────────▼─────────────────────────────────────────┐
│                    apps/api (Node.js + Express 4)                       │
│  Auth & RBAC · Services · Templates · Submissions · Safety/OCR · Metrics│
├───────────────────────────────────┬─────────────────────────────────────┤
│  Playwright Chromium (Offline)    │  docx Engine (OpenXML)              │
└───────────────────┬───────────────┴─────────────────┬───────────────────┘
                    │                                 │
┌───────────────────▼─────────────────────────────────▼───────────────────┐
│               packages/shared (@jandastavej/shared)                     │
│   Zod Schemas · Answer Validators · Single-Path HTML/CSS Renderer       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  MongoDB (Mongoose)   │
                        │ Templates · Versions  │
                        │ TTL Sessions · Audits │
                        └───────────────────────┘
```

**Visual Cue:**  
- Clean 3-tier monorepo architecture block diagram (`apps/web`, `apps/api`, `packages/shared`, MongoDB).

> **Speaker Notes:**  
> "Architecturally, JanDastavej is a clean TypeScript monorepo. Both the React 19 frontend and Express API consume `@jandastavej/shared` for Zod validation and HTML document rendering—guaranteeing contract consistency and a single render path."

---

## Slide 11: Technology Stack

**Headline:** Modern, production-aligned open-source stack.

| Layer | Technologies Used |
|---|---|
| **Frontend (`apps/web`)** | React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router v7, TanStack Query, React Hook Form + Zod, Lucide React, Sonner |
| **Typography & Theme** | `@fontsource/noto-sans-gujarati`, `@fontsource/noto-sans`, owned CSS design tokens (`#1F3A5F` navy, `#F7F6F3` paper canvas) |
| **Backend (`apps/api`)** | Node.js (>= 20 / tested on v22–24), Express 4, TypeScript, Mongoose (MongoDB), Pino structured logging, Multer |
| **Document Engines** | Playwright (headless Chromium PDF), `docx` (OpenXML Word generation) |
| **Shared Layer (`packages/shared`)** | Zod schemas, shared answer validators, deterministic HTML/CSS document renderer |
| **Quality & DevOps** | Vitest, Supertest, Testing Library, GitHub Actions CI/CD, Docker + Nginx + PM2 |

> **Speaker Notes:**  
> "Our stack uses React 19 and Tailwind v4 on the frontend, Node.js, Express, and MongoDB on the backend, Playwright and `docx` for document generation, and Zod schemas shared end-to-end across all workspaces."

---

## Slide 12: Security, Privacy & DPDP Act 2023 Alignment

**Headline:** Privacy by default—minimize collection, isolate rendering, and protect citizens.

- **Ephemeral Citizen Sessions:** `GenerationSession` records use MongoDB TTL expiry (`expiresAt`); citizens can clear session data immediately from the UI.
- **DPDP Act 2023 Controls:** Granular opt-in consent records (`process`, `keep`, `ai_assist`), default PII masking (`piiMasker`), and instant delete in `My Documents`.
- **Authentication & Transport Security:**
  - Admin passwords hashed with **Argon2**; sessions stored in **HttpOnly, SameSite cookies** (no JWTs in `localStorage`).
  - `helmet` security headers, strict CORS allowlists, and `express-rate-limit` on API/auth endpoints.
- **Injection & SSRF Defense:**
  - Deterministic value escaping—user input never becomes executable HTML, CSS, or template code.
  - PDF Chromium worker runs with `javaScriptEnabled: false` and `offline: true` (zero outbound network access).
- **Zero-PII Observability:** Structured Pino logs with `requestId` exclude form answers, tokens, and document bodies.

> **Speaker Notes:**  
> "Security and citizen privacy are built into the foundation. Citizen sessions expire automatically via TTL indexes, admin auth uses Argon2 with HttpOnly cookies, user values are strictly escaped, and our Chromium PDF worker runs completely offline with JavaScript disabled."

---

## Slide 13: Engineering Quality & CI/CD Pipeline

**Headline:** Automated verification across types, tests, Indic fonts, and containers.

- **Automated GitHub Actions Pipeline (`.github/workflows/cicd.yml`):**
  1. **Lint & Typecheck:** Builds `@jandastavej/shared` and runs strict TypeScript checks across all workspaces.
  2. **Unit & Integration Tests:** Spins up MongoDB 7.0 service, installs Playwright Chromium + Indic fonts (`fonts-indic`, `fonts-noto-extra`), seeds test data, and runs **Vitest** suites across `shared`, `api`, and `web`.
  3. **Production Builds:** Verifies compiled artifacts for shared, API, and Vite web bundle.
  4. **Docker Build & Push:** Packages production API and Nginx-served web containers (`ghcr.io`).
- **Deployment Ready:** Includes `docker-compose.yml`, `ecosystem.config.js` (PM2), health checks (`/api/v1/health`), and flow audit scripts (`scripts/audit-flow.js`).

> **Speaker Notes:**  
> "Every push runs through a four-stage GitHub Actions pipeline: strict workspace typechecking, full Vitest integration tests against a live MongoDB 7 container with Indic fonts installed, production workspace builds, and Docker image packaging."

---

## Slide 14: Prototype Scope & Future Roadmap

**Headline:** Clear MVP boundaries today; clear path to district-wide pilot tomorrow.

### Current Prototype Boundaries (Transparency First)
- All included templates are labeled **"Demo only — not for official use"** pending Collector Office legal review.
- Generates prepared documents—does **not** claim automatic notarization, e-stamping, oath administration, or legal validity.

### Next Phase Roadmap
1. **Authority Template Validation:** Sign-off on official Gujarati & English wording, stamp-duty notes, and department rules from Gandhinagar Collectorate.
2. **Assisted Operator Mode:** Dedicated Seva Kendra / Taluka counter workflow with visible citizen consent banners and operator audit trails.
3. **Digital Public Infrastructure Hooks:** Optional DigiLocker document fetch, Aadhaar e-Sign / e-Stamping integration once official APIs are provisioned.
4. **Expanded Service Catalog:** Scale beyond the 5 core services to caste, non-creamy layer, solvency, and ration card workflows.

> **Speaker Notes:**  
> "We are transparent about prototype boundaries: included formats are marked demo-only until legally approved by the authority. Next steps are straightforward—departmental sign-off on official Gujarati templates, Seva Kendra operator mode, and optional DigiLocker or e-Sign integrations."

---

## Slide 15: Summary & Live Demo Q&A

**Headline:** JanDastavej — Faster for Citizens. Standardized for Administration.

- **Zero Redundant Entry:** Fill once across multi-document service bundles.
- **Shared Preview/PDF Renderer:** Chromium PDF and browser preview share rendering code; long-document Gujarati pagination must be verified separately.
- **Dual Export:** Print-ready A4 PDF + editable Word DOCX.
- **Governed & Private:** Immutable template versions, operational audit logs, and DPDP-aligned ephemeral sessions.

**Thank You · Questions & Live Demo**  
- Citizen Portal: `http://localhost:5173`  
- Admin Governance: `http://localhost:5173/admin/login`  
- API Health: `http://localhost:4000/api/v1/health`
