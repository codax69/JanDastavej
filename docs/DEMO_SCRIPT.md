# JanDastavej (PS000221) — 3–4 Minute Demonstration Script

**Authority:** Collector Office, Gandhinagar
**Problem Statement:** PS000221 · Digital Document Generator
**Audience:** Challenge Evaluators, Departmental Stakeholders

---

## Part 1: Problem Introduction (0:00 – 0:40)
- **Speaker:** "Namaste. In Gujarat's Collector and Taluka offices, citizens and administrative staff prepare thousands of affidavits, declarations, and certificate attachments each week. Today, citizens repeatedly handwrite or re-type the exact same personal details into inconsistent formats, leading to delays, formatting rejections, and typing fees.
- **Goal:** JanDastavej standardizes preparation, eliminates repeated data entry, provides an instant faithful A4 preview, and generates clean PDFs with verified Gujarati Unicode typography — all without persisting sensitive citizen answers."

## Part 2: Citizen Discovery & Format Selection (0:40 – 1:15)
- **Action:** Open `http://localhost:5173/`. Show text wordmark `JanDastavej` (no fake government logos/seals) and prominent banner: *"Demo only — not for official use."*
- **Action:** Toggle language `English` ⇄ `ગુજરાતી` in header. Notice instantaneous translation without page reload.
- **Action:** Click "દસ્તાવેજ લાઇબ્રેરી" (`/documents`). Filter by category "સ્વ-ઘોષણાપત્રો" or search for "સોગંદનામું".
- **Action:** Open `Self-Declaration Form` (`/documents/sample-declaration`). Highlight:
  - Clear purpose note
  - Checklist of required supporting documents to have ready
  - Instructions on post-generation steps (signing and submission)
  - Version 1 (Published) governance badge.

## Part 3: Guided Form & Inline Validation (1:15 – 2:00)
- **Action:** Click "દસ્તાવેજ બનાવવાનું શરૂ કરો" (`/create/sample-declaration`).
- **Action:** Show the 4-step progress indicator: `1. Select Format → 2. Enter Details → 3. Preview → 4. Download`.
- **Action:** Click "પૂર્વાવલોકન જુઓ" without filling fields. Show inline validation:
  - Red border + alert icon + clear Gujarati message `આ માહિતી ભરવી આવશ્યક છે.`
  - Emphasize that form state is **never erased** on validation error.
- **Action:** Fill valid citizen details (Name, Age, Address, Declaration statement).
- **Action:** Check the opt-in checkbox *"આ સત્ર દરમિયાન અન્ય દસ્તાવેજો માટે મારી માહિતી સાચવી રાખો (ઓપ્ટ-ઇન)"*. Show the prominent "ડેટા સાફ કરો" (Clear My Data) button.

## Part 4: Single Render Path & Instant Preview (2:00 – 2:40)
- **Action:** Click "પૂર્વાવલોકન જુઓ". Transition to `/preview/:sessionId`.
- **Action:** Show the A4 document canvas (`--paper` on muted canvas):
  - Notice identical placement, margins, and Gujarati typography
  - Watermark: `*** માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી ***`
  - Show "Edit Answers" returns to form with values completely intact.
- **Action:** Highlight the Legal Disclaimer Box:
  - Document preparation notice (not automatically sworn or filed)
  - PDF Download button is **disabled** until user explicitly checks the acknowledgment box.
- **Action:** Check the box and click "PDF ડાઉનલોડ કરો".
- **Action:** Open downloaded PDF. Point out that the PDF layout and text are 100% identical to the browser preview (Single Render Path).

## Part 5: Admin Governance & Privacy Architecture (2:40 – 3:30)
- **Action:** Navigate to `/admin/login`. Sign in using HttpOnly cookie credentials (`admin@jandastavej.local`).
- **Action:** Open `/admin/templates`. Show the full template lifecycle:
  - `Draft → In Review → Approved → Published → Retired`
  - Version immutability: published versions cannot be modified in place.
- **Action:** Open `/admin/audit`. Show the tamper-evident audit trail:
  - Every creation, approval, and publication is logged with actor and timestamp.
  - Zero document content or citizen answers are stored in audit logs.
- **Closing:** "JanDastavej is built with zero AI-generated legal text, strict server-side validation, sandboxed offline Playwright PDF generation, and automated test coverage ready for official Collector Office pilot validation."
