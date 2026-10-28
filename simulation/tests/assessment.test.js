import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_MINUTES, LEVEL3_SCOPE_PENALTY, timeBudget, outageCost, minutesSpent, minutesLeft,
  bookedEvidenceIds, availableEvidence, canCollect, knownEvidenceIds, findingsForGoal, hasKeyEvidence,
  rateProcessArea, processAreaRatings, rateMaturityLevel, expertRatings, compareRating, COMPARE_LABELS,
  reasoningCues, actionTotals, fitsBudget, canAddAction,
} from '../js/logic/assessment.js';
import { EXPERT, BUDGET } from '../js/data/decisions.js';
import { ALL_GOALS, REASON_PROMPTS } from '../js/data/tmmi.js';
import { expertState, planState } from './helpers.js';

const pas = (...ratings) => ratings.map((rating, i) => ({ id: `PA${i + 1}`, rating }));

// ---------- time ----------

describe('timeBudget', () => {
  it('gives 340 minutes for a Level 2 scope', () => {
    assert.equal(timeBudget('level2'), 340);
    assert.equal(BASE_MINUTES, 340);
  });

  it('gives 280 minutes when Level 3 is added to the scope', () => {
    assert.equal(timeBudget('level23'), 280);
    assert.equal(BASE_MINUTES - LEVEL3_SCOPE_PENALTY, 280);
  });

  it('gives the base budget for automation scope and for no scope yet', () => {
    assert.equal(timeBudget('automation'), 340);
    assert.equal(timeBudget(null), 340);
  });
});

describe('outageCost', () => {
  it('charges 20 to observe, 50 to wait and 0 to ignore', () => {
    assert.equal(outageCost('observe'), 20);
    assert.equal(outageCost('wait'), 50);
    assert.equal(outageCost('ignore'), 0);
  });

  it('charges nothing before the outage decision is made', () => {
    assert.equal(outageCost(null), 0);
  });
});

describe('minutesSpent', () => {
  it('is 0 for nothing collected and no outage decision', () => {
    assert.equal(minutesSpent([], null), 0);
  });

  it('sums the cost of collected evidence', () => {
    assert.equal(minutesSpent(['A', 'B'], null), 50);
  });

  it('adds the outage cost', () => {
    assert.equal(minutesSpent(['A', 'B'], 'wait'), 100);
    assert.equal(minutesSpent(['A'], 'observe'), 40);
  });

  it('counts unknown ids as zero minutes', () => {
    assert.equal(minutesSpent(['A', 'NOPE'], null), 20);
  });
});

describe('minutesLeft', () => {
  it('is the budget minus evidence and outage minutes', () => {
    const s = planState({ scope: 'level2', collected: ['A', 'C'], outage: 'observe' });
    assert.equal(minutesLeft(s), 340 - 20 - 40 - 20);
  });

  it('uses the smaller Level 2+3 budget', () => {
    const s = planState({ scope: 'level23', collected: ['A'] });
    assert.equal(minutesLeft(s), 260);
  });

  it('leaves 15 minutes on the expert path (8 documents 245 + two 30-min interviews + observe 20 = 325)', () => {
    assert.equal(minutesLeft(expertState()), 15);
  });
});

// ---------- evidence availability ----------

describe('bookedEvidenceIds', () => {
  it('maps booked interviewees to their interview evidence ids', () => {
    assert.deepEqual(bookedEvidenceIds(['deniz', 'kerem']), ['H2', 'H4']);
  });

  it('is empty when nobody is booked', () => {
    assert.deepEqual(bookedEvidenceIds([]), []);
  });
});

describe('availableEvidence', () => {
  it('offers documents and time sinks but no interviews when nobody is booked', () => {
    const ids = availableEvidence([]).map((e) => e.id);
    assert.ok(ids.includes('A'));
    assert.ok(ids.includes('T1'));
    assert.ok(!ids.some((id) => /^H\d$/.test(id)));
  });

  it('offers exactly the booked interviews', () => {
    const interviews = availableEvidence(['burak', 'onur']).filter((e) => e.kind === 'interview').map((e) => e.id);
    assert.deepEqual(interviews.sort(), ['H5', 'H6']);
  });

  it('never offers the opening meeting or the outage observation', () => {
    const ids = availableEvidence(['deniz', 'kerem']).map((e) => e.id);
    assert.ok(!ids.includes('H1'));
    assert.ok(!ids.includes('OBS'));
  });
});

