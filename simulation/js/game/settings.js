// Player settings, persisted in localStorage. Sound on/off is owned by
// audio.js (its own key); everything else lives under STORE_KEY.
// showSettings() renders the settings panel; the rest is DOM-free state.
import * as audio from './audio.js';
import { getLang } from '../i18n/i18n.js';

const STORE_KEY = 'rotasa-settings-v1';

export const TEXT_SPEEDS = Object.freeze({ slow: 40, normal: 90, instant: Infinity });

const SCHEMA = Object.freeze({
  volume: { default: 0.8, valid: (v) => typeof v === 'number' && v >= 0 && v <= 1 },
  textSpeed: { default: 'normal', valid: (v) => Object.hasOwn(TEXT_SPEEDS, v) },
  quality: { default: 'high', valid: (v) => v === 'high' || v === 'low' },
  motion: { default: 'system', valid: (v) => ['system', 'on', 'off'].includes(v) },
  designerNotes: { default: false, valid: (v) => typeof v === 'boolean' },
});

const listeners = new Set();
let settings = Object.freeze(load());

function defaults() {
  return Object.fromEntries(Object.entries(SCHEMA).map(([k, s]) => [k, s.default]));
}

// Unknown keys and invalid values from storage fall back to defaults.
function load() {
  const base = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (!raw || typeof raw !== 'object') return base;
    return Object.fromEntries(Object.entries(base).map(([k, d]) => [k, SCHEMA[k].valid(raw[k]) ? raw[k] : d]));
  } catch {
    return base;
  }
}

function persist(next) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private window): settings last for this visit.
  }
}

/** Current settings snapshot: { sound, volume, textSpeed, quality, motion, designerNotes, language }. */
export function getSettings() {
  return Object.freeze({ ...settings, sound: audio.isOn(), language: getLang() });
}

/** Characters per second for the dialogue typewriter (Infinity = instant). */
export function getTextSpeed() {
  return TEXT_SPEEDS[settings.textSpeed];
}

/** True when motion should be reduced: the setting wins, 'system' follows the OS. */
export function prefersReducedMotion() {
  if (settings.motion === 'on') return true;
  if (settings.motion === 'off') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Subscribes to changes; cb(settings, key). Returns an unsubscribe function. */
export function onSettingsChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Validates and stores one setting, applies its side effect, notifies listeners. Returns true when applied. */
export function setSetting(key, value) {
  if (key === 'sound') {
    if (value) audio.enable(); else audio.disable();
    notify(key);
    return true;
  }
  if (!SCHEMA[key] || !SCHEMA[key].valid(value)) return false;
  if (settings[key] === value) return true;
  settings = Object.freeze({ ...settings, [key]: value });
  persist(settings);
  applyOne(key);
  notify(key);
  return true;
}

function notify(key) {
  const snapshot = getSettings();
  listeners.forEach((cb) => {
    try {
      cb(snapshot, key);
    } catch {
      // A broken listener must not stop the others.
    }
  });
}

// ---------- side effects ----------

function applyMotion() {
  const root = document.documentElement;
  if (settings.motion === 'on') root.dataset.motion = 'reduce';
  else if (settings.motion === 'off') root.dataset.motion = 'full';
  else delete root.dataset.motion;
}

// audio.js keeps its master gain private; setVolume is used once it exists.
function applyVolume() {
  if (typeof audio.setVolume === 'function') audio.setVolume(settings.volume);
}

async function applyQuality() {
  if (!window.THREE) return; // No 3D engine on this page, so no world to configure.
  try {
    const mod = await import('../world/world.js');
    const world = mod.getWorld?.();
    if (world && typeof world.setQuality === 'function') world.setQuality(settings.quality);
  } catch {
    // No 3D world on this page: nothing to configure.
  }
}

function applyOne(key) {
  if (key === 'motion') applyMotion();
  else if (key === 'volume') applyVolume();
  else if (key === 'quality') applyQuality();
}

/** Applies every stored setting once at boot (motion attribute, volume, graphics). */
export function applySettings() {
  applyMotion();
  applyVolume();
  return applyQuality();
}

export { showSettings } from './settings-panel.js';
