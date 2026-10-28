// One-line chapter recaps shown between chapters ("You collected 9 items.
// You skipped the release email."). Pure functions of the game state.
import { INTERVIEWEES, LEVEL_OPTIONS, ACTIONS, EXPERT } from '../data/decisions.js';
import { ALL_GOALS } from '../data/tmmi.js';
import { actionTotals } from './assessment.js';

// Short names for the documents, used in "You skipped …" sentences.
export const SHORT_NAMES = Object.freeze({
  A: 'the draft test policy',
  B: 'the test plan',
  C: 'the test cases',
  D: 'the defect records',
  E: 'the metrics',
  F: 'the pipeline notes',
  G: 'the release email',
  J: 'the ownership notes',
});

const SCOPE_SHORT = { automation: 'test automation only', level2: 'all six Level 2 process areas', level23: 'Level 2 and Level 3' };
const TYPE_SHORT = { certificate: 'a promised rating', informal: 'an informal assessment', formal: 'a formal assessment' };
const OUTAGE_LINE = {
  observe: 'You watched the staging outage.',
  wait: 'You waited out the staging outage.',
  ignore: 'You kept reading during the staging outage.',
};
const MAX_NAMED = 2;

const nameOf = (id) => INTERVIEWEES.find((p) => p.id === id)?.name ?? id;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// "a", "a and b", "a, b and 2 more"
export function joinNames(names) {
  if (names.length <= 1) return names.join('');
  if (names.length <= MAX_NAMED) return `${names[0]} and ${names[1]}`;
  const rest = names.length - MAX_NAMED;
  return `${names.slice(0, MAX_NAMED).join(', ')} and ${rest} more`;
}

function planSummary(plan) {
  const matches = [plan.scope === EXPERT.scope, plan.type === EXPERT.type,
    [...plan.interviews].sort().join() === [...EXPERT.interviews].sort().join()].filter(Boolean).length;
  const scope = SCOPE_SHORT[plan.scope] ?? 'no scope';
  const type = TYPE_SHORT[plan.type] ?? 'no assessment type';
  const booked = plan.interviews.length ? `You booked ${joinNames(plan.interviews.map(nameOf))}.` : 'You booked nobody.';
  return `Scope: ${scope}. Type: ${type}. ${booked} ${matches} of 3 match the expert.`;
}

function collectSummary(collect) {
  const n = collect.collected.length;
  const skipped = EXPERT.collected.filter((id) => SHORT_NAMES[id] && !collect.collected.includes(id)).map((id) => SHORT_NAMES[id]);
  const skipLine = skipped.length ? `You skipped ${joinNames(skipped)}.` : 'You read every key document.';
  const outage = OUTAGE_LINE[collect.outage] ?? '';
  return [`You collected ${plural(n, 'item')}.`, skipLine, outage].filter(Boolean).join(' ');
}

function assessSummary(assess) {
  const rated = ALL_GOALS.filter((g) => assess.ratings[g.id]).length;
  const same = ALL_GOALS.filter((g) => assess.ratings[g.id] === g.expert).length;
  return `You rated ${rated} of ${ALL_GOALS.length} goals. ${same} match the expert exactly.`;
}

function concludeSummary(conclude) {
  if (!conclude.level) return 'You left the maturity level open.';
  if (conclude.level === EXPERT.level) return 'Your conclusion matches the expert: indicative Level 1, not a formal rating.';
  const yours = LEVEL_OPTIONS.find((o) => o.id === conclude.level);
  return `You concluded ${yours ? yours.title : 'something else'} The expert said: indicative Level 1, not a formal rating.`;
}

function reportSummary(report) {
  const keys = ['automation', 'attribution', 'kvkk'];
  const answered = keys.filter((k) => report[k]).length;
  const same = keys.filter((k) => report[k] && report[k] === EXPERT[k]).length;
  return `You answered ${answered} of 3 objections. ${same} match the expert.`;
}

function improveSummary(improve) {
  const t = actionTotals(improve.actions);
  const first = ACTIONS.find((a) => a.id === improve.first);
  const head = `You chose ${plural(improve.actions.length, 'action')} (${t.hours} h, TRY ${t.money.toLocaleString('en-US')}).`;
  return first ? `${head} First: ${first.title.toLowerCase()}.` : head;
}

/** The recap line for the chapter that just ended (step 0–6); '' when there is none. */
export function chapterSummary(state, step) {
  switch (step) {
    case 0: return 'Briefing done. You know the case: release 4.1 and a CTO who wants TMMi Level 2.';
    case 1: return planSummary(state.plan);
    case 2: return collectSummary(state.collect);
    case 3: return assessSummary(state.assess);
    case 4: return concludeSummary(state.conclude);
    case 5: return reportSummary(state.report);
    case 6: return improveSummary(state.improve);
    default: return '';
  }
}

