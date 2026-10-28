// Achievements: pure rules over the game state. No DOM access.
// Each one rewards a piece of good assessment practice from the case,
// TMMi v2.0 or TAMAR R1.3, never luck or speed.
import { EXPERT, BUDGET } from '../data/decisions.js';
import { EVIDENCE } from '../data/evidence.js';
import { ALL_GOALS } from '../data/tmmi.js';
import {
  compareRating, knownEvidenceIds, actionTotals, fitsBudget, processAreaRatings,
} from './assessment.js';

export const MIN_RESERVE_HOURS = 30;
export const MIN_ITEMS_FOR_FOCUS = 5;

const DOCUMENT_IDS = EVIDENCE.filter((e) => e.kind === 'document').map((e) => e.id);
const TRAP_IDS = EVIDENCE.filter((e) => e.kind === 'trap').map((e) => e.id);
const WEAK_PA_RATINGS = ['N', 'P'];
const LIST_DECISIONS = ['interviews', 'collected', 'actions'];
const SLICE_OF = {
  scope: 'plan', type: 'plan', interviews: 'plan',
  collected: 'collect', outage: 'collect',
  level: 'conclude',
  automation: 'report', attribution: 'report', kvkk: 'report',
  actions: 'improve', first: 'improve',
};

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const has = (list, id) => list.includes(id);

// ---------- rules (state -> boolean) ----------

function honestGap(state) {
  const known = knownEvidenceIds(state);
  return ALL_GOALS.some((g) => state.assess.ratings[g.id] === '?'
    && compareRating(g.id, '?', known).status === 'honest-gap');
}

// The conclusion follows the player's own ratings: some process area is
// N or P, so Level 2 is out of reach, and the result is labelled indicative.
function weakestLink(state) {
  if (state.conclude.level !== 'level1-indicative') return false;
  const pas = processAreaRatings(state.assess.ratings, state.plan.scope);
  return pas.some((pa) => WEAK_PA_RATINGS.includes(pa.rating));
}

function budgetDiscipline({ improve }) {
  if (!improve.actions.length || !fitsBudget(improve.actions)) return false;
  return BUDGET.hours - actionTotals(improve.actions).hours >= MIN_RESERVE_HOURS;
}

function timeWellSpent({ collect }) {
  return collect.collected.length >= MIN_ITEMS_FOR_FOCUS && !collect.collected.some((id) => has(TRAP_IDS, id));
}

function expertsShadow(state) {
  return Object.entries(SLICE_OF).every(([key, slice]) => {
    const mine = state[slice][key];
    return LIST_DECISIONS.includes(key) ? sameSet(mine, EXPERT[key]) : mine === EXPERT[key];
  });
}

const RULES = {
  'no-false-certificates': (s) => s.plan.type === 'informal',
  'eyes-on-the-outage': (s) => s.collect.outage === 'observe',
  'evidence-over-word': (s) => s.assess.ratings['TPL-G5'] === 'N' && has(s.collect.collected, 'B'),
  'honest-gap': honestGap,
  'weakest-link': weakestLink,
  'numbers-talk': (s) => s.report.automation === 'data' && has(s.collect.collected, 'E'),
  'protected-sources': (s) => s.report.attribution === 'refuse',
  'budget-discipline': budgetDiscipline,
  'owner-first': (s) => s.improve.first === 'owner' && has(s.improve.actions, 'owner'),
  'time-well-spent': timeWellSpent,
  'full-house': (s) => DOCUMENT_IDS.every((id) => has(s.collect.collected, id)),
  'experts-shadow': expertsShadow,
};

// ---------- the list ----------

const entry = (id, icon, title, description, hint) => Object.freeze({ id, icon, title, description, hint });

export const ACHIEVEMENTS = Object.freeze([
  entry('no-false-certificates', '◇', 'No false certificates',
    'You agreed an informal assessment on day one: findings and a plan, not a rating anyone could quote as a certificate.',
    'Be clear with the sponsor about what kind of result an informal assessment gives.'),
  entry('eyes-on-the-outage', '◉', 'Eyes on the outage',
    'You watched the staging recovery yourself. Practice seen first-hand is evidence nobody can prepare for you.',
    'When something breaks during the visit, it may be the process you came to see.'),
  entry('evidence-over-word', '▤', 'Evidence over word',
    'You rated commitment to the test plan (TPL-G5) Not achieved with the plan itself in your bag: one signature, no stakeholders.',
    'Read the test plan before you believe anyone about who agreed to it.'),
  entry('honest-gap', '?', 'Honest gap',
    'You marked a goal "?" because its key evidence was never collected, instead of guessing a rating.',
    'Sometimes the most accurate rating is admitting what you did not see.'),
  entry('weakest-link', '⛓', 'Weakest link',
    'Your indicative conclusion follows your own ratings: a process area is only as strong as its weakest goal, and a level only as strong as its weakest process area.',
    'Let your own goal ratings decide the level, and say what kind of result it is.'),
  entry('numbers-talk', '▥', 'Numbers talk',
    'You answered the CTO’s automation plan with Rotaşa’s own metrics: more tests, slower pipeline, no fewer escapes.',
    'An objection is easier to answer with the client’s own spreadsheet.'),
  entry('protected-sources', '⚿', 'Protected sources',
    'You refused to say who said what. Findings are non-attributable, so people keep talking openly.',
    'The sponsor owns the findings, not the names behind them.'),
  entry('budget-discipline', '◔', 'Budget discipline',
    `Your plan fits the budget and keeps at least ${MIN_RESERVE_HOURS} hours in reserve for the surprises a real quarter brings.`,
    'Spending every last hour is not the same as planning well.'),
  entry('owner-first', '♚', 'Owner first',
    'You started with a test process owner. Without one, every other action competes with sprint work and stalls.',
    'Ask who will drive the improvement before you decide what to improve.'),
  entry('time-well-spent', '◷', 'Time well spent',
    `You collected at least ${MIN_ITEMS_FOR_FOCUS} items and none of the time sinks: re-testing the product is not assessing the process.`,
    'Not every open door on site leads to evidence about the test process.'),
  entry('full-house', '▦', 'Full house',
    'All eight case documents made it into your bag before the day ended.',
    'Plan your day so every document fits in the time window.'),
  entry('experts-shadow', '◆', 'Expert’s shadow',
    'Every decision you made matches the expert’s, from the scope on day one to the first action of the plan.',
    'Walk the whole route the way the expert would.'),
]);

/** Returns the achievement with this id, or null. */
export function findAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}

/** Ids of every achievement the state unlocks, in list order. */
export function evaluateAchievements(state) {
  return ACHIEVEMENTS.filter((a) => RULES[a.id](state)).map((a) => a.id);
}
