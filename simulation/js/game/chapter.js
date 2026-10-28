// Full-screen cinematic chapter card shown between steps.
// Auto-dismisses after ~2.2 s, or earlier on click or key. A second call
// replaces the card on screen (the first promise resolves at once).
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { ui as sound } from './audio.js';
import { translate as t } from '../i18n/i18n.js';

const SHOW_MS = 2200;
const SHOW_MS_REDUCED = 1400;
const LEAVE_MS = 380;
const INPUT_GRACE_MS = 280;
const SVG_NS = 'http://www.w3.org/2000/svg';
const STOPS = 7;

let current = null;

function reducedMotion() {
  const pref = document.documentElement.dataset.motion;
  if (pref) return pref === 'reduce';
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  children.forEach((c) => el.append(c));
  return el;
}

function truck() {
  return svg('svg', { viewBox: '0 0 34 20', width: 34, height: 20, class: 'g-chapter-truck', 'aria-hidden': 'true' },
    svg('rect', { x: 1, y: 3, width: 20, height: 11, rx: 1.5, class: 'g-truck-body' }),
    svg('path', { d: 'M21 6.5h6l5 5V14H21z', class: 'g-truck-cab' }),
    svg('circle', { cx: 7, cy: 15.5, r: 2.6, class: 'g-truck-wheel' }),
    svg('circle', { cx: 26, cy: 15.5, r: 2.6, class: 'g-truck-wheel' }));
}

// Seven stops, one per step; the truck drives from the previous stop to this one.
function route(number) {
  const n = Math.max(0, Math.min(STOPS, Number(number) || 0));
  const to = n === 0 ? 0 : (n - 1) / (STOPS - 1);
  const from = n <= 1 ? -0.12 : (n - 2) / (STOPS - 1);
  const stops = Array.from({ length: STOPS }, (_, i) => h('span', {
    class: `g-chapter-stop${i < n ? ' is-reached' : ''}`,
    style: { '--i': i },
  }));
  return h('div', { class: 'g-chapter-route', 'aria-hidden': 'true', style: { '--from': from.toFixed(3), '--to': to.toFixed(3) } },
    h('span', { class: 'g-chapter-line' }),
    stops,
    h('span', { class: 'g-chapter-lane' }, truck()));
}

function label(number) {
  if (number === 0 || number === '0') return 'Prologue';
  const n = Number(number);
  return Number.isFinite(n) ? `Chapter ${String(n).padStart(2, '0')}` : `Chapter ${number}`;
}

function buildCard({ number, title, subtitle }) {
  const kicker = label(number);
  return h('div', {
    class: 'g-chapter',
    role: 'status',
    'aria-live': 'polite',
    'aria-label': [kicker, title, subtitle].filter(Boolean).join('. '),
  },
  h('div', { class: 'g-chapter-grain', 'aria-hidden': 'true' }),
  h('div', { class: 'g-chapter-inner', 'aria-hidden': 'true' },
    h('p', { class: 'g-chapter-num' }, kicker),
    h('h2', { class: 'g-chapter-title' }, title || ''),
    subtitle ? h('p', { class: 'g-chapter-sub' }, subtitle) : null,
    route(number)),
  h('p', { class: 'g-chapter-hint', 'aria-hidden': 'true' }, 'Click or press any key'));
}

/** Shows a chapter title card. Resolves when it is dismissed. */
export function showChapter({ number = '', title = '', subtitle = '' } = {}) {
  if (current) current.finish(true);
  return new Promise((resolve) => {
    const el = buildCard({ number, title: t(title), subtitle: t(subtitle) });
    const openedAt = performance.now();
    let done = false;

    const finish = (instant = false) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onInput, true);
      el.removeEventListener('pointerdown', onInput);
      if (current?.el === el) current = null;
      if (instant || reducedMotion()) el.remove();
      else {
        el.classList.add('is-leaving');
        window.setTimeout(() => el.remove(), LEAVE_MS);
      }
      resolve();
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

    const timer = window.setTimeout(() => finish(), reducedMotion() ? SHOW_MS_REDUCED : SHOW_MS);
    document.addEventListener('keydown', onInput, true);
    el.addEventListener('pointerdown', onInput);
    current = { el, finish };
    gameLayer().append(el);
    sound('chapter');
  });
}

export default showChapter;
