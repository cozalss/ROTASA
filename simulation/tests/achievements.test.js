import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, evaluateAchievements, findAchievement } from '../js/logic/achievements.js';
import { createInitialState } from '../js/store.js';
import { expertRatings } from '../js/logic/assessment.js';
import { ALL_GOALS } from '../js/data/tmmi.js';
import { expertState } from './helpers.js';

const unlocked = (state, id) => evaluateAchievements(state).includes(id);
const ratingsWith = (patch) => Object.freeze({ ...expertRatings(), ...patch });
const allRated = (rating) => Object.freeze(Object.fromEntries(ALL_GOALS.map((g) => [g.id, rating])));

describe('ACHIEVEMENTS list', () => {
  it('has 10 to 12 entries with unique ids and complete fields', () => {
    assert.ok(ACHIEVEMENTS.length >= 10 && ACHIEVEMENTS.length <= 12);
    assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
    ACHIEVEMENTS.forEach((a) => {
      ['id', 'title', 'description', 'hint', 'icon'].forEach((key) => assert.ok(a[key], `${a.id} lacks ${key}`));
    });
  });

  it('is frozen data without functions', () => {
    assert.ok(Object.isFrozen(ACHIEVEMENTS));
    ACHIEVEMENTS.forEach((a) => {
      assert.ok(Object.isFrozen(a));
      assert.ok(Object.values(a).every((v) => typeof v === 'string'));
    });
  });

  it('finds an achievement by id and returns null for unknown ids', () => {
    assert.equal(findAchievement('owner-first').title, 'Owner first');
    assert.equal(findAchievement('nope'), null);
  });
});

describe('evaluateAchievements', () => {
  it('unlocks nothing for a fresh game', () => {
    assert.deepEqual(evaluateAchievements(createInitialState()), []);
  });

  it('unlocks every achievement except Honest gap for the expert path', () => {
    const ids = evaluateAchievements(expertState());
    const expected = ACHIEVEMENTS.map((a) => a.id).filter((id) => id !== 'honest-gap');
    assert.deepEqual(ids, expected);
  });

  it('returns ids in list order and never mutates the state', () => {
    const state = expertState();
    const before = JSON.stringify(state);
    evaluateAchievements(state);
    assert.equal(JSON.stringify(state), before);
  });
});

describe('No false certificates', () => {
  it('unlocks for an informal assessment', () => assert.ok(unlocked(expertState(), 'no-false-certificates')));
  it('stays locked for a certificate or a formal assessment', () => {
    assert.ok(!unlocked(expertState({ plan: { type: 'certificate' } }), 'no-false-certificates'));
    assert.ok(!unlocked(expertState({ plan: { type: 'formal' } }), 'no-false-certificates'));
  });
});

describe('Eyes on the outage', () => {
  it('unlocks when the player observes the recovery', () => assert.ok(unlocked(expertState(), 'eyes-on-the-outage')));
  it('stays locked when the player waits or ignores it', () => {
    assert.ok(!unlocked(expertState({ collect: { outage: 'wait' } }), 'eyes-on-the-outage'));
    assert.ok(!unlocked(expertState({ collect: { outage: 'ignore' } }), 'eyes-on-the-outage'));
  });
});

describe('Evidence over word', () => {
  it('unlocks when TPL-G5 is rated N with the test plan (B) in hand', () => {
    assert.ok(unlocked(expertState(), 'evidence-over-word'));
  });
  it('stays locked when TPL-G5 is rated higher', () => {
    assert.ok(!unlocked(expertState({ assess: { ratings: ratingsWith({ 'TPL-G5': 'P' }) } }), 'evidence-over-word'));
  });
  it('stays locked without Document B', () => {
    const collected = ['A', 'C', 'D', 'E', 'F', 'G', 'J', 'H2', 'H4'];
    assert.ok(!unlocked(expertState({ collect: { collected } }), 'evidence-over-word'));
  });
});

describe('Honest gap', () => {
  it('unlocks for "?" on a goal whose key evidence was not collected', () => {
    // TEV-G1 needs F; drop F and admit the gap.
    const state = expertState({
      collect: { collected: ['A', 'B', 'C', 'D', 'E', 'G', 'J', 'H2', 'H4'] },
      assess: { ratings: ratingsWith({ 'TEV-G1': '?' }) },
    });
    assert.ok(unlocked(state, 'honest-gap'));
  });
  it('stays locked for "?" when the key evidence was there', () => {
    assert.ok(!unlocked(expertState({ assess: { ratings: ratingsWith({ 'TEV-G1': '?' }) } }), 'honest-gap'));
  });
  it('stays locked when nothing is rated "?"', () => assert.ok(!unlocked(expertState(), 'honest-gap')));
});

