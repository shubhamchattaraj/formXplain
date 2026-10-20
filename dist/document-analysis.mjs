/* Document-driven local analysis. This module does not call an AI service. */
const clean = (s) =>
  String(s || "")
    .replace(/\s+/g, " ")
    .trim();
const words = (s) => (String(s || "").match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const escSentence = (s) => clean(s).replace(/^[-•*\d.)\s]+/, "");
const splitSentences = (text) =>
  String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(escSentence)
    .filter((s) => s.length > 15);
function sourceFor(pages, regex) {
  for (const p of pages) {
    const match = String(p.text || "").match(regex);
    if (match)
      return { page: p.pageNumber, snippet: clean(match[0]).slice(0, 420) };
  }
  return null;
}
function extractFieldLines(pages) {
  const out = [];
  const label =
    /(?:full name|applicant name|name of applicant|sex|gender|father.?s?.?\/?.?mother.?s?.?\/?.?husband|address|house\/building|street|mohalla|town\/village|post office|district|state|date of birth|age|disability|mobile|landline|email|aadhaar|aadhar|epic number|signature|place|date|institution|from \(?date|to \(?date|period|declaration|passport size|photograph|certificate|account number|occupation|income|category|course|qualification|registration number|contact number)/i;
  for (const p of pages) {
    const sourceText = String(p.text || "");
    const segments = sourceText.split(/\n+|(?<=[.!?])\s+|;\s*/);
    const labelMatches = [
      ...sourceText.matchAll(
        /(?:full name|applicant name|name of applicant|home address|address|sex|gender|date of birth|age|disability|mobile(?: no\.?| number)?|landline|email(?: id)?|aadhaar|aadhar|epic number|signature|place|date|name of educational institution|from \(date\)|to \(date\)|period|occupation|income|category|course|qualification|registration number|contact number)(?:\s*\([^)]*\))?/gi,
      ),
    ].map((m) => m[0]);
    for (const raw of [...segments, ...labelMatches]) {
      const line = clean(raw);
      if (
        line.length > 2 &&
        line.length < 150 &&
        label.test(line) &&
        !out.some((x) => x.label.toLowerCase() === line.toLowerCase())
      ) {
        const lower = line.toLowerCase();
        const status = /optional|if any|if known|if applicable/i.test(line)
          ? "Optional / conditional"
          : /required|mandatory|must|shall/i.test(line)
            ? "Explicitly required by wording"
            : "Not specified — verify officially";
        let group =
          /institution|from \(?date|to \(?date|period|teaching|employment|work experience/i.test(
            lower,
          )
            ? "Experience / supporting information"
            : /signature|place|declaration|citizen|true to the best|strike off/i.test(
                  lower,
                )
              ? "Declaration and signature"
              : /photograph|photo/i.test(lower)
                ? "Photograph / attachment"
                : /officer|receipt|action taken|accepted|rejected/i.test(lower)
                  ? "Authority-only section (verify role)"
                  : /address|house|street|mohalla|town|post office|district|state/i.test(
                        lower,
                      )
                    ? "Address"
                    : /name|sex|gender|age|birth|disability|aadhaar|aadhar|epic|mobile|landline|email|contact/i.test(
                          lower,
                        )
                      ? "Applicant details"
                      : "Other form fields";
        out.push({
          label: line.replace(/[:：]+$/, ""),
          page: p.pageNumber,
          status,
          group,
          source: line,
        });
      }
    }
  }
  return out.slice(0, 100);
}
function makeSection(title, body, source = null, items = []) {
  return { title, body, source, items };
}
export function analyzeDocument(doc) {
  const pages = (doc?.pages || []).map((p, i) => ({
    ...p,
    pageNumber: p.pageNumber || i + 1,
    text: String(p.text || ""),
  }));
  const full = pages.map((p) => p.text).join("\n");
  const all = clean(full);
  const sentences = splitSentences(full);
  const form19 =
    /form\s*[-–]?\s*19/i.test(all) &&
    /teachers[’' ]?\s*constituency/i.test(all) &&
    /electoral roll/i.test(all);
  const titleMatch = all.match(
    /(?:claim for inclusion of name in the electoral roll[^.]{0,120}|application for[^.]{0,120}|(?:application|claim|registration) form[^.]{0,100})/i,
  );
  const authorityMatch = all.match(
    /(?:Election Commission of India|Government of [A-Z][A-Za-z ]+|Department of [A-Z][A-Za-z ,&-]+)/i,
  );
  const title = form19
    ? "Claim for inclusion of name in the electoral roll for a Teachers’ Constituency (Form 19)"
    : titleMatch
      ? clean(titleMatch[0])
      : doc?.name || "Uploaded document";
  const purposeSource = sourceFor(
    pages,
    /(?:I request that my name be registered[^.]*|claim for inclusion of name[^.]*|purpose of this form[^.]*|this application is for[^.]*)/i,
  );
  const audienceSource = sourceFor(
    pages,
    /(?:who can apply[^.]*|applicant[s]?[^.]{0,160}|person[s]? applying[^.]{0,160}|during the last six years[^.]{0,220}|eligib(?:le|ility)[^.]{0,180})/i,
  );
  const eligibility = [];
  const eligRegex =
    /(?:eligible|eligibility|must have|at least|more than|total period|within (?:the )?last|during the last|qualifying condition|qualification)[^.!?\n]{0,220}[.!?]?/gi;
  let m;
  while ((m = eligRegex.exec(full)) && eligibility.length < 8) {
    const s = clean(m[0]);
    if (s.length > 20 && !eligibility.some((x) => x.text === s)) {
      const p =
        pages.find((x) => x.text.includes(m[0].trim())) ||
        pages.find((x) =>
          x.text.toLowerCase().includes(s.slice(0, 24).toLowerCase()),
        );
      eligibility.push({ text: s, page: p?.pageNumber || 1 });
    }
  }
  const fields = extractFieldLines(pages).map((f) => {
    const label = clean(f.label);
    const lower = label.toLowerCase();
    let meaning = `Use the “${label}” field for the information named by that label.`;
    let example =
      "Follow any instruction printed beside this field; the extracted text does not specify a more exact format.";
    let mistake =
      "Do not guess missing details. Check the completed entry against the original document or record.";
    if (/full name|applicant name|name of applicant|^name\b/.test(lower)) {
      meaning = "Enter the applicant’s name in this field.";
      example =
        "Match the spelling and format requested by the form to the relevant record.";
      mistake = "Do not use a nickname or alter the spelling of the name.";
    } else if (
      /address|house|building|street|mohalla|town|village|district|state|post office/.test(
        lower,
      )
    ) {
      meaning = "Enter the address information requested here.";
      example =
        "If the form separates the address into boxes, put each part in its matching field.";
      mistake =
        "Do not put the entire address into one box when separate fields are provided.";
    } else if (/date of birth|\bdob\b/.test(lower)) {
      meaning = "Enter the applicant’s date of birth.";
      example = "Use the date order or format printed on the form.";
      mistake = "Do not estimate the date if a reliable record is available.";
    } else if (/\bage\b/.test(lower)) {
      meaning = "Enter the applicant’s age in the units requested by the form.";
      example =
        "If years and months are both shown, complete both only as applicable.";
      mistake = "Check the age against the date of birth; do not guess.";
    } else if (/photograph|passport size|photo/.test(lower)) {
      meaning =
        "Use this area for a photograph only if the form explicitly requests one.";
      example =
        "Follow the dimensions and photo instructions printed in the source.";
      mistake =
        "Do not assume that a photo upload or copy is acceptable unless the form says so.";
    } else if (/signature/.test(lower)) {
      meaning =
        "Sign in the applicant signature field if it is intended for the applicant.";
      example =
        "Check the nearby label to confirm whose signature is requested.";
      mistake =
        "Do not sign fields reserved for an officer or other authority.";
    } else if (/email|mobile|phone|contact number|landline/.test(lower)) {
      meaning = "Enter the requested contact detail.";
      example =
        "Use a current contact detail and follow any “optional” or “if any” note beside the field.";
      mistake =
        "Do not treat an explicitly optional contact field as mandatory.";
    } else if (
      /institution|school|college|employer|teaching experience|period/.test(
        lower,
      )
    ) {
      meaning =
        "Enter the institution or period details requested by this field.";
      example =
        "Use the relevant institution name and dates that match your records.";
      mistake = "Do not invent dates or double-count overlapping periods.";
    } else if (/declaration|citizen|declare|true to the best/.test(lower)) {
      meaning = "Read the declaration before completing or selecting it.";
      example =
        "Proceed only when the statement is accurate for your circumstances.";
      mistake = "Do not select or sign a declaration that is not true.";
    } else if (/optional|if any|if known|if applicable/.test(lower)) {
      meaning =
        "This field is marked optional or conditional in the extracted wording.";
      example =
        "Complete it only when applicable or when the form’s instructions require it.";
      mistake =
        "Do not interpret this label alone as proof that an attachment is required.";
    } else if (
      /aadhaar|aadhar|epic|registration number|account number|\bnumber\b/.test(
        lower,
      )
    ) {
      meaning = "Enter the requested identifying number, if applicable.";
      example =
        "Copy it accurately from the relevant record and follow qualifications such as “if any” or “if known.”";
      mistake =
        "Do not confuse identifiers from different records or invent a missing number.";
    } else if (/\bdate\b/.test(lower)) {
      meaning = "Enter the date requested by this field.";
      example =
        "Use the printed date format and the event the field refers to.";
      mistake = "Check the date against the source record before submitting.";
    }
    return { ...f, meaning, example, mistake, special: f.source || null };
  });
  const requirements = [];
  const photo = sourceFor(
    pages,
    /(?:space for pasting one[\s\S]{0,240}|photograph\s*\(4\.5\s*cm\s*x\s*3\.5\s*cm\)[\s\S]{0,120}|recent[^.\n]{0,80}passport size[^.\n]{0,160})/i,
  );
  if (photo)
    requirements.push({
      name: "Recent passport-size colour photograph",
      status: "Explicitly required",
      why: "The form provides a dedicated photograph space and states the photo specifications.",
      page: photo.page,
      snippet: photo.snippet,
      verify:
        "Match the printed dimensions and presentation instructions on the form.",
      kind: "physical attachment",
      format:
        "Unsigned, frontal full-face view, white background; 4.5 cm × 3.5 cm where those dimensions appear in the source.",
    });
  const support = sourceFor(
    pages,
    /in support of the above,? i submit herewith[^\n.]*/i,
  );
  const teaching = sourceFor(pages, /during the last six years[^\n.]{0,260}/i);
  if (support || teaching)
    requirements.push({
      name: "Evidence supporting teaching experience",
      status: form19
        ? "Explicitly required"
        : "Requested / supporting evidence",
      why: form19
        ? "The uploaded form refers to supporting evidence without listing the exact documents at that point. Separately, ECI FAQ guidance for Form 19 says documentary proof of qualifying teaching is required."
        : "The source refers to supporting evidence but does not itself enumerate the exact acceptable documents at that point.",
      page: support?.page || teaching?.page || 1,
      snippet: support?.snippet || teaching?.snippet || "",
      verify:
        "Confirm acceptable evidence and any attestation requirements with the relevant authority.",
      kind: "supporting evidence",
      format: form19
        ? "The form itself does not specify the exact document. ECI FAQ says a certificate from each relevant teaching institution is normally adequate; verify current requirements."
        : "Not specified in this form.",
    });
  // Only promote a named item into the document checklist when the source
  // contains an attachment/submission instruction. Ordinary field labels such
  // as PAN, address, date of birth, or signature are not documents.
  const attachmentLines = pages.flatMap((p) =>
    p.text
      .split(/\n+/)
      .map(clean)
      .filter((x) =>
        /\b(?:attach|attached|enclose|enclosed|submit herewith|documentary proof|supporting document|copy of|photocopy of)\b/i.test(
          x,
        ),
      )
      .map((text) => ({ page: p.pageNumber, text })),
  );
  const documentPatterns = [
    [
      /passport[- ]size (?:colour|color )?photograph|recent[^.]{0,50}photograph|photograph/i,
      "Recent passport-size photograph",
    ],
    [/proof of identity|identity proof/i, "Proof of identity"],
    [/proof of address|address proof/i, "Proof of address"],
    [
      /income certificate|proof of income/i,
      "Income certificate or proof of income",
    ],
    [/caste certificate/i, "Caste certificate"],
    [/disability certificate/i, "Disability certificate"],
    [/birth certificate/i, "Birth certificate"],
    [
      /teaching experience|documentary proof|supporting evidence/i,
      "Supporting evidence for the stated requirement",
    ],
    [/mark ?sheet|academic transcript/i, "Mark sheet or academic transcript"],
    [/bank statement/i, "Bank statement"],
    [/pan card|copy of pan|photocopy of pan/i, "PAN card copy"],
    [/aadhaar card|aadhar card/i, "Aadhaar card copy"],
    [/passport copy|copy of passport|photocopy of passport/i, "Passport copy"],
    [/residence certificate/i, "Residence certificate"],
  ];
  for (const item of attachmentLines) {
    const match = documentPatterns.find(([pattern]) => pattern.test(item.text));
    if (!match) continue;
    const [pattern, name] = match;
    const conditional =
      /if required|if applicable|where applicable|if any|if eligible|may be asked to|as applicable|optional/i.test(
        item.text,
      );
    const explicit =
      /\b(?:must|required|shall|attach|enclose|submit herewith|documentary proof|supporting document)\b/i.test(
        item.text,
      );
    const status = conditional
      ? "Conditional — if applicable"
      : explicit
        ? "Required by the stated instruction"
        : "Requirement to verify";
    const sameCategory = requirements.some((r) => {
      const existing = String(r.name || "").toLowerCase();
      return (
        existing === name.toLowerCase() ||
        (/photograph/i.test(name) && /photograph|photo/i.test(existing)) ||
        (/supporting evidence/i.test(name) &&
          /teaching experience|supporting evidence/i.test(existing))
      );
    });
    if (!sameCategory)
      requirements.push({
        name,
        status,
        why: "Identified from an attachment or supporting-evidence instruction in the uploaded form.",
        page: item.page,
        snippet: item.text,
        verify:
          "Check the original instruction if the requirement is conditional or unclear.",
        kind: "document attachment",
      });
  }
  const officialGuidance = form19
    ? {
        label:
          "Election Commission of India official website — locate Form 19 FAQ, Question 56",
        url: "https://www.eci.gov.in/",
        retrieved: "16 October 2026",
        detail:
          "The Election Commission of India’s Form 19 FAQ (Question 56) says documentary proof of qualifying teaching is required; a certificate from the head of the teaching institution is normally considered adequate. If teaching occurred at multiple institutions, a certificate from each institution for the relevant period is described. It also refers to specified educational institutions notified by the State Government, at least secondary-school standard, ordinary residence in the constituency, and a qualifying date. The linked page is the ECI official website; locate the Form 19 FAQ and confirm it applies to your constituency and qualifying date.",
      }
    : null;
  const declarations = [];
  if (/has not been included in the electoral roll/i.test(full))
    declarations.push({
      text: "The applicant declares that their name has not been included in this or another Teachers’ Constituency electoral roll.",
      page:
        pages.find((p) =>
          /has not been included in the electoral roll/i.test(p.text),
        )?.pageNumber || 1,
    });
  if (
    /has been included in the electoral roll/i.test(full) &&
    /request that it be deleted/i.test(full)
  )
    declarations.push({
      text: "Alternatively, the applicant states that their name is already included in another Teachers’ Constituency roll and requests deletion from that roll.",
      page:
        pages.find((p) => /request that it be deleted/i.test(p.text))
          ?.pageNumber || 1,
    });
  const authoritySections = pages.flatMap((p) =>
    p.text
      .split(/\n+/)
      .map(clean)
      .filter((x) =>
        /intimation of action taken|receipt of application|for office use|office use only/i.test(
          x,
        ),
      )
      .map((x) => ({ text: x, page: p.pageNumber })),
  );
  const applicantNotes = pages.flatMap((p) =>
    p.text
      .split(/\n+/)
      .map(clean)
      .filter((x) => /to be filled in by the applicant/i.test(x))
      .map((x) => ({ text: x, page: p.pageNumber })),
  );
  const guide = {
    title,
    authority:
      authorityMatch?.[0] ||
      (form19
        ? "Election Commission of India (stated in the form)"
        : "Not identified in the extracted text — verify on the original document"),
    formType: form19
      ? "Form 19"
      : "Not reliably identified from extracted text",
    purpose: form19
      ? "This form is used to ask for a person’s name to be included in the electoral roll for a Teachers’ Constituency. Submitting it is a request, not a guarantee of eligibility or acceptance."
      : purposeSource?.snippet ||
        (titleMatch
          ? `The title suggests this document concerns ${clean(titleMatch[0]).toLowerCase()}. The extracted text does not provide enough evidence for a more specific conclusion.`
          : "The extracted text does not clearly state the form’s purpose. Review the original title and instructions; do not infer eligibility from the upload alone."),
    purposeSource:
      purposeSource ||
      sourceFor(pages, /(?:title|application|form|claim|registration)/i),
    audience: form19
      ? "A person seeking inclusion in a Teachers’ Constituency electoral roll. The form itself asks the applicant to state teaching experience during the last six years totaling more than three years. This is not a complete legal eligibility assessment; verify all applicable rules with the relevant election authority."
      : audienceSource?.snippet ||
        "The intended applicant is not clearly identified in the extracted text. Check the title, addressee, instructions, and official guidance before deciding whether the form applies to you.",
    eligibility:
      form19 && teaching
        ? [
            {
              text: "The form states that, during the last six years, the applicant has been engaged in teaching for a total period of more than three years.",
              page: teaching.pageNumber,
            },
          ]
        : eligibility,
    requirements,
    attachments: requirements.filter((r) =>
      /photograph|evidence|support|attach|document|certificate|proof/i.test(
        r.name + " " + r.why,
      ),
    ),
    fields,
    declarations,
    authoritySections,
    applicantNotes,
    officialGuidance,
    pageCount: pages.length,
    pages: pages.map((p) => ({
      page: p.pageNumber,
      words: words(p.text),
      empty: words(p.text) < 3,
      method: p.extractionMethod || "extracted text",
      excerpt: clean(p.text).slice(0, 320),
    })),
    sourceNotice:
      "Local rule-based analysis of the current upload; not generated by an AI model. Explanations are interpretations, and source text or official instructions should control.",
    warnings: pages
      .filter((p) => words(p.text) < 3)
      .map(
        (p) =>
          `Page ${p.pageNumber} has little or no readable text; its guide may be incomplete.`,
      ),
  };
  if (form19) {
    const fieldSpecs = [
      [
        "Teachers’ Constituency and addressee",
        /Teachers[’' ]?\s*Constituency|Electoral Registration Officer/i,
        "Name the Teachers’ Constituency and the Electoral Registration Officer addressed by the form.",
        "Use the constituency name and any details requested by the local election authority.",
        "Do not leave the constituency blank or guess the officer’s address.",
      ],
      [
        "Applicant name and sex",
        /Full Name|\bSex\b/i,
        "Enter the applicant’s full name and sex in the labelled fields.",
        "Match the name to the relevant official records.",
        "Check spelling and do not use a nickname unless official records use it.",
      ],
      [
        "Parent or spouse name",
        /Father.?s.?\/Mother.?s.?\/Husband.?s.? Name/i,
        "Enter the full name of the applicable parent or husband as the field requests.",
        "Write the full name, not initials if the form expects a full name.",
        "Do not fill multiple relationships unless the form asks for them.",
      ],
      [
        "Ordinary residential address",
        /House Address \(Place of ordinary residence\)/i,
        "Provide the address fields shown: house/building/apartment, street/mohalla, town/village, post office, police station/tehsil/taluqa/mouza, district, and state.",
        "Use the applicant’s ordinary residential address and split it across the matching boxes.",
        "Do not put the entire address into one box if separate fields are provided.",
      ],
      [
        "Age and date of birth",
        /Age\s+Years/i,
        "Enter age in years and months where requested, and date of birth in the printed day/month/year boxes.",
        "Use the date format printed on the form.",
        "Check age and date against a reliable record; do not estimate if exact details are available.",
      ],
      [
        "Disability information",
        /Disability \(if any\)[^\n]*/i,
        "The form explicitly labels this field optional and lists disability categories.",
        "Select a listed option only if applicable.",
        "Do not treat the optional field as a mandatory attachment.",
      ],
      [
        "Existing Assembly Constituency registration",
        /Whether registered as an elector for any assembly constituency/i,
        "Indicate whether already registered as an elector in an Assembly Constituency; complete the follow-up fields if yes.",
        "The form asks for constituency number/name and part or polling-station number if known.",
        "Do not invent a part number; the form says “if known.”",
      ],
      [
        "Existing electoral details",
        /EPIC Number \(if any\)/i,
        "Complete the existing-registration subsection only when applicable; it includes date of birth and EPIC number if any.",
        "Copy the EPIC number exactly from the electoral record.",
        "Do not confuse an EPIC number with an Aadhaar number.",
      ],
      [
        "Aadhaar details / alternative declaration",
        /Aadhaar Details/i,
        "Tick the applicable choice shown: Aadhaar number, or the statement that you cannot furnish it because you do not have an Aadhaar number.",
        "Follow the printed alternatives.",
        "The number field alone does not establish that a photocopy must be attached.",
      ],
      [
        "Contact details",
        /Contact Number/i,
        "Enter mobile, landline, and email only as applicable; the form marks mobile optional and email “if any.”",
        "Use active contact details.",
        "Do not interpret optional labels as compulsory.",
      ],
      [
        "Teaching experience table",
        /During the last six years/i,
        "List educational institutions and the From date, To date, and Period for each relevant teaching engagement.",
        "The form states a total teaching period of more than three years during the last six years.",
        "The form does not explain a calculation method; do not double-count overlapping periods. Verify the qualifying period officially.",
      ],
      [
        "Teaching evidence",
        /In support of the above, I submit herewith/i,
        "The form references supporting evidence but does not list the exact documents in the supplied form.",
        "Check applicable official guidance. The linked ECI guidance gives additional external detail.",
        "Do not assume any one certificate format is accepted in every case without verification.",
      ],
      [
        "Previous Teachers’ Constituency registration",
        /My name has not been included in the electoral roll/i,
        "Two alternative declarations are printed: not previously included, or already included elsewhere and requesting deletion.",
        "Strike off the paragraph that does not apply, as the form instructs.",
        "Do not select a declaration automatically; read both and choose truthfully.",
      ],
      [
        "Citizenship and truth declaration",
        /I declare that I am a citizen of India/i,
        "Read the declaration of Indian citizenship and truthfulness of the supplied particulars.",
        "Proceed only if the declaration is accurate for you.",
        "The form warns false statements/declarations may be punishable under section 31 of the Representation of the People Act, 1950.",
      ],
      [
        "Place, date, and claimant signature",
        /Signature of claimant/i,
        "Enter place and date and sign in the claimant signature area.",
        "Use the signature required by the submitting authority.",
        "Do not sign officer-only areas.",
      ],
      [
        "Photograph area",
        /SPACE FOR PASTING ONE/i,
        "Paste the photograph in the designated space.",
        "Recent, unsigned, passport-size colour photo; frontal view of the full face; white background; 4.5 cm × 3.5 cm as printed.",
        "Do not paste a signed photo or assume a digital upload replaces the physical photograph.",
      ],
      [
        "Officer action and receipt areas",
        /Intimation of action taken|Receipt of application/i,
        "The action-taken and receipt sections name the Electoral Registration Officer and are officer-facing. The extracted form also includes “To be filled in by the applicant” near the receipt area, so check the visual form layout to see exactly which starred blanks that note applies to.",
        "Leave officer decision, serial/part registration, rejection reason, officer date and officer address for the authority.",
        "Do not fill officer decisions or sign on behalf of the officer.",
      ],
    ];
    const actualFields = [];
    for (const [label, re, meaning, example, mistake] of fieldSpecs) {
      const src = sourceFor(pages, re);
      if (src)
        actualFields.push({
          label,
          page: src.page,
          location: label.includes("address")
            ? "Address block"
            : label.includes("table") || label.includes("evidence")
              ? "Teaching experience section"
              : label.includes("Photograph")
                ? "Photograph box near the top of the form"
                : label.includes("Officer")
                  ? "Lower / perforated authority section"
                  : "Main form body",
          meaning,
          example,
          status: /Officer action/.test(label)
            ? "Officer-facing — leave official decision fields blank"
            : /optional/i.test(src.snippet) ||
                /if any|if known/i.test(src.snippet)
              ? "Optional / conditional"
              : /Disability information/.test(label)
                ? "Optional"
                : "Not specified — verify officially",
          mistake,
          special: src.snippet,
          source: src,
        });
    }
    guide.fields = actualFields;
    guide.declarations = [
      ...(sourceFor(
        pages,
        /My name has not been included in the electoral roll/i,
      )
        ? [
            {
              text: "Alternative A: the applicant declares their name has not been included in this or any other Teachers’ Constituency electoral roll.",
              page: sourceFor(
                pages,
                /My name has not been included in the electoral roll/i,
              ).page,
            },
          ]
        : []),
      ...(sourceFor(pages, /My name has been included in the electoral roll/i)
        ? [
            {
              text: "Alternative B: the applicant declares their name is already included in another Teachers’ Constituency roll and requests deletion from that roll.",
              page: sourceFor(
                pages,
                /My name has been included in the electoral roll/i,
              ).page,
            },
          ]
        : []),
    ];
  }
  return guide;
}
