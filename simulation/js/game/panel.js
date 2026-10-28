// Shared building blocks for the game shell: stacked modal panels with focus
// trapping, keyboard-navigable vertical menus, and the game logo.
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { ui as sound } from './audio.js';

const LEAVE_MS = 240;
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const stack = [];

export function reducedMotion() {
  const forced = document.documentElement.dataset.motion;
  if (forced === 'reduce') return true;
  if (forced === 'full') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Removes an element after its leave animation (immediately with reduced motion). */
export function leave(el, cls = 'is-leaving') {
  if (!el.isConnected) return Promise.resolve();
  if (reducedMotion()) {
    el.remove();
    return Promise.resolve();
  }
  el.classList.add(cls);
  return new Promise((resolve) => window.setTimeout(() => { el.remove(); resolve(); }, LEAVE_MS));
}

function focusables(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
}

/** Keeps Tab inside root. Returns true when the key was handled. */
export function trapTab(e, root) {
  if (e.key !== 'Tab') return false;
  const items = focusables(root);
  if (!items.length) return false;
  const first = items[0];
  const last = items[items.length - 1];
  const inside = root.contains(document.activeElement);
  if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); return true; }
  if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); return true; }
  return false;
}

/** True while any shell panel is open. */
export function hasOpenPanel() {
  return stack.length > 0;
}

/** The game logo: ROTAŞA in display type, ASSESSMENT DESK as a mono subline. */
export function logo(size = 'xl') {
  return h('div', { class: `sh-logo sh-logo-${size}`, role: 'img', 'aria-label': 'Rotaşa Assessment Desk' },
    h('span', { class: 'sh-logo-word', 'aria-hidden': 'true' }, 'ROTA', h('span', { class: 'sh-logo-s' }, 'Ş'), 'A'),
    h('span', { class: 'sh-logo-sub', 'aria-hidden': 'true' },
      h('span', { class: 'sh-logo-rule' }), 'ASSESSMENT DESK', h('span', { class: 'sh-logo-rule' })));
}

/**
 * Opens a modal panel on top of any open one and returns close().
 * opts: { kicker, title, body: Node|[Node], className, wide, onClose, closeLabel }
 * Escape closes only the topmost panel. Focus returns to where it was.
 */
export function openPanel({ kicker = '', title = '', body = [], className = '', wide = false, onClose, closeLabel = 'Close' } = {}) {
  const uid = Math.random().toString(36).slice(2, 8);
  const restoreTo = document.activeElement;
  const closeBtn = h('button', { type: 'button', class: 'sh-panel-close', 'aria-label': closeLabel },
    h('span', { 'aria-hidden': 'true' }, 'Esc'));
  const card = h('section', {
    class: `sh-panel${wide ? ' is-wide' : ''} ${className}`.trim(),
    role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `sh-panel-${uid}`,
  },
  h('header', { class: 'sh-panel-head' },
    h('div', {},
      kicker ? h('p', { class: 'sh-kicker' }, kicker) : null,
      h('h2', { class: 'sh-panel-title', id: `sh-panel-${uid}` }, title)),
    closeBtn),
  h('div', { class: 'sh-panel-body' }, body));
  const root = h('div', { class: 'sh-scrim' }, card);
  let open = true;

  function close() {
    if (!open) return;
    open = false;
    document.removeEventListener('keydown', onKey, true);
    stack.splice(stack.indexOf(entry), 1);
    leave(root);
    if (restoreTo?.isConnected && typeof restoreTo.focus === 'function') restoreTo.focus({ preventScroll: true });
    onClose?.();
  }

  function onKey(e) {
    if (stack[stack.length - 1] !== entry) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      sound('click');
      close();
      return;
    }
    trapTab(e, card);
  }

  const entry = { root, close };
  closeBtn.addEventListener('click', () => { sound('click'); close(); });
  root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); });
  document.addEventListener('keydown', onKey, true);
  stack.push(entry);
  gameLayer().append(root);
  (focusables(card.querySelector('.sh-panel-body'))[0] || closeBtn).focus({ preventScroll: true });
  return close;
}

/**
 * A vertical game menu. items: [{ id, label, hint?, onSelect }].
 * Up/Down/Home/End move focus (wrapping), hover moves focus, Enter/Space selects.
 * Returns { el, focusFirst, destroy }.
 */
export function menu(items, { label = 'Menu', className = '' } = {}) {
  const buttons = items.map((item, i) => h('button', {
    type: 'button',
    class: 'sh-menu-item',
    'data-id': item.id,
    lang: item.lang,
    style: { '--i': i },
    onClick: () => { sound('click'); item.onSelect?.(); },
  },
  h('span', { class: 'sh-menu-num', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
  h('span', { class: 'sh-menu-text' },
    h('span', { class: 'sh-menu-label' }, item.label),
    item.hint ? h('span', { class: 'sh-menu-hint' }, item.hint) : null),
  h('span', { class: 'sh-menu-arrow', 'aria-hidden': 'true' }, '▸')));

  const el = h('nav', { class: `sh-menu ${className}`.trim(), 'aria-label': label }, h('ul', {}, buttons.map((b) => h('li', {}, b))));

  function move(delta, from) {
    const at = buttons.indexOf(from);
    const next = at < 0 ? 0 : (at + delta + buttons.length) % buttons.length;
    focusItem(buttons[next]);
  }

  function focusItem(btn) {
    if (!btn || btn === document.activeElement) return;
    btn.focus({ preventScroll: true });
    sound('click');
  }

  el.addEventListener('keydown', (e) => {
    const keys = { ArrowDown: () => move(1, e.target), ArrowUp: () => move(-1, e.target),
      Home: () => focusItem(buttons[0]), End: () => focusItem(buttons[buttons.length - 1]) };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  });
  buttons.forEach((b) => b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') focusItem(b); }));

  return {
    el,
    focusFirst: () => buttons[0]?.focus({ preventScroll: true }),
    destroy: () => el.remove(),
  };
}
