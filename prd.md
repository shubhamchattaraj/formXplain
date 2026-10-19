# formXplain — Product Requirements (implementation draft)

## Product promise
Help people inspect administrative documents and turn source-backed observations into a personal checklist. The interface must distinguish extracted facts, heuristic candidates, and information not found in the available text.

## User stories
1. As an applicant, I can upload a text PDF or paste text so I can inspect it in one place.
2. As a user with a scanned PDF/image, I can attempt English OCR and see when it was used.
3. As a user, I can inspect page-level extraction and warnings before relying on the content.
4. As a user, I can search for keywords and review matching passages with source page numbers.
5. As a user, I can turn possible requirement lines into an editable personal checklist.
6. As a user, I can print/download the checklist and clear session data.
7. As a privacy-conscious user, I can understand local processing, CDN dependencies, and retention behavior.

## Functional requirements
- Validate file extension/type and 20 MB maximum; reject PDFs over 80 pages.
- Extract PDF text page-by-page with PDF.js.
- Attempt Tesseract.js English OCR on PDF pages with little extracted text and on PNG/JPEG images.
- Report progress and recoverable errors; allow cooperative cancellation.
- Keep page number and extraction method with each page.
- Produce a local extractive preview and heuristic requirement candidates.
- Retrieve source text matching question keywords; do not fabricate answers or citations.
- Checklist supports create, edit, remove, completion, print, and text download.
- Hash navigation across dashboard, scan, summary, ask, checklist, documents, and settings.
- Clear active session state and avoid deliberate localStorage persistence.

## Non-functional requirements
- Responsive layout, semantic controls, keyboard focus, reduced-motion preference, and status announcements.
- Render extracted content with textContent or escaped content, never as trusted HTML.
- No secrets or API credentials in client code.
- Document that CDN assets and OCR language data require network access.

## Acceptance checks
See `tests/test-plan.md`. Manual browser checks remain required; tests not executed must not be marked passed.

## Explicit non-goals
No generative AI, official eligibility determination, legal advice, persistent history, account system, or guaranteed OCR accuracy in this version.

## Status
Draft for review after implementation. Official Skill Pack workflow is not asserted complete.

## Previously implemented v0.3.0 acceptance criteria
- Show Summary is hidden/disabled before a successful extraction, then becomes actionable.
- Summary preparation is guarded against repeated clicks and displays status feedback.
- Overall and page-wise summaries are generated from actual extracted text; each page summary retains its own page number, source excerpt, extraction method, and OCR warning when applicable.
- Camera access begins only after user interaction; captures can be reviewed/removed and OCRed; tracks stop when the camera is closed or the page is unloaded.
- No AI generation is claimed when no model backend is configured.

## v0.4.0 acceptance criteria
- A successful upload enables **Understand This Form** and opens a five-section guide built from the current document's extracted page text.
- The guide separates source-derived claims from external official guidance, keeps page references, and marks ambiguous requirements for verification.
- Form 19 analysis captures the stated title/purpose, more-than-three-years teaching statement, optional fields, photo instructions, alternative declarations, and officer-facing areas without selecting a declaration or asserting applicant eligibility.
- The official ECI Form 19 FAQ is labelled external guidance; the UI notes that the supplied form's “more than three years” wording differs from FAQ wording (“at least three years”) and tells applicants to confirm current rules and qualifying date.
- A non-Form-19 test document receives generic analysis based on its own text rather than Form 19-specific claims.
- Attachment checkboxes are interactive, and the uncertainty note remains visible.
- The analysis module does not send document text to a model provider; no AI output is claimed.
