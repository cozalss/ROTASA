// Visual-novel dialogue box anchored to the bottom of the viewport.
// Lines type out quickly; click, Enter or Space completes a line, again advances.
// After the last line, optional choices appear (Up/Down, 1-9, Enter).
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { ui as sound } from './audio.js';
import { getTextSpeed, prefersReducedMotion } from './settings.js';
import { translate as t } from '../i18n/i18n.js';

// Picks right after the choices appear are ignored, so a player still pressing
// Enter to skip text does not choose by accident.
const CHOICE_GUARD_MS = 450;
const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Speaker accents (dark-panel safe) and default name plates. */
export const SPEAKERS = Object.freeze({
  murat: { color: '#6f9bf0', name: 'Murat Kaya', role: 'CTO' },
  deniz: { color: '#3cc4b8', name: 'Deniz Arslan', role: 'QA lead' },
  kerem: { color: '#e8b740', name: 'Kerem Demir', role: 'Product owner, Routing & Integration' },
  aylin: { color: '#a9bf52', name: 'Aylin Çelik', role: 'Product owner, Field' },
  ece: { color: '#ad8ff5', name: 'Ece Yılmaz', role: 'Developer, Routing' },
  burak: { color: '#ec6a52', name: 'Burak Şahin', role: 'DevOps' },
  onur: { color: '#9fb0c3', name: 'Onur Kılıç', role: 'Test engineer, Field' },
  selin: { color: '#f08fb0', name: 'Selin', role: 'Your lead assessor · on the phone' },
  assessor: { color: '#ff8a3d', name: 'You', role: 'External assessor' },
  narrator: { color: '#c9d4e0', name: '', role: '' },
});

let active = null;
let peopleModule = null;

function reducedMotion() {
  return prefersReducedMotion();
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·';
}

