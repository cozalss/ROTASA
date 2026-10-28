// Chapter 7 · Six months later. The office in the after-good or after-bad
// mood; one marker per consequence, pinned where it happened. Picking one
// walks you there and shows the story in a speech bubble. The Debrief bar
// opens the route recap, then the dossier's reflect screen.
import { h } from '../../ui/dom.js';
import { gameLayer } from '../toast.js';
import { consequences } from '../../logic/outcome.js';
import { afterMood } from '../../logic/recap.js';
import { showRecap } from '../recap.js';
import { consequenceSpots } from './ch07-spots.js';
import { worldOn, withWorld, clearWorld, tipOnce } from './kit.js';
import { translate as t } from '../../i18n/i18n.js';

const st = { ctx: null, spots: [], visited: new Set(), bar: null, closeRecap: null };

export const meta = {
  step: 7,
  title: 'Six months later',
  subtitle: 'Walk the office and see what your decisions did.',
  objective() {
    const n = st.spots.length;
    const done = st.visited.size;
    const text = n && done < n && worldOn(st.ctx)
      ? `Walk the office · ${done} of ${n} stories seen`
      : 'Open the debrief to compare your route with the expert’s.';
    return { text, done, total: n };
  },
};

function hotspots() {
  return st.spots.map((s) => ({
    id: s.id, anchor: s.anchor, kind: 'event', label: s.label, sublabel: s.sublabel,
    state: st.visited.has(s.id) ? 'done' : 'available',
  }));
}

function announce(text) {
  const live = st.bar?.querySelector('.af-live');
  if (live) live.textContent = t(text);
}

function visit(id) {
  const spot = st.spots.find((s) => s.id === id);
  if (!spot || !st.ctx) return;
  st.visited.add(id);
  withWorld(st.ctx, (w) => {
    w.setHotspots(hotspots());
    Promise.resolve(w.setPerson('assessor', { anchor: spot.anchor, state: 'idle' })).then(() => { if (st.ctx) w.say('assessor', spot.text); });
  });
  announce(`${spot.label}. ${spot.text}`);
  refreshBar();
  st.ctx.refresh?.();
  if (st.visited.size === st.spots.length) tipOnce(st.ctx, 'after-all-seen', 'You have seen every story. Open the debrief to see your whole route.');
}

function openRecap() {
  if (!st.ctx) return;
  const ctx = st.ctx;
  st.closeRecap = showRecap(ctx.store.get(), { onDebrief: () => ctx.dossier.open() });
}

function buildBar() {
  return h('div', { class: 'af-bar', role: 'region', 'aria-label': 'Six months later' },
    h('p', { class: 'af-count' }),
    h('button', { type: 'button', class: 'af-debrief', onClick: openRecap }, 'Debrief'),
    h('p', { class: 'af-live g-sr', 'aria-live': 'polite' }));
}

function refreshBar() {
  if (!st.bar) return;
  const n = st.spots.length;
  const all = st.visited.size >= n;
  st.bar.querySelector('.af-count').textContent = t(worldOn(st.ctx)
    ? `${st.visited.size} of ${n} stories seen`
    : 'The six-month stories are in the debrief.');
  st.bar.querySelector('.af-debrief').classList.toggle('is-ready', all || !worldOn(st.ctx));
}

function stageWorld(ctx, state, items) {
  withWorld(ctx, (w) => {
    w.setMode('explore');
    w.setMood(afterMood(items));
    w.setView('overview');
    w.setHotspots(hotspots(), visit);
    if (state.improve.first === 'owner') w.setPerson('deniz', { anchor: 'qa-desk', state: 'typing' });
  });
}

export function enter(ctx) {
  const state = ctx.store.get();
  const items = consequences(state);
  st.ctx = ctx;
  st.spots = consequenceSpots(items);
  st.visited = new Set();
  ctx.dossier?.close?.();
  stageWorld(ctx, state, items);
  st.bar?.remove();
  st.bar = buildBar();
  gameLayer().append(st.bar);
  refreshBar();
  Promise.resolve(ctx.mentor?.(meta.step)).then(() => {
    if (st.ctx === ctx && worldOn(ctx)) tipOnce(ctx, 'after-markers', 'Each glowing marker is one consequence, pinned where it happened. Click one to walk there.');
  });
}

export function update() {
  refreshBar();
}

export function exit(ctx) {
  st.closeRecap?.();
  st.closeRecap = null;
  st.bar?.remove();
  st.bar = null;
  st.ctx = null;
  clearWorld(ctx);
}

/** Opens the route recap (also for the director, e.g. from a menu). */
export { openRecap };
