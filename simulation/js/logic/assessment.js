// Pure assessment rules. No DOM access, so everything here is unit tested.
import { EVIDENCE, OPENING_MEETING, OUTAGE_EVENT, findEvidence } from '../data/evidence.js';
import { INTERVIEWEES, OUTAGE_OPTIONS, ACTIONS, BUDGET } from '../data/decisions.js';
import { PROCESS_AREAS, RATING_ORDER, findGoal } from '../data/tmmi.js';

export const BASE_MINUTES = 340;
export const LEVEL3_SCOPE_PENALTY = 60;

// ---------- Step 2: time and evidence ----------

export function timeBudget(scope) {
  return scope === 'level23' ? BASE_MINUTES - LEVEL3_SCOPE_PENALTY : BASE_MINUTES;
}

export function outageCost(outage) {
  const option = OUTAGE_OPTIONS.find((o) => o.id === outage);
  return option ? option.cost : 0;
}

export function minutesSpent(collected, outage) {
  const evidenceMinutes = collected.reduce((sum, id) => sum + (findEvidence(id)?.cost ?? 0), 0);
  return evidenceMinutes + outageCost(outage);
}

export function minutesLeft(state) {
  return timeBudget(state.plan.scope) - minutesSpent(state.collect.collected, state.collect.outage);
}

export function bookedEvidenceIds(interviews) {
  return INTERVIEWEES.filter((p) => interviews.includes(p.id)).map((p) => p.evidence);
}

// Items the player may request: all documents and time sinks, plus booked interviews.
export function availableEvidence(interviews) {
  const booked = bookedEvidenceIds(interviews);
  return EVIDENCE.filter((e) => e.kind !== 'interview' || booked.includes(e.id));
}

export function canCollect(state, id) {
  const item = findEvidence(id);
  if (!item || state.collect.collected.includes(id)) return false;
  if (!availableEvidence(state.plan.interviews).some((e) => e.id === id)) return false;
  return item.cost <= minutesLeft(state);
}

// Everything the player knows: the opening meeting is always held.
export function knownEvidenceIds(state) {
  const ids = [OPENING_MEETING.id, ...state.collect.collected];
  return state.collect.outage === 'observe' ? [...ids, OUTAGE_EVENT.id] : ids;
}

export function findingsForGoal(goalId, knownIds) {
  return knownIds
    .map((id) => findEvidence(id))
    .filter((e) => e && e.findings[goalId])
    .map((e) => ({ evidence: e, text: e.findings[goalId] }));
}

export function hasKeyEvidence(goalId, knownIds) {
  const goal = findGoal(goalId);
  return goal ? goal.key.some((id) => knownIds.includes(id)) : false;
}

// ---------- Step 3–4: TAMAR rating rules ----------

// A process area is only as strong as its weakest goal (TAMAR §3.4.3.4).
// Any goal not rated ('?' or missing) makes the process area NR.
export function rateProcessArea(goalRatings) {
  if (goalRatings.length === 0 || goalRatings.some((r) => !Object.hasOwn(RATING_ORDER, r))) return 'NR';
  return goalRatings.reduce((low, r) => (RATING_ORDER[r] < RATING_ORDER[low] ? r : low));
}

export function processAreaRatings(ratings, scope) {
  return PROCESS_AREAS.map((pa) => ({
    id: pa.id,
    name: pa.name,
    rating: scope === 'automation' ? 'NR' : rateProcessArea(pa.goals.map((g) => ratings[g.id])),
  }));
}

// Maturity level: the lowest process area rating; achieved when every process
// area is L or F; any NR makes the level NR (TAMAR §3.4.3.5, §3.4.2.7).
export function rateMaturityLevel(paRatings) {
  const values = paRatings.map((p) => p.rating);
  if (values.includes('NR')) return { rating: 'NR', achieved: false };
  const rating = rateProcessArea(values);
  return { rating, achieved: rating === 'L' || rating === 'F' };
}

export function expertRatings() {
  return Object.fromEntries(PROCESS_AREAS.flatMap((pa) => pa.goals.map((g) => [g.id, g.expert])));
}

// Compares one goal rating with the expert's.
export function compareRating(goalId, playerRating, knownIds) {
  const goal = findGoal(goalId);
  const hadKey = hasKeyEvidence(goalId, knownIds);
  if (!playerRating) return { status: 'missing', tone: 'bad' };
  if (playerRating === '?') {
    return hadKey ? { status: 'avoided', tone: 'warn' } : { status: 'honest-gap', tone: 'warn' };
  }
  if (!hadKey) return { status: 'unsupported', tone: 'bad' };
  if (playerRating === goal.expert) return { status: 'match', tone: 'good' };
  if (goal.accept.includes(playerRating)) return { status: 'defensible', tone: 'good' };
  const gap = Math.abs(RATING_ORDER[playerRating] - RATING_ORDER[goal.expert]);
  return gap >= 2 ? { status: 'contradicts', tone: 'bad' } : { status: 'differs', tone: 'warn' };
}

export const COMPARE_LABELS = {
  match: 'Same as expert',
  defensible: 'Defensible',
  differs: 'One step off',
  contradicts: 'Rating goes against your evidence',
  unsupported: 'Rated without the key evidence',
  'honest-gap': 'Honest gap: key evidence not collected',
  avoided: 'Not rated although evidence was there',
  missing: 'Not rated',
};

// Case-folds English and Turkish alike: İ, I and ı all become i.
const fold = (s) => s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');

// Returns the expert cues a written justification mentions. A cue is a word
// or a list of alternatives (for example its English and Turkish forms).
export function reasoningCues(text, cues) {
  const folded = fold(text || '');
  return cues.filter((c) => [c].flat().some((alt) => folded.includes(fold(alt))));
}

// ---------- Step 6: budget ----------

export function actionTotals(actionIds) {
  return ACTIONS.filter((a) => actionIds.includes(a.id))
    .reduce((t, a) => ({ hours: t.hours + a.hours, money: t.money + a.money }), { hours: 0, money: 0 });
}

export function fitsBudget(actionIds) {
  const t = actionTotals(actionIds);
  return t.hours <= BUDGET.hours && t.money <= BUDGET.money;
}

export function canAddAction(actionIds, id) {
  return actionIds.includes(id) || fitsBudget([...actionIds, id]);
}
