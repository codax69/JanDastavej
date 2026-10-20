# JanDastavej — Product Requirements Document (PRD)

**Problem ID:** PS000221 · **Authority:** Collector Office, Gandhinagar
**Version:** 1.1 · **Prepared:** 20 October 2026 · **Target submission:** 6 November 2026
**Companion document:** `TRD.md` (technical requirements)

> Status: Prototype specification. Legal templates and workflows require validation by the relevant authority before public use.

---

## 1. Document control

| Field | Details |
|---|---|
| Project | JanDastavej — Digital Document Generator |
| Problem ID | PS000221 |
| Industry / authority | Collector Office, Gandhinagar |
| Primary audience | Product team, developers, designers, testers, challenge evaluators, departmental stakeholders |
| Target | Working prototype suitable for demonstration before 6 November 2026 |
| Source problem | Provided PS000221 problem statement |

### Assumptions and boundaries

- The challenge asks for standardized affidavits, declarations, notarisation-related formats and supporting documents, populated from minimum required citizen information.
- No official templates, service-specific legal rules, approved wording, stamp-duty rules or government integrations were supplied.
- All sample templates in development must be labelled as **demonstration templates** until approved by the relevant authority.
- Generating a document does **not** make an affidavit sworn, notarized, stamped, legally valid or accepted by any office.
- The MVP is a **document preparation tool**, not a legal-advice engine or an e-notarization platform.

## 2. Executive summary

JanDastavej is a responsive web application that reduces repetitive data entry and formatting effort when citizens prepare affidavits, declarations and supporting documents. A user selects a document type, enters only the fields that template requires, reviews a faithful preview, corrects permitted fields and downloads or prints the document. Authorized staff manage template versions and required fields. The MVP focuses on a small validated template set and one complete end-to-end workflow.

## 3. Problem statement

Citizens and administrative staff struggle to identify the correct document format and repeatedly type the same details into predefined formats. Manual preparation is slow, error-prone and depends on familiarity with forms and procedures. The system standardizes preparation, reduces repeated entry, and supports editing, preview, printing and downloading.

## 4. Vision and objectives

- Make document preparation understandable for users with different levels of digital literacy.
- Reduce repeated entry of the same details within a session.
- Generate consistent documents from versioned templates, never AI-invented legal text.
- Make preview, correction, PDF download and print straightforward on mobile and desktop.
- Let authorized staff manage templates with clear versioning and audit history.
- Protect personal information through minimization, secure handling and limited retention.

## 5. Users and roles

| Role | Needs | Permissions |
|---|---|---|
| Citizen / applicant | Find a document, fill a guided form, preview, edit permitted fields, download/print | Use public templates; create and download; no admin |
| Office staff | Help applicants prepare documents, answer format questions | Assisted workflow where authorized; no changing approved legal wording without template role |
| Template administrator | Maintain approved templates, fields, instructions, versions | Create/edit drafts, submit for approval, publish approved versions, retire obsolete ones |
| Approver / reviewer | Verify a template matches the authorized source | Approve/reject versions and record reason |
| System administrator | Manage access, security, configuration, service health | Manage roles/config; access personal content only when necessary and authorized |

## 6. Scope

### 6.1 In scope (MVP)

- Responsive citizen portal with search and category filters.
- 3–5 demo templates; official only after authority validation.
- Template-driven dynamic forms with required-field validation and opt-in reuse within a session.
- Gujarati and English interface/document capability where verified fonts and approved wording exist.
- Preview matching generated output as closely as possible.
- PDF generation, download and browser print.
- Basic template administration, versioning, draft/published states.
- Authentication and role-based access for admin functions.
- Privacy notice, data minimization, safe error handling, basic audit events.
- Basic usage and quality metrics.

### 6.2 Out of scope (MVP)

- Automated notarization, e-stamping, digital signatures, oath administration, identity verification.
- Claims of legal validity or guaranteed acceptance.
- Direct government-system integrations without documented API access and permission.
- AI-generated legal clauses or autonomous legal advice.
- Online payment, stamp-duty calculation, appointment booking.
- Long-term citizen document vault or default storage of sensitive documents.
- Production-scale public launch without security, legal and accessibility review.

