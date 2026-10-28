// Guarded link to js/game/mentor.js (Selin, one-time tips, glossary). The
// module is optional: when it is missing or fails, every call is a no-op.
import { whenNoDialogue } from './talk.js';
import { toast } from './toast.js';

let mod = null;

/** Loads mentor.js once. Resolves true when it is available. */
export function loadMentor() {
  if (!mod) mod = import('./mentor.js').catch(() => null);
  return mod.then(Boolean);
}

function call(name, ...args) {
  return (mod || Promise.resolve(null)).then((m) => {
    const fn = m?.[name];
    if (typeof fn !== 'function') return undefined;
    try {
      return fn(...args);
    } catch {
      return undefined;
    }
  });
}

/**
 * Selin's chapter brief. Resolves after it is closed (whether mentor() returns
 * a promise or not), so a chapter can open its own dialogue afterwards.
 */
export async function mentor(step, opts = {}) {
  try {
    await call('mentor', step, opts);
  } catch {
    // A failed brief never blocks the chapter.
  }
  await whenNoDialogue();
}

const shownHere = new Set();

/** One-time tip (shown once per save). Without mentor.js it falls back to a toast once per visit. */
export function tip(id, text) {
  return (mod || Promise.resolve(null)).then((m) => {
    if (typeof m?.tip === 'function') return call('tip', id, text);
    if (shownHere.has(id)) return undefined;
    shownHere.add(id);
    toast(text, 'expert');
    return undefined;
  });
}

/** Optional: glossary tooltips inside a freshly rendered dossier screen. */
export function decorate(root) {
  return call('decorate', root);
}

/** Optional: forget shown tips (new game). */
export function resetTips() {
  return call('resetTips');
}