describe('canCollect', () => {
  it('allows an available, uncollected item that fits the time', () => {
    assert.equal(canCollect(planState(), 'A'), true);
  });

  it('refuses an item already collected', () => {
    assert.equal(canCollect(planState({ collected: ['A'] }), 'A'), false);
  });

  it('refuses an interview that was not booked', () => {
    assert.equal(canCollect(planState({ interviews: ['deniz'] }), 'H4'), false);
  });

  it('allows a booked interview', () => {
    assert.equal(canCollect(planState({ interviews: ['kerem'] }), 'H4'), true);
  });

  it('refuses unknown ids, the opening meeting and the outage observation', () => {
    const s = planState({ interviews: ['deniz'] });
    assert.equal(canCollect(s, 'ZZ'), false);
    assert.equal(canCollect(s, 'H1'), false);
    assert.equal(canCollect(s, 'OBS'), false);
  });

  it('allows an item whose cost equals the minutes left', () => {
    // 340 - (A20 B30 C40 D35 E35 F40 J30 = 230) - observe 20 = 90 = T2 cost
    const s = planState({ collected: ['A', 'B', 'C', 'D', 'E', 'F', 'J'], outage: 'observe' });
    assert.equal(minutesLeft(s), 90);
    assert.equal(canCollect(s, 'T2'), true);
  });

  it('refuses an item that costs more than the minutes left', () => {
    const s = planState({ collected: ['A', 'B', 'C', 'D', 'E', 'F', 'J'], outage: 'wait' });
    assert.equal(minutesLeft(s), 60);
    assert.equal(canCollect(s, 'T2'), false);
    assert.equal(canCollect(s, 'T1'), true);
  });

  it('refuses a 30-minute item when the expert path has only 15 minutes left', () => {
    assert.equal(canCollect(expertState(), 'T3'), false);
  });
});

describe('knownEvidenceIds', () => {
  it('always includes the opening meeting H1', () => {
    assert.deepEqual(knownEvidenceIds(planState()), ['H1']);
  });

  it('includes collected items after H1', () => {
    assert.deepEqual(knownEvidenceIds(planState({ collected: ['A', 'G'] })), ['H1', 'A', 'G']);
  });

  it('includes OBS only when the outage was observed', () => {
    assert.ok(knownEvidenceIds(planState({ outage: 'observe' })).includes('OBS'));
    for (const outage of ['wait', 'ignore', null]) {
      assert.ok(!knownEvidenceIds(planState({ outage })).includes('OBS'), String(outage));
    }
  });
});

describe('findingsForGoal', () => {
  it('returns the finding text of each known item that speaks to the goal', () => {
    const found = findingsForGoal('TPS-G1', ['H1', 'A', 'G']);
    assert.deepEqual(found.map((f) => f.evidence.id), ['H1', 'A', 'G']);
    assert.ok(found.every((f) => typeof f.text === 'string' && f.text.length > 0));
  });

  it('skips known items with no finding for the goal', () => {
    assert.deepEqual(findingsForGoal('TEV-G1', ['H1', 'A', 'B']), []);
  });

  it('ignores unknown evidence ids', () => {
    assert.deepEqual(findingsForGoal('TPS-G1', ['NOPE']), []);
  });

  it('returns nothing for an unknown goal', () => {
    assert.deepEqual(findingsForGoal('XX-G9', ['A', 'B', 'C']), []);
  });

  it('includes the outage observation for TEV-G3', () => {
    assert.deepEqual(findingsForGoal('TEV-G3', ['OBS']).map((f) => f.evidence.id), ['OBS']);
  });
});

describe('hasKeyEvidence', () => {
  it('is true when any key item is known', () => {
    assert.equal(hasKeyEvidence('TPS-G1', ['G']), true);
  });

  it('is false when no key item is known', () => {
    assert.equal(hasKeyEvidence('TPS-G1', ['B', 'C']), false);
  });

  it('is true for IH-G1 from the opening meeting alone', () => {
    assert.equal(hasKeyEvidence('IH-G1', ['H1']), true);
  });

  it('is false for an unknown goal', () => {
    assert.equal(hasKeyEvidence('XX-G9', ['A']), false);
  });
});

