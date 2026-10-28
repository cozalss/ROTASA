// Content-accuracy guards: the data files must agree with each other, with
// the TMMi Level 2 structure and with the case pack.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE, ALL_EVIDENCE, OPENING_MEETING, OUTAGE_EVENT, findEvidence } from '../js/data/evidence.js';
import {
  EXPERT, EXPERT_WHY, SCOPE_OPTIONS, TYPE_OPTIONS, INTERVIEWEES, INTERVIEW_SLOTS, OUTAGE_OPTIONS, LEVEL_OPTIONS,
  AUTOMATION_OPTIONS, ATTRIBUTION_OPTIONS, KVKK_OPTIONS, ACTIONS,
} from '../js/data/decisions.js';
import { PROCESS_AREAS, ALL_GOALS, RATING_ORDER, RATINGS, REASONED_GOALS, REASON_PROMPTS, findGoal } from '../js/data/tmmi.js';
import { minutesSpent, timeBudget, hasKeyEvidence, knownEvidenceIds } from '../js/logic/assessment.js';
import { expertState } from './helpers.js';

const ids = (list) => list.map((x) => x.id);
const GOAL_IDS = new Set(ALL_GOALS.map((g) => g.id));

describe('TMMi Level 2 structure', () => {
  it('has 6 process areas in framework order', () => {
    assert.deepEqual(ids(PROCESS_AREAS), ['TPS', 'TPL', 'TMC', 'TDE', 'TEV', 'IH']);
  });

  it('has 21 goals in total', () => {
    assert.equal(ALL_GOALS.length, 21);
  });

  it('has the framework goal count per process area (3, 5, 3, 4, 3, 3)', () => {
    assert.deepEqual(PROCESS_AREAS.map((pa) => pa.goals.length), [3, 5, 3, 4, 3, 3]);
  });

  it('has unique goal ids prefixed by their process area', () => {
    assert.equal(GOAL_IDS.size, 21);
    for (const g of ALL_GOALS) assert.ok(g.id.startsWith(`${g.pa}-G`), g.id);
  });

  it('rating scale is N < P < L < F plus "?"', () => {
    assert.deepEqual(RATING_ORDER, { N: 0, P: 1, L: 2, F: 3 });
    assert.deepEqual(ids(RATINGS), ['N', 'P', 'L', 'F', '?']);
  });
});

describe('goals', () => {
  it('every expert rating is on the N-F scale', () => {
    for (const g of ALL_GOALS) assert.ok(g.expert in RATING_ORDER, g.id);
  });

  it('every goal lists its expert rating in accept', () => {
    for (const g of ALL_GOALS) assert.ok(g.accept.includes(g.expert), g.id);
  });

  it('every accepted rating is on the N-F scale', () => {
    for (const g of ALL_GOALS) assert.ok(g.accept.every((r) => r in RATING_ORDER), g.id);
  });

  it('every goal has at least one key evidence id, and each exists', () => {
    for (const g of ALL_GOALS) {
      assert.ok(g.key.length > 0, g.id);
      for (const k of g.key) assert.ok(findEvidence(k), `${g.id} key ${k}`);
    }
  });

  it('every key evidence item has a finding for that goal', () => {
    for (const g of ALL_GOALS) {
      for (const k of g.key) assert.ok(findEvidence(k).findings[g.id], `${k} has no finding for ${g.id}`);
    }
  });

  it('every goal has a name and an expert explanation', () => {
    for (const g of ALL_GOALS) assert.ok(g.name && g.why, g.id);
  });

  it('reasoned goals exist and each has a prompt, an expert answer and cues', () => {
    for (const id of REASONED_GOALS) {
      assert.ok(findGoal(id), id);
      const p = REASON_PROMPTS[id];
      assert.ok(p && p.question && p.expert && p.cues.length > 0, id);
      assert.ok(p.expert.startsWith(`${findGoal(id).expert}.`), `${id} answer opens with the expert rating`);
    }
  });
});

describe('evidence', () => {
  it('has unique ids across all evidence', () => {
    const all = ids(ALL_EVIDENCE);
    assert.equal(new Set(all).size, all.length);
  });

  it('keeps the opening meeting and outage observation out of the collectable list', () => {
    assert.ok(!ids(EVIDENCE).includes(OPENING_MEETING.id));
    assert.ok(!ids(EVIDENCE).includes(OUTAGE_EVENT.id));
  });

  it('every finding key is a real goal id', () => {
    for (const e of ALL_EVIDENCE) {
      for (const goalId of Object.keys(e.findings)) assert.ok(GOAL_IDS.has(goalId), `${e.id} -> ${goalId}`);
    }
  });

  it('time sinks carry no findings', () => {
    for (const e of EVIDENCE.filter((x) => x.kind === 'trap')) assert.deepEqual(e.findings, {}, e.id);
  });

  it('every item has a non-negative cost; only the opening meeting is free', () => {
    for (const e of ALL_EVIDENCE) assert.ok(Number.isInteger(e.cost) && e.cost >= 0, e.id);
    assert.deepEqual(ALL_EVIDENCE.filter((e) => e.cost === 0).map((e) => e.id), ['H1']);
  });

  it('the outage observation costs what the "observe" option charges', () => {
    assert.equal(OUTAGE_EVENT.cost, OUTAGE_OPTIONS.find((o) => o.id === 'observe').cost);
  });
});

