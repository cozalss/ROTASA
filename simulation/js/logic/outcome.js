// Step 7: six months later, and the player's path next to the expert's.
import { EXPERT, EXPERT_WHY, SCOPE_OPTIONS, TYPE_OPTIONS, INTERVIEWEES, OUTAGE_OPTIONS, LEVEL_OPTIONS,
  AUTOMATION_OPTIONS, ATTRIBUTION_OPTIONS, KVKK_OPTIONS, ACTIONS } from '../data/decisions.js';
import { findEvidence } from '../data/evidence.js';
import { ALL_GOALS, REASONED_GOALS } from '../data/tmmi.js';
import { compareRating, knownEvidenceIds, COMPARE_LABELS } from './assessment.js';

const has = (list, id) => list.includes(id);

// Each consequence names the decision that caused it (`from`). The helpers
// below each cover one thread of the six-month story.
export function consequences(state) {
  const out = [];
  const add = (from, tone, text) => out.push({ from, tone, text });
  scopeAndType(state.plan, add);
  planning(state.plan, state.improve.actions, add);
  objections(state, add);
  testData(state, add);
  actionsOutcome(state.improve, add);
  out.push({ from: 'Overall', tone: 'neutral', text: overallLine(state) });
  return out;
}

function scopeAndType(plan, add) {
  if (plan.scope === 'automation') add('Step 1 · Scope', 'bad', 'Your report covered automation only. Rotaşa bought a UI test tool; the gaps in planning, monitoring and governance stayed invisible, and production defects did not fall.');
  if (plan.scope === 'level23') add('Step 1 · Scope', 'warn', 'Half of your recommendations were Level 3 topics. The team started on peer reviews before it had an approved test plan, and Level 2 work slipped.');

  if (plan.type === 'certificate') add('Step 1 · Assessment type', 'bad', 'The CTO wrote "TMMi assessed" in the customer questionnaire. The customer asked for the accredited assessor and the formal report; there were none, and Rotaşa had to withdraw the answer.');
  if (plan.type === 'informal') add('Step 1 · Assessment type', 'good', 'The CTO answered the supplier questionnaire honestly: informal assessment done, improvement plan running, formal assessment planned. The customer accepted it.');
  if (plan.type === 'formal') add('Step 1 · Assessment type', 'warn', 'The CTO spent three months finding an accredited lead assessor. No improvement work started in that time.');
}

// Product owner involvement (Step 1 interview) and the planning actions (Step 6).
function planning(plan, acts, add) {
  const kerem = has(plan.interviews, 'kerem');
  const template = has(acts, 'template');
  if (has(acts, 'risk')) {
    add(kerem ? 'Step 1 · Interviews / Step 6' : 'Step 6 · Actions', 'good', 'At the first product risk workshop Kerem and Aylin ranked the 4.2 risks with Deniz. Windows crossing midnight and the CSV import (ENT-311) became named risks with their own test conditions, and Kerem held the 4.2 release until ROTA-1188 was fixed and TC-1206 passed on re-run.');
  } else if (kerem) {
    add('Step 1 · Interviews / Step 6', 'warn', template
      ? 'Kerem now understood what the plan is for and signed it through the new approval step, but without a funded risk workshop its risk section was still one line: "routing engine".'
      : 'Kerem now understood what the plan is for, but without a funded risk workshop the 4.2 plan again went out with only the QA lead’s signature.');
  } else {
    add('Step 1 · Interviews', 'warn', template
      ? 'No product owner was involved in planning. The 4.2 plan passed the new approval step, but its risks were still one line and the release date decided the release again.'
      : 'No product owner was involved. The 4.2 test plan went out with the QA lead’s signature only, and the release date decided the release again.');
  }
  if (template) add('Step 6 · Actions', 'good', 'The new plan template has an approval table that cannot be skipped: the 4.2 test plan v1.0 carries the signatures of both product owners and the CTO, not only the QA lead’s.');
}

function objections(state, add) {
  const { report } = state;
  if (report.automation === 'data') {
    add('Step 5 · Automation objection', 'good', has(state.improve.actions, 'flaky')
      ? 'Rotaşa’s own numbers changed the CTO’s plan: the 300 hours he wanted for new automation went into process work and the clean-up of flaky and disabled tests.'
      : 'Rotaşa’s own numbers changed the CTO’s plan: the 300 hours he wanted for new automation went into process work instead.');
  }
  if (report.automation === 'agree') add('Step 5 · Automation objection', 'bad', 'The quarter went into new UI automation. The pipeline got slower, flaky failures kept climbing and production defects did not fall.');
  if (report.automation === 'principle') add('Step 5 · Automation objection', 'warn', 'The CTO agreed in the meeting but kept funding automation first; without data, your argument did not stick.');

  if (report.attribution === 'refuse') add('Step 5 · Attribution', 'good', 'Nobody was singled out. In the six-month check, staff again spoke openly about what was not working.');
  else if (report.attribution) add('Step 5 · Attribution', 'bad', 'The CTO confronted the people he identified. In the six-month check, interviews produced careful, empty answers.');
}

