// Selin's chapter briefs and the glossary. Pure data plus one text splitter,
// so it can be unit tested without a DOM. Sources: TMMi Framework v2.0,
// TAMAR R1.3 and the case pack (see ../docs/research/*.md).
//
// Selin is the player's lead assessor at their own firm. She explains the
// method; she is not part of the case and never supplies evidence.

export const MENTOR = Object.freeze({
  id: 'selin',
  name: 'Selin',
  role: 'Your lead assessor · on the phone',
  color: '#f08fb0',
});

export const MAX_LINE_WORDS = 25;

/** Chapter (= step 0–7) -> 1–3 short lines: the goal, how to do it, one tip. */
export const MENTOR_LINES = Object.freeze({
  0: Object.freeze([
    'I’m Selin, your lead assessor. Tonight you run an informal TMMi assessment of Rotaşa’s test process.',
    'TMMi is a ladder of test maturity. At Level 2, testing is a managed process, not heroics.',
    'Tip: you judge the process, not the product. Evidence beats opinion, including mine.',
  ]),
  1: Object.freeze([
    'First, agree the plan with Murat: the scope, what kind of result he gets, and whom you interview.',
    'TMMi is staged: Level 2 needs all six of its process areas. Leave one out and the level is Not Rated.',
    'Tip: an informal assessment gives findings, never a certificate. Say so on day one.',
  ]),
  2: Object.freeze([
    'You have one day on site. Every document and interview costs time; the label shows how much.',
    'Click glowing documents and the people you booked. Only booked people have time for you.',
    'Tip: re-testing the product or reading code is not assessing the process. Watch what really happens.',
  ]),
  3: Object.freeze([
    'Now rate all 21 Level 2 goals: N, P, L or F, using only what is in your bag.',
    'Open a process area, read the evidence under each goal, then pick a rating. Use “?” when key evidence is missing.',
    'Tip: two goals ask for a written reason. Name the documents you rely on, not your impression.',
  ]),
  4: Object.freeze([
    'Turn your goal ratings into one statement about Rotaşa’s maturity level.',
    'A process area is only as strong as its weakest goal; a level only as strong as its weakest process area.',
    'Tip: this is an informal assessment, so call the result indicative. It is not a formal rating.',
  ]),
  5: Object.freeze([
    'Murat reads your findings now. Expect three objections, and answer each one in the meeting.',
    'Speak his language: money, risk and Rotaşa’s own numbers. Your written reply goes in the dossier.',
    'Tip: report findings by role and process area, never by person. Your sources stay confidential.',
  ]),
  6: Object.freeze([
    'Build the improvement plan: 400 hours and TRY 150,000. Choose actions, then the one that starts first.',
    'This is IDEAL’s Establishing phase: you diagnosed, now you plan. Close the weakest Level 2 goals first.',
    'Tip: keep some hours in reserve, and decide who owns the plan before what goes in it.',
  ]),
  7: Object.freeze([
    'Six months have passed. Walk the office: each marker shows what one of your decisions did.',
    'Then open the debrief to compare your route with the expert’s, decision by decision.',
    'Tip: IDEAL ends with Learning. Ask yourself which evidence would have changed a rating.',
  ]),
});

const entry = (id, term, text, aliases = [], caseSensitive = false) =>
  Object.freeze({ id, term, text, aliases: Object.freeze(aliases), caseSensitive });

