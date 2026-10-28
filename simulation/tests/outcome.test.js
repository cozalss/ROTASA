import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { consequences, pathRows, ratingSummary } from '../js/logic/outcome.js';
import { EXPERT } from '../js/data/decisions.js';
import { ALL_GOALS, REASONED_GOALS } from '../js/data/tmmi.js';
import { expertState } from './helpers.js';

const texts = (list, tone) => list.filter((c) => c.tone === tone).map((c) => c.text);
const anyText = (list, fragment) => list.some((c) => c.text.includes(fragment));

// Every decision away from the expert, in the worst direction.
function badPathState() {
  return expertState({
    plan: { scope: 'automation', type: 'certificate', interviews: ['ece', 'onur'] },
    collect: { collected: ['A', 'B', 'T1', 'H3', 'H6'], outage: 'ignore' },
    report: { automation: 'agree', attribution: 'names', kvkk: 'drop' },
    improve: { actions: ['envs', 'perf'], first: 'envs' },
  });
}

describe('consequences: expert path', () => {
  const list = consequences(expertState());

  it('contains only good and neutral items', () => {
    const tones = new Set(list.map((c) => c.tone));
    assert.deepEqual([...tones].filter((t) => t !== 'good' && t !== 'neutral'), []);
  });

  it('names the decision behind every item', () => {
    assert.ok(list.every((c) => typeof c.from === 'string' && c.from.length > 0));
  });

  it('ends with the neutral overall line counting the core actions done', () => {
    const last = list.at(-1);
    assert.equal(last.from, 'Overall');
    assert.equal(last.tone, 'neutral');
    assert.match(last.text, /6 of the 6 governance and planning actions/);
    assert.match(last.text, /second quarter/);
  });

  it('includes the informal-type, risk workshop, plan approval, data, refuse, masked-data, BVA, flaky, defect review, PIR and owner outcomes', () => {
    const good = texts(list, 'good');
    for (const fragment of ['answered the supplier questionnaire honestly', 'product risk workshop', 'approval table', 'own numbers',
      'Nobody was singled out', 'masked data', 'boundary value analysis', 'Flaky tests were quarantined', 'weekly defect review',
      'post-incident review', 'Deniz became test process owner']) {
      assert.ok(good.some((t) => t.includes(fragment)), fragment);
    }
  });

  it('ties the risk workshop to both the interview and the action', () => {
    assert.ok(list.some((c) => c.from === 'Step 1 · Interviews / Step 6' && c.text.includes('ROTA-1188')));
  });

  it('mentions the flaky-test clean-up in the automation outcome only because flaky was funded', () => {
    assert.ok(texts(list, 'good').some((t) => t.includes('own numbers') && t.includes('flaky')));
  });

  it('never claims production defects rose', () => {
    assert.ok(!list.some((c) => /production defects (rose|rising|stayed high)/.test(c.text)));
  });
});

describe('consequences: bad path', () => {
  const list = consequences(badPathState());
  const bad = texts(list, 'bad');

  it('reports the automation-only scope', () => {
    assert.ok(bad.some((t) => t.includes('covered automation only')));
  });

  it('reports the false certificate', () => {
    assert.ok(bad.some((t) => t.includes('withdraw the answer')));
  });

  it('warns that no product owner was involved', () => {
    assert.ok(texts(list, 'warn').some((t) => t.includes('No product owner was involved')));
  });

  it('reports agreeing with the automation push', () => {
    assert.ok(bad.some((t) => t.includes('new UI automation')));
  });

  it('reports giving names to the CTO', () => {
    assert.ok(bad.some((t) => t.includes('confronted the people')));
  });

  it('reports never seeing the staging data when neither F nor H5 was collected', () => {
    assert.ok(bad.some((t) => t.includes('You never saw the staging data')));
  });

  it('reports the midnight window slipping through without training and DoR', () => {
    assert.ok(bad.some((t) => t.includes('00:00 slipped through')));
  });

  it('reports that nobody owned the plan', () => {
    assert.ok(bad.some((t) => t.includes('Nobody owned the improvement plan')));
  });

  it('warns about per-PR environments and performance testing', () => {
    const warn = texts(list, 'warn');
    assert.ok(warn.some((t) => t.includes('Per-pull-request environments')));
    assert.ok(warn.some((t) => t.includes('Level 3 topic')));
  });

  it('ends with the overall line that the target was dropped', () => {
    assert.match(list.at(-1).text, /quietly dropped/);
  });

  it('contains no good items', () => {
    assert.deepEqual(texts(list, 'good'), []);
  });
});