describe('Weakest link', () => {
  it('unlocks for an indicative Level 1 when own ratings hold an N or P process area', () => {
    assert.ok(unlocked(expertState(), 'weakest-link'));
  });
  it('stays locked for a different conclusion', () => {
    assert.ok(!unlocked(expertState({ conclude: { level: 'level2' } }), 'weakest-link'));
    assert.ok(!unlocked(expertState({ conclude: { level: 'level1-formal' } }), 'weakest-link'));
  });
  it('stays locked when own ratings would put every process area at L or F', () => {
    assert.ok(!unlocked(expertState({ assess: { ratings: allRated('L') } }), 'weakest-link'));
  });
  it('stays locked when the scope left every process area Not Rated', () => {
    assert.ok(!unlocked(expertState({ plan: { scope: 'automation' } }), 'weakest-link'));
  });
});

describe('Numbers talk', () => {
  it('unlocks when the automation objection is answered with Document E', () => {
    assert.ok(unlocked(expertState(), 'numbers-talk'));
  });
  it('stays locked for agreeing or arguing from principle', () => {
    assert.ok(!unlocked(expertState({ report: { automation: 'agree' } }), 'numbers-talk'));
    assert.ok(!unlocked(expertState({ report: { automation: 'principle' } }), 'numbers-talk'));
  });
  it('stays locked without Document E', () => {
    const collected = ['A', 'B', 'C', 'D', 'F', 'G', 'J', 'H2', 'H4'];
    assert.ok(!unlocked(expertState({ collect: { collected } }), 'numbers-talk'));
  });
});

describe('Protected sources', () => {
  it('unlocks when the player declines to name sources', () => assert.ok(unlocked(expertState(), 'protected-sources')));
  it('stays locked for names or a hint', () => {
    assert.ok(!unlocked(expertState({ report: { attribution: 'names' } }), 'protected-sources'));
    assert.ok(!unlocked(expertState({ report: { attribution: 'hint' } }), 'protected-sources'));
  });
});

describe('Budget discipline', () => {
  it('unlocks within budget with at least 30 h in reserve', () => {
    assert.ok(unlocked(expertState(), 'budget-discipline'));
  });
  it('stays locked with no actions chosen', () => {
    assert.ok(!unlocked(expertState({ improve: { actions: [] } }), 'budget-discipline'));
  });
  it('stays locked when the reserve drops under 30 h', () => {
    // Expert plan is 362 h; adding the 20 h device farm leaves 18 h.
    const actions = ['owner', 'policy', 'strategy', 'risk', 'template', 'training', 'defects', 'dor', 'pir', 'flaky', 'data', 'devices'];
    assert.ok(!unlocked(expertState({ improve: { actions } }), 'budget-discipline'));
  });
  it('unlocks with exactly 30 h left', () => {
    // Expert plan minus dor (12 h) plus the device farm (20 h) = 370 h, 30 h left.
    const actions = ['owner', 'policy', 'strategy', 'risk', 'template', 'training', 'defects', 'pir', 'flaky', 'data', 'devices'];
    assert.ok(unlocked(expertState({ improve: { actions } }), 'budget-discipline'));
  });
  it('stays locked when the money budget is exceeded', () => {
    const actions = ['owner', 'envs', 'devices', 'perf'];
    assert.ok(!unlocked(expertState({ improve: { actions } }), 'budget-discipline'));
  });
});

describe('Owner first', () => {
  it('unlocks when the owner action is chosen and starts first', () => assert.ok(unlocked(expertState(), 'owner-first')));
  it('stays locked when another action starts first', () => {
    assert.ok(!unlocked(expertState({ improve: { first: 'policy' } }), 'owner-first'));
  });
  it('stays locked when "owner" is first but not in the plan', () => {
    assert.ok(!unlocked(expertState({ improve: { actions: ['policy'], first: 'owner' } }), 'owner-first'));
  });
});

describe('Time well spent', () => {
  it('unlocks with five or more items and no time sinks', () => assert.ok(unlocked(expertState(), 'time-well-spent')));
  it('stays locked when any time sink (T1–T3) is collected', () => {
    ['T1', 'T2', 'T3'].forEach((trap) => {
      const collected = ['A', 'B', 'C', 'D', trap];
      assert.ok(!unlocked(expertState({ collect: { collected } }), 'time-well-spent'), trap);
    });
  });
  it('stays locked with fewer than five items', () => {
    assert.ok(!unlocked(expertState({ collect: { collected: ['A', 'B', 'C', 'D'] } }), 'time-well-spent'));
  });
});

describe('Full house', () => {
  it('unlocks when all eight documents are collected', () => assert.ok(unlocked(expertState(), 'full-house')));
  it('stays locked when one document is missing', () => {
    const collected = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H2', 'H4'];
    assert.ok(!unlocked(expertState({ collect: { collected } }), 'full-house'));
  });
});

describe("Expert's shadow", () => {
  it('unlocks when every decision matches the expert, in any order', () => {
    const reordered = expertState({ plan: { interviews: ['kerem', 'deniz'] } });
    assert.ok(unlocked(reordered, 'experts-shadow'));
  });
  it('stays locked when a single decision differs', () => {
    assert.ok(!unlocked(expertState({ report: { kvkk: 'verbal' } }), 'experts-shadow'));
    assert.ok(!unlocked(expertState({ plan: { interviews: ['deniz', 'burak'] } }), 'experts-shadow'));
    assert.ok(!unlocked(expertState({ improve: { actions: ['owner'] } }), 'experts-shadow'));
  });
});
