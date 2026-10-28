// Director cues: the end-of-chapter recap, the locked-decision verdict stamp
// and the pulsing Continue button. DOM only, mounted in #game-ui.
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { ui as sound } from './audio.js';
import { reducedMotion, leave, trapTab } from './panel.js';

const RECAP_MS = 3600;
const RECAP_MS_REDUCED = 3000;
const INPUT_GRACE_MS = 300;

// ---------- recap: "Chapter 2 complete · You collected 9 items." ----------

/** Shows a one-line recap of the chapter that just ended. Resolves when dismissed or after a few seconds. */
export function showRecap({ kicker, line }) {
  if (!line) return Promise.resolve();
  return new Promise((resolve) => {
    const openedAt = performance.now();
    const el = h('div', { class: 'gd-recap', role: 'status', 'aria-live': 'polite' },
      h('div', { class: 'gd-recap-card' },
        h('p', { class: 'gd-recap-kicker' }, kicker),
        h('p', { class: 'gd-recap-line' }, line),
        h('p', { class: 'gd-recap-hint', 'aria-hidden': 'true' }, 'Click or press any key')));
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onInput, true);
      leave(el).then(resolve);
    };
    function onInput(e) {
      if (performance.now() - openedAt < INPUT_GRACE_MS) return;
      if (e.type === 'keydown') {
        if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
      }
      finish();
    }
    const timer = window.setTimeout(finish, reducedMotion() ? RECAP_MS_REDUCED : RECAP_MS);
    document.addEventListener('keydown', onInput, true);
    el.addEventListener('pointerdown', onInput);
    gameLayer().append(el);
  });
}

// ---------- verdict: the expert comparison after a lock ----------

/**
 * Stamps a locked decision and shows the expert comparison.
 * opts: { decision, match, yours, expertTitle, feedback, why, consequence }
 * Resolves when the player presses Continue (or Esc).
 */
export function showVerdict(opts) {
  sound('stamp');
  return new Promise((resolve) => {
    const restoreTo = document.activeElement;
    const btn = h('button', { type: 'button', class: 'gd-btn gd-btn-primary' }, 'Continue');
    const card = verdictCard(opts, btn);
    const el = h('div', { class: 'gd-verdict-layer' }, card);
    const close = () => {
      document.removeEventListener('keydown', onKey, true);
      leave(el).then(() => {
        if (restoreTo?.isConnected && typeof restoreTo.focus === 'function') restoreTo.focus({ preventScroll: true });
        resolve();
      });
    };
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      trapTab(e, card);
    }
    btn.addEventListener('click', close, { once: true });
    document.addEventListener('keydown', onKey, true);
    gameLayer().append(el);
    btn.focus({ preventScroll: true });
  });
}

function verdictCard({ decision, match, yours, expertTitle, feedback, why, consequence }, btn) {
  const tone = match ? 'good' : 'warn';
  return h('section', { class: `gd-verdict gd-verdict-${tone}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gd-verdict-title' },
    h('span', { class: 'gd-stamp', 'aria-hidden': 'true' }, match ? 'Matches expert' : 'Filed'),
    h('p', { class: 'gd-verdict-kicker' }, `${decision} · locked`),
    h('h2', { class: 'gd-verdict-title', id: 'gd-verdict-title' }, match ? 'Same choice as the expert.' : `The expert chose: ${expertTitle}`),
    yours ? h('p', { class: 'gd-verdict-yours' }, h('b', {}, 'You chose: '), yours) : null,
    feedback ? h('p', { class: 'gd-verdict-text' }, feedback) : null,
    !match && why ? h('p', { class: 'gd-verdict-why' }, h('b', {}, 'Why the expert chose it: '), why) : null,
    consequence ? h('p', { class: 'gd-verdict-next' }, consequence) : null,
    h('div', { class: 'gd-verdict-actions' }, btn));
}

// ---------- the Continue call to action ----------

let cta = null;
let ctaHandler = null;

/** Shows (or replaces) the pulsing Continue button; null hides it. opts: { label, hint, onClick } */
export function setCta(opts) {
  ctaHandler = opts?.onClick ?? null;
  if (!opts) {
    cta?.remove();
    cta = null;
    return;
  }
  const key = `${opts.label}|${opts.hint ?? ''}`;
  if (cta?.dataset.key === key && cta.isConnected) return;
  cta?.remove();
  const btn = h('button', { type: 'button', class: 'gd-btn gd-btn-primary gd-cta-btn', id: 'gd-cta-btn' },
    h('span', {}, opts.label), h('span', { class: 'gd-cta-arrow', 'aria-hidden': 'true' }, '▸'));
  btn.addEventListener('click', () => { sound('click'); ctaHandler?.(); });
  cta = h('div', { class: 'gd-cta', dataset: { key } },
    opts.hint ? h('p', { class: 'gd-cta-hint' }, opts.hint) : null,
    btn);
  gameLayer().append(cta);
}
