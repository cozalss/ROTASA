// The dossier: the step screens (#stage) shown as a notebook sheet that slides
// over the world. Without the 3D world it stays open and carries the game.
// The screens re-render on every state change; scroll and focus are kept.
import { h } from '../ui/dom.js';
import { renderProcessMap, renderClock, STEP_TITLES } from '../ui/components.js';
import { animateStepIn } from '../fx/motion.js';

const CLEAR_AFTER_MS = 480;

/**
 * createDossier({ screens, screenCtx, objectiveOf, onGo, onClose, onMenu, onRendered })
 * -> { render(state), open(state), close(), isOpen(), setPinned(bool), scrollTo(selector) }
 */
export function createDossier(opts) {
  const shell = document.querySelector('.app-shell');
  const head = document.getElementById('dossier-head');
  const stage = document.getElementById('stage');
  const st = { open: false, pinned: false, renderedStep: -1, clearTimer: 0, last: null };

  function headView(state) {
    const obj = opts.objectiveOf(state);
    const kicker = state.step === 0 ? 'Dossier · Prologue' : `Dossier · Chapter ${state.step} of 7`;
    const back = st.pinned ? null : h('button', {
      type: 'button', class: 'gd-btn gd-btn-primary gd-dossier-close', id: 'dossier-close', onClick: () => opts.onClose(),
    }, h('span', { 'aria-hidden': 'true' }, '◂ '), 'Back to the office');
    const menu = h('button', { type: 'button', class: 'gd-btn gd-btn-ghost gd-dossier-menu', onClick: () => opts.onMenu() }, 'Menu');
    return [
      h('div', { class: 'gd-dossier-top' },
        h('div', { class: 'gd-dossier-id' },
          h('p', { class: 'gd-dossier-kicker' }, kicker),
          h('h2', { class: 'gd-dossier-title' }, STEP_TITLES[state.step] || ''),
          h('p', { class: 'gd-dossier-obj' }, h('span', { class: 'g-sr' }, 'Objective: '), obj.text)),
        h('div', { class: 'gd-dossier-tools' }, renderClock(state), menu, back)),
      h('nav', { class: 'process-map gd-dossier-route', 'aria-label': 'Chapters' }, renderProcessMap(state, opts.onGo)),
    ];
  }

  function keepFocus(focusId) {
    if (focusId && !document.activeElement?.id) document.getElementById(focusId)?.focus({ preventScroll: true });
  }

  function paint(state) {
    head.replaceChildren(...headView(state));
    const scrollTop = shell.scrollTop;
    const focusId = document.activeElement?.id;
    const screen = opts.screens[state.step];
    stage.replaceChildren(screen.render(state, opts.screenCtx));
    if (st.renderedStep !== state.step) {
      shell.scrollTop = 0;
      animateStepIn(stage);
      st.renderedStep = state.step;
    } else {
      shell.scrollTop = scrollTop;
      keepFocus(focusId);
    }
    opts.onRendered?.(stage);
  }

  function setOpenClass(on) {
    document.body.classList.toggle('dossier-open', on);
    shell.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) shell.removeAttribute('inert'); else shell.setAttribute('inert', '');
  }

  return {
    render(state) {
      st.last = state;
      if (st.open) paint(state);
    },
    open(state = st.last) {
      window.clearTimeout(st.clearTimer);
      if (!state) return;
      const wasOpen = st.open;
      st.open = true;
      st.last = state;
      paint(state);
      setOpenClass(true);
      if (!wasOpen && !st.pinned) document.getElementById('dossier-close')?.focus({ preventScroll: true });
    },
    close() {
      if (!st.open || st.pinned) return;
      st.open = false;
      setOpenClass(false);
      // Empty the hidden sheet once it has slid away (stops the briefing's 3D scene).
      st.clearTimer = window.setTimeout(() => {
        if (st.open) return;
        stage.replaceChildren();
        st.renderedStep = -1;
      }, CLEAR_AFTER_MS);
    },
    isOpen: () => st.open,
    isPinned: () => st.pinned,
    setPinned(on, state = st.last) {
      st.pinned = Boolean(on);
      document.body.classList.toggle('dossier-pinned', st.pinned);
      if (st.pinned) this.open(state);
    },
    scrollTo(selector) {
      const target = stage.querySelector(selector);
      target?.scrollIntoView({ block: 'start' });
    },
  };
}
