// Step 7 route recap: a full-screen reveal before the debrief. Three big
// scores, the two routes (expert: teal dashed line; you: orange line that dips
// at every decision that left the expert's route), and the achievements.
//
//   const close = showRecap(state, { onDebrief: () => ctx.dossier.open() });
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { trapTab } from './panel.js';
import { prefersReducedMotion } from './settings.js';
import { recapFor, routeGeometry } from '../logic/recap.js';
import { ACHIEVEMENTS, evaluateAchievements } from '../logic/achievements.js';
import { translate as t } from '../i18n/i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 640;
const H = 170;
const DRAW_MS = 1600;

let active = null;

function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  children.forEach((c) => el.append(c));
  return el;
}

function scoreTile(score, label, tone) {
  return h('li', { class: `rc-score rc-${tone}` },
    h('b', { class: 'rc-score-n' }, String(score.n), h('span', { class: 'rc-score-of' }, ` / ${score.of}`)),
    h('span', { class: 'rc-score-label' }, label));
}

function nodeMarks(geo, stops) {
  return geo.nodes.map((n, i) => {
    const g = svg('g', { class: `rc-node ${n.onRoute ? 'is-on' : 'is-off'}`, style: `--i:${i}` });
    if (!n.onRoute) g.append(svg('line', { x1: n.x, y1: geo.baseline, x2: n.x, y2: n.y, class: 'rc-drop' }));
    g.append(svg('circle', { cx: n.x, cy: n.y, r: n.onRoute ? 5 : 6.5, class: 'rc-dot' }));
    const first = i === 0 || stops[i - 1].chapter !== stops[i].chapter;
    if (first) g.append(svg('text', { x: n.x, y: H - 10, class: 'rc-ch' }, document.createTextNode(stops[i].chapter)));
    return g;
  });
}

function routeSvg(stops) {
  const geo = routeGeometry(stops, { width: W, height: H - 26 });
  const offCount = stops.filter((s) => !s.onRoute).length;
  const player = svg('path', { d: geo.player, class: 'rc-line-player' });
  const chart = svg('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'rc-svg', role: 'img', focusable: 'false',
    'aria-label': t(`Your route next to the expert's: ${stops.length - offCount} of ${stops.length} decisions on the expert's route, ${offCount} off it.`),
  },
  svg('path', { d: geo.expert, class: 'rc-line-expert' }),
  player,
  ...nodeMarks(geo, stops));
  return { chart, player };
}

// Draw the player's line once (static with reduced motion).
function animateRoute(player) {
  if (prefersReducedMotion() || typeof player.getTotalLength !== 'function') return;
  const len = Math.ceil(player.getTotalLength());
  player.style.strokeDasharray = `${len}`;
  player.style.strokeDashoffset = `${len}`;
  player.getBoundingClientRect();
  requestAnimationFrame(() => {
    player.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
    player.style.strokeDashoffset = '0';
  });
}

function offList(stops) {
  const off = stops.filter((s) => !s.onRoute);
  if (!off.length) return h('p', { class: 'rc-off-none' }, 'You never left the expert’s route.');
  return h('ol', { class: 'rc-off-list' },
    off.map((s) => h('li', { class: `rc-off-item tone-${s.tone}` },
      h('span', { class: 'rc-off-ch' }, `Ch. ${s.chapter}`), h('span', {}, s.label))));
}

function achievementRow(state) {
  const unlocked = new Set(evaluateAchievements(state));
  return h('section', { class: 'rc-ach', 'aria-labelledby': 'rc-ach-title' },
    h('h3', { class: 'rc-h3', id: 'rc-ach-title' }, `Achievements · ${unlocked.size} of ${ACHIEVEMENTS.length}`),
    h('ul', { class: 'rc-ach-list' },
      ACHIEVEMENTS.map((a) => {
        const on = unlocked.has(a.id);
        return h('li', { class: `rc-ach-item${on ? ' is-on' : ''}`, title: on ? a.description : a.hint },
          h('span', { class: 'rc-ach-icon', 'aria-hidden': 'true' }, a.icon),
          h('span', { class: 'rc-ach-title' }, a.title),
          h('span', { class: 'g-sr' }, on ? ', unlocked' : ', locked'));
      })));
}

function buildCard(state, close, onDebrief) {
  const { scores, stops } = recapFor(state);
  const { chart, player } = routeSvg(stops);
  const debrief = h('button', { type: 'button', class: 'rc-btn rc-btn-primary', onClick: () => { close(); onDebrief?.(); } }, 'Open the full debrief');
  const card = h('section', { class: 'rc-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'rc-title' },
    h('header', { class: 'rc-head' },
      h('div', {}, h('p', { class: 'rc-kicker' }, 'Six months later · Debrief'), h('h2', { class: 'rc-title', id: 'rc-title' }, 'Your route')),
      h('button', { type: 'button', class: 'rc-close', 'aria-label': 'Close the recap', onClick: close }, h('span', { 'aria-hidden': 'true' }, 'Esc'))),
    h('ul', { class: 'rc-scores', 'aria-label': 'Scores' },
      scoreTile(scores.decisions, 'decisions on the expert’s route', 'expert'),
      scoreTile(scores.accepted, 'goal ratings the expert accepts', 'good'),
      scoreTile(scores.off, 'goal ratings far off or unsupported', 'bad')),
    h('figure', { class: 'rc-route' },
      chart,
      h('figcaption', { class: 'rc-legend' },
        h('span', { class: 'rc-key rc-key-expert' }, 'Expert route'),
        h('span', { class: 'rc-key rc-key-player' }, 'Your route'),
        h('span', { class: 'rc-key-note' }, 'Numbers are chapters. Each dip is a decision that left the expert’s route.'))),
    h('section', { class: 'rc-off', 'aria-labelledby': 'rc-off-title' },
      h('h3', { class: 'rc-h3', id: 'rc-off-title' }, 'Where you left it'), offList(stops)),
    achievementRow(state),
    h('footer', { class: 'rc-foot' },
      h('button', { type: 'button', class: 'rc-btn', onClick: close }, 'Keep walking'), debrief));
  return { card, player, debrief };
}

/** Shows the recap overlay. Returns close(). onDebrief runs after "Open the full debrief". */
export function showRecap(state, { onDebrief, onClose } = {}) {
  active?.();
  const restoreTo = document.activeElement;
  let root = null;
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    trapTab(e, root);
  };
  function close() {
    if (!root) return;
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    root = null;
    if (active === close) active = null;
    if (restoreTo?.isConnected) restoreTo.focus?.({ preventScroll: true });
    onClose?.();
  }
  const { card, player, debrief } = buildCard(state, close, onDebrief);
  root = h('div', { class: `rc-scrim${prefersReducedMotion() ? ' is-static' : ''}` }, card);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  document.addEventListener('keydown', onKey, true);
  gameLayer().append(root);
  active = close;
  animateRoute(player);
  debrief.focus({ preventScroll: true });
  return close;
}

export default showRecap;
