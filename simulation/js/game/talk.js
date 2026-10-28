// Promise helpers over the dialogue box, for scripted scenes.
//   const id = await talk({ speaker: 'murat', lines, choices });   // choice id, 'end' or null (dismissed)
//   const ok = await converse([['assessor', 'Question?'], ['deniz', 'Answer.']]);
import { openDialogue } from './dialogue.js';
import { gameLayer } from './toast.js';

let closeCurrent = null;

// Later boxes in a scripted exchange skip the fade-in, so the scene does not flicker.
function lastLayer() {
  const layers = gameLayer().querySelectorAll('.g-dialogue-layer');
  return layers[layers.length - 1] ?? null;
}

/**
 * Opens a dialogue and resolves with the chosen id, 'end' when the last line
 * was read, or null when the player dismissed it (Esc or the close button).
 */
export function talk(opts, { quick = false } = {}) {
  return new Promise((resolve) => {
    let dismissed = false;
    const onEsc = (e) => { if (e.key === 'Escape' && opts.dismissible !== false) dismissed = true; };
    const done = (value) => {
      window.removeEventListener('keydown', onEsc, true);
      if (closeCurrent === close) closeCurrent = null;
      resolve(value);
    };
    window.addEventListener('keydown', onEsc, true);
    const close = openDialogue({
      ...opts,
      onChoose: (id) => done(id),
      onClose: () => done(dismissed ? null : 'end'),
    });
    closeCurrent = close;
    const layer = lastLayer();
    if (quick) layer?.classList.add('is-quick');
    layer?.querySelector('.g-dlg-close')?.addEventListener('click', () => { dismissed = true; }, { capture: true, once: true });
  });
}

/** Plays [speaker, line] pairs as one exchange. Resolves false when dismissed. */
export async function converse(pairs, alive = () => true) {
  for (let i = 0; i < pairs.length; i += 1) {
    if (!alive()) return false;
    const [speaker, line] = pairs[i];
    const result = await talk({ speaker, lines: [line] }, { quick: i > 0 });
    if (result === null) return false;
  }
  return alive();
}

/** Closes the dialogue opened through talk(), if any. */
export function closeTalk() {
  const close = closeCurrent;
  closeCurrent = null;
  close?.();
}

/** True while any dialogue box is on screen. */
export function isTalking() {
  return Boolean(document.querySelector('#game-ui .g-dialogue-layer'));
}

/** Resolves once no dialogue box is on screen (mentor briefs, other scenes). */
export function whenNoDialogue() {
  if (!isTalking()) return Promise.resolve();
  return new Promise((resolve) => {
    const obs = new MutationObserver(() => {
      if (isTalking()) return;
      obs.disconnect();
      resolve();
    });
    obs.observe(gameLayer(), { childList: true });
  });
}