// ---------- TAMAR rating rules ----------

describe('rateProcessArea (TAMAR §3.4.3.4, Annex 2 §2.1)', () => {
  it('Annex 2 Ex. 1: L L F F F -> L', () => {
    assert.equal(rateProcessArea(['L', 'L', 'F', 'F', 'F']), 'L');
  });

  it('Annex 2 Ex. 2: L L F P L -> P', () => {
    assert.equal(rateProcessArea(['L', 'L', 'F', 'P', 'L']), 'P');
  });

  it('Annex 2 Ex. 3: one goal not rated makes the PA NR', () => {
    assert.equal(rateProcessArea(['L', 'F', 'F', 'P', '?']), 'NR');
  });

  it('is F only when every goal is F', () => {
    assert.equal(rateProcessArea(['F', 'F', 'F']), 'F');
  });

  it('is N when any goal is N', () => {
    assert.equal(rateProcessArea(['F', 'N', 'L']), 'N');
  });

  it('treats a missing goal rating as NR', () => {
    assert.equal(rateProcessArea(['P', undefined, 'L']), 'NR');
    assert.equal(rateProcessArea(['P', null]), 'NR');
  });

  it('is NR for an empty goal list', () => {
    assert.equal(rateProcessArea([]), 'NR');
  });

  it('rates a single goal as itself', () => {
    assert.equal(rateProcessArea(['P']), 'P');
  });
});

describe('processAreaRatings', () => {
  it('rates the six Level 2 process areas from goal ratings', () => {
    const rows = processAreaRatings(expertRatings(), 'level2');
    assert.deepEqual(rows.map((r) => r.id), ['TPS', 'TPL', 'TMC', 'TDE', 'TEV', 'IH']);
    assert.ok(rows.every((r) => typeof r.name === 'string' && r.name.length > 0));
  });

  it('gives the expert ratings TPS N, TPL N, TMC N, TDE P, TEV N, IH P', () => {
    const byId = Object.fromEntries(processAreaRatings(expertRatings(), 'level2').map((r) => [r.id, r.rating]));
    assert.deepEqual(byId, { TPS: 'N', TPL: 'N', TMC: 'N', TDE: 'P', TEV: 'N', IH: 'P' });
  });

  it('rates every process area NR under the automation-only scope', () => {
    const rows = processAreaRatings(expertRatings(), 'automation');
    assert.ok(rows.every((r) => r.rating === 'NR'));
  });

  it('rates a process area NR when one of its goals is not rated', () => {
    const ratings = { ...expertRatings(), 'TDE-G2': '?' };
    const byId = Object.fromEntries(processAreaRatings(ratings, 'level2').map((r) => [r.id, r.rating]));
    assert.equal(byId.TDE, 'NR');
    assert.equal(byId.IH, 'P', 'other PAs unaffected');
  });

  it('rates every process area NR when nothing is rated', () => {
    assert.ok(processAreaRatings({}, 'level2').every((r) => r.rating === 'NR'));
  });
});

describe('rateMaturityLevel (TAMAR §3.4.3.5, Annex 2 §2.2)', () => {
  it('Annex 2 Ex. 1: F L L F F L -> L, Level 2 achieved', () => {
    assert.deepEqual(rateMaturityLevel(pas('F', 'L', 'L', 'F', 'F', 'L')), { rating: 'L', achieved: true });
  });

  it('Annex 2 Ex. 2: F L L P F F -> P, Level 2 not achieved', () => {
    assert.deepEqual(rateMaturityLevel(pas('F', 'L', 'L', 'P', 'F', 'F')), { rating: 'P', achieved: false });
  });

  it('all F -> F, achieved', () => {
    assert.deepEqual(rateMaturityLevel(pas('F', 'F', 'F', 'F', 'F', 'F')), { rating: 'F', achieved: true });
  });

  it('any N -> N, not achieved', () => {
    assert.deepEqual(rateMaturityLevel(pas('F', 'F', 'N', 'F', 'F', 'F')), { rating: 'N', achieved: false });
  });

  it('any NR process area makes the level NR (§3.4.2.7.3)', () => {
    assert.deepEqual(rateMaturityLevel(pas('F', 'F', 'NR', 'F', 'F', 'F')), { rating: 'NR', achieved: false });
  });

  it('NR wins over N', () => {
    assert.deepEqual(rateMaturityLevel(pas('N', 'NR')), { rating: 'NR', achieved: false });
  });

  it('is NR for an empty process area list', () => {
    assert.deepEqual(rateMaturityLevel([]), { rating: 'NR', achieved: false });
  });

  it('the expert ratings give ML2 = N, not achieved', () => {
    assert.deepEqual(rateMaturityLevel(processAreaRatings(expertRatings(), 'level2')), { rating: 'N', achieved: false });
  });

  it('the automation-only scope gives ML2 = NR', () => {
    assert.equal(rateMaturityLevel(processAreaRatings(expertRatings(), 'automation')).rating, 'NR');
  });

  // TAMAR Annex 2 Ex. 3: an NA process area is excluded and does not affect the
  // level. The simulation never produces NA, and rateMaturityLevel treats it
  // like NR. Left as a todo so the gap stays visible without changing behaviour.
  it('Annex 2 Ex. 3: an NA process area is excluded from the level rating', { todo: 'NA is not modelled; currently rated NR' }, () => {
    assert.deepEqual(rateMaturityLevel(pas('F', 'F', 'L', 'F', 'NA', 'F')), { rating: 'L', achieved: true });
  });
});

