# formXplain — Scope (implementation draft)

## Problem
People encounter official forms and notices whose instructions, conditions, and requested documents can be hard to navigate. formXplain aims to help users inspect the text in a document and organize follow-up actions without pretending to provide official legal or eligibility decisions.

## Intended users
Citizens, students, job seekers, families, and first-time applicants, initially with an India-first context.

## In scope for this prototype
- Local browser upload for PDF, PNG, and JPEG files up to 20 MB.
- PDF.js page-wise selectable-text extraction and heuristic identification of pages with little extractable text.
- Tesseract.js English OCR for low-text PDF pages and image uploads, subject to CDN/language-data availability.
- Page-numbered extracted text, local overview, heuristic requirement candidates, keyword passage retrieval, checklist editing/completion, print and text export.
- Separate Dashboard, Scan, Summary, Ask, Checklist, Documents, and Settings views.
- Clear error states and user-facing privacy/limitations disclosures.

## Out of scope
- Generative AI answers or summaries; no model provider is configured.
- Official verification of requirements, deadlines, eligibility, or application outcomes.
- Guaranteed OCR accuracy, handwriting recognition, multilingual OCR, full table reconstruction, or reliable visual bounding-box highlighting of form fields.
- Persistent document history, accounts, cloud storage, or a backend API.

## Constraints and risks
- External CDN/network required for browser libraries, fonts, and OCR language assets.
- OCR may misread important details; users must verify source documents.
- Client-side processing is device-dependent. Current limits are 20 MB and 80 PDF pages.
- Text remains in page memory during the session; refreshing may clear it.

## Success criteria to test
- User can load supported files or paste text and see honest processing status.
- Readable PDF pages retain page associations; scanned/low-text pages attempt OCR.
- Search results show actual excerpts and page numbers or report no evidence.
- Checklist items can be added, edited, removed, checked, printed, and downloaded.
- All seven navigation views and clear-session controls work at desktop and mobile widths.

## Workflow status
This is an implementation draft and does not claim completion of the official Devpost Learn Skill Pack sequence. See `devpost/WORKFLOW_STATUS.md`.

## Previously implemented v0.3.0 features retained
- Show Summary is gated on successful document extraction and prepares the current document’s local summary before navigating to the Summary page.
- Overall summary plus expandable page-by-page and section-wise summaries preserve source page metadata and warnings.
- Camera capture supports preview, multiple images, retake-by-removing and recapturing, remove-page, and OCR through the existing Tesseract.js browser pipeline.
- These are heuristic local summaries; no AI backend is configured.

## v0.4.0 additions
- Adds **Understand This Form**, a five-section guide generated from the active upload: purpose, intended applicant/conditions, document requirements, attachment checklist, and field-by-field guidance.
- Adds a reusable `document-analysis.mjs` module that keeps source page references, identifies labels and optional wording, and flags low-text pages.
- Recognizes the supplied Form 19 only when its extracted text contains multiple identifying signals. It then explains both alternative Teachers’ Constituency declarations, the photo specifications, teaching-experience table, and officer-facing action/receipt areas.
- Shows external ECI Form 19 FAQ guidance separately from the uploaded form, including a note to verify current rules and the qualifying date. It does not assert personal eligibility.
- Includes automated unit tests for Form 19, optional fields, page attribution, empty pages, and an unrelated membership application to check against hardcoded-template behavior.
- No generative AI provider is configured; document analysis is local and rule-based. External guidance is not fetched live by the app.
