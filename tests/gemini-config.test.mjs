import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const server = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('Gemini API key is read server-side and never embedded in frontend', () => { assert.match(server, /process\.env\.GEMINI_API_KEY/); assert.doesNotMatch(html, /AIza[0-9A-Za-z_-]{20,}/); });
test('summary UI has exactly five requested AI headings', () => { for (const heading of ['What is this form?','Who needs to fill it?','What is the purpose?','Things to fill in','Documents required']) assert.ok(html.includes(heading) || server.includes(heading), `Missing ${heading}`); });
test('Gemini response schema includes concrete field and document lists', () => {
  // Assert the schema's behavior, not one exact whitespace/quote formatting.
  assert.match(server, /responseMimeType:\s*["']application\/json["']/);
  assert.match(server, /fields:\s*\{\s*type:\s*["']ARRAY["']/);
  assert.match(server, /documents:\s*\{\s*type:\s*["']ARRAY["']/);
  assert.match(server, /required:\s*\[[^\]]*\"name\"[^\]]*\"guidance\"[^\]]*\"status\"[^\]]*\"sourcePage\"/s);
  assert.match(server, /required:\s*\[[^\]]*\"name\"[^\]]*\"classification\"[^\]]*\"condition\"[^\]]*\"sourcePage\"/s);
});

test('Gemini summary schema provides structured field guidance and document classifications', () => {
  assert.match(server, /guidance:\s*\{\s*type:\s*["']STRING["']/);
  assert.match(server, /classification:\s*\{\s*type:\s*["']STRING["']/);
  assert.match(server, /sourcePage:\s*\{\s*type:\s*["']INTEGER["']/);
  assert.match(server, /status is only 'Required', 'Conditional', 'Optional', or 'Not stated'/);
  assert.match(server, /Document classification is only 'Required', 'Conditional', 'Optional', or 'Unclear'/);
});
test('summary interface exposes copy, text download, print, and OCR verification affordances', () => {
  for (const id of ['copySummary','downloadSummary','printSummary','summaryActionStatus']) assert.ok(html.includes(`id="${id}"`), `Missing ${id}`);
  assert.match(html, /Verify all requirements, especially OCR-read names, numbers, tables, and checkboxes/);
  assert.match(html, /summary-status/);
});


test('Gemini endpoint bounds document size and validates page objects', () => {
  assert.match(server, /pages\.length > 100/);
  assert.match(server, /pages\.some\(\(p\) => !p \|\| typeof p !== "object" \|\| Array\.isArray\(p\)\)/);
  assert.match(server, /pageText\.slice\(0, 30000\)/);
  assert.match(server, /\.slice\(0, 180000\)/);
});

test('Gemini request has a timeout and does not expose raw network errors', () => {
  assert.match(server, /AbortSignal\.timeout\(60000\)/);
  assert.match(server, /Gemini took too long to respond/);
  assert.match(server, /Could not reach Gemini\. Check your connection and try again\./);
  assert.doesNotMatch(server, /Could not reach Gemini: \$\{e\.message\}/);
});