## 7. Core user journeys and flows

### 7.1 Citizen generates a document (primary flow, F1)

1. Open the portal and choose language.
2. Search or browse categories and open a document detail page.
3. Review purpose, eligibility/context notes, required information, next steps.
4. Complete a dynamic form; required fields and formats explained in plain language.
5. Review a preview generated from the selected template and entered data.
6. Return to the form to correct permitted values; regenerate preview.
7. Accept a clear notice that the file is a prepared document and may still need execution, stamping, notarization or other steps.
8. Download PDF or print. The system does **not** represent this as submission to an authority.

### 7.2 Administrator publishes a template (F6)

1. Authorized admin creates a draft from a controlled template source.
2. Define field schema, validation, language variants, layout, user instructions.
3. Preview with synthetic test data; validate output against the source format.
4. Submit for review; approver accepts or rejects with a reason.
5. Publish approved version; retain prior versions and audit history.
6. Retire obsolete templates; show a notice if users reach an old version.

### 7.3 Flow inventory

| ID | Flow | Priority |
|---|---|---|
| F1 | Citizen: generate a document (select → enter → preview → download) | P0 |
| F2 | Browse / search / filter templates | P0 |
| F3 | Session reuse, clear-my-data, session expiry | P0 |
| F4 | Loading, empty, success and error states | P0 |
| F5 | Admin login / logout | P1 |
| F6 | Template lifecycle: Draft → In review → Approved → Published → Retired | P1 |
| F7 | Audit history | P1 |
| F8 | Language switch EN ⇄ GU without losing form state | P1 |
| F9 | Navigation integrity (no dead links; back/refresh behave sanely) | P0 |

## 8. Functional requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-01 | Browse/search templates by title, category, language | P0 | User finds an active template by keyboard or touch; inactive templates not offered as current |
| FR-02 | Show purpose, required information, limitations, next steps | P0 | Detail page gives plain-language instructions before data entry |
| FR-03 | Render form fields from a versioned schema | P0 | Each published template renders configured fields and validation without hard-coded per-template UI |
| FR-04 | Validate required fields and formats | P0 | Invalid/missing values flagged inline; valid values remain after correction |
| FR-05 | Reuse details within a session when user opts in | P0 | Repeated fields can be prefilled; user can edit/clear; values never silently reused across users |
| FR-06 | Generate preview using an approved template | P0 | Preview has entered values in correct locations and matches the PDF |
| FR-07 | Download PDF and print | P0 | PDF opens, has selectable text where supported, no clipped content |
| FR-08 | Support Gujarati and English where approved | P1 | Gujarati glyphs render correctly in preview and PDF with tested fonts; language selection explicit |
| FR-09 | Template administration workflow | P1 | Admin can draft, validate, submit, approve, publish, retire per role |
| FR-10 | Version history and audit events | P1 | Changes/approvals recorded with actor, timestamp, version |
| FR-11 | Display legal/administrative disclaimer | P0 | User told documents may need further execution/verification and are not automatically notarized |
| FR-12 | Protect personal data; deletion/reset controls | P0 | Session data can be cleared; unnecessary values not retained after session |
| FR-13 | Accessible loading, empty, success, error states | P0 | Network/PDF errors understandable and do not erase entered data |
| FR-14 | Aggregate usage and outcomes without unnecessary PII | P2 | Metrics report counts and errors without storing document contents by default |

## 9. Non-functional requirements

| ID | Area | Requirement / target |
|---|---|---|
| NFR-01 | Usability | First-time user completes a supported template without understanding template syntax |
| NFR-02 | Responsive design | Supports small mobile, tablet, desktop; no horizontal overflow in primary journeys |
| NFR-03 | Performance | Typical short document: preview ≤ 3 s, PDF ≤ 5 s in prototype tests; measure, don't assume |
| NFR-04 | Availability | Prototype reliability over scale; safe error if PDF service unavailable |
| NFR-05 | Accessibility | Semantic headings, labels, keyboard focus, visible focus states, contrast, accessible validation messages |
| NFR-06 | Security | HTTPS, secure cookies, server-side validation, role checks, rate limiting, safe file handling, secrets outside source control |
| NFR-07 | Privacy | Collect only required info; no raw document storage by default; defined retention/deletion |
| NFR-08 | Auditability | Template changes and approvals attributable and versioned |
| NFR-09 | Maintainability | Typed API contracts, modular features, linting, tests, documented env vars |
| NFR-10 | Language rendering | Test Gujarati conjuncts, vowel signs, punctuation, wrapping, PDF font embedding |

