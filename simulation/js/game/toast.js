// Short notices stacked bottom-right, above the dialogue box.
// Also owns gameLayer(), the #game-ui container every game overlay mounts into.
import { h } from '../ui/dom.js';
import { translate as t } from '../i18n/i18n.js';

const TOAST_MS = 3400;
const TOAST_MS_LONG = 5200;
const MAX_TOASTS = 4;
const LONG_TEXT = 70;
const TONES = ['info', 'good', 'warn', 'bad', 'player', 'expert'];
const ICONS = { info: '•', good: '✓', warn: '!', bad: '×', player: '+', expert: '◆' };

/** Returns #game-ui, creating it at the end of <body> when the page has none. */
export function gameLayer() {
  const existing = document.getElementById('game-ui');
  if (existing) return existing;
  const layer = h('div', { id: 'game-ui' });
  document.body.append(layer);
  return layer;
}

function stack() {
  const layer = gameLayer();
  const found = layer.querySelector('.g-toasts');
  if (found) return found;
  const created = h('div', { class: 'g-toasts', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' });
  layer.append(created);
  return created;
}

function dismiss(el) {
  if (!el.isConnected || el.classList.contains('is-leaving')) return;
  el.classList.add('is-leaving');
  const remove = () => el.remove();
  el.addEventListener('animationend', remove, { once: true });
  // Reduced motion has no animation, so animationend never fires.
  window.setTimeout(remove, 400);
}

/**
 * Shows a toast. tone: 'info' (default) | 'good' | 'warn' | 'bad' | 'player' | 'expert'.
 * Returns a function that dismisses it early.
 */
export function toast(rawText, tone = 'info') {
  const text = t(rawText);
  const safeTone = TONES.includes(tone) ? tone : 'info';
  const list = stack();
  const el = h('div', { class: `g-toast g-toast-${safeTone}` },
    h('span', { class: 'g-toast-icon', 'aria-hidden': 'true' }, ICONS[safeTone]),
    h('span', { class: 'g-toast-text' }, String(text ?? '')));
  el.addEventListener('click', () => dismiss(el));
  list.append(el);
  const live = list.querySelectorAll('.g-toast:not(.is-leaving)');
  if (live.length > MAX_TOASTS) dismiss(live[0]);
  const ms = String(text ?? '').length > LONG_TEXT ? TOAST_MS_LONG : TOAST_MS;
  const timer = window.setTimeout(() => dismiss(el), ms);
  return () => {
    window.clearTimeout(timer);
    dismiss(el);
  };
}

export default toast;