describe('interviewees', () => {
  it('each interviewee points to an existing interview whose person matches', () => {
    for (const p of INTERVIEWEES) {
      const e = findEvidence(p.evidence);
      assert.ok(e, p.id);
      assert.equal(e.kind, 'interview', p.id);
      assert.equal(e.person, p.id, p.id);
    }
  });

  it('every bookable interview belongs to an interviewee', () => {
    const booked = INTERVIEWEES.map((p) => p.evidence);
    for (const e of EVIDENCE.filter((x) => x.kind === 'interview')) assert.ok(booked.includes(e.id), e.id);
  });

  it('INTERVIEW_SLOTS is 2', () => {
    assert.equal(INTERVIEW_SLOTS, 2);
  });
});

describe('EXPERT path', () => {
  const has = (options, id) => options.some((o) => o.id === id);

  it('every EXPERT choice refers to an existing option', () => {
    assert.ok(has(SCOPE_OPTIONS, EXPERT.scope), 'scope');
    assert.ok(has(TYPE_OPTIONS, EXPERT.type), 'type');
    assert.ok(has(OUTAGE_OPTIONS, EXPERT.outage), 'outage');
    assert.ok(has(LEVEL_OPTIONS, EXPERT.level), 'level');
    assert.ok(has(AUTOMATION_OPTIONS, EXPERT.automation), 'automation');
    assert.ok(has(ATTRIBUTION_OPTIONS, EXPERT.attribution), 'attribution');
    assert.ok(has(KVKK_OPTIONS, EXPERT.kvkk), 'kvkk');
    assert.ok(has(ACTIONS, EXPERT.first), 'first');
    for (const id of EXPERT.interviews) assert.ok(has(INTERVIEWEES, id), `interview ${id}`);
    for (const id of EXPERT.actions) assert.ok(has(ACTIONS, id), `action ${id}`);
    for (const id of EXPERT.collected) assert.ok(has(EVIDENCE, id), `evidence ${id}`);
  });

  it('books exactly INTERVIEW_SLOTS interviews', () => {
    assert.equal(EXPERT.interviews.length, INTERVIEW_SLOTS);
  });

  it('collects only interviews it booked, and no time sinks', () => {
    const booked = INTERVIEWEES.filter((p) => EXPERT.interviews.includes(p.id)).map((p) => p.evidence);
    for (const id of EXPERT.collected) {
      const e = findEvidence(id);
      assert.notEqual(e.kind, 'trap', id);
      if (e.kind === 'interview') assert.ok(booked.includes(id), id);
    }
  });

  it('collects all eight documents and both booked interviews', () => {
    const docs = ids(EVIDENCE.filter((e) => e.kind === 'document'));
    assert.equal(docs.length, 8);
    for (const d of docs) assert.ok(EXPERT.collected.includes(d), d);
  });

  it('fits the Level 2 time budget, including the outage observation', () => {
    assert.ok(minutesSpent(EXPERT.collected, EXPERT.outage) <= timeBudget('level2'));
  });

  it('has key evidence for every goal it rates', () => {
    const known = knownEvidenceIds(expertState());
    for (const g of ALL_GOALS) assert.ok(hasKeyEvidence(g.id, known), g.id);
  });

  it('chooses a first action from its own action set', () => {
    assert.ok(EXPERT.actions.includes(EXPERT.first));
  });

  it('chooses the "show Rotaşa’s own numbers" objection, whose required evidence it collected', () => {
    const option = AUTOMATION_OPTIONS.find((o) => o.id === EXPERT.automation);
    assert.ok(EXPERT.collected.includes(option.needs));
  });

  it('explains every decision', () => {
    for (const key of Object.keys(EXPERT)) assert.ok(EXPERT_WHY[key], key);
  });
});

describe('ACTIONS match case pack Document I', () => {
  const DOCUMENT_I = {
    owner: [12, 0], policy: [24, 0], strategy: [60, 0], risk: [16, 0], template: [20, 0],
    training: [40, 30000], flaky: [80, 0], data: [70, 20000], envs: [120, 90000], dashboard: [50, 10000],
    defects: [16, 0], dor: [12, 0], perf: [100, 25000], devices: [20, 40000], pir: [12, 0],
  };

  it('has exactly the 15 Document I actions', () => {
    assert.deepEqual(ids(ACTIONS).sort(), Object.keys(DOCUMENT_I).sort());
  });

  for (const [id, [hours, money]] of Object.entries(DOCUMENT_I)) {
    it(`${id}: ${hours} h, TRY ${money}`, () => {
      const a = ACTIONS.find((x) => x.id === id);
      assert.equal(a.hours, hours);
      assert.equal(a.money, money);
    });
  }

  it('links each action to a Level 2 process area or L3', () => {
    const allowed = new Set([...ids(PROCESS_AREAS), 'L3']);
    for (const a of ACTIONS) assert.ok(allowed.has(a.pa), a.id);
  });
});
