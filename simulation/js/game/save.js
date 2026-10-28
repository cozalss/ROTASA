// Saved progress in localStorage. Storage can be missing (private window);
// the game then runs without saving.
import { createInitialState } from '../store.js';

const SAVE_KEY = 'rotasa-assessment-v1';

/** True when a game in progress is saved (read before the first save of this visit). */
export function hasSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    return Boolean(saved && typeof saved === 'object' && (saved.maxStep > 0 || saved.step > 0));
  } catch {
    return false;
  }
}

/** The saved state merged over a fresh one, or null. */
export function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return saved && typeof saved === 'object' ? Object.freeze({ ...createInitialState(), ...saved }) : null;
  } catch {
    return null;
  }
}

export function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: the game still works for this visit.
  }
}
