import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDocument } from '../document-analysis.mjs';

const form19Pages = [
  { pageNumber: 1, extractionMethod: 'pdf-text', text: `Form-19 (See Rule31) ELECTION COMMISSION OF INDIA Claim for inclusion of name in the electoral roll for a Teachers’ Constituency. To, The Electoral Registration Officer, Teachers’ Constituency. SPACE FOR PASTING ONE RECENT UNSIGNED PASSPORT SIZE COLOR PHOTOGRAPH (4.5 CM X 3.5 CM) SHOWING FRONTAL VIEW OF FULL FACE WITH WHITE BACKGROUND. Full Name Sex Father's/Mother's/Husband's Name (in full). House Address (Place of ordinary residence): House/Building/Apartment No.; Street/Mohalla; Town/Village; Post Office; Police Station/Tehsil/Taluqa/Mouza; District; State. Age Years Months Date of Birth. Disability (if any) (optional Field). Whether registered as an elector for any assembly constituency. Number and Name of Assembly Constituency; Part/Polling Station No. (if known); Date of Birth; EPIC Number (if any). Aadhaar Details: Aadhaar Number or I am not able to furnish my Aadhaar Number because I don't have Aadhaar Number. Contact Number: Mobile No. (optional), Landline, Email Id (if any). During the last six years, I have been engaged in teaching for a total period of more than three years as follows: Name of Educational Institution; From (Date); To (Date); Period. In support of the above, I submit herewith` },
  { pageNumber: 2, extractionMethod: 'pdf-text', text: `My name has not been included in the electoral roll for this or any other teachers’ constituency. OR My name has been included in the electoral roll for the teachers’ constituency under the address given below and I request that it be deleted from that roll. I declare that I am a citizen of India and that all particulars given above are true to the best of my knowledge and belief. Place Date Signature of claimant. Any person who makes a statement or declaration which is false is punishable under section 31 of the Representation of the People Act, 1950. Strike off the paragraph not applicable. Intimation of action taken. Electoral Registration Officer. Receipt of application. Electoral Registration Officer. To be filled in by the applicant.` }
];

test('Form 19 is identified from actual document text and page structure is preserved', () => {
  const guide = analyzeDocument({ name: 'sample.pdf', pages: form19Pages });
  assert.equal(guide.formType, 'Form 19');
  assert.match(guide.title, /Teachers’ Constituency/);
  assert.equal(guide.pageCount, 2);
  assert.deepEqual(guide.pages.map(p => p.page), [1, 2]);
  assert.match(guide.purpose, /name to be included in the electoral roll/);
});

test('Form 19 teaching condition, photograph specifications, and official evidence guidance are distinguished', () => {
  const guide = analyzeDocument({ name: 'sample.pdf', pages: form19Pages });
  assert.match(guide.eligibility[0].text, /more than three years/);
  const photo = guide.requirements.find(r => /photograph/i.test(r.name));
  assert.ok(photo);
  assert.equal(photo.status, 'Explicitly required');
  assert.match(photo.format, /unsigned/i);
  assert.match(photo.format, /4\.5 cm/);
  const teaching = guide.requirements.find(r => /teaching experience/i.test(r.name));
  assert.ok(teaching);
  assert.equal(teaching.status, 'Explicitly required');
  assert.match(teaching.why, /ECI FAQ guidance/);
  assert.ok(guide.officialGuidance);
  assert.match(guide.officialGuidance.detail, /certificate from the head/i);
});

test('optional form fields are excluded from document requirements while declarations remain separately source-paged', () => {
  const guide = analyzeDocument({ name: 'sample.pdf', pages: form19Pages });
  assert.ok(!guide.requirements.some(r => /disability|address|date of birth|signature|declaration|aadhaar number|epic number/i.test(r.name)));
  assert.equal(guide.declarations.length, 2);
  assert.ok(guide.declarations.every(d => d.page === 2));
  assert.ok(guide.authoritySections.some(s => /Intimation of action taken/i.test(s.text) && s.page === 2));
  assert.ok(guide.authoritySections.some(s => /Receipt of application/i.test(s.text) && s.page === 2));
  assert.ok(guide.applicantNotes.some(s => /filled in by the applicant/i.test(s.text) && s.page === 2));
});

