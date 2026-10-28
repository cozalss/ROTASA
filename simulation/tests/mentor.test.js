import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MENTOR, MENTOR_LINES, MAX_LINE_WORDS, GLOSSARY, findTerm, wordCount, mentorLines, splitByTerms,
} from '../js/game/mentor-data.js';

const REQUIRED_TERMS = [
  'TMMi', 'Maturity level', 'Process area', 'Goal', 'Practice', 'N/P/L/F', 'NR', 'Informal assessment',
  'Formal assessment', 'Evidence', 'Staged model', 'Weakest link', 'Non-attribution', 'IDEAL', 'KVKK',
  'Definition of Ready', 'Exit criteria',
];

test('every chapter 0–7 has 1–3 mentor lines', () => {
  for (let step = 0; step <= 7; step += 1) {
    const lines = mentorLines(step);
    assert.ok(lines.length >= 1 && lines.length <= 3, `chapter ${step} has ${lines.length} lines`);
  }
  assert.deepEqual(mentorLines(8), []);
  assert.equal(Object.keys(MENTOR_LINES).length, 8);
});

test(`mentor lines stay within ${MAX_LINE_WORDS} words`, () => {
  Object.entries(MENTOR_LINES).forEach(([step, lines]) => lines.forEach((line) => {
    assert.ok(wordCount(line) <= MAX_LINE_WORDS, `chapter ${step}: "${line}" has ${wordCount(line)} words`);
  }));
});

test('the mentor never claims to be a case character', () => {
  assert.equal(MENTOR.id, 'selin');
  assert.match(MENTOR.role, /lead assessor/i);
});

test('wordCount counts whitespace-separated words', () => {
  assert.equal(wordCount('  one two\tthree  '), 3);
  assert.equal(wordCount(''), 0);
});

test('the glossary covers every required term with a short definition', () => {
  const terms = GLOSSARY.map((g) => g.term);
  REQUIRED_TERMS.forEach((t) => assert.ok(terms.includes(t), `missing ${t}`));
  GLOSSARY.forEach((g) => {
    assert.ok(g.id && g.text, `${g.term} needs an id and text`);
    const sentences = g.text.split(/(?<=[.!?])\s+/).filter(Boolean).length;
    assert.ok(sentences <= 3, `${g.term} is too long (${sentences} sentences)`);
    assert.ok(g.text.length <= 220, `${g.term} is ${g.text.length} characters`);
  });
  assert.equal(new Set(GLOSSARY.map((g) => g.id)).size, GLOSSARY.length, 'ids are unique');
});

test('glossary definitions follow TMMi v2.0 and TAMAR', () => {
  assert.match(findTerm('informal').text, /never a formal maturity rating/);
  assert.match(findTerm('npl').text, /0–15%.*>15–50%.*>50–85%.*>85–100%/);
  assert.match(findTerm('nr').text, /NR process area makes the level NR/);
  assert.match(findTerm('ideal').text, /Initiating, Diagnosing, Establishing, Acting, Learning/);
  assert.match(findTerm('goal').text, /only required/);
  assert.equal(findTerm('nope'), null);
});

test('splitByTerms marks the first mention of each term only', () => {
  const { segments, used } = splitByTerms('TMMi has process areas. Each process area has goals. TMMi again.');
  const marked = segments.filter((s) => s.id);
  assert.deepEqual(marked.map((s) => [s.text, s.id]), [['TMMi', 'tmmi'], ['process areas', 'pa'], ['goals', 'goal']]);
  assert.equal(segments.map((s) => s.text).join(''), 'TMMi has process areas. Each process area has goals. TMMi again.');
  assert.ok(used.has('tmmi') && used.has('pa'));
});

test('splitByTerms respects word boundaries and case rules', () => {
  const informal = splitByTerms('An informal assessment is quick.').segments.filter((s) => s.id);
  assert.deepEqual(informal.map((s) => s.id), ['informal'], '"formal assessment" inside "informal" is not matched');
  assert.equal(splitByTerms('ideal conditions, tmmi').segments.filter((s) => s.id).length, 0, 'acronyms are case-sensitive');
  assert.equal(splitByTerms('NRA and goalkeeper').segments.filter((s) => s.id).length, 0);
  assert.deepEqual(splitByTerms('Rated NR.').segments.filter((s) => s.id).map((s) => s.id), ['nr']);
});

test('splitByTerms skips ids already used and handles plain text', () => {
  const { segments } = splitByTerms('TMMi and KVKK', GLOSSARY, new Set(['tmmi']));
  assert.deepEqual(segments.filter((s) => s.id).map((s) => s.id), ['kvkk']);
  assert.deepEqual(splitByTerms('nothing here').segments, [{ text: 'nothing here' }]);
  assert.deepEqual(splitByTerms('').segments, []);
});
