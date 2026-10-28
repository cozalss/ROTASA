// Step 5 building blocks: the findings brief, the CTO's opening line (which
// depends on the Step 1 assessment type) and the Document E metric tiles.
import { h, chip } from '../dom.js';
import { PROCESS_AREAS } from '../../data/tmmi.js';
import { findEvidence } from '../../data/evidence.js';
import { processAreaRatings } from '../../logic/assessment.js';
import { ratingMark, ratingTone, speech } from './conclude-kit.js';

const RATED = ['N', 'P', 'L', 'F'];

function goalLine(goal, rating) {
  return h('li', {},
    h('span', { class: `c-dot tone-${ratingTone(rating)}`, 'aria-hidden': 'true' }, ratingMark(rating)),
    h('span', {}, goal.name, h('span', { class: 'sr-only' }, `, rated ${ratingMark(rating)}`)));
}

// Strengths (L/F goals) and weakest goals for one process area.
export function paFindings(pa, paRating, ratings) {
  const rated = pa.goals.map((g) => ({ goal: g, rating: ratings[g.id] ?? null }));
  const weakest = paRating === 'NR'
    ? rated.filter((x) => !RATED.includes(x.rating))
    : rated.filter((x) => x.rating === paRating);
  const strengths = rated.filter((x) => x.rating === 'L' || x.rating === 'F');
  return { weakest, strengths };
}

export function findingsBrief(state) {
  const { ratings } = state.assess;
  const pas = processAreaRatings(ratings, state.plan.scope);
  const outOfScope = state.plan.scope === 'automation';
  const cards = PROCESS_AREAS.map((pa, i) => {
    const rating = pas[i].rating;
    if (outOfScope) {
      return h('li', { class: 'c-brief-card tone-neutral' },
        h('header', {}, h('span', { class: 'mono' }, pa.id), h('b', {}, pa.name), chip('NR', 'neutral')),
        h('p', { class: 'muted' }, 'Outside your scope. No finding can be reported.'));
    }
    const { weakest, strengths } = paFindings(pa, rating, ratings);
    return h('li', { class: `c-brief-card tone-${ratingTone(rating)}` },
      h('header', {}, h('span', { class: 'mono' }, pa.id), h('b', {}, pa.name), chip(`${rating} · indicative · your working note`, 'neutral')),
      h('p', { class: 'eyebrow' }, rating === 'NR' ? 'Not rated: missing goals' : 'Weakest goals'),
      h('ul', { class: 'c-brief-list' }, weakest.map((x) => goalLine(x.goal, x.rating))),
      h('p', { class: 'eyebrow' }, 'Strengths'),
      strengths.length
        ? h('ul', { class: 'c-brief-list' }, strengths.map((x) => goalLine(x.goal, x.rating)))
        : h('p', { class: 'muted c-brief-none' }, 'No goal rated Largely or Fully.'));
  });
  return h('ol', { class: 'c-brief', 'aria-label': 'Findings by process area, from your ratings' }, cards);
}

const OPENERS = {
  certificate: {
    line: 'So, which level do we get on the certificate you promised?',
    tone: 'bad',
    head: 'Your Step 1 promise backfires.',
    text: 'You agreed to give him a level he could show customers. An informal assessment “will not result in a formal maturity rating” (TAMAR §1.3.1.1.2), and this is an informal assessment. Now you must take the promise back in front of the sponsor, and every finding sounds like an excuse for a missing certificate. Say it plainly: no certificate today; an indicative view and a plan.',
  },
  informal: {
    line: 'You said findings, not a rating. Fine. Show me where we stand.',
    tone: 'good',
    head: 'Your Step 1 agreement pays off.',
    text: 'You set expectations on day one, so the meeting starts with the findings, not with a certificate that does not exist.',
  },
  formal: {
    line: 'You insisted it had to be formal. So is this the formal result?',
    tone: 'warn',
    head: 'Your Step 1 position comes back.',
    text: 'This visit was planned as an informal assessment, so it cannot give a formal result. The CTO now expects a second, paid assessment before anything moves.',
  },
};

export function opener(type) {
  const o = OPENERS[type];
  if (!o) return null;
  return h('div', { class: 'c-opener' },
    speech(o.line),
    h('div', { class: `verdict ${o.tone}` }, h('strong', {}, o.head), h('p', {}, o.text)));
}

// ---------- Document E: the QA lead's metrics spreadsheet ----------
const METRICS = [
  { col: 'API tests', label: 'Automated API tests', tone: 'expert' },
  { col: 'Prod defects', label: 'Production defects / sprint', tone: 'bad' },
  { col: 'Flaky', label: 'Flaky failures', tone: 'bad' },
  { col: 'Pipeline min', label: 'Pipeline minutes', tone: 'warn' },
];

function metricSeries() {
  const table = findEvidence('E')?.body.find((b) => b.table)?.table;
  if (!table) return [];
  const sprints = table.rows.map((r) => r[0]);
  return METRICS.map((m) => {
    const idx = table.head.indexOf(m.col);
    const values = table.rows.map((r) => Number(r[idx]));
    return { ...m, values, sprints };
  }).filter((m) => m.values.every((v) => Number.isFinite(v)));
}

function metricTile(m) {
  const max = Math.max(...m.values);
  const first = m.values[0];
  const last = m.values[m.values.length - 1];
  const summary = `${m.label}: ${first} in sprint ${m.sprints[0]}, ${last} in sprint ${m.sprints[m.sprints.length - 1]}.`;
  return h('li', { class: `c-metric tone-${m.tone}` },
    h('p', { class: 'c-metric-label' }, m.label),
    h('p', { class: 'c-metric-num tabular', 'aria-label': summary }, String(first), h('span', { 'aria-hidden': 'true' }, ' → '), h('b', {}, String(last))),
    h('div', { class: 'c-spark', 'aria-hidden': 'true' },
      m.values.map((v, i) => h('span', {
        class: 'c-spark-bar',
        style: { height: `${Math.max(8, Math.round((v / max) * 100))}%` },
        title: `Sprint ${m.sprints[i]}: ${v}`,
      }))));
}

export function metricTiles(collected = true) {
  const series = metricSeries();
  if (series.length === 0) return null;
  return h('figure', { class: 'c-metrics' },
    h('figcaption', { class: 'eyebrow' }, `Document E · sprints ${series[0].sprints[0]}–${series[0].sprints.at(-1)}${collected ? '' : ' · you did not collect it'}`),
    h('ul', { class: 'c-metric-list' }, series.map(metricTile)));
}

export const AUTOMATION_EXPERT_REPLY = 'Your QA lead’s metrics spreadsheet answers this. From Sprint 32 to 37 automated API tests grew from 210 to 262, but production defects never fell: 3–4 every sprint, then 8 in Sprint 37. Flaky failures went from 6 to 15, the pipeline from 22 to 33 minutes, and the share of planned tests actually run fell from 87% to 63% by Sprint 35. Fourteen tests are disabled (F). Level 2 is about managed processes: an approved policy and strategy, risk-based plans with commitment, monitoring against targets, a controlled environment and an owner. Automation pays off once those exist, so most of the 400 hours should go there.';

// Each cue is a word or a list of alternatives (English and Turkish).
export const AUTOMATION_CUES = ['210', '262', ['production', 'canlı', 'üretim'], ['flaky', 'kararsız', 'güvenilmez'], ['pipeline', 'hattı'],
  ['managed', 'yönetil'], ['process', 'süreç'], ['policy', 'politika'], 'plan', 'risk', ['monitor', 'izle', 'takip']];