test('unrelated application receives document-specific analysis, not a Form 19 template', () => {
  const pages = [
    { pageNumber: 1, extractionMethod: 'pdf-text', text: `Community library membership application. Applicant name. Home address. Contact email (optional). Select membership type. Attach one recent photograph if required by the library. Applicant signature.` },
    { pageNumber: 2, extractionMethod: 'pdf-text', text: `Library staff use only. Membership decision. Staff signature and approval date.` }
  ];
  const guide = analyzeDocument({ name: 'library-membership.pdf', pages });
  assert.notEqual(guide.formType, 'Form 19');
  assert.match(guide.title, /library-membership|application/i);
  assert.doesNotMatch(guide.purpose, /Teachers’ Constituency/);
  assert.ok(guide.fields.some(f => /Applicant name/i.test(f.label)));
  assert.equal(guide.officialGuidance, null);
});

test('empty pages are flagged and not treated as readable evidence', () => {
  const guide = analyzeDocument({ name: 'mixed.pdf', pages: [
    { pageNumber: 1, text: 'Application for a library card. Enter applicant name.' },
    { pageNumber: 2, text: '' }
  ] });
  assert.equal(guide.pages[1].empty, true);
  assert.ok(guide.warnings.some(w => /Page 2/.test(w)));
});

test('field guidance is specific to each detected field and keeps source-page associations', () => {
  const guide = analyzeDocument({ name: 'library-membership.pdf', pages: [
    { pageNumber: 3, extractionMethod: 'pdf-text', text: 'Community library membership application. Full Name. Home Address. Date of Birth. Contact email (optional). Applicant Signature.' }
  ] });
  const name = guide.fields.find(f => /full name/i.test(f.label));
  const address = guide.fields.find(f => /address/i.test(f.label));
  const birth = guide.fields.find(f => /date of birth/i.test(f.label));
  const email = guide.fields.find(f => /email/i.test(f.label));
  assert.ok(name && address && birth && email);
  assert.match(name.meaning, /name/i);
  assert.match(address.meaning, /address/i);
  assert.match(birth.meaning, /date of birth/i);
  assert.match(email.meaning, /contact detail/i);
  assert.notEqual(name.example, address.example);
  assert.notEqual(address.example, birth.example);
  assert.equal(name.page, 3);
  assert.equal(address.page, 3);
  assert.equal(birth.page, 3);
  assert.equal(email.page, 3);
  assert.match(email.meaning, /optional|contact/i);
});

test('document requirement statuses and page references remain evidence-grounded', () => {
  const guide = analyzeDocument({ name: 'library-membership.pdf', pages: [
    { pageNumber: 1, text: 'Community library membership application. Attach one recent photograph if required by the library.' },
    { pageNumber: 2, text: 'Applicant signature.' }
  ] });
  const photo = guide.requirements.find(r => /photograph/i.test(r.name));
  assert.ok(photo);
  assert.equal(photo.page, 1);
  assert.notEqual(photo.status, 'Explicitly required');
});


test('document checklist only promotes named supporting documents, not ordinary form fields', () => {
  const guide = analyzeDocument({ name: 'library-membership.pdf', pages: [
    { pageNumber: 1, extractionMethod: 'pdf-text', text: 'Library membership application. Enter full name and date of birth. Attach proof of identity if applicable. Sign the declaration.' },
    { pageNumber: 2, extractionMethod: 'pdf-text', text: 'Enter your address and contact number.' }
  ] });
  assert.ok(guide.requirements.some(r => /proof of identity/i.test(r.name) && /conditional/i.test(r.status)));
  assert.ok(!guide.requirements.some(r => /full name|date of birth|address|contact number|declaration/i.test(r.name)));
  assert.ok(guide.requirements.every(r => !r.name.includes('Enter ')));
});

test('no attachment evidence produces an empty document list rather than invented requirements', () => {
  const guide = analyzeDocument({ name: 'plain-form.pdf', pages: [
    { pageNumber: 1, extractionMethod: 'pdf-text', text: 'Application form. Enter full name, address, date of birth, and signature.' }
  ] });
  assert.deepEqual(guide.requirements, []);
});
