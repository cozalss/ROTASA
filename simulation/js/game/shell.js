// The game shell: title screen, pause menu, and re-exports of the loading
// screen and the read-only panels. DOM only; works without the 3D world.
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { ui as sound } from './audio.js';
import { logo, menu, leave, trapTab, hasOpenPanel, reducedMotion } from './panel.js';
import { routeBackdrop } from './shell-art.js';
import { showSettings } from './settings.js';
import { showHowToPlay, showCredits } from './shell-panels.js';
import { getLang, setLang } from '../i18n/i18n.js';

export { showLoading } from './loading.js';
export { showHowToPlay, showCredits } from './shell-panels.js';
export { showSettings } from './settings.js';

const TAGLINE = 'One day. Six process areas. Your call.';
const FOOTER = 'TMMi v2.0 · Case: Rotaşa Technology';
const BLOCKERS = '[aria-modal="true"], .g-chapter, .g-dialogue-layer, .sh-loading, .sh-title, #doc-viewer:not([hidden])';

let pauseClose = null;

// ---------- title ----------

function titleItems(opts, askNewGame) {
  return [
    opts.hasSave ? { id: 'continue', label: 'Continue', hint: opts.saveLabel || 'Pick up where you left off', onSelect: opts.onContinue } : null,
    { id: 'new', label: 'New game', hint: 'Start a fresh assessment of Rotaşa', onSelect: opts.hasSave ? askNewGame : opts.onNewGame },
    opts.onTrophies ? { id: 'trophies', label: 'Trophies', hint: 'Marks of good assessment practice', onSelect: opts.onTrophies } : null,
    { id: 'how', label: 'How to play', hint: 'Controls, chapters, ratings', onSelect: opts.onHowToPlay || (() => showHowToPlay()) },
    { id: 'settings', label: 'Settings', hint: 'Sound, text speed, graphics, motion', onSelect: opts.onSettings || (() => showSettings()) },
    { id: 'credits', label: 'Credits', hint: 'Sources and tools', onSelect: opts.onCredits || (() => showCredits()) },
    languageItem(),
  ].filter(Boolean);
}

// Always shown in the other language so a player who cannot read the current one can find it.
function languageItem() {
  const next = getLang() === 'tr' ? { id: 'en', label: 'English', hint: 'Switch the game to English' } : { id: 'tr', label: 'Türkçe', hint: 'Oyunu Türkçe oyna' };
  return { id: 'lang', lang: next.id, label: next.label, hint: next.hint, onSelect: () => setLang(next.id) };
}

function confirmNewGame({ onConfirm, onBack }) {
  const choices = menu([
    { id: 'keep', label: 'Keep my save', hint: 'Back to the menu', onSelect: onBack },
    { id: 'restart', label: 'Start over', hint: 'Your saved assessment will be erased', onSelect: onConfirm },
  ], { label: 'Confirm new game', className: 'sh-menu-confirm' });
  const el = h('div', { class: 'sh-confirm', role: 'group', 'aria-labelledby': 'sh-confirm-title' },
    h('p', { class: 'sh-kicker sh-kicker-warn' }, 'New game'),
    h('h2', { class: 'sh-confirm-title', id: 'sh-confirm-title' }, 'Start a fresh assessment?'),
    h('p', { class: 'sh-confirm-text' }, 'You have an assessment in progress. Starting over erases it on this device.'),
    choices.el);
  return { el, focus: choices.focusFirst };
}

