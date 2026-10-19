# VS Code setup — Windows

## Prerequisites
1. Install Node.js 18 or newer from https://nodejs.org/.
2. Install Git from https://git-scm.com/.
3. Install Visual Studio Code from https://code.visualstudio.com/.
4. Internet access is needed for browser libraries, fonts, and OCR language data.

## Open and run
1. Extract `formXplain-updated.zip` (or the project ZIP you downloaded) to a folder.
2. In VS Code, select **File → Open Folder…** and choose the extracted `formXplain` folder.
3. Select **Terminal → New Terminal**.
4. Confirm Node and npm are available:

   ```powershell
   node --version
   npm --version
   ```

5. Start the local server:

   ```powershell
   npm start
   ```

6. Open http://127.0.0.1:4173 in a modern browser.
7. To stop the server, focus the terminal and press `Ctrl+C`.

No `npm install` is needed; the project uses Node's built-in HTTP server and has no npm dependencies.

## Test the workflow
- Open **Scan document**, upload a text PDF, then check page count and extraction status.
- Try a scanned PDF or PNG/JPEG to exercise OCR. First-time OCR may download language data and take longer.
- If you do not have a document, paste text and click **Use pasted text**.
- Inspect **Summary** and open page-by-page evidence.
- Search terms in **Ask document** and check page-linked source excerpts.
- Add/edit/check/remove checklist items; try Download .txt and Print.
- Visit all navigation pages and test Clear in the top bar or Settings.

## Checks
Run in a second terminal (or stop the server first):

```powershell
npm run check
```

This checks the Node server syntax. It does not replace browser testing of PDF.js or OCR.

## Git and GitHub
From the project folder:

```powershell
git init
git add .
git status
git commit -m "Build formXplain document workflow prototype"
```

Create an empty public repository on GitHub, then use the exact remote URL GitHub provides:

```powershell
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Replace the placeholder with your real repository URL. Do not commit `.env`, API keys, or private documents. Check `git status` and review the files before pushing.

## Troubleshooting
- **Port in use:** run `$env:PORT=4174; npm start` and open http://127.0.0.1:4174.
- **PDF.js/OCR does not load:** check internet access, browser console, and whether the CDN is blocked by a network filter.
- **OCR takes a long time:** use a smaller file or fewer pages; OCR quality and speed depend on device and scan quality.
- **Scanned PDF has no OCR output:** verify scan quality and try pasting text manually. English OCR is configured in this prototype.
- **Browser refresh clears the document:** expected; document state is held in memory and not persisted.
- **Print window blocked:** allow pop-ups for the local page or download the checklist as text.

## Continue the Devpost Learn Skill Pack workflow
Install and use the official skill pack in a compatible coding agent using its current documented instructions. Follow `1-start`, `2-scope`, `3-prd`, `4-spec`, `5-build`, and `6-ship` in order. Read the actual installed `SKILL.md` instructions, review and revise the planning drafts, and document only work genuinely performed. This setup guide does not claim the workflow has already been completed.

## Camera capture and Show Summary (v0.4.0)

After a PDF/image extraction, OCR pass, or pasted-text import succeeds, use **Show Summary** in the Scan page’s Processing details panel. The app prepares an overall summary and expandable page-by-page/section-wise cards. To use the camera, run the app at `http://127.0.0.1:4173` (localhost is a secure context in modern browsers), open Scan Document, and choose **Use Camera**. Grant permission, capture pages, review or remove thumbnails, and choose **Process captured pages**. If the browser has no camera, permission is denied, or the camera is unsupported, use the regular file picker.

The summary and camera OCR run in local browser code. No generative AI provider is configured. OCR requires the Tesseract.js CDN and English language data to load.


## Understand This Form (v0.4.0)

After a successful PDF/image scan or pasted-text import, choose **Understand This Form** in the Processing details panel, or open **Document Summary** and choose the same action. The guide contains five sections: purpose, intended applicant/conditions, document requirements, attachment checklist, and field-by-field guide. Each detected field links to a page number and source snippet when available. The guide is local deterministic analysis, not generative AI.

For Form 19, the app identifies the form only when multiple text signals match. It distinguishes the uploaded form from external ECI Form 19 FAQ guidance. The ECI FAQ wording and the supplied form wording differ on the teaching period, so the guide tells users to verify the applicable current rules and qualifying date with the ERO/AERO. The official-site link is provided for follow-up; the app does not fetch live official guidance.

Run automated tests with `npm test`. Browser tests for the five guide sections, OCR, camera, and responsive behavior remain manual and are listed in `tests/test-plan.md`.
