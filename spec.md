# formXplain — Technical Specification (implementation draft)

## Architecture
- Static single-page application in `index.html`, served by the Node.js built-in HTTP server in `server.js`.
- Hash routes: `#dashboard`, `#scan`, `#summary`, `#ask`, `#checklist`, `#documents`, `#settings`.
- No npm runtime dependencies and no API server for document content.
- State is held in an in-memory JavaScript object; no localStorage persistence.

## Browser libraries
- PDF.js 4.10.38 ESM from jsDelivr for page count, text extraction, and rendering pages for OCR.
- Tesseract.js 5.1.1 browser bundle from jsDelivr for English OCR.
- Lucide 0.468.0 for icons; Google Fonts Montserrat and Lora for typography.
- Third-party requests mean this is local document processing, not fully offline processing.

## Document data model
A document has `name`, `type`, `pages`, `wordCount`, `requirements`, `warnings`, and `processedAt`. Each page has `pageNumber`, `text`, and `extractionMethod` (`pdf-text`, `ocr`, or `pasted-text`). Requirement candidates keep their source text, page, and extraction method.

## Processing pipeline
1. Validate PDF/image type and 20 MB file size.
2. For PDFs, load with PDF.js and reject documents over 80 pages.
3. Extract text page-by-page; mark low-text pages for OCR.
4. Render low-text PDF pages at scale 1.6 and run Tesseract English OCR. For PNG/JPEG, run OCR directly.
5. Preserve page number and extraction method; report unreadable pages and OCR warnings.
6. Create local summary from the first sentences and heuristic candidates from requirement-related wording.
7. Retrieve matching sentences using query keyword overlap and display the original source excerpt and page number.
8. Build a personal checklist from user-confirmed candidate items.

## Limits and failure behavior
- 20 MB upload limit, 80-page PDF limit, English OCR only.
- OCR may need internet access to download language assets. Missing CDN, malformed/encrypted PDFs, low-quality scans, and browser memory limits can cause failures.
- Cancellation is cooperative; it cannot guarantee interruption of an in-flight OCR operation.
- The low-text detector is heuristic. The prototype may miss a scan-heavy page with some selectable text.
- Local summary and retrieval are not generative AI. Requirement candidates are not verified official requirements.

## Security and privacy
- File content is processed in browser memory; no formXplain backend endpoint receives it.
- Do not persist document content in browser storage. Clear-session controls reset in-memory state.
- Use textContent for extracted strings and escaped text in the print view.
- CDN requests disclose ordinary network metadata to those providers. This prototype is not intended for highly sensitive documents without a separate security review.

## Verification
Run `npm run check`, then `npm start`. Complete the manual test plan in `tests/test-plan.md` in a real browser. Browser-dependent PDF/OCR scenarios are not considered passed until tested with representative files.

## Status
Implementation-aligned draft; review and update through the official Devpost Learn Skill Pack workflow before claiming completion.

## Previously implemented v0.3.0 implementation notes
- Hash-based routes and in-memory `state.doc` remain the single active-document source of truth. No document text is added to persistent browser storage.
- `prepareSummary()` derives page summaries and an overall summary from page-local extracted text and only then navigates to `#summary`.
- Page summary cards carry page numbers and source excerpts. Unreadable pages receive an explicit warning instead of a fabricated explanation.
- Camera capture uses `getUserMedia`, canvas capture to JPEG blobs, temporary object URLs for review thumbnails, and the existing Tesseract.js OCR worker. Image blobs remain in session memory and are revoked/cleared when removed, processed, or reset.
- The local summary is heuristic and topic/action-pattern-based, not a generative AI model.

## v0.4.0 implementation notes
- `document-analysis.mjs` exports `analyzeDocument(doc)`, a deterministic analyzer consuming the current document's page objects. It derives a generic guide for unrelated forms and activates the Form 19-specific interpretation only after matching multiple source-text signals.
- The summary view contains five numbered guide panels, a scrollable evidence table, checkable attachment rows, expandable field cards, and source-page excerpts.
- ECI FAQ content is represented as clearly labelled external guidance with retrieval date and an official-site link; it is not mixed into uploaded-source excerpts and is not fetched live by the app.
- The guide is not generative AI. Page-local summaries and question retrieval remain local heuristics. Empty pages produce warnings.
- Automated tests run with `npm test`; the app's server syntax check runs with `npm run check`.
