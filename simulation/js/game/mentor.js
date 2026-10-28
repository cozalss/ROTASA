// Selin, the player's lead assessor: a short brief at the start of each
// chapter (once per save, or on demand from the HUD "?"), one-time tips, and
// a free line for reactions. She explains the method and never supplies evidence.
//
//   await mentor(3);                 // brief once per save; resolves when closed
//   mentor(3, { force: true });      // the HUD "?" button
//   tip('first-rating', 'Rate from the evidence under each goal.');
//   mentorSay(['Good call.']);       // reaction line, not gated
import { openDialogue } from './dialogue.js';
import { toast, gameLayer } from './toast.js';
import { MENTOR, mentorLines } from './mentor-data.js';
import { enhanceGlossary } from './glossary.js';

export { MENTOR, MENTOR_LINES, GLOSSARY } from './mentor-data.js';
export { enhanceGlossary, showGlossary } from './glossary.js';

/** Dossier blocks that teach terms: concept boxes, step ledes, verdicts. */
export const DOSSIER_GLOSSARY = '[data-glossary], .concept, .step-lede, .verdict, .c-blank';

const STORE_KEY = 'rotasa-mentor-v1';

function readSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      briefs: Array.isArray(raw?.briefs) ? raw.briefs : [],
      tips: Array.isArray(raw?.tips) ? raw.tips : [],
    };
  } catch {
    return { briefs: [], tips: [] };
  }
}

function writeSeen(next) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private window): briefs repeat next visit, nothing breaks.
  }
}

function markSeen(kind, id) {
  const seen = readSeen();
  if (seen[kind].includes(id)) return;
  writeSeen({ ...seen, [kind]: [...seen[kind], id] });
}

/** Forgets which briefs and tips were shown. Call it when a new game starts. */
export function resetMentor() {
  writeSeen({ briefs: [], tips: [] });
}

/** True when the brief for this chapter was already shown in this save. */
export function briefSeen(step) {
  return readSeen().briefs.includes(step);
}

// Dialogue.js has no 'selin' speaker yet: mark the box so css/mentor.css can
// give it Selin's colour and a phone badge.
function markMentorBox(layerBefore) {
  const box = [...gameLayer().querySelectorAll('.g-dialogue')].find((el) => !layerBefore.has(el));
  if (!box) return null;
  box.classList.add('mt-mentor');
  box.style.setProperty('--speaker', MENTOR.color);
  return box.closest('.g-dialogue-layer');
}

// Resolves when the dialogue leaves the DOM, whether closed by the player or
// replaced by another dialogue (dialogue.js skips onClose on replacement).
function whenGone(node, resolve) {
  if (!node) return resolve();
  const obs = new MutationObserver(() => {
    if (node.isConnected) return;
    obs.disconnect();
    resolve();
  });
  obs.observe(gameLayer(), { childList: true });
}

/** Opens a Selin dialogue with these lines. Resolves when it closes. */
export function mentorSay(lines, { choices, onChoose } = {}) {
  const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean).map(String);
  if (!list.length && !choices?.length) return Promise.resolve();
  return new Promise((resolve) => {
    const before = new Set(gameLayer().querySelectorAll('.g-dialogue'));
    openDialogue({ speaker: MENTOR.id, name: MENTOR.name, role: MENTOR.role, lines: list, choices, onChoose });
    whenGone(markMentorBox(before), resolve);
  });
}

/**
 * Selin's brief for a chapter (0–7). Shown once per save unless `force`.
 * Resolves to true when it was shown, false when skipped.
 */
export function mentor(step, { force = false } = {}) {
  const lines = mentorLines(step);
  if (!lines.length || (!force && briefSeen(step))) return Promise.resolve(false);
  markSeen('briefs', step);
  return mentorSay(lines).then(() => true);
}

/** A one-time tip (once per save). Returns true when it was shown now. */
export function tip(id, text) {
  if (!id || !text || readSeen().tips.includes(id)) return false;
  markSeen('tips', id);
  toast(`Tip · ${text}`, 'info');
  const last = gameLayer().querySelector('.g-toasts')?.lastElementChild;
  last?.classList.add('mt-tip');
  return true;
}

/** Director hook (mentor-bridge.js): glossary terms in a freshly rendered dossier screen. */
export function decorate(root) {
  enhanceGlossary(root, { selector: DOSSIER_GLOSSARY });
}

/** Director hook (mentor-bridge.js): a new game shows briefs and tips again. */
export const resetTips = () => resetMentor();

export default mentor;