## 10. UX / UI requirements

### 10.1 Design principles

- Government-service clarity: calm, trustworthy, restrained colour, obvious next actions.
- Mobile-first; single-column forms on narrow screens, two columns only when it improves readability.
- Plain-language Gujarati and English labels; explain legal jargon.
- Step indicator: **Select document → Enter details → Preview → Download**.
- Show progress and field errors next to the field; never rely on colour alone.
- Preview is visually distinct from editable controls ("paper" sheet on a muted canvas).
- No AI-generated or fabricated official seals, logos, signatures or stamps; text wordmark only.
- Legal disclaimers visible **before** download, not hidden in the footer.

### 10.2 Visual theme (summary — tokens in TRD §9)

| Role | Value |
|---|---|
| Primary | Deep indigo-navy `#1F3A5F` |
| Accent | Muted saffron `#C9741A` (sparingly) |
| Background | Warm off-white `#F7F6F3` |
| Surface | White `#FFFFFF` |
| Text | `#1B1F24`; muted `#5B6470` |
| Success / Warning / Error | `#1E7B4C` / `#9A6200` on `#FFF4DB` / `#B3261E` |
| Font | Noto Sans Gujarati + Noto Sans, line-height ≥ 1.6 |

### 10.3 Recommended shadcn/ui components

| Use | Components |
|---|---|
| Navigation/layout | Button, Card, Separator, Breadcrumb, Sheet, Sidebar (where needed) |
| Forms | Input, Textarea, Select, Checkbox, Radio Group, Form, Label, Field, Calendar (only if required) |
| Feedback | Alert, Alert Dialog, Dialog, Sonner, Skeleton, Progress |
| Search/listing | Command, Input, Badge, Tabs, Table, Pagination |
| Admin workflow | Table, Dropdown Menu, Dialog, Badge, Tooltip, Tabs |
| Document preview | Card, Scroll Area, Separator, Dialog; custom HTML document canvas |

Use shadcn/ui as an owned component layer, not a prebuilt theme. Avoid adding a second component library.

## 11. Information architecture and screens

| Route | Purpose | Key elements |
|---|---|---|
| `/` | Landing | Service summary, search, categories, how it works, language selector, privacy/help links |
| `/documents` | Library | Search, category and language filters, active templates |
| `/documents/:slug` | Document info | Purpose, required fields, notes, version/date, next steps, Start button |
| `/create/:templateId` | Dynamic form | Step indicator, schema-driven fields, validation, session reuse, clear controls |
| `/preview/:sessionId` | Preview | Document rendering, edit-return, print, PDF download, disclaimer |
| `/admin/login` | Admin auth | Secure sign-in, rate limiting |
| `/admin/templates` | Template management | List, status, version, draft/publish/retire actions |
| `/admin/templates/:id` | Template editor | Metadata, schema, layout, language, preview, approval workflow |
| `/admin/audit` | Audit history | Filterable template and approval events |

## 12. Legal and content governance

- Each official template needs an authoritative source reference, approving authority, effective date, version and supported language.
- Keep draft and published content separate. Published versions are immutable; changes create a new version.
- Do not use an LLM to create or rewrite legal clauses in the production path.
- Show service-specific instructions only when confirmed by the responsible office.
- Clearly distinguish preparation from notarization, attestation, e-stamping, signing and formal submission.
- Display a department-approved disclaimer and help contact.
- With no official template available, use synthetic examples marked **"Demo only — not for official use."**

## 13. Success metrics