describe('expertRatings', () => {
  it('has one rating for each of the 21 goals', () => {
    const r = expertRatings();
    assert.equal(Object.keys(r).length, 21);
    assert.deepEqual(Object.keys(r).sort(), ALL_GOALS.map((g) => g.id).sort());
  });

  it('uses only N, P, L or F', () => {
    assert.ok(Object.values(expertRatings()).every((v) => ['N', 'P', 'L', 'F'].includes(v)));
  });
});

// ---------- comparing with the expert ----------

describe('compareRating', () => {
  const withKey = ['H1', 'A', 'G']; // key evidence for TPS-G1 and TPS-G3 (A)
  const withoutKey = ['H1', 'C'];

  it('match: same rating as the expert with key evidence', () => {
    assert.deepEqual(compareRating('TPS-G1', 'P', withKey), { status: 'match', tone: 'good' });
  });

  it('defensible: a different rating the expert panel accepts', () => {
    assert.deepEqual(compareRating('TPS-G1', 'N', withKey), { status: 'defensible', tone: 'good' });
  });

  it('differs: one step from the expert and not in accept', () => {
    assert.deepEqual(compareRating('TPS-G1', 'L', withKey), { status: 'differs', tone: 'warn' });
  });

  it('contradicts: two or more steps from the expert', () => {
    assert.deepEqual(compareRating('TPS-G3', 'L', withKey), { status: 'contradicts', tone: 'bad' });
    assert.deepEqual(compareRating('TPS-G3', 'F', withKey), { status: 'contradicts', tone: 'bad' });
  });

  it('unsupported: a rating given without any key evidence, even if it matches', () => {
    assert.deepEqual(compareRating('TPS-G1', 'P', withoutKey), { status: 'unsupported', tone: 'bad' });
  });

  it('honest-gap: "?" when the key evidence was not collected', () => {
    assert.deepEqual(compareRating('TPS-G1', '?', withoutKey), { status: 'honest-gap', tone: 'warn' });
  });

  it('avoided: "?" although the key evidence was known', () => {
    assert.deepEqual(compareRating('TPS-G1', '?', withKey), { status: 'avoided', tone: 'warn' });
  });

  it('missing: no rating at all', () => {
    assert.deepEqual(compareRating('TPS-G1', undefined, withKey), { status: 'missing', tone: 'bad' });
    assert.deepEqual(compareRating('TPS-G1', null, withoutKey), { status: 'missing', tone: 'bad' });
  });

  it('every status has a label', () => {
    for (const status of ['match', 'defensible', 'differs', 'contradicts', 'unsupported', 'honest-gap', 'avoided', 'missing']) {
      assert.equal(typeof COMPARE_LABELS[status], 'string', status);
    }
  });

  it('the expert path matches the expert on all 21 goals', () => {
    const known = knownEvidenceIds(expertState());
    const ratings = expertRatings();
    for (const g of ALL_GOALS) {
      assert.equal(compareRating(g.id, ratings[g.id], known).status, 'match', g.id);
    }
  });
});

