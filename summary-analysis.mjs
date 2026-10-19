/* Evidence-grounded extractive summaries for formXplain.
 * This module selects and ranks source sentences; it does not invent missing facts
 * or call a generative AI service.
 */
const clean = (value) =>
  String(value ?? "")
    .replace(/[\u0000\uFFFD]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const wordCount = (value) =>
  (String(value ?? "").match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const normalize = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function splitSentences(text) {
  // Also split common OCR/PDF extraction separators while avoiding empty fragments.
  return String(text ?? "")
    .replace(/\r/g, "\n")
    .split(/\n+|(?<=[.!?])\s+(?=(?:[A-Z0-9“"'([]|\p{Lu}))/u)
    .map((s) => clean(s).replace(/^[-•*▪◦\d]+[.)\s-]*/, ""))
    .filter((s) => wordCount(s) >= 4 && s.length >= 20);
}

const STOP = new Set(
  "the a an and or but if then than of to in on at for from by with as is are be been being this that these those it its into about your you we our their they them who what when where how may can could should must shall will would not no yes any each all other more most such also only both either same use used using have has had do does did document form application applicant information details section please enter provide submit attach include required requiredly".split(
    " ",
  ),
);
const SIGNALS = [
  [
    /\b(deadline|due date|last date|submit by|no later than|before \d|valid until|expires? on)\b/i,
    7,
  ],
  [
    /\b(must|required|shall|mandatory|need to|have to|is to be|are to be)\b/i,
    6,
  ],
  [
    /\b(eligible|eligibility|qualif|at least|more than|within the last|during the last|criteria)\b/i,
    5,
  ],
  [
    /\b(submit|send|upload|return|attach|enclose|bring|provide|produce|furnish)\b/i,
    4,
  ],
  [/\b(fee|payment|amount|rupees|₹|\bINR\b|penalty|refund)\b/i, 4],
  [
    /\b(declare|declaration|undertaking|certify|signature|sign|false statement)\b/i,
    3,
  ],
  [
    /\b(address|date of birth|identity|proof|certificate|photograph|documentary evidence|bank|income|experience)\b/i,
    2,
  ],
  [
    /(\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}\b|\b\d+(?:\.\d+)?\s*(?:days?|weeks?|months?|years?|%|cm|mm|kg|₹|rupees?)\b)/i,
    2,
  ],
];
const GENERIC =
  /^(?:page \d+|instructions|important instructions|general instructions|application form|form|details|information|declaration|terms and conditions|conditions|documents required|documents to be submitted)[.:\s]*$/i;

function scoreSentence(sentence, index, total) {
  const s = sentence;
  const wc = wordCount(s);
  if (wc < 5) return -5;
  let score = 0;
  for (const [regex, weight] of SIGNALS) if (regex.test(s)) score += weight;
  const tokens = normalize(s)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP.has(t));
  score += Math.min(3, new Set(tokens).size / 8);
  if (wc > 12 && wc < 65) score += 1.5;
  if (wc > 85) score -= 2;
  if (GENERIC.test(s)) score -= 8;
  if (/^(?:page|scan|image|formxplain)\b/i.test(s)) score -= 1;
  // Small first/last-position bonus, never enough to outweigh a clear requirement.
  if (index < 2) score += 0.5;
  if (index >= total - 2) score += 0.25;
  return score;
}

function uniqueRanked(sentences, limit = 8) {
  const seen = new Set();
  return sentences
    .map((item, index) => ({
      ...item,
      score: scoreSentence(item.text, index, sentences.length),
      index,
      key: normalize(item.text),
    }))
    .filter((item) => item.score > 0 && item.key.length > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter((item) => {
      const key = item.key;
      if (
        [...seen].some(
          (existing) =>
            existing === key ||
            (Math.min(existing.length, key.length) > 45 &&
              (existing.includes(key) || key.includes(existing))),
        )
      )
        return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .sort((a, b) => a.index - b.index);
}

function pageSentences(page) {
  return splitSentences(page.text).map((text) => ({
    text,
    page: page.pageNumber,
    method: page.extractionMethod || "extracted text",
  }));
}

function findFirst(sentences, regex) {
  return sentences.find((item) => regex.test(item.text)) || null;
}

function summarizePage(page) {
  const text = clean(page?.text);
  if (wordCount(text) < 3) {
    return {
      heading: "Content not readable",
      explanation:
        "This page could not be summarized reliably because too little readable text was extracted.",
      points: [],
      sections: [],
      warning:
        "No meaningful text was extracted from this page. Review the original page or retry OCR.",
    };
  }
  const sentences = pageSentences(page);
  const points = uniqueRanked(sentences, 5).map((item) => item.text);
  const first = sentences[0]?.text || text.slice(0, 180);
  const heading =
    /\b(application|claim|registration|enrolment|enrollment|admission)\b/i.test(
      first,
    )
      ? "Purpose and application details"
      : /\b(eligib|qualif|criteria|must have|at least|more than)\b/i.test(text)
        ? "Eligibility and conditions"
        : /\b(deadline|due date|submit by|last date|expires|valid until)\b/i.test(
              text,
            )
          ? "Dates and deadlines"
          : /\b(attach|enclose|supporting document|proof of|certificate|photograph)\b/i.test(
                text,
              )
            ? "Documents and supporting evidence"
            : /\b(declare|declaration|undertaking|signature|sign)\b/i.test(text)
              ? "Declaration and signature"
              : "Key information";
  const sections = [];
  for (const item of uniqueRanked(sentences, 6)) {
    sections.push({
      title: /deadline|due date|last date|valid until|expires/i.test(item.text)
        ? "Date or validity"
        : /must|required|shall|mandatory|need to|have to/i.test(item.text)
          ? "Requirement or instruction"
          : /eligible|eligibility|qualif|at least|more than|criteria/i.test(
                item.text,
              )
            ? "Eligibility or condition"
            : /attach|enclose|certificate|proof|photograph|documentary evidence/i.test(
                  item.text,
                )
              ? "Supporting document"
              : "Key source statement",
      explanation: item.text,
      sourceExcerpt: item.text.slice(0, 360),
      page: item.page,
      action: null,
    });
  }
  const warning =
    /ocr/i.test(page.extractionMethod || "") ||
    /camera-ocr/i.test(page.extractionMethod || "")
      ? "This page was read using OCR. Verify names, numbers, dates, tables, and checkboxes against the original image."
      : null;
  return {
    heading,
    explanation: points.length
      ? `Key statements selected from the extracted text on this page. Check the source excerpts and original page for context.`
      : "Text was extracted, but no strong instruction or key statement could be selected confidently. Review the source text below.",
    points,
    sections,
    warning,
  };
}

function classifyKind(text) {
  if (/\b(scholarship|financial aid|stipend)\b/i.test(text))
    return "scholarship or financial-aid document";
  if (/\b(application form|apply for|applicant|claim for)\b/i.test(text))
    return "application or claim document";
  if (/\b(registration|enrolment|enrollment)\b/i.test(text))
    return "registration document";
  if (/\b(declaration|undertaking|affidavit)\b/i.test(text))
    return "declaration or undertaking";
  if (/\b(notice|circular|notification)\b/i.test(text))
    return "notice or circular";
  if (/\b(certificate)\b/i.test(text)) return "certificate-related document";
  if (/\b(instructions|guidelines|procedure)\b/i.test(text))
    return "instruction or guidance document";
  return "document";
}

function collectRequirements(pages) {
  const re =
    /\b(must|required|shall|mandatory|submit|attach|enclose|provide|produce|furnish|proof of|supporting document|documents to|bring along|upload|deadline|due date|last date|valid until|expires on)\b/i;
  const found = [];
  for (const page of pages) {
    for (const text of splitSentences(page.text)) {
      if (!re.test(text) || wordCount(text) < 5 || text.length > 360) continue;
      const key = normalize(text);
      if (found.some((item) => item.key === key)) continue;
      found.push({
        text,
        page: page.pageNumber,
        method: page.extractionMethod || "extracted text",
        key,
      });
    }
  }
  return found.slice(0, 12).map(({ key, ...item }) => item);
}

function summarizeDocument(doc) {
  const pages = (doc?.pages || []).map((page, index) => ({
    ...page,
    pageNumber: page.pageNumber || index + 1,
    text: String(page.text || ""),
  }));
  const all = pages.flatMap(pageSentences);
  const ranked = uniqueRanked(all, 12);
  const fullText = pages.map((page) => page.text).join("\n");
  const purposeSentence =
    findFirst(
      all,
      /\b(this form|this application|application for|claim for|purpose|is used to|seeks to|invites applications|apply for)\b/i,
    ) || all[0];
  const audienceSentence =
    findFirst(
      all,
      /\b(who can apply|students? (?:enrolled|who|whose)|residents? (?:of|who)|candidates? (?:who|for)|employees? (?:who|of)|persons? who|any person|only those|eligible applicants?|qualification criteria)\b/i,
    ) || findFirst(all, /\b(eligib|who may apply|applicants? must)\b/i);
  const dateItems = uniqueRanked(
    all.filter((item) =>
      /(\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b(?:deadline|due date|last date|submit by|no later than|valid until|expires? on)\b)/i.test(
        item.text,
      ),
    ),
    8,
  );
  const reqs = collectRequirements(pages);
  const unreadable = pages.filter((page) => wordCount(page.text) < 3);
  const ocrPages = pages.filter((page) =>
    /ocr/i.test(page.extractionMethod || ""),
  );
  const actions = ranked
    .filter((item) =>
      /\b(must|required|shall|submit|attach|enclose|provide|bring|upload|sign|declare|complete|fill in|enter your|deadline|due date|last date)\b/i.test(
        item.text,
      ),
    )
    .slice(0, 8)
    .map((item) => item.text);
  const important = ranked
    .filter((item) => !actions.includes(item.text))
    .slice(0, 6)
    .map((item) => item.text);
  const purpose = purposeSentence
    ? `${purposeSentence.text}${purposeSentence.text.endsWith(".") ? "" : "."}`
    : `The extracted text does not clearly state the document's purpose. Review the title and opening instructions on the original pages.`;
  const audience = audienceSentence
    ? `${audienceSentence.text}${audienceSentence.text.endsWith(".") ? "" : "."}`
    : null;
  const warnings = [];
  if (unreadable.length)
    warnings.push(
      `Page${unreadable.length > 1 ? "s" : ""} ${unreadable.map((page) => page.pageNumber).join(", ")} had too little readable text to summarize reliably.`,
    );
  if (ocrPages.length)
    warnings.push(
      `OCR was used on ${ocrPages.length} page(s). Verify names, numbers, dates, tables, and checkboxes against the original.`,
    );
  if (wordCount(fullText) < 40)
    warnings.push(
      "The extracted text is very short; this summary may omit important visual instructions.",
    );
  return {
    purpose,
    audience,
    actions,
    importantPoints: important,
    dates: dateItems.map((item) => item.text),
    requirements: reqs,
    warnings,
    kind: classifyKind(fullText),
    coverage: {
      pagesRead: pages.length - unreadable.length,
      totalPages: pages.length,
      extractedWords: wordCount(fullText),
    },
  };
}

export { summarizePage, summarizeDocument };