describe('consequences: other branches', () => {
  it('warns about the Level 2+3 scope and the formal assessment', () => {
    const list = consequences(expertState({ plan: { scope: 'level23', type: 'formal' } }));
    assert.ok(anyText(list, 'Level 3 topics'));
    assert.ok(anyText(list, 'accredited lead assessor'));
  });

  it('credits the risk workshop to the Step 6 action when Kerem was not interviewed', () => {
    const list = consequences(expertState({ plan: { interviews: ['deniz', 'burak'] } }));
    assert.ok(list.some((c) => c.from === 'Step 6 · Actions' && c.tone === 'good' && c.text.includes('product risk workshop')));
  });

  const withoutRisk = EXPERT.actions.filter((a) => a !== 'risk');
  const withoutRiskOrTemplate = withoutRisk.filter((a) => a !== 'template');

  it('without a funded workshop, Kerem signs through the approval step but the risks stay one line', () => {
    const list = consequences(expertState({ improve: { actions: withoutRisk } }));
    assert.ok(!anyText(list, 'product risk workshop'));
    assert.ok(texts(list, 'warn').some((t) => t.includes('Kerem now understood') && t.includes('approval step')));
  });

  it('without workshop or template, Kerem’s interview leaves the plan with one signature', () => {
    const list = consequences(expertState({ improve: { actions: withoutRiskOrTemplate } }));
    assert.ok(texts(list, 'warn').some((t) => t.includes('Kerem now understood') && t.includes('only the QA lead’s signature')));
    assert.ok(!anyText(list, 'approval table'));
  });

  it('with a template but no product owner, the plan passes approval but its risks stay one line', () => {
    const list = consequences(expertState({ plan: { interviews: ['deniz', 'burak'] }, improve: { actions: withoutRisk } }));
    assert.ok(texts(list, 'warn').some((t) => t.includes('No product owner was involved in planning')));
  });

  it('does not mention the flaky clean-up in the automation outcome when flaky was not funded', () => {
    const actions = EXPERT.actions.filter((a) => a !== 'flaky');
    const list = consequences(expertState({ improve: { actions } }));
    const line = list.find((c) => c.from === 'Step 5 · Automation objection');
    assert.ok(line.text.includes('own numbers'));
    assert.ok(!line.text.includes('flaky'));
    assert.ok(!anyText(list, 'Flaky tests were quarantined'));
  });

  it('warns when the automation objection is argued on principle only', () => {
    const list = consequences(expertState({ report: { automation: 'principle' } }));
    assert.ok(texts(list, 'warn').some((t) => t.includes('without data')));
  });

  it('treats the "someone in Routing" hint as attribution', () => {
    const list = consequences(expertState({ report: { attribution: 'hint' } }));
    assert.ok(texts(list, 'bad').some((t) => t.includes('confronted the people')));
  });

  it('says nothing about attribution before it is decided', () => {
    const list = consequences(expertState({ report: { attribution: null } }));
    assert.ok(!list.some((c) => c.from.includes('Attribution')));
  });

  const withoutData = EXPERT.actions.filter((a) => a !== 'data');

  it('masked data funded but the finding only told verbally: good outcome, with the missing written finding noted', () => {
    const list = consequences(expertState({ report: { kvkk: 'verbal' } }));
    const line = list.find((c) => c.from === 'Step 5–6 · Test data');
    assert.equal(line.tone, 'good');
    assert.match(line.text, /never made it into your written report/);
  });

  it('masked data funded without ever seeing the staging data: good, credited to the Step 6 action', () => {
    const list = consequences(expertState({ collect: { collected: ['A', 'B'] }, report: { kvkk: null } }));
    assert.ok(list.some((c) => c.from === 'Step 6 · Actions' && c.tone === 'good' && c.text.includes('never explained the KVKK exposure')));
    assert.ok(!anyText(list, 'You never saw the staging data'));
  });

  it('reports the unmasked copy when the finding was kept but masked data was not funded', () => {
    const list = consequences(expertState({ improve: { actions: withoutData } }));
    assert.ok(texts(list, 'bad').some((t) => t.includes('Your report named the problem') && t.includes('unmasked production copy stayed')));
  });

  it('reports the unmasked copy when the data was seen, dropped and not funded', () => {
    const list = consequences(expertState({ report: { kvkk: 'verbal' }, improve: { actions: withoutData } }));
    assert.ok(texts(list, 'bad').some((t) => t.startsWith('The unmasked production copy stayed')));
  });

  it('counts H5 alone as having seen the staging data', () => {
    const list = consequences(expertState({ collect: { collected: ['A', 'H5'] }, report: { kvkk: 'drop' }, improve: { actions: withoutData } }));
    assert.ok(anyText(list, 'unmasked production copy stayed'));
    assert.ok(!anyText(list, 'You never saw the staging data'));
  });

  it('needs both training and DoR to prevent the midnight defect', () => {
    const actions = EXPERT.actions.filter((a) => a !== 'dor');
    const list = consequences(expertState({ improve: { actions } }));
    assert.ok(texts(list, 'bad').some((t) => t.includes('00:00 slipped through')));
  });

  it('warns when an owner is chosen but is not the first action', () => {
    const list = consequences(expertState({ improve: { first: 'policy' } }));
    assert.ok(texts(list, 'warn').some((t) => t.includes('appointed late')));
  });

  it('gives the middle overall line for 3-4 core actions', () => {
    const list = consequences(expertState({ improve: { actions: ['owner', 'policy', 'risk'], first: 'owner' } }));
    assert.match(list.at(-1).text, /some Level 2 practices had started/);
  });

  it('gives the middle overall line for all core actions outside a Level 2 scope', () => {
    const list = consequences(expertState({ plan: { scope: 'level23' } }));
    assert.match(list.at(-1).text, /some Level 2 practices had started/);
  });
});

