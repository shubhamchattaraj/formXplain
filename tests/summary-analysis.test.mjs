import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeDocument, summarizePage } from '../summary-analysis.mjs';

test('document summary selects source-backed instructions, dates, and requirements', () => {
  const doc = summarizeDocument({ pages: [
    { pageNumber: 1, extractionMethod: 'pdf-text', text: 'Community education scholarship application. Students enrolled in an approved full-time course may apply. Applicants must submit the completed form by 31 October 2026. Attach proof of enrolment and a recent income certificate.' },
    { pageNumber: 2, extractionMethod: 'pdf-text', text: 'The applicant must sign the declaration confirming that all information is correct. Applications received after the deadline will not be considered. Contact the scholarship office if clarification is needed.' }
  ] });
  assert.match(doc.purpose, /scholarship application/i);
  assert.match(doc.audience, /Students enrolled/i);
  assert.ok(doc.actions.some(text => /submit the completed form by 31 October 2026/i.test(text)));
  assert.ok(doc.requirements.some(item => /proof of enrolment/i.test(item.text) && item.page === 1));
  assert.ok(doc.dates.some(text => /31 October 2026/i.test(text)));
  assert.ok(doc.actions.some(text => /sign the declaration/i.test(text)));
});

test('page summary keeps selected statements and page source references', () => {
  const result = summarizePage({ pageNumber: 4, extractionMethod: 'pdf-text', text: 'Eligibility conditions. Applicants must be residents of the district for at least three years. Submit proof of residence with the application.' });
  assert.ok(result.points.some(text => /residents of the district/i.test(text)));
  assert.ok(result.sections.every(section => section.page === 4));
});

test('very short pages are explicitly marked as unreliable', () => {
  const result = summarizeDocument({ pages: [{ pageNumber: 2, text: '' }] });
  assert.ok(result.warnings.some(text => /Page 2/i.test(text)));
  assert.match(summarizePage({ pageNumber: 2, text: '' }).heading, /not readable/i);
});