// Funding masked data (Step 6) decides the outcome; the Step 5 wording decides
// whether the report explains why.
function testData(state, add) {
  const { collect, report, improve } = state;
  const knewData = has(collect.collected, 'F') || has(collect.collected, 'H5');
  if (has(improve.actions, 'data')) {
    if (!knewData) add('Step 6 · Actions', 'good', 'Staging now runs on masked data. You never saw the unmasked production copy yourself, so your report never explained the KVKK exposure this action closed.');
    else if (report.kvkk === 'keep') add('Step 5–6 · Test data', 'good', 'Staging now runs on masked data: real customer addresses and driver phone numbers no longer leave production, and the KVKK exposure named in your report is closed.');
    else add('Step 5–6 · Test data', 'good', 'Staging now runs on masked data, so the KVKK exposure is closed. But the finding never made it into your written report, so nothing records why the money was spent.');
    return;
  }
  if (!knewData) {
    add('Step 2 · Evidence', 'bad', 'You never saw the staging data. The monthly refresh kept copying real customer addresses and driver phone numbers into staging for all three teams, and the KVKK exposure stayed open with nobody owning it.');
    return;
  }
  add('Step 5–6 · Test data', 'bad', report.kvkk === 'keep'
    ? 'Your report named the problem, but the plan did not fund masked data. The unmasked production copy stayed in staging through six more monthly refreshes, and the KVKK exposure is still open.'
    : 'The unmasked production copy stayed in staging through six more monthly refreshes. Nobody wrote it down, and the KVKK exposure is still open.');
}

function actionsOutcome(improve, add) {
  const acts = improve.actions;
  if (has(acts, 'training') && has(acts, 'dor')) add('Step 6 · Actions', 'good', 'Every 4.2 story had acceptance criteria before testing started, and testers trained in boundary value analysis added cases for 22:00–02:00, exactly 12 hours and just over 12 hours. No time-window defect escaped in 4.2.');
  else add('Step 6 · Actions', 'bad', 'A window ending exactly at 00:00 slipped through in 4.2. The test cases still came from incomplete acceptance criteria.');

  if (has(acts, 'flaky')) add('Step 6 · Actions', 'good', 'Flaky tests were quarantined and the 14 disabled tests went to zero, each fixed or deleted with a reason. The pipeline no longer reruns a failure until it passes.');
  if (has(acts, 'defects')) add('Step 6 · Actions', 'good', 'With written severity definitions and a weekly defect review, no production defect was closed as "cannot reproduce" without device and network details; before, that was 7 of 19.');
  if (has(acts, 'envs')) add('Step 6 · Actions', 'warn', 'Per-pull-request environments ended the staging fights, but they took 120 hours and most of the cash, so planning and governance work waited.');
  if (has(acts, 'perf')) add('Step 6 · Actions', 'warn', 'The performance test setup works, but non-functional testing is a Level 3 topic; the Level 2 gaps it competed with are still open.');
  if (has(acts, 'pir')) add('Step 6 · Actions', 'good', 'The written 4.1 post-incident review filled the empty root-cause field of ROTA-1179 and turned "finish the remaining tests after the release" into tracked actions with owners and due dates.');

  if (has(acts, 'owner') && improve.first === 'owner') add('Step 6 · First action', 'good', 'Deniz became test process owner with time set aside for it. She tracked the plan every sprint, so nothing stalled.');
  else if (has(acts, 'owner')) add('Step 6 · First action', 'warn', 'An owner was appointed late in the quarter; the first actions started without anyone tracking them.');
  else add('Step 6 · Actions', 'bad', 'Nobody owned the improvement plan. After six months, half of the actions were still "in progress".');
}

function overallLine(state) {
  const core = ['owner', 'policy', 'strategy', 'risk', 'template', 'pir'];
  const hits = core.filter((id) => state.improve.actions.includes(id)).length;
  if (state.plan.scope === 'level2' && hits >= 5) return `In the six-month check, ${hits} of the 6 governance and planning actions were done. A follow-up informal assessment would find approved documents where it found drafts, but monitoring against targets and test performance indicators need a second quarter before Level 2 is in reach.`;
  if (hits >= 3) return 'In the six-month check, some Level 2 practices had started, but the weakest links remained. Level 2 within 12 months now looks unlikely.';
  return 'In the six-month check, the test process looked much as it did before 4.1. The 12-month Level 2 target was quietly dropped.';
}