/** Glossary, alphabetical by term. `aliases` are extra spellings matched in text. */
export const GLOSSARY = Object.freeze([
  entry('dor', 'Definition of Ready',
    'Entry criteria: what a piece of work must have before testing or development starts, such as acceptance criteria in a user story. TMMi calls entry criteria the definition-of-ready.',
    ['definition-of-ready', 'entry criteria']),
  entry('evidence', 'Evidence',
    'What ratings rest on. TAMAR names staff interviews, documents and other written material, questionnaires and customer surveys. Here you can also observe practice first-hand.',
    ['evidence kinds', 'objective evidence']),
  entry('exit', 'Exit criteria',
    'Agreed conditions that decide when testing is complete, also called the definition-of-done. They are set in the test plan and monitored.',
    ['definition-of-done']),
  entry('formal', 'Formal assessment',
    'Led by an accredited Lead Assessor with a team of at least two. Interviews must be corroborated by documents, and the result is a verifiable maturity rating.',
    ['formal assessments']),
  entry('goal', 'Goal',
    'What an organization shall achieve in a process area. Goals are the only required part of TMMi, and ratings are decided on goals.',
    ['specific goal', 'goals']),
  entry('ideal', 'IDEAL',
    'An improvement cycle: Initiating, Diagnosing, Establishing, Acting, Learning. This assessment is Diagnosing; your action plan is Establishing.',
    ['IDEAL model'], true),
  entry('informal', 'Informal assessment',
    'A quick check by one experienced assessor. One type of evidence is enough and nothing must be corroborated. It gives findings, never a formal maturity rating.',
    ['informal assessments']),
  entry('kvkk', 'KVKK',
    'Turkey’s Personal Data Protection Law. Real customer addresses and phone numbers copied into a test environment are a legal exposure under it.',
    [], true),
  entry('level', 'Maturity level',
    'One of five TMMi stages, from 1 Initial to 5 Optimization. Each level above 1 has process areas to implement; every organization is at least Level 1.',
    ['maturity levels']),
  entry('npl', 'N/P/L/F',
    'The rating scale: Not achieved (0–15%), Partially (>15–50%), Largely (>50–85%), Fully achieved (>85–100%). The percentages apply to practices only.',
    ['NPLF'], true),
  entry('nonattribution', 'Non-attribution',
    'Assessment data stays confidential and cannot be traced to any individual. The sponsor owns the findings, not the names behind them.',
    ['non-attributable']),
  entry('nr', 'NR',
    'Not Rated: the evidence is insufficient or the item is out of scope. One NR goal makes its process area NR, and one NR process area makes the level NR.',
    ['Not Rated'], true),
  entry('practice', 'Practice',
    'What an organization typically does to reach a goal. Practices are expected, not required: an acceptable alternative also counts.',
    ['specific practice', 'practices']),
  entry('pa', 'Process area',
    'A cluster of related practices, such as Test Planning. Level 2 has six. A process area is satisfied when its goals are achieved.',
    ['process areas']),
  entry('staged', 'Staged model',
    'TMMi levels build on each other: a higher level cannot be achieved while a lower one is not, and skipping a level is usually counter-productive.',
    ['staged']),
  entry('tmmi', 'TMMi',
    'Test Maturity Model integration (v2.0): a staged model for assessing and improving a test process, from Level 1 Initial to Level 5 Optimization.',
    ['TMMi v2.0'], true),
  entry('weakest', 'Weakest link',
    'TAMAR’s rule: a process area takes the lowest rating of its goals, and a maturity level takes the lowest rating of its process areas.',
    ['weakest goal', 'weakest process area']),
]);

/** The glossary entry with this id, or null. */
export function findTerm(id) {
  return GLOSSARY.find((g) => g.id === id) || null;
}

/** Number of words in a line (whitespace separated). */
export function wordCount(line) {
  return String(line).trim().split(/\s+/).filter(Boolean).length;
}

/** Mentor lines for a chapter, or an empty list. */
export function mentorLines(step) {
  return MENTOR_LINES[step] || [];
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// One alternation per spelling, longest first, so "process areas" beats "process area".
function spellings(entries) {
  return entries
    .flatMap((g) => [g.term, ...g.aliases].map((text) => ({ id: g.id, text, cs: g.caseSensitive })))
    .sort((a, b) => b.text.length - a.text.length);
}

function matchAt(text, at, list) {
  for (const s of list) {
    const piece = text.slice(at, at + s.text.length);
    const same = s.cs ? piece === s.text : piece.toLowerCase() === s.text.toLowerCase();
    if (!same) continue;
    const before = at > 0 ? text[at - 1] : ' ';
    const after = text[at + s.text.length] ?? ' ';
    if (/[\p{L}\p{N}-]/u.test(before) || /[\p{L}\p{N}]/u.test(after)) continue;
    return s;
  }
  return null;
}

/**
 * Splits text into plain and glossary segments: [{ text, id? }].
 * Each glossary id is marked once (its first occurrence) and never if it is
 * already in `used`. Returns { segments, used } with `used` as a new Set.
 */
export function splitByTerms(text, entries = GLOSSARY, used = new Set()) {
  const all = spellings(entries);
  const seen = new Set(used);
  const segments = [];
  let list = all.filter((s) => !seen.has(s.id));
  let plain = '';
  let i = 0;
  while (i < text.length) {
    const hit = matchAt(text, i, list);
    if (!hit) {
      plain += text[i];
      i += 1;
      continue;
    }
    if (plain) segments.push({ text: plain });
    plain = '';
    segments.push({ text: text.slice(i, i + hit.text.length), id: hit.id });
    seen.add(hit.id);
    list = list.filter((s) => s.id !== hit.id);
    i += hit.text.length;
  }
  if (plain) segments.push({ text: plain });
  return { segments, used: seen };
}
