# Feature Addendum 2 — User Uploads Own Documents + Uses Them for Affidavits & Other Documents

**Applies to:** JanDastavej (PS000221) · **Amends:** `PRD.md`, `TRD.md`
**Related:** `FEATURE_USER_UPLOAD_AI_VERIFY.md` (that file is about uploading *blank formats/templates* for admin verification; **this file is about citizens uploading their own personal documents**). The two features are separate and must not share storage or queues.
**Status:** Change request. Where this conflicts with PRD/TRD, this file wins for this feature only.

---

## 1. What is being added

A signed-in user can upload their own supporting documents (for example ID proof, address proof, previous affidavit, certificate). The system scans them, extracts details on the server, and offers to **pre-fill** the affidavit/declaration form. The user reviews and corrects every value, then generates the document (affidavit, declaration, undertaking, etc.) and downloads or prints it. Uploaded files can optionally be kept in a private **My Documents** area for reuse, under explicit consent and a retention limit.

```
Upload my document → Safety scan → Extract text/fields → User reviews & confirms → Pre-fill form
      → Preview → PDF / Print → (optional) attach/keep in My Documents → Delete anytime
```

## 2. Changes to earlier scope

| Earlier rule | Change |
|---|---|
| PRD §6.2: no long-term vault, no default storage of sensitive docs | Add an **opt-in** private "My Documents" area with short default retention. Default is **no storage**: files are deleted after the session unless the user chooses "Keep" |
| PRD NFR-07 / TRD §8: minimize PII, no raw document storage by default | Still holds as the default. Storage only with explicit consent, per file, with a visible expiry and a delete button |
| Anonymous generation | Generating from a blank form stays anonymous. **Uploading personal documents requires sign-in** (email/phone OTP) |
| No AI on personal data | AI is **off by default** for personal documents. Extraction uses local OCR + rules. AI-assisted extraction only if the department approves the provider, and only after explicit user consent |
| Out of scope: identity verification | Still out of scope. The app **does not verify** that an uploaded ID is genuine; it only helps copy details, which the user confirms |

## 3. Roles

| Role | Can do |
|---|---|
| Citizen (signed in) | Upload own documents, review extracted values, generate documents, keep/delete own files |
| Citizen (anonymous) | Use blank forms only; cannot upload personal documents |
| Office staff (assisted mode) | Only with the citizen's consent and a visible assisted-session banner; every access audited |
| Admin | Manage templates/config. **No access to citizens' uploaded files** except a break-glass path with reason, second approver and audit event |

## 4. Flows

### D1 — Upload and use a supporting document (P0)
1. In the form step, user clicks **Upload a document to fill details** (optional, never required).
2. Consent screen: what is read, where it is processed, how long it is kept, and that nothing is sent to external AI unless they opt in. Checkbox required.
3. Choose document type (ID proof, address proof, previous affidavit, other) and upload (PDF/JPG/PNG).
4. Scan and extraction run with a progress state; the UI never blocks entry (user can skip and type manually).
5. **Review screen**: each extracted value shown next to a crop/preview of the source with a confidence indicator. User edits, accepts or discards each value. Nothing is applied automatically.
6. Accepted values pre-fill the form; filled-from-upload fields show a small "from your document" tag and stay editable.
7. Continue: preview → disclaimer → PDF/print.
8. End of session: uploaded file and extracted values are deleted unless the user chose **Keep in My Documents**.

### D2 — My Documents (P1)
- `/my-documents` lists kept files: name, type, uploaded date, **expires on**, and actions: use, rename, download, delete.
- Delete is immediate and permanent (file + extracted values + derived thumbnails).
- Default retention 30 days (configurable, max per department policy); user can choose shorter. Expiry reminder before deletion.
- "Delete all my data" button, and account deletion removes everything.

### D3 — Attach supporting documents to the generated output (P1)
- User may select kept/uploaded files to bundle as **annexures** after the generated affidavit in one PDF (cover page lists annexures, each page marked "Annexure A/B…").
- Only PDF/JPG/PNG; merged server-side; size cap on the bundle.
- The app does not certify or attest the annexures.

### D4 — Use previous generated documents (P1)
- User can re-use details from a previously generated affidavit **only if they kept it** (same opt-in/retention rules).

### D5 — Other documents (P0 for catalogue, content from admin)
- "Affidavits and other documents" = all published templates (affidavit, declaration, undertaking, consent letter, etc.). No new template engine; same schema-driven flow F1–F4.
- Library gets category chips: **Affidavits · Declarations · Undertakings · Letters · Other**.

## 5. Extraction pipeline (server-side, sandboxed worker)

1. **Safety gate**: magic-byte MIME check; reject macros, encrypted PDFs, active content, oversize/page-bomb files; malware scan (ClamAV or equivalent); strip metadata (including EXIF GPS).
2. **Text extraction**: PDF text layer; DOCX via mammoth; images/scans via Tesseract OCR (`eng` + `guj`). Record confidence per field.
3. **Field detection (rules first)**: regex/pattern extraction for name, father/spouse name, date of birth, address, PIN code, ID-number formats, dates. Map to the **template's field keys** (a shared field dictionary: `fullName`, `fatherName`, `dob`, `address`, `pincode`, …).
4. **Optional AI assist** (default OFF): if enabled by config **and** the user consented, send only the minimum needed text to the approved provider to improve field mapping. Never send the image. Never send full ID numbers (mask, e.g. last 4 digits only unless the template needs the full value; if needed it is filled locally, not by AI).
5. **Output**: a JSON list `{ fieldKey, value, confidence, sourcePage, bbox }`, validated by zod. Anything below a confidence threshold is shown as "please check".
6. **Never auto-apply.** The user confirms every value (D1 step 5).

## 6. Privacy and legal controls (India)
- Align with Digital Personal Data Protection Act, 2023 (DPDP Act).
- Granular consent: (a) process, (b) keep, (c) ai_assist.
- Mask sensitive identifiers (Aadhaar, PAN, voter ID, passport) in UI by default.