const titleOf = (options, id) => options.find((o) => o.id === id)?.title ?? '—';
const nameList = (ids) => INTERVIEWEES.filter((p) => ids.includes(p.id)).map((p) => p.name).join(', ') || '—';
const evidenceList = (ids) => ids.map((id) => findEvidence(id)?.title ?? id).join('; ') || '—';
const actionList = (ids) => ACTIONS.filter((a) => ids.includes(a.id)).map((a) => a.title).join('; ') || '—';

function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

function setStatus(player, expert) {
  if (sameSet(player, expert)) return { label: 'Same', tone: 'good' };
  const overlap = player.filter((x) => expert.includes(x)).length;
  if (overlap === expert.length) return { label: 'Expert set covered', tone: 'good' };
  if (overlap >= Math.ceil(expert.length / 2)) return { label: 'Partly the same', tone: 'warn' };
  return { label: 'Different', tone: 'bad' };
}

const single = (player, expert) => (player === expert ? { label: 'Same', tone: 'good' } : { label: 'Different', tone: 'bad' });

// Rows for the Step 7 comparison table.
export function pathRows(state) {
  const { plan, collect, assess, conclude, report, improve } = state;
  const known = knownEvidenceIds(state);
  const rows = [
    { step: '1 · Scope', player: titleOf(SCOPE_OPTIONS, plan.scope), expert: titleOf(SCOPE_OPTIONS, EXPERT.scope), status: single(plan.scope, EXPERT.scope), why: EXPERT_WHY.scope },
    { step: '1 · Assessment type', player: titleOf(TYPE_OPTIONS, plan.type), expert: titleOf(TYPE_OPTIONS, EXPERT.type), status: single(plan.type, EXPERT.type), why: EXPERT_WHY.type },
    { step: '1 · Interviews', player: nameList(plan.interviews), expert: nameList(EXPERT.interviews), status: setStatus(plan.interviews, EXPERT.interviews), why: EXPERT_WHY.interviews },
    { step: '2 · Evidence', player: evidenceList(collect.collected), expert: evidenceList(EXPERT.collected), status: setStatus(collect.collected, EXPERT.collected), why: EXPERT_WHY.collected },
    { step: '2 · Staging outage', player: titleOf(OUTAGE_OPTIONS, collect.outage), expert: titleOf(OUTAGE_OPTIONS, EXPERT.outage), status: single(collect.outage, EXPERT.outage), why: EXPERT_WHY.outage },
  ];
  REASONED_GOALS.forEach((goalId) => {
    const goal = ALL_GOALS.find((g) => g.id === goalId);
    const cmp = compareRating(goalId, assess.ratings[goalId], known);
    rows.push({ step: `3 · ${goal.pa} ${goalId.split('-')[1]} ${goal.name}`, player: `${assess.ratings[goalId] ?? '—'} · ${assess.reasons[goalId] || '(no reasoning written)'}`, expert: `${goal.expert} · ${goal.why}`, status: { label: COMPARE_LABELS[cmp.status], tone: cmp.tone }, why: 'Written reasoning shows which evidence the rating rests on.' });
  });
  rows.push(
    { step: '4 · Maturity level', player: titleOf(LEVEL_OPTIONS, conclude.level), expert: titleOf(LEVEL_OPTIONS, EXPERT.level), status: single(conclude.level, EXPERT.level), why: EXPERT_WHY.level },
    { step: '5 · Automation objection', player: titleOf(AUTOMATION_OPTIONS, report.automation), expert: titleOf(AUTOMATION_OPTIONS, EXPERT.automation), status: single(report.automation, EXPERT.automation), why: EXPERT_WHY.automation },
    { step: '5 · "Who said it?"', player: titleOf(ATTRIBUTION_OPTIONS, report.attribution), expert: titleOf(ATTRIBUTION_OPTIONS, EXPERT.attribution), status: single(report.attribution, EXPERT.attribution), why: EXPERT_WHY.attribution },
    { step: '5 · Test data finding', player: titleOf(KVKK_OPTIONS, report.kvkk), expert: titleOf(KVKK_OPTIONS, EXPERT.kvkk), status: single(report.kvkk, EXPERT.kvkk), why: EXPERT_WHY.kvkk },
    { step: '6 · Actions', player: actionList(improve.actions), expert: actionList(EXPERT.actions), status: setStatus(improve.actions, EXPERT.actions), why: EXPERT_WHY.actions },
    { step: '6 · First action', player: titleOf(ACTIONS, improve.first), expert: titleOf(ACTIONS, EXPERT.first), status: single(improve.first, EXPERT.first), why: EXPERT_WHY.first },
  );
  return rows;
}

// Summary of all 21 goal ratings against the expert.
export function ratingSummary(state) {
  const known = knownEvidenceIds(state);
  return ALL_GOALS.map((g) => ({ goal: g, player: state.assess.ratings[g.id] ?? null, ...compareRating(g.id, state.assess.ratings[g.id], known) }));
}
