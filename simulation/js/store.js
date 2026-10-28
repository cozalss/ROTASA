// Immutable state container. Every update returns a new state object;
// listeners re-render from the new snapshot.

export const STEP_IDS = ['intro', 'plan', 'collect', 'assess', 'conclude', 'report', 'improve', 'reflect'];

export function createInitialState() {
  return Object.freeze({
    step: 0,
    maxStep: 0,
    designerNotes: false,
    plan: Object.freeze({ scope: null, scopeReason: '', type: null, interviews: Object.freeze([]) }),
    collect: Object.freeze({ collected: Object.freeze([]), outage: null }),
    assess: Object.freeze({ ratings: Object.freeze({}), reasons: Object.freeze({}), revealed: Object.freeze({}), openPa: null }),
    conclude: Object.freeze({ level: null, levelReason: '', revealed: false }),
    report: Object.freeze({ automation: null, automationText: '', attribution: null, kvkk: null, revealed: Object.freeze({}) }),
    improve: Object.freeze({ actions: Object.freeze([]), first: null, revealed: false }),
  });
}

// Shallow-merges `patch` into the named slice and returns a new root state.
export function patchSlice(state, slice, patch) {
  return Object.freeze({ ...state, [slice]: Object.freeze({ ...state[slice], ...patch }) });
}

export function patchRoot(state, patch) {
  return Object.freeze({ ...state, ...patch });
}

export function goToStep(state, step) {
  const bounded = Math.max(0, Math.min(STEP_IDS.length - 1, step));
  return patchRoot(state, { step: bounded, maxStep: Math.max(state.maxStep, bounded) });
}

export function toggleInList(list, id, limit = Infinity) {
  if (list.includes(id)) return Object.freeze(list.filter((x) => x !== id));
  if (list.length >= limit) return list;
  return Object.freeze([...list, id]);
}

export function setKey(record, key, value) {
  return Object.freeze({ ...record, [key]: value });
}

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    // `silent` updates state without notifying (used for typing in text areas,
    // so a re-render does not steal focus).
    update(fn, { silent = false } = {}) {
      state = fn(state);
      if (!silent) listeners.forEach((l) => l(state));
    },
    replace(next) {
      state = next;
      listeners.forEach((l) => l(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