function titleView(opts) {
  const slot = h('div', { class: 'sh-title-slot' });
  const el = h('div', { class: 'sh-title', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Main menu' },
    h('div', { class: 'sh-title-shade', 'aria-hidden': 'true' }),
    routeBackdrop({ cls: 'sh-routes sh-title-routes', still: reducedMotion() }),
    h('div', { class: 'sh-bg-grain', 'aria-hidden': 'true' }),
    h('div', { class: 'sh-title-inner' },
      h('header', { class: 'sh-title-head' },
        h('p', { class: 'sh-kicker sh-title-kicker' }, h('span', { class: 'sh-beacon', 'aria-hidden': 'true' }), 'Informal TMMi assessment · Night shift'),
        logo('xl'),
        h('p', { class: 'sh-tagline' }, TAGLINE)),
      slot),
    h('footer', { class: 'sh-title-foot' },
      h('span', {}, FOOTER),
      h('span', { class: 'sh-title-keys', 'aria-hidden': 'true' }, h('kbd', { class: 'sh-kbd' }, '↑'), h('kbd', { class: 'sh-kbd' }, '↓'), ' choose ', h('kbd', { class: 'sh-kbd' }, 'Enter'), ' select')));
  return { el, slot, opts };
}

/**
 * Shows the title screen over the live world. Returns close(), which resolves
 * when the screen is gone. opts: { hasSave, saveLabel?, onNewGame, onContinue,
 * onSettings?, onHowToPlay?, onCredits?, onTrophies? } (missing panel handlers
 * open the built-in panels; Trophies only appears with onTrophies).
 */
export function showTitle(opts = {}) {
  const view = titleView(opts);
  let open = true;

  const showMenu = (focusId) => {
    const m = menu(titleItems(opts, showConfirm), { label: 'Main menu', className: 'sh-menu-title' });
    view.slot.replaceChildren(m.el);
    const target = focusId && m.el.querySelector(`[data-id="${focusId}"]`);
    if (target) target.focus({ preventScroll: true }); else m.focusFirst();
  };

  function showConfirm() {
    const c = confirmNewGame({
      onBack: () => showMenu('new'),
      onConfirm: () => opts.onNewGame?.(),
    });
    view.slot.replaceChildren(c.el);
    c.focus();
  }

  function onKey(e) {
    if (!open || hasOpenPanel()) return;
    if (e.key === 'Escape' && view.slot.querySelector('.sh-confirm')) {
      e.preventDefault();
      sound('click');
      showMenu('new');
      return;
    }
    trapTab(e, view.el);
  }

  document.addEventListener('keydown', onKey, true);
  gameLayer().append(view.el);
  showMenu();

  return function close() {
    if (!open) return Promise.resolve();
    open = false;
    document.removeEventListener('keydown', onKey, true);
    return leave(view.el);
  };
}

// ---------- pause ----------

/** True when nothing modal is open, so the pause menu may open. */
export function canPause() {
  return !pauseClose && !hasOpenPanel() && !document.querySelector(BLOCKERS);
}

export function isPaused() {
  return Boolean(pauseClose);
}

function pauseItems(opts, close) {
  const then = (fn) => () => { close(); fn?.(); };
  return [
    { id: 'resume', label: 'Resume', hint: 'Back to the office', onSelect: then(opts.onResume) },
    opts.onDossier ? { id: 'dossier', label: 'Dossier', hint: 'Your notes, evidence and decisions', onSelect: then(opts.onDossier) } : null,
    { id: 'settings', label: 'Settings', onSelect: opts.onSettings || (() => showSettings()) },
    opts.onTrophies ? { id: 'trophies', label: 'Trophies', hint: 'Marks of good assessment practice', onSelect: opts.onTrophies } : null,
    { id: 'how', label: 'How to play', onSelect: () => showHowToPlay() },
    { id: 'title', label: 'Quit to title', hint: 'Progress is saved automatically', onSelect: then(opts.onTitle) },
  ].filter(Boolean);
}

/**
 * Opens the pause menu unless a dialogue, chapter card, panel or other modal
 * is open (then nothing happens). opts: { onResume, onDossier, onSettings?,
 * onTrophies?, onTitle, chapterLabel? }. Esc or a click outside resumes. Returns close().
 */
export function showPause(opts = {}) {
  if (!canPause()) return () => {};
  const restoreTo = document.activeElement;
  let open = true;

  const close = (resumed = false) => {
    if (!open) return;
    open = false;
    pauseClose = null;
    document.removeEventListener('keydown', onKey, true);
    leave(root);
    if (restoreTo?.isConnected && typeof restoreTo.focus === 'function') restoreTo.focus({ preventScroll: true });
    if (resumed) opts.onResume?.();
  };

  const m = menu(pauseItems(opts, () => close(false)), { label: 'Pause menu', className: 'sh-menu-pause' });
  const card = h('section', { class: 'sh-pause-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sh-pause-title' },
    h('p', { class: 'sh-kicker' }, opts.chapterLabel || 'Rotaşa Assessment Desk'),
    h('h2', { class: 'sh-pause-title', id: 'sh-pause-title' }, 'Paused'),
    m.el);
  const root = h('div', { class: 'sh-pause' }, routeBackdrop({ cls: 'sh-routes sh-pause-routes', still: true }), card);

  function onKey(e) {
    if (hasOpenPanel()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      sound('click');
      close(true);
      return;
    }
    trapTab(e, card);
  }

  root.addEventListener('pointerdown', (e) => { if (e.target === root) close(true); });
  document.addEventListener('keydown', onKey, true);
  gameLayer().append(root);
  pauseClose = () => close(false);
  m.focusFirst();
  return () => close(false);
}

/**
 * Opens the pause menu on Escape whenever nothing else is open.
 * getOptions() returns the showPause options at the moment of the key press.
 * Listens on window in the capture phase, so it sees the page as it was before
 * any other Escape handler closed something. Returns an unbind function.
 */
export function bindPauseKey(getOptions) {
  const onKey = (e) => {
    if (e.key !== 'Escape' || e.repeat || !canPause()) return;
    e.preventDefault();
    e.stopPropagation();
    showPause(getOptions?.() || {});
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