| Metric | How to measure | Initial target (prototype proposal) |
|---|---|---|
| Generation completion rate | Successful PDF downloads / generation starts | Baseline; ≥ 90% in controlled runs |
| Time to generate | Median time from opening template to PDF | ≤ 3 min for a short familiar template |
| Validation quality | Required-field errors caught before PDF | 100% of configured rules covered by automated tests |
| PDF correctness | Test PDFs match expected placement/text | 100% of critical fields present in release set |
| Gujarati rendering | Manual + automated checks | No missing glyphs or clipped critical text |
| Template governance | Published versions with approver/source/version | 100% have governance metadata |
| Privacy | PII in logs or metrics | Zero PII in logs during test audit |

Targets are proposed engineering targets, not official challenge KPIs. Report actual results; don't claim targets were met without evidence.

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No approved templates supplied | Output unsuitable for real use | Request official sources; demo-only until validated |
| Gujarati PDF rendering issues | Clipped/unreadable text | Tested Gujarati Unicode font, embedded in PDF; test conjuncts and wrapping |
| Template changes after launch | Outdated wording used | Version templates, show effective dates, retire old versions, keep audit |
| PDF renderer overload | Slow/failed generation | Isolated worker, resource limits, timeouts, concurrency caps |
| Sensitive data exposure | Loss of trust, legal risk | Minimize collection, no default storage, restricted logs, secure cookies |
| Overengineering before deadline | Core workflow incomplete | Ship one full generation path first; admin polish later |
| AI adds incorrect legal wording | Misleading content | No AI legal clauses; approved text + deterministic substitution |

## 15. Delivery plan to 6 November 2026

| Dates | Deliverable | Definition of done |
|---|---|---|
| 20–22 Oct | Scope, design, repo, data model, template validation | 3–5 candidate templates agreed; unapproved labelled demo-only; app scaffolded |
| 23–25 Oct | Template library and dynamic form | Search/select, schema-driven fields, required validation |
| 26–27 Oct | Preview and PDF | Preview/download works on at least one short template |
| 28–30 Oct | Admin workflow and versioning | Draft and publish with role checks and audit events |
| 31 Oct–2 Nov | Gujarati/English, accessibility, privacy, **flow audit + theme fix** | Language rendering, mobile layout, session clearing, disclaimers, consistent theme |
| 3 Nov | Integration and regression testing | E2E and PDF regression run; critical defects fixed |
| 4 Nov | Deployment and demo script | Stable demo environment; backup screenshots/video |
| 5 Nov | Documentation and submission pack | README, architecture diagram, screenshots, test evidence, presentation |
| 6 Nov | Submission buffer | Submit before cutoff; no risky changes |

## 16. Demo script (3–4 minutes)

1. Introduce the problem: repeated data entry and inconsistent preparation.
2. Open the library and search for a sample document.
3. Show required information and the limitation/next-step note.
4. Fill a short Gujarati or English form; show inline validation.
5. Generate a preview, change a field, regenerate.
6. Download the PDF; show it matches the preview.
7. Show the admin version/approval screen with demo data.
8. Close with measured test results, privacy design, and the need for official template validation.

## 17. Open questions for the department

- Which exact document types should the pilot cover?
- Can the office provide current authorized templates and their source/approval information?
- Which Gujarati and English formats are required; any prescribed fonts or page layouts?
- What stamp duty, attestation or notarization steps must be displayed?
- Anonymous citizen use, or authentication for any service?
- Approved hosting, data-residency, security or accessibility standards?
- Is any government-system integration required, and is API access documented?
- Who is authorized to review and publish template versions?

## 18. Definition of done

The MVP is ready for demonstration when a citizen can select a supported template, complete validated fields, preview the document, correct entries, download a correctly rendered PDF and understand any further execution steps; authorized staff can manage a versioned template through a controlled approval workflow; and the application passes the defined functional, privacy, security and PDF rendering tests.

## References

- Problem statement PS000221 (Collector Office, Gandhinagar)
- shadcn/ui installation: https://ui.shadcn.com/docs/installation
- shadcn/ui Vite guide: https://ui.shadcn.com/docs/installation/vite
- React versions: https://react.dev/versions

*Combines requirements inferred from the problem statement with recommended engineering practice. Confirm legal, operational and hosting requirements with the responsible authority before production use.*