# formXplain

**Make paperwork make sense.** formXplain is a local-first document companion for citizens, students, job seekers, families, and first-time applicants. It helps users extract document text, find source passages, identify possible requirement statements, and maintain a personal checklist.

## Current implementation (v0.4.5)

- Dedicated Dashboard, Scan, Summary, Ask, Checklist, Documents, and Settings pages using lightweight hash navigation.
- Professional blue/cyan/black/white Claymorphism design, Montserrat interface typography, and Lora reading typography.
- PDF.js page-by-page text extraction, page counts, and empty-text page detection.
- Tesseract.js OCR for pages with little extractable PDF text and for PNG/JPEG image uploads; mixed PDFs use selectable text on readable pages and OCR on low-text pages.
- Progress indicators, 20 MB file-size limit, 80-page PDF limit, cancellation request, and recoverable error messages.
- Gated **Show Summary** and **Understand This Form** actions appear only after successful extraction.
- The new five-part Form Filling Guide explains purpose, intended applicant and stated conditions, document requirements, a checkable attachment list, and field-by-field guidance. Each finding is associated with page references or marked uncertain.
- `document-analysis.mjs` analyzes the actual current document. Form 19-specific interpretation is activated only when its title and Teachers’ Constituency/electoral-roll signals are present; unrelated forms use generic field extraction instead of receiving a canned Form 19 answer.
- The Form 19 guide distinguishes the supplied form from external Election Commission of India FAQ guidance. It notes the wording difference between “more than three years” in the form and “at least three years” in the FAQ and asks users to verify current rules and the qualifying date.
- The Form Filling Guide can use Google Gemini through the local Node.js server when `GEMINI_API_KEY` is configured. A deterministic local fallback remains available when Gemini is unavailable; results retain source-page references and should be checked against the original document.
- Camera capture through `MediaDevices.getUserMedia` with live preview, front/rear camera switching where supported, multi-page capture, retake/removal, thumbnail review, and OCR using the same Tesseract.js pipeline.
- Local overview, heuristic possible-requirement detection with page/source method, document-grounded keyword retrieval with excerpts, and an editable checklist.
- Checklist completion, download as text, print, current-session document list, and clear-session controls.
- No document content is intentionally sent to a formXplain backend or stored in localStorage. Refreshing can clear in-memory state.

## Run on Windows / VS Code

Prerequisites: Node.js 18+ and a modern browser. Internet access is needed to load the pinned browser libraries, Google Fonts, and (for OCR) Tesseract language data. No `npm install` is needed; this project uses Node's built-in HTTP server.

```powershell
node --version
npm start
```

Open `http://127.0.0.1:4173`. Stop the server with `Ctrl+C`. Run `npm run check` to check the server JavaScript syntax and `npm test` to run the automated document-analysis tests. The browser app is served at `/`; the pages are client-side routes such as `/#scan` and `/#summary`.

## Workflow

1. Go to **Scan document** and upload a PDF, PNG, or JPEG, paste text, or choose **Use Camera** on a supported secure context (HTTPS or localhost).
2. For camera capture, capture one or more pages, review/remove images, then process the captures. Images stay in memory and are OCR-processed locally.
3. Wait for extraction/OCR status to complete. For scanned PDF pages, PDF.js renders the page and Tesseract.js attempts OCR.
4. After successful extraction, choose **Show Summary**. The local summarizer builds an overall overview and separate page/section cards from each page’s extracted text. Use the source excerpts and original page text to verify the heuristic explanation.
5. Choose **Understand This Form** for the five-part guide. Expand field cards and inspect source page excerpts. Attachment items have checkboxes; unclear requirements are marked for verification.
6. Use **Ask document** to retrieve matching source passages. This is keyword retrieval, not a generated answer.
7. Review possible requirements and add relevant items to **Checklist**. Edit, remove, complete, print, or download the list.
8. Use **Settings** to review privacy behavior or clear current-session data.

## Processing and privacy notes

PDF text extraction and OCR run in the browser. The app loads PDF.js, Tesseract.js, Lucide, and Google Fonts from third-party CDNs; OCR language data may also be fetched from a CDN. Consequently, the app is not fully offline, and those third parties may receive ordinary network metadata. Document text is not intentionally sent to a formXplain backend. Do not upload highly sensitive material unless you are comfortable with browser/CDN behavior on your network.

The app retains document data in JavaScript memory during the page session. It does not deliberately persist document text to browser storage. Refreshing the page may clear the active document and checklist. Clearing session data removes in-memory state.

## Important limitations

- **AI and fallback behavior:** the Form Filling Guide can call Google Gemini through the local server when configured. Local summary analysis and document Q&A use deterministic heuristics/keyword retrieval rather than generative AI. If Gemini is unavailable, the app falls back to local analysis and identifies that fallback. External ECI FAQ guidance is labelled separately and is not fetched or refreshed live by the app.
- OCR quality depends on image resolution, language, layout, and network availability. The current OCR language is English. Handwriting, stamps, checkboxes, tables, and low-quality scans may be misread. Always compare OCR results to the original.
- Low-text pages are detected heuristically. A page with a few words and a large scanned area may not trigger OCR; OCR only replaces a page's text when OCR returns readable text.
- The app does not validate current rules, eligibility, deadlines, or legal obligations. Verify with the issuing authority.
- The 20 MB and 80-page limits are client-side safeguards, not a guarantee that every device can process a document. Cancellation is cooperative and may not interrupt an already-running browser OCR call immediately.
- This is an applicant-assistance tool, not a secure records-management system or an authority on eligibility, legal obligations, or current deadlines.

## Third-party dependencies and licenses

No npm runtime dependencies are installed. Browser-loaded dependencies:

- PDF.js `pdfjs-dist` 4.10.38 — Apache-2.0.
- Tesseract.js 5.1.1 — Apache-2.0; OCR engine/language assets have their own attribution and license notices.
- Lucide 0.468.0 — ISC.
- Google Fonts Montserrat and Lora — see the font projects' license metadata.

Tailwind browser CDN is no longer required by this implementation; layout and styles are local CSS. Re-check exact upstream licensing and CDN URLs before public release.

## Project structure

```text
formXplain/
├── index.html
├── document-analysis.mjs
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── LICENSE
├── scope.md
├── prd.md
├── spec.md
├── assets/README.md
├── backend/README.md
├── docs/VS_CODE_SETUP.md
├── devpost/WORKFLOW_STATUS.md
├── devpost/checklist.md
├── summary-analysis.mjs
├── tests/
│   ├── document-analysis.test.mjs
│   ├── gemini-config.test.mjs
│   ├── summary-analysis.test.mjs
│   └── test-plan.md
└── agent/skills/ (bundled Skill Pack reference files)
```

## Devpost preparation

Rules checked on 16 October 2026: the official submission deadline is 26 October 2026 at 5:00 pm EDT. Required materials include a working proof of concept, `scope.md`, `prd.md`, `spec.md`, a public repository with an open-source license, a project description, and a public YouTube/Vimeo demo video under three minutes. See the [official rules](https://learn-ai-basics.devpost.com/rules), [resources](https://learn-ai-basics.devpost.com/resources), and [Skill Pack repository](https://github.com/challengepost/learn-ai-basics). The planning documents and workflow notes are working project artifacts, not proof that the official Learn Skill Pack workflow has been completed. Follow the current official rules and the actual installed Skill Pack instructions in a compatible coding agent, in sequence: `1-start`, `2-scope`, `3-prd`, `4-spec`, `5-build`, `6-ship`. Record the real work performed; do not claim skill execution that did not occur. Before submission, test on target browsers, publish the source repository with this license, record a public demo video under three minutes, and complete the current Devpost form honestly.

## Form Filling Guide limitations

The guide is generated from extracted text and deterministic pattern rules. Visual layout and table relationships can be lost during text extraction; field labels may be missed or assigned a page imperfectly when OCR is noisy. Form 19 recognition depends on multiple text signals and is not a legal eligibility decision. External ECI guidance is labelled separately and should be checked for current applicability. The general field extractor may not understand every form type.

## Camera and summary limitations

Camera access requires a supported browser and a secure context (HTTPS or localhost). Permission can be denied or camera hardware may be unavailable; file upload remains the fallback. Camera images are held in page memory for the current session and their temporary preview URLs are revoked after processing/removal or clearing the session. Camera capture and OCR should be verified on a physical mobile device before a public demo. Summary page references come from application-managed page metadata; text copied/pasted manually is treated as one page because original pagination is unavailable.


## Google Gemini AI summaries (v0.4.5)

The main summary calls Google Gemini from the local Node.js server. The browser sends only extracted page text to `/api/summarize`; the API key is never sent to the browser. The AI response is constrained to five fields: form, who, purpose, fields, and documents. If the key is missing or Gemini errors, the app labels the result as a local fallback and explains why.

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey) and put it in `.env` as `GEMINI_API_KEY=your_key_here`. Do not commit `.env`.
4. Run `npm run check`, `npm test`, then `npm start`.
5. Open `http://127.0.0.1:4173`. Upload and scan a form, then choose **Show Summary**.

**Privacy note:** when Gemini is configured, extracted document text is sent to Google's Gemini API for processing. Do not use sensitive documents unless you have permission and are comfortable with the provider's data handling terms. Keep `.env` private. The current server binds to `127.0.0.1` for local development; deploy behind a secure server and add authentication, rate limiting, request-size controls, and abuse protection before making it public.
