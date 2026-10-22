# JanDastavej (જનદસ્તાવેજ)

> **Citizen-Centric Digital Affidavit & Declaration Generator**  
> Open-source platform streamlining citizen interactions with district administration and public services. Generates standardized affidavits, self-declarations, undertakings, and supporting document checklists with zero redundant data entry.

---

## 1. Problem & Solution Overview

### The Citizen Problem
- **Checklist Confusion:** Citizens visiting Taluka or District Seva Kendra often don't know which affidavits, declarations, or physical proofs are mandatory vs. conditional for services like Income Certificate, Domicile, Name Change, or Electricity Connections.
- **Redundant Data Entry:** Citizens are forced to fill out repetitive paper forms (name, father's name, age, address, Aadhaar) across multiple documents for a single service.
- **Unverified & Costly Formats:** Relying on unofficial typists outside offices often yields outdated formats, rejected submissions, or unnecessary notary costs.

### The JanDastavej Solution
1. **Service-to-Document Mapping:** Browse catalog of citizen services with authoritative checklists of mandatory vs. conditional declarations and required physical proofs.
2. **Unified Citizen Input:** Fill personal details once; canonical field mapper populates every required document in the bundle simultaneously.
3. **Dual Export Formats:**
   - **PDF Generation:** Pixel-perfect A4 legal layout rendered via headless Chromium with embedded Unicode Gujarati/Devanagari fonts (`Noto Sans Gujarati`).
   - **Word DOCX Export:** Native OpenXML editable format for citizens needing specific offline customizations or advocate additions.
   - **Combined Bundle PDF:** Single combined PDF containing all required declarations in sequence.
4. **Data Protection & Privacy (DPDP Compliance):** Ephemeral sessions with TTL, consent records, no unnecessary PII retention, secure session cookies, and Argon2 password hashing.
5. **Administrative Governance:** Role-based access control (Admin/Officer/Viewer), template versioning (`draft` -> `published` -> `archived`), publication audit trail, and document requirement management.

---

## 2. Architecture & Monorepo Structure

```
JanDastavej/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── models/          # Mongoose models (Service, Template, GenerationSession, etc.)
│   │   │   ├── modules/
│   │   │   │   ├── admin/       # Template management, submissions review, audit logs
│   │   │   │   ├── auth/        # OTP authentication & session management
│   │   │   │   ├── generations/ # Playwright PDF generator & DOCX builder
│   │   │   │   ├── services/    # Citizen service catalog & bundle generation
│   │   │   │   └── templates/   # Template retrieval & rendering
│   │   │   └── scripts/seed.ts  # Database seed script (templates & services)
│   │   └── vitest.config.ts
│   └── web/                     # React 19 + Vite + TypeScript frontend
│       ├── src/
│       │   ├── components/      # UI components (Button, Badge, Card, Modal, StepIndicator)
│       │   ├── context/         # CitizenAuthContext, LanguageContext, SessionReuseContext
│       │   └── features/
│       │       ├── admin/       # Template editor, submission review
│       │       ├── documents/   # Document catalog & single document flow
│       │       ├── preview/     # Live A4 document preview & export
│       │       └── services/    # Service directory, checklist, bundle wizard & preview
│       └── vite.config.ts
├── packages/
│   └── shared/                  # Common TypeScript schemas & engines
│       └── src/
│           ├── renderers/       # Layout engines, HTML generators & answer normalizers
│           └── schemas/         # Zod schemas for templates, services, sessions, DPDP
├── docs/                        # Architecture & compliance specifications
└── LICENSE                      # Open-source MIT License
```

---

## 3. Tech Stack

- **Runtime:** Node.js >= 20 (tested on Node v24.22)
- **Monorepo Management:** npm workspaces
- **Backend:** Express 4, TypeScript, Zod, Mongoose (MongoDB), Helmet, CORS, Argon2, Pino logger
- **PDF Engine:** Playwright headless Chromium with local font integration (`Noto Sans Gujarati`, `Noto Sans Devanagari`)
- **DOCX Engine:** `docx` npm library (native OpenXML generation)
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, TanStack Query, React Router v7
- **Testing:** Vitest across all packages and apps

---

## 4. Quick Start (Local Setup)

### Prerequisites
- Node.js (>= 20.0.0)
- MongoDB running locally on `localhost:27017`
- Linux fonts (optional for development, essential for server PDF rendering): `fonts-noto-core`, `fonts-noto-cjk`

### 1. Clone & Install
```bash
git clone https://github.com/your-username/JanDastavej.git
cd JanDastavej
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `apps/api/.env` and `apps/web/.env`:
```bash
cp .env.example apps/api/.env
```
Ensure `apps/api/.env` has:
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/jandastavej
SESSION_SECRET=dev-session-secret-change-in-production-min-32-chars
COOKIE_SECRET=dev-cookie-secret-change-in-production-min-32-chars
```

### 3. Seed Database
Seeds 5 standardized legal templates and 5 high-impact citizen services:
```bash
npm run seed --workspace=apps/api
```

### 4. Run Development Servers
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- API Health Check: `http://localhost:4000/api/v1/health`

---

## 5. Verification & Testing

Run the full automated test suite (38+ tests across workspaces):
```bash
# Run all tests
npm run test --workspaces

# Run type check
npm run typecheck --workspaces

# Build production bundles
npm run build --workspaces
```

---

## 6. Supported Citizen Services & Documents

| Service | Category | Required Declarations & Documents | Physical Proofs Required |
|---|---|---|---|
| **Income Certificate** (આવક પ્રમાણપત્ર) | Revenue | Self-Declaration (`sample-declaration`), Income Declaration (`income-declaration`), Address Declaration (`sample-address-declaration`) | Ration Card, Electricity Bill, Salary Slip / Talati Report |
| **Domicile Certificate** (ડોમિસાઇલ પ્રમાણપત્ર) | General Administration | Address Declaration (`sample-address-declaration`), General Affidavit (`sample-affidavit`), Self-Declaration (`sample-declaration`) | School Leaving Certificate (10+ Years), Electricity Bills, Tax Receipts |
| **Name Change Declaration** (નામ સુધારણા સોગંદનામું) | Legal Affairs | General Affidavit (`sample-affidavit`), Self-Declaration (`sample-declaration`) | Old Govt Photo ID, Birth Certificate / School LC, Gazette / Marriage Cert |
| **Senior Citizen Certificate** (વરિષ્ઠ નાગરિક પ્રમાણપત્ર) | Social Welfare | Self-Declaration (`sample-declaration`), Address Declaration (`sample-address-declaration`) | Age Proof (Birth Cert / Voter ID), Address Proof, Passport Photos |
| **New Utility Connection** (નવું જોડાણ બાંહેધરી) | Urban Development | Utility Undertaking (`undertaking-utility`), Address Declaration (`sample-address-declaration`) | Property Tax Bill, Index-2 Copy, Ownership Proof |

---

## 7. Security, Privacy & DPDP Compliance

- **No Unauthorized Persistent PII:** Personal data entered in citizen sessions is stored ephemerally (`GenerationSession`) and can be cleared immediately upon download.
- **Strict Role-Based Access Control (RBAC):** Backend verifies admin tokens and roles (`ADMIN`, `OFFICER`, `VIEWER`). Frontend route guards are backed by server-side verification.
- **Cryptographic Security:** Argon2 password hashing for administrators, signed HTTP-only cookies for sessions, and helmet security headers with strict CSP.
- **Input Validation:** Every payload is validated against strict Zod schemas on both frontend and API layers.
- **Safe Template Rendering:** Document templates use deterministic, sanitized placeholder engines without arbitrary code evaluation.

---

## 8. Disclaimer

> **Important:** This system is an open-source prototype designed for hackathons and demonstration of citizen-centric administrative workflows. The generated documents and checklists are for demonstration purposes and must be verified against current state gazette notifications and district administration rules before official submission.

---

## 9. License

This project is licensed under the [MIT License](LICENSE).
