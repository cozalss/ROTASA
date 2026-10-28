import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_IDS, createInitialState, patchSlice, patchRoot, goToStep, toggleInList, setKey, createStore,
} from '../js/store.js';

describe('createInitialState', () => {
  it('returns a deeply frozen state', () => {
    const s = createInitialState();
    assert.ok(Object.isFrozen(s));
    for (const slice of ['plan', 'collect', 'assess', 'conclude', 'report', 'improve']) {
      assert.ok(Object.isFrozen(s[slice]), `${slice} is frozen`);
    }
    assert.ok(Object.isFrozen(s.plan.interviews));
    assert.ok(Object.isFrozen(s.collect.collected));
    assert.ok(Object.isFrozen(s.assess.ratings));
    assert.ok(Object.isFrozen(s.improve.actions));
  });

  it('starts on step 0 with nothing decided', () => {
    const s = createInitialState();
    assert.equal(s.step, 0);
    assert.equal(s.maxStep, 0);
    assert.equal(s.plan.scope, null);
    assert.deepEqual(s.collect.collected, []);
    assert.deepEqual(s.assess.ratings, {});
  });

  it('returns a fresh object on every call', () => {
    assert.notEqual(createInitialState(), createInitialState());
  });

  it('rejects writes in strict mode', () => {
    const s = createInitialState();
    assert.throws(() => { s.step = 3; }, TypeError);
    assert.throws(() => { s.plan.interviews.push('deniz'); }, TypeError);
  });
});

describe('patchSlice', () => {
  it('returns a new root and a new slice with the patch merged', () => {
    const s = createInitialState();
    const next = patchSlice(s, 'plan', { scope: 'level2' });
    assert.notEqual(next, s);
    assert.notEqual(next.plan, s.plan);
    assert.equal(next.plan.scope, 'level2');
    assert.equal(next.plan.type, null, 'other fields kept');
  });

  it('does not mutate the original state', () => {
    const s = createInitialState();
    patchSlice(s, 'plan', { scope: 'level2' });
    assert.equal(s.plan.scope, null);
  });

  it('keeps untouched slices by reference', () => {
    const s = createInitialState();
    const next = patchSlice(s, 'plan', { scope: 'level2' });
    assert.equal(next.collect, s.collect);
  });

  it('freezes the result', () => {
    const next = patchSlice(createInitialState(), 'plan', { scope: 'level2' });
    assert.ok(Object.isFrozen(next));
    assert.ok(Object.isFrozen(next.plan));
  });
});

describe('patchRoot', () => {
  it('returns a new frozen root without mutating the original', () => {
    const s = createInitialState();
    const next = patchRoot(s, { designerNotes: true });
    assert.notEqual(next, s);
    assert.equal(next.designerNotes, true);
    assert.equal(s.designerNotes, false);
    assert.ok(Object.isFrozen(next));
  });
});

describe('goToStep', () => {
  it('moves to the requested step and raises maxStep', () => {
    const s = goToStep(createInitialState(), 3);
    assert.equal(s.step, 3);
    assert.equal(s.maxStep, 3);
  });

  it('keeps maxStep when going back', () => {
    const s = goToStep(goToStep(createInitialState(), 4), 1);
    assert.equal(s.step, 1);
    assert.equal(s.maxStep, 4);
  });

  it('clamps below zero to 0', () => {
    assert.equal(goToStep(createInitialState(), -5).step, 0);
  });

  it('clamps beyond the last step to the last index', () => {
    const s = goToStep(createInitialState(), 99);
    assert.equal(s.step, STEP_IDS.length - 1);
    assert.equal(s.maxStep, STEP_IDS.length - 1);
  });

  it('does not mutate the input state', () => {
    const s = createInitialState();
    goToStep(s, 2);
    assert.equal(s.step, 0);
  });
});

describe('toggleInList', () => {
  it('adds a missing id', () => {
    assert.deepEqual(toggleInList([], 'a'), ['a']);
  });

  it('removes a present id', () => {
    assert.deepEqual(toggleInList(['a', 'b'], 'a'), ['b']);
  });

  it('does not add beyond the limit and returns the same list', () => {
    const list = Object.freeze(['a', 'b']);
    assert.equal(toggleInList(list, 'c', 2), list);
  });

  it('still removes when the list is at the limit', () => {
    assert.deepEqual(toggleInList(['a', 'b'], 'b', 2), ['a']);
  });

  it('returns a new frozen list and leaves the input unchanged', () => {
    const list = Object.freeze(['a']);
    const next = toggleInList(list, 'b');
    assert.notEqual(next, list);
    assert.ok(Object.isFrozen(next));
    assert.deepEqual(list, ['a']);
  });
});

describe('setKey', () => {
  it('returns a new frozen record with the key set', () => {
    const rec = Object.freeze({ a: 1 });
    const next = setKey(rec, 'b', 2);
    assert.deepEqual(next, { a: 1, b: 2 });
    assert.deepEqual(rec, { a: 1 });
    assert.ok(Object.isFrozen(next));
  });
});

describe('createStore', () => {
  it('get returns the initial state', () => {
    const init = createInitialState();
    assert.equal(createStore(init).get(), init);
  });

  it('update applies the function and notifies subscribers with the new state', () => {
    const store = createStore(createInitialState());
    const seen = [];
    store.subscribe((s) => seen.push(s.step));
    store.update((s) => goToStep(s, 2));
    assert.equal(store.get().step, 2);
    assert.deepEqual(seen, [2]);
  });

  it('silent update changes state without notifying', () => {
    const store = createStore(createInitialState());
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    store.update((s) => goToStep(s, 1), { silent: true });
    assert.equal(store.get().step, 1);
    assert.equal(calls, 0);
  });

  it('replace swaps the whole state and notifies', () => {
    const store = createStore(createInitialState());
    const next = goToStep(createInitialState(), 5);
    let received = null;
    store.subscribe((s) => { received = s; });
    store.replace(next);
    assert.equal(store.get(), next);
    assert.equal(received, next);
  });

  it('unsubscribe stops further notifications', () => {
    const store = createStore(createInitialState());
    let calls = 0;
    const off = store.subscribe(() => { calls += 1; });
    store.update((s) => s);
    off();
    store.update((s) => s);
    assert.equal(calls, 1);
  });

  it('notifies every subscriber', () => {
    const store = createStore(createInitialState());
    let a = 0;
    let b = 0;
    store.subscribe(() => { a += 1; });
    store.subscribe(() => { b += 1; });
    store.update((s) => s);
    assert.equal(a, 1);
    assert.equal(b, 1);
  });
});
