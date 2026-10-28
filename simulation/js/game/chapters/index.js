// Chapter registry. Chapters 0–2 ship with the director; 3–7 are loaded on
// demand and replaced by a plain dossier chapter when their module is missing.
import * as ch00 from './ch00.js';
import * as ch01 from './ch01.js';
import * as ch02 from './ch02.js';
import { STEP_TITLES } from '../../ui/components.js';
import { objectiveFor } from '../hud.js';

const BUILT_IN = { 0: ch00, 1: ch01, 2: ch02 };
const LAZY = {
  3: () => import('./ch03.js'),
  4: () => import('./ch04.js'),
  5: () => import('./ch05.js'),
  6: () => import('./ch06.js'),
  7: () => import('./ch07.js'),
};

// Chapter card titles from docs/GAME-DESIGN.md, used when a module has no meta.
export const CARDS = Object.freeze({
  0: { title: 'Night shift', subtitle: 'Rotaşa’s release 4.1 sent deliveries out at the wrong time. You are the external assessor.' },
  1: { title: 'The opening call', subtitle: 'Agree the plan with the CTO: scope, kind of assessment, two interviews.' },
  2: { title: 'A day at Rotaşa', subtitle: 'One day on site. Collect evidence before the time runs out.' },
  3: { title: 'The war room', subtitle: 'Rate each Level 2 goal from the evidence you collected.' },
  4: { title: 'Weakest link', subtitle: 'Decide what you can honestly say about Rotaşa’s maturity.' },
  5: { title: 'The findings meeting', subtitle: 'Present your findings to the CTO and answer his objections.' },
  6: { title: 'The plan', subtitle: 'Spend 400 person-hours where they matter most.' },
  7: { title: 'Six months later', subtitle: 'See what your choices did to Rotaşa, next to the expert’s path.' },
});

const VIEWS = { 3: 'war-room', 4: 'war-room', 5: 'meeting-room', 6: 'war-room', 7: 'overview' };

// A chapter that only stages the world as a backdrop and opens the dossier.
function plainChapter(step) {
  return Object.freeze({
    meta: { step, title: CARDS[step].title, subtitle: CARDS[step].subtitle, objective: objectiveFor },
    enter(ctx) {
      ctx.world.setMode('backdrop');
      ctx.world.setMood('evening');
      ctx.world.setView(VIEWS[step] || 'overview');
      ctx.world.setHotspots([]);
      ctx.dossier.open();
    },
    update() {},
    exit() {},
  });
}

function isChapter(mod) {
  return Boolean(mod && typeof mod.enter === 'function');
}

const cache = new Map();

/** Resolves the chapter module for a step (never rejects). */
export function loadChapter(step) {
  if (BUILT_IN[step]) return Promise.resolve(BUILT_IN[step]);
  if (!cache.has(step)) {
    const load = LAZY[step] ? LAZY[step]() : Promise.reject(new Error('no chapter'));
    cache.set(step, load.then((mod) => (isChapter(mod) ? mod : plainChapter(step))).catch(() => plainChapter(step)));
  }
  return cache.get(step);
}

/** Chapter card data for a module: { number, title, subtitle }. */
export function cardFor(mod, step) {
  const meta = mod?.meta || {};
  return { number: step, title: meta.title || CARDS[step]?.title || STEP_TITLES[step], subtitle: meta.subtitle || CARDS[step]?.subtitle || '' };
}

/** The HUD objective for a module and state ({ text, done, total }). */
export function objectiveOf(mod, state) {
  try {
    const obj = mod?.meta?.objective?.(state);
    if (obj && typeof obj.text === 'string') return { done: 0, total: 0, ...obj };
  } catch {
    // Fall back to the built-in objective.
  }
  return objectiveFor(state);
}
