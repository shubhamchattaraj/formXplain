# formXplain Netlify AI Summary patch

This is a patch, not a replacement project. Copy these files into the matching locations in your existing project and allow them to overwrite the matching files:

- `index.html`
- `package.json`
- `build.mjs`
- `netlify.toml`
- `netlify/functions/summarize.mjs`

## Netlify settings

The included `netlify.toml` configures:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- `/api/summarize` routed to the serverless `summarize` function

In Netlify → Site configuration → Environment variables, add or verify these variables with **Functions** runtime access:
- `GEMINI_API_KEY` = your private API key
- `GEMINI_MODEL` = `gemini-2.5-flash`

Do not put the key in `index.html`, commit it to GitHub, or include it in this patch. If you change environment variables, trigger a new deploy.

## Deploy

1. Merge/copy these patch files into the root of your existing project.
2. Run `npm test` and `npm run build` locally.
3. Commit and push the changed files to the same GitHub repository connected to Netlify.
4. Wait for the new deploy to finish.
5. Open the deployed app, upload a non-sensitive sample PDF, and click **Show Summary**.

The app continues to provide source-based highlights if AI Summary is temporarily unavailable, but the interface no longer labels it as “local” or names the AI provider. The serverless function returns generic user-facing errors and never sends the API key to the browser.
