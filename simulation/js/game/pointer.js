// Idle pointer: after a few seconds without input, an arrow bobs over the
// suggested next place in the office. Any input hides it and restarts the wait.
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';

const IDLE_MS = 6000;
const INPUTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
const BLOCKERS = '.g-dialogue-layer, .g-chapter, .gd-recap, .gd-verdict-layer, .sh-title, .sh-pause, .sh-scrim, .sh-loading';

/**
 * createPointer(world, canShow) -> { pointTo(anchor|null), dispose() }
 * canShow() lets the director veto the arrow (dossier open, world not explorable).
 */
export function createPointer(world, canShow = () => true) {
  const el = h('div', { class: 'gd-pointer', 'aria-hidden': 'true', hidden: true },
    h('span', { class: 'gd-pointer-arrow' }), h('span', { class: 'gd-pointer-ring' }));
  gameLayer().append(el);
  let anchor = null;
  let timer = 0;
  let raf = 0;

  function hide() {
    el.hidden = true;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function blocked() {
    return !anchor || !canShow() || !world.isAvailable() || document.querySelector(BLOCKERS);
  }

  function track() {
    if (blocked()) { hide(); return; }
    const p = world.screenPosition(anchor);
    el.hidden = !p.visible;
    el.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
    raf = window.requestAnimationFrame(track);
  }

  function arm() {
    window.clearTimeout(timer);
    hide();
    if (!anchor) return;
    timer = window.setTimeout(() => { if (!blocked()) track(); else arm(); }, IDLE_MS);
  }

  INPUTS.forEach((type) => window.addEventListener(type, arm, { passive: true, capture: true }));

  return {
    pointTo(next) {
      if (next === anchor) return;
      anchor = next || null;
      arm();
    },
    dispose() {
      window.clearTimeout(timer);
      hide();
      INPUTS.forEach((type) => window.removeEventListener(type, arm, { capture: true }));
      el.remove();
    },
  };
}