describe('pathRows', () => {
  const rows = pathRows(expertState());
  const decisionSteps = ['1 · Scope', '1 · Assessment type', '1 · Interviews', '2 · Evidence', '2 · Staging outage',
    '4 · Maturity level', '5 · Automation objection', '5 · "Who said it?"', '5 · Test data finding', '6 · Actions', '6 · First action'];

  it('has one row per decision plus one per reasoned goal', () => {
    assert.equal(rows.length, decisionSteps.length + REASONED_GOALS.length);
    const steps = rows.map((r) => r.step);
    for (const s of decisionSteps) assert.ok(steps.includes(s), s);
  });

  it('marks every decision row "Same" on the expert path', () => {
    for (const r of rows.filter((x) => decisionSteps.includes(x.step))) {
      assert.deepEqual(r.status, { label: 'Same', tone: 'good' }, r.step);
    }
  });

  it('marks every reasoned-goal row as the expert match on the expert path', () => {
    const goalRows = rows.filter((x) => x.step.startsWith('3 · '));
    assert.equal(goalRows.length, REASONED_GOALS.length);
    for (const r of goalRows) assert.deepEqual(r.status, { label: 'Same as expert', tone: 'good' }, r.step);
  });

  it('gives every row a player value, an expert value and a reason', () => {
    for (const r of rows) {
      assert.ok(r.player && r.expert && r.why, r.step);
    }
  });

  it('shows dashes and "Different" for an untouched state', () => {
    const empty = pathRows(expertState({ plan: { scope: null, type: null, interviews: [] } }));
    const scope = empty.find((r) => r.step === '1 · Scope');
    assert.equal(scope.player, '—');
    assert.deepEqual(scope.status, { label: 'Different', tone: 'bad' });
    assert.equal(empty.find((r) => r.step === '1 · Interviews').player, '—');
  });

  it('shows dashes for empty evidence and action lists and the raw id for unknown evidence', () => {
    const empty = pathRows(expertState({ collect: { collected: [] }, improve: { actions: [], first: null }, assess: { ratings: {} } }));
    assert.equal(empty.find((r) => r.step === '2 · Evidence').player, '—');
    assert.equal(empty.find((r) => r.step === '6 · Actions').player, '—');
    assert.match(empty.find((r) => r.step.startsWith('3 · TMC')).player, /^— · /);
    const odd = pathRows(expertState({ collect: { collected: ['ZZ'] } }));
    assert.equal(odd.find((r) => r.step === '2 · Evidence').player, 'ZZ');
  });

  it('labels a superset of the expert actions as "Expert set covered"', () => {
    const r = pathRows(expertState({ improve: { actions: [...EXPERT.actions, 'devices'] } })).find((x) => x.step === '6 · Actions');
    assert.deepEqual(r.status, { label: 'Expert set covered', tone: 'good' });
  });

  it('labels half the expert interviews as "Partly the same"', () => {
    const r = pathRows(expertState({ plan: { interviews: ['deniz', 'ece'] } })).find((x) => x.step === '1 · Interviews');
    assert.deepEqual(r.status, { label: 'Partly the same', tone: 'warn' });
  });

  it('labels no overlap as "Different"', () => {
    const r = pathRows(expertState({ plan: { interviews: ['ece', 'onur'] } })).find((x) => x.step === '1 · Interviews');
    assert.deepEqual(r.status, { label: 'Different', tone: 'bad' });
  });

  it('shows "(no reasoning written)" when a reasoned goal has no text', () => {
    const r = pathRows(expertState()).find((x) => x.step.startsWith('3 · TMC'));
    assert.match(r.player, /no reasoning written/);
  });
});

describe('ratingSummary', () => {
  it('has one row for each of the 21 goals', () => {
    assert.equal(ratingSummary(expertState()).length, 21);
    assert.deepEqual(ratingSummary(expertState()).map((r) => r.goal.id), ALL_GOALS.map((g) => g.id));
  });

  it('is all "match" on the expert path', () => {
    assert.ok(ratingSummary(expertState()).every((r) => r.status === 'match' && r.tone === 'good'));
  });

  it('reports null player ratings as missing', () => {
    const rows = ratingSummary(expertState({ assess: { ratings: {} } }));
    assert.ok(rows.every((r) => r.player === null && r.status === 'missing'));
  });
});
