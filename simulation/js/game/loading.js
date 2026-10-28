// Full-screen loading screen: logo, a route progress bar with a moving truck
// and rotating tips. Progress follows resolved tasks; it never hangs.
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { logo, leave, reducedMotion } from './panel.js';
import { truckSvg } from './shell-art.js';
import { translate as t } from '../i18n/i18n.js';

const MIN_MS = 900;
const TIMEOUT_MS = 8000;
const TIP_MS = 3600;
const CREEP_MAX = 0.12;
const STOPS = 7;
const EASE = 0.12;

export const TIPS = Object.freeze([
  'A process area is only as strong as its weakest goal.',
  'In an informal assessment you report findings, not a rating.',
  'Every organization is at least TMMi Level 1. The question is what stands between it and Level 2.',
  'Findings are reported by role and process area, never by person.',
  'A document tells you what should happen. An interview tells you what does.',
  'Time on site is limited: re-testing the product is not assessing the process.',
  'Level 2 is staged: all six process areas must reach Largely or Fully.',
  'A "?" is an honest rating when the key evidence was never collected.',
  'The sponsor owns the findings, not the names behind them.',
  'Release 4.1 went out with 73% of the regression run. Ask why, not who.',
]);

function toRunner(task) {
  return () => Promise.resolve().then(() => (typeof task === 'function' ? task() : task));
}

function routeBar() {
  const stops = Array.from({ length: STOPS }, (_, i) => h('span', { class: 'sh-load-stop', style: { '--i': i } }));
  const fill = h('span', { class: 'sh-load-fill' });
  const lane = h('span', { class: 'sh-load-lane' }, truckSvg('sh-load-truck'));
  const bar = h('div', {
    class: 'sh-load-route', role: 'progressbar', 'aria-label': 'Loading',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
  }, h('span', { class: 'sh-load-road' }), fill, stops, lane);
  return { bar, set: (p) => setProgress(bar, p) };
}

function setProgress(bar, p) {
  const pct = Math.round(p * 100);
  bar.style.setProperty('--p', p.toFixed(3));
  bar.setAttribute('aria-valuenow', String(pct));
  bar.querySelectorAll('.sh-load-stop').forEach((s, i) => s.classList.toggle('is-reached', i / (STOPS - 1) <= p + 0.001));
}

function tipRotator(el) {
  let index = Math.floor(Math.random() * TIPS.length);
  const show = () => {
    el.classList.remove('is-in');
    void el.offsetWidth;
    el.textContent = t(TIPS[index % TIPS.length]);
    el.classList.add('is-in');
    index += 1;
  };
  show();
  const timer = window.setInterval(show, TIP_MS);
  return () => window.clearInterval(timer);
}

function buildScreen(label) {
  const route = routeBar();
  const pct = h('span', { class: 'sh-load-pct', 'aria-hidden': 'true' }, '000');
  const tip = h('p', { class: 'sh-load-tip-text' });
  const el = h('div', { class: 'sh-loading', role: 'status', 'aria-live': 'polite', 'aria-busy': 'true' },
    h('div', { class: 'sh-bg-grain', 'aria-hidden': 'true' }),
    h('div', { class: 'sh-loading-inner' },
      logo('lg'),
      h('div', { class: 'sh-load-meta' },
        h('span', { class: 'sh-load-label' }, label),
        pct),
      route.bar,
      h('div', { class: 'sh-load-tip' },
        h('span', { class: 'sh-kicker' }, 'Field note'),
        tip)));
  return { el, route, pct, tip };
}

/**
 * Shows the loading screen until every task settles (or TIMEOUT_MS passes),
 * for at least MIN_MS. tasks: [Promise | () => Promise]. Resolves with
 * Promise.allSettled-style results; a timed-out task reports { status: 'timeout' }.
 */
export function showLoading({ tasks = [], label = 'Preparing the office' } = {}) {
  const view = buildScreen(label);
  const runners = tasks.map(toRunner);
  const results = new Array(runners.length).fill(null);
  const startedAt = performance.now();
  let settled = 0;
  let raf = 0;
  gameLayer().append(view.el);
  const stopTips = tipRotator(view.tip);

  let shown = 0;
  // Real progress leaves a small share for a slow creep, so the truck keeps
  // moving while one task is slow; it never outruns the minimum display time.
  const target = () => {
    const real = runners.length ? settled / runners.length : 1;
    const elapsed = performance.now() - startedAt;
    const creep = CREEP_MAX * Math.min(1, elapsed / TIMEOUT_MS);
    const base = real === 1 ? 1 : real * (1 - CREEP_MAX) + creep;
    return Math.min(elapsed / MIN_MS, base);
  };

  const paint = () => {
    shown = Math.min(1, Math.max(shown, shown + (target() - shown) * EASE));
    view.route.set(shown);
    view.pct.textContent = String(Math.round(shown * 100)).padStart(3, '0');
    raf = window.requestAnimationFrame(paint);
  };
  paint();

  const tracked = runners.map((run, i) => run().then(
    (value) => { results[i] = { status: 'fulfilled', value }; },
    (reason) => { results[i] = { status: 'rejected', reason }; },
  ).finally(() => { settled += 1; }));

  const all = Promise.all(tracked);
  const timeout = new Promise((r) => window.setTimeout(r, TIMEOUT_MS));
  const minimum = new Promise((r) => window.setTimeout(r, MIN_MS));

  return Promise.all([Promise.race([all, timeout]), minimum]).then(() => {
    settled = runners.length;
    window.cancelAnimationFrame(raf);
    view.route.set(1);
    view.pct.textContent = '100';
    view.el.setAttribute('aria-busy', 'false');
    stopTips();
    const finalResults = results.map((r) => r || { status: 'timeout' });
    const hold = reducedMotion() ? 0 : 260;
    return new Promise((resolve) => window.setTimeout(() => {
      leave(view.el, 'is-done').then(() => resolve(finalResults));
    }, hold));
  });
}

export default showLoading;
