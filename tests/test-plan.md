# formXplain manual test plan

Record each case as **Pass**, **Fail**, or **Not run** only after actually testing it in a browser. Add browser/OS, file fixture, and observed result for each run. Automated server syntax checks do not verify browser document processing.

| # | Test | Expected result | Status |
|---|---|---|---|
| 1 | Start with `npm start` | Server responds at `http://127.0.0.1:4173` | Not run in browser |
| 2 | Navigate to all seven pages | Correct page appears and active nav is highlighted | Not run |
| 3 | Upload normal text PDF | Page count and text are extracted, page associations retained | Not run |
| 4 | Upload scanned PDF | Low-text pages attempt OCR; OCR source/method is shown | Not run |
| 5 | Upload mixed PDF | Text pages use PDF extraction; low-text pages attempt OCR | Not run |
| 6 | Upload PNG/JPEG | OCR runs and returns recognized text if library/data available | Not run |
| 7 | Upload unsupported file | Clear validation error; app remains usable | Not run |
| 8 | Upload file >20 MB | File rejected with size explanation | Not run |
| 9 | Upload PDF >80 pages | PDF rejected with page-limit explanation | Not run |
| 10 | Upload corrupt/encrypted PDF | Recoverable error shown | Not run |
| 11 | OCR unavailable or times out | Error displayed; paste-text fallback remains available | Not run |
| 12 | Paste empty text | User prompted to enter text | Not run |
| 13 | Paste document text | Summary and one-page evidence are created | Not run |
| 14 | Search supported question | Matching real excerpts and page labels appear | Not run |
| 15 | Search absent topic | No-evidence message; no fabricated answer | Not run |
| 16 | Requirement candidates | Candidate text and page/method are displayed | Not run |
| 17 | Checklist add/edit/remove/check | State and progress update correctly | Not run |
| 18 | Download checklist | Text file contains document name and item states | Not run |
| 19 | Print checklist | Print view opens and contains escaped text | Not run |
| 20 | Clear session | Document, checklist and session list clear | Not run |
| 21 | Refresh page | In-memory document may be lost as disclosed | Not run |
| 22 | Keyboard and reduced motion | Focus visible; navigation/controls keyboard-operable; reduced motion respected | Not run |
| 23 | Responsive viewport | Navigation and content usable at mobile/tablet widths | Not run |
| 24 | Missing AI configuration | App remains in local search mode; no AI claims | Not run |
| 25 | Extract final ZIP and start | Clean extracted copy starts and serves the app | Pending archive check |
| 26 | Show Summary before processing | Button is hidden and cannot be activated | Not run in browser |
| 27 | Show Summary after successful extraction | Button appears; repeated clicks are disabled during preparation; navigates to summary | Not run in browser |
| 28 | Multi-page summary | Each processed page has its own expandable card and correct source page label | Not run in browser |
| 29 | Section-wise summary | Derived sections retain source excerpts and originating page number | Not run in browser |
| 30 | Empty/unreadable page | Explicit cannot-summarize warning appears without fabricated content | Not run in browser |
| 31 | Camera permission allowed | Live preview opens after explicit click; photo capture works | Not run on physical device |
| 32 | Camera multi-page workflow | Capture multiple images, retake/remove one, OCR remaining pages in order | Not run on physical device |
| 33 | Camera switch/close | Switch camera when supported; all tracks stop on close | Not run on physical device |
| 34 | Camera permission denied / unsupported | Helpful error and file-upload fallback remain available | Not run in browser |
| 35 | Reset after camera/document processing | Captures, summary, active document, and checklist are cleared | Not run in browser |
| 37 | Replace active document | Old summary, question results, and document-derived checklist items do not carry over | Not run in browser |
| 36 | Print summary | Print view contains overall and page summaries | Not run in browser |

| 38 | Understand This Form after upload | Button opens five guide sections for the active upload | Not run in browser |
| 39 | Form 19 sample | Title/purpose, teaching condition, photograph specs, optional fields, declarations, and officer sections have source pages | Automated unit test passed; browser UI not run |
| 40 | Teaching evidence ambiguity | Uploaded-form wording is separated from ECI FAQ guidance; applicable rules are flagged for verification | Automated unit test passed; external guidance is bundled and not fetched live |
| 41 | Unrelated application form | Generic document-specific analysis; no Teachers’ Constituency content appears | Automated unit test passed |
| 42 | Attachment checklist | Items can be checked; verification note remains visible | Not run in browser |
| 43 | Field-by-field guide | Expandable cards show page, meaning, format guidance, mistakes, and source excerpt where available | Not run in browser |
| 44 | Guide opened directly from scan page | Summary parent is prepared before guide is displayed | Static/code review only; browser not run |

## Automated checks
- `npm run check`: **Passed** (Node server syntax check).
- `npm test`: **Passed, 5/5 tests** (Form 19 detection, requirements/photograph and official guidance, optional fields/declarations/page attribution, unrelated form, and unreadable page warnings).
- Browser JavaScript syntax: extract the inline module and run `node --check` on a temporary `.mjs` copy.
- ZIP integrity and required-file listing: verify with `unzip -t` / Python `zipfile.testzip()`.

## Test fixture guidance
Use documents you have permission to test with. Prefer a synthetic text PDF and synthetic scanned PDF containing non-sensitive text (e.g. a made-up date and requirement) so OCR and page references can be verified without exposing personal records.

## v0.4.0 implementation checks
- The Show Summary control is connected to the actual current in-memory document and is hidden until `applyDocument()` succeeds.
- Page and section summaries are generated from each page’s extracted text; this is heuristic local summarization, not AI.
- Camera uses the browser camera API and sends captured image blobs to the Tesseract.js OCR worker. Physical-device camera and real OCR accuracy still require manual verification.


## Actual verification record — 16 October 2026
- `npm test`: passed 5 tests, 0 failures.
- `npm run check`: passed.
- Actual supplied Form 19 PDF was inspected with `pdfinfo`/`pdftotext`: 2 pages. The analysis module was run against its extracted page text; Form 19, page-1 teaching/photo items, page-2 alternative declarations and officer action/receipt sections were identified. This validates analyzer logic against extracted text, not the browser PDF.js/OCR pipeline.
- Browser UI automation, physical-device camera, scanned-PDF OCR, and responsive visual checks remain **not run** in this environment. Do not mark those cases passed until a real browser/device run.