// The 3D world is optional: load its portrait renderer lazily, never at import time.
function loadPortrait(id) {
  try {
    peopleModule = peopleModule || import('../world/people.js').catch(() => null);
    return peopleModule
      .then((mod) => (mod && typeof mod.getPortrait === 'function' ? mod.getPortrait(id) : null))
      .catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

function renderPortrait(speaker, name, isOpen) {
  const slot = h('div', { class: 'g-dlg-portrait', 'aria-hidden': 'true' },
    h('span', { class: 'g-dlg-avatar' }, speaker === 'narrator' ? '◆' : initials(name)));
  if (speaker === 'narrator') return slot;
  loadPortrait(speaker).then((url) => {
    if (typeof url !== 'string' || !url || !isOpen()) return;
    const img = h('img', { src: url, alt: '', class: 'g-dlg-img', draggable: 'false' });
    img.addEventListener('load', () => slot.classList.add('has-img'), { once: true });
    slot.append(img);
  });
  return slot;
}

function renderChoice(choice, index, onPick) {
  const note = choice.disabled && choice.note ? h('span', { class: 'g-choice-note' }, choice.note) : null;
  return h('li', {},
    h('button', {
      type: 'button',
      class: 'g-choice',
      'data-index': String(index),
      'aria-disabled': choice.disabled ? 'true' : null,
      onClick: () => onPick(index),
    },
    h('span', { class: 'g-choice-key', 'aria-hidden': 'true' }, index < 9 ? String(index + 1) : '·'),
    h('span', { class: 'g-choice-main' },
      h('span', { class: 'g-choice-label' }, choice.label),
      note),
    choice.meta ? h('span', { class: 'g-choice-meta' }, choice.meta) : null));
}

function buildView(opts, ids, isOpen) {
  const info = SPEAKERS[opts.speaker] || SPEAKERS.narrator;
  const name = opts.name ?? info.name;
  const role = opts.role ?? info.role;
  const view = {
    typed: h('span', { class: 'g-dlg-typed' }),
    ghost: h('span', { class: 'g-dlg-ghost' }),
    live: h('p', { class: 'g-sr', id: ids.live, 'aria-live': 'polite' }),
    count: h('span', { class: 'g-dlg-count', 'aria-hidden': 'true' }),
    next: h('button', { type: 'button', class: 'g-dlg-next', 'aria-label': 'Continue' }, h('span', { 'aria-hidden': 'true' }, '▸')),
    choices: h('ol', { class: 'g-dlg-choices', hidden: true, 'aria-label': 'Your reply' }),
    close: opts.dismissible === false ? null : h('button', { type: 'button', class: 'g-dlg-close', 'aria-label': 'Close dialogue' }, 'Esc'),
  };
  view.text = h('div', { class: 'g-dlg-textwrap' },
    h('p', { class: 'g-dlg-text', 'aria-hidden': 'true' }, view.typed, view.ghost), view.live, view.next);
  view.box = h('section', {
    class: `g-dialogue${opts.speaker === 'narrator' ? ' is-narrator' : ''}`,
    role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': ids.name, 'aria-describedby': ids.live,
    style: { '--speaker': info.color },
  },
  renderPortrait(opts.speaker, name || 'Narrator', isOpen),
  h('div', { class: 'g-dlg-body' },
    h('header', { class: 'g-dlg-plate' },
      h('h2', { class: 'g-dlg-name', id: ids.name }, name || 'Narrator'),
      role ? h('span', { class: 'g-dlg-role' }, role) : null,
      view.count, view.close),
    view.text, view.choices));
  view.root = h('div', { class: 'g-dialogue-layer' }, view.box);
  return view;
}

function focusables(root) {
  return [...root.querySelectorAll('button:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Opens the dialogue box (closing any open one) and returns close().
 * opts: { speaker, name?, role?, lines: [string], choices?: [{ id, label, meta?, disabled?, note? }],
 *         onChoose?(id), onClose?(), dismissible?: boolean (default true) }
 * onChoose fires after the box closes, so it may open the next dialogue.
 * onClose fires when the box closes without a choice (Escape, last line, close()).
 */
export function openDialogue(opts = {}) {
  if (active) active('replaced');
  const lines = (opts.lines || []).map((l) => t(String(l)));
  const choices = (opts.choices || []).map((c) => ({ ...c, label: t(c.label), meta: c.meta && t(c.meta), note: c.note && t(c.note) }));
  opts = { ...opts, name: opts.name && t(opts.name), role: opts.role && t(opts.role) };
  const uid = Math.random().toString(36).slice(2, 8);
  const st = { index: 0, shown: 0, typing: false, phase: 'lines', raf: 0, open: true, choicesAt: 0 };
  const restoreTo = document.activeElement;
  const view = buildView(opts, { name: `g-dlg-name-${uid}`, live: `g-dlg-live-${uid}` }, () => st.open);

  function paint() {
    const line = lines[st.index] || '';
    view.typed.textContent = line.slice(0, st.shown);
    view.ghost.textContent = line.slice(st.shown);
    view.box.classList.toggle('is-typing', st.typing);
  }

  function finishLine() {
    window.cancelAnimationFrame(st.raf);
    st.typing = false;
    st.shown = (lines[st.index] || '').length;
    paint();
    if (st.index >= lines.length - 1 && choices.length) showChoices();
  }

  function typeLine() {
    const line = lines[st.index] || '';
    view.live.textContent = line;
    view.count.textContent = lines.length > 1 ? `${st.index + 1} / ${lines.length}` : '';
    const cps = getTextSpeed();
    if (reducedMotion() || !line || !Number.isFinite(cps)) return finishLine();
    st.typing = true;
    st.shown = 0;
    const start = performance.now();
    const tick = (now) => {
      st.shown = Math.min(line.length, Math.floor(((now - start) / 1000) * cps));
      if (st.shown >= line.length) return finishLine();
      paint();
      st.raf = window.requestAnimationFrame(tick);
    };
    paint();
    st.raf = window.requestAnimationFrame(tick);
  }

  function advance() {
    if (st.phase !== 'lines') return;
    if (st.typing) return finishLine();
    if (st.index < lines.length - 1) {
      st.index += 1;
      sound('click');
      return typeLine();
    }
    if (!choices.length) close('end');
  }

  function showChoices() {
    st.phase = 'choices';
    st.choicesAt = performance.now();
    view.box.classList.add('has-choices');
    view.choices.replaceChildren(...choices.map((c, i) => renderChoice(c, i, pick)));
    view.choices.hidden = false;
    view.next.hidden = true;
    const buttons = choiceButtons();
    (buttons.find((b) => !b.hasAttribute('aria-disabled')) || buttons[0])?.focus({ preventScroll: true });
  }

  function choiceButtons() {
    return [...view.choices.querySelectorAll('.g-choice')];
  }

  function pick(index) {
    const choice = choices[index];
    if (!choice || st.phase !== 'choices') return;
    if (performance.now() - (st.choicesAt || 0) < CHOICE_GUARD_MS) return;
    const btn = choiceButtons()[index];
    if (choice.disabled) {
      btn?.focus();
      btn?.classList.remove('is-denied');
      void btn?.offsetWidth;
      btn?.classList.add('is-denied');
      return;
    }
    sound('click');
    teardown();
    opts.onChoose?.(choice.id);
  }

  function moveFocus(delta) {
    const buttons = choiceButtons();
    const at = buttons.indexOf(document.activeElement);
    const next = at < 0 ? 0 : (at + delta + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }

  function trapTab(e) {
    const items = focusables(view.box);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const inside = view.box.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
  }

  function onChoiceKey(e) {
    const digit = DIGIT_KEYS.indexOf(e.key);
    if (e.key === 'ArrowDown') moveFocus(1);
    else if (e.key === 'ArrowUp') moveFocus(-1);
    else if (digit >= 0 && digit < choices.length) pick(digit);
    else return false;
    return true;
  }

  function onLineKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return false;
    const onOwnButton = e.target instanceof HTMLButtonElement && view.box.contains(e.target);
    if (onOwnButton) return false;
    advance();
    return true;
  }

  function onKey(e) {
    if (!st.open || e.isComposing) return;
    if (e.key === 'Tab') return trapTab(e);
    if (e.key === 'Escape') {
      if (opts.dismissible === false) return;
      e.preventDefault();
      e.stopPropagation();
      return close('escape');
    }
    const handled = st.phase === 'choices' ? onChoiceKey(e) : onLineKey(e);
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }

  function teardown() {
    if (!st.open) return false;
    st.open = false;
    window.cancelAnimationFrame(st.raf);
    document.removeEventListener('keydown', onKey, true);
    view.root.remove();
    if (active === close) active = null;
    if (restoreTo && restoreTo.isConnected && typeof restoreTo.focus === 'function') restoreTo.focus({ preventScroll: true });
    return true;
  }

  function close(reason = 'api') {
    if (teardown() && reason !== 'replaced') opts.onClose?.();
  }

  view.next.addEventListener('click', (e) => { e.stopPropagation(); advance(); });
  view.text.addEventListener('click', advance);
  view.root.addEventListener('click', (e) => { if (e.target === view.root) advance(); });
  view.close?.addEventListener('click', () => close('escape'));
  document.addEventListener('keydown', onKey, true);

  gameLayer().append(view.root);
  active = close;
  if (lines.length) {
    typeLine();
    view.next.focus({ preventScroll: true });
  } else if (choices.length) showChoices();
  return () => close('api');
}

export default openDialogue;
