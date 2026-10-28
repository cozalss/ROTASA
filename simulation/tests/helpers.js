// Shared fixtures: full game states built only through the public store API.
import { createInitialState, patchSlice } from '../js/store.js';
import { EXPERT } from '../js/data/decisions.js';
import { expertRatings } from '../js/logic/assessment.js';

// A state in which every decision follows EXPERT and every goal carries the
// expert rating. `overrides` maps slice name -> patch, applied afterwards.
export function expertState(overrides = {}) {
  let s = createInitialState();
  s = patchSlice(s, 'plan', { scope: EXPERT.scope, type: EXPERT.type, interviews: Object.freeze([...EXPERT.interviews]) });
  s = patchSlice(s, 'collect', { collected: Object.freeze([...EXPERT.collected]), outage: EXPERT.outage });
  s = patchSlice(s, 'assess', { ratings: Object.freeze(expertRatings()) });
  s = patchSlice(s, 'conclude', { level: EXPERT.level });
  s = patchSlice(s, 'report', { automation: EXPERT.automation, attribution: EXPERT.attribution, kvkk: EXPERT.kvkk });
  s = patchSlice(s, 'improve', { actions: Object.freeze([...EXPERT.actions]), first: EXPERT.first });
  return Object.entries(overrides).reduce((acc, [slice, patch]) => patchSlice(acc, slice, patch), s);
}

// A state with the given plan/collect values and nothing else decided.
export function planState({ scope = 'level2', interviews = [], collected = [], outage = null } = {}) {
  let s = createInitialState();
  s = patchSlice(s, 'plan', { scope, interviews });
  return patchSlice(s, 'collect', { collected, outage });
}