describe('reasoningCues', () => {
  it('finds cues regardless of case', () => {
    assert.deepEqual(reasoningCues('The MIDNIGHT case and Boundary values', ['midnight', 'boundary', 'ROTA-412']), ['midnight', 'boundary']);
  });

  it('matches upper-case cues against lower-case text', () => {
    assert.deepEqual(reasoningCues('see rota-412 and tc-1205', ['ROTA-412', 'TC-']), ['ROTA-412', 'TC-']);
  });

  it('matches any alternative of a cue, including Turkish ones', () => {
    const cues = [['midnight', 'gece yarı'], ['boundary', 'sınır'], 'TC-'];
    assert.deepEqual(reasoningCues('GECE YARISI geçen pencere, SINIR değer analizi yok', cues), [cues[0], cues[1]]);
    assert.deepEqual(reasoningCues('İzlenebilirlik yok: tc-1205', [['traceab', 'izlenebil'], 'TC-']), [['traceab', 'izlenebil'], 'TC-']);
  });

  it('returns nothing for empty or missing text', () => {
    assert.deepEqual(reasoningCues('', ['midnight']), []);
    assert.deepEqual(reasoningCues(undefined, ['midnight']), []);
  });

  it('returns nothing for an empty cue list', () => {
    assert.deepEqual(reasoningCues('midnight', []), []);
  });

  it('the expert reasoning for TDE-G1 hits most of its own cues', () => {
    const { expert, cues } = REASON_PROMPTS['TDE-G1'];
    assert.ok(reasoningCues(expert, cues).length >= cues.length / 2);
  });

  it('no cue is a single letter that would match unrelated text', () => {
    for (const { cues } of Object.values(REASON_PROMPTS)) {
      for (const c of cues.flat()) assert.ok(c.length > 1, `cue "${c}" is too short`);
    }
  });
});

// ---------- budget ----------

describe('actionTotals', () => {
  it('is zero for no actions', () => {
    assert.deepEqual(actionTotals([]), { hours: 0, money: 0 });
  });

  it('sums hours and money of the chosen actions', () => {
    assert.deepEqual(actionTotals(['training', 'envs']), { hours: 160, money: 120000 });
  });

  it('ignores unknown action ids', () => {
    assert.deepEqual(actionTotals(['owner', 'nope']), { hours: 12, money: 0 });
  });

  it('the expert action set costs 362 hours and TRY 50,000', () => {
    assert.deepEqual(actionTotals(EXPERT.actions), { hours: 362, money: 50000 });
  });
});

describe('fitsBudget', () => {
  it('the budget is 400 hours and TRY 150,000', () => {
    assert.deepEqual(BUDGET, { hours: 400, money: 150000 });
  });

  it('accepts the expert action set', () => {
    assert.equal(fitsBudget(EXPERT.actions), true);
  });

  it('accepts exactly 400 hours', () => {
    const ids = ['envs', 'perf', 'flaky', 'strategy', 'training'];
    assert.equal(actionTotals(ids).hours, 400);
    assert.equal(fitsBudget(ids), true);
  });

  it('rejects 401+ hours', () => {
    assert.equal(fitsBudget(['envs', 'perf', 'flaky', 'strategy', 'training', 'owner']), false);
  });

  it('accepts exactly TRY 150,000', () => {
    const ids = ['envs', 'devices', 'data'];
    assert.equal(actionTotals(ids).money, 150000);
    assert.equal(fitsBudget(ids), true);
  });

  it('rejects more than TRY 150,000 even within the hours', () => {
    assert.equal(fitsBudget(['envs', 'devices', 'data', 'dashboard']), false);
  });
});

describe('canAddAction', () => {
  it('allows an action that still fits', () => {
    assert.equal(canAddAction(EXPERT.actions, 'devices'), true);
  });

  it('refuses an action that breaks the hour budget', () => {
    assert.equal(canAddAction(EXPERT.actions, 'envs'), false);
    assert.equal(canAddAction(EXPERT.actions, 'dashboard'), false);
  });

  it('always allows an action that is already chosen (so it can be removed)', () => {
    const over = ['envs', 'perf', 'flaky', 'strategy', 'training', 'owner'];
    assert.equal(fitsBudget(over), false);
    assert.equal(canAddAction(over, 'owner'), true);
  });
});
