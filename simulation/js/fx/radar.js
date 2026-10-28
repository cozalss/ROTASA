// Radar chart: six Level 2 process areas, player vs expert, on the N/P/L/F
// scale. Pure SVG built with DOM calls; colours come from CSS classes.
import { translate as t } from '../i18n/i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const LEVELS = ['N', 'P', 'L', 'F'];
const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 112;

function svg(tag, attrs = {}, children = []) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  children.forEach((c) => el.append(c));
  return el;
}

// N sits on the first ring (not the centre) so an all-N shape is still visible.
function radiusFor(rating) {
  const index = LEVELS.indexOf(rating);
  return index < 0 ? 0 : ((index + 1) / LEVELS.length) * RADIUS;
}

function point(i, count, r) {
  const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
  return [CENTER + Math.cos(angle) * r, CENTER + Math.sin(angle) * r];
}

function polygon(series, cls) {
  const pts = series.map((s, i) => point(i, series.length, radiusFor(s.rating)).join(',')).join(' ');
  return svg('polygon', { points: pts, class: cls });
}

/**
 * @param {{id:string, rating:string}[]} player  process area ratings
 * @param {{id:string, rating:string}[] | null} expert  expert ratings, or null to hide
 */
export function radarChart(player, expert) {
  const count = player.length;
  const rings = LEVELS.map((lvl, i) => {
    const r = ((i + 1) / LEVELS.length) * RADIUS;
    const pts = player.map((_, k) => point(k, count, r).join(',')).join(' ');
    const [lx, ly] = point(0, count, r);
    return svg('g', {}, [
      svg('polygon', { points: pts, class: 'radar-ring' }),
      svg('text', { x: lx + 6, y: ly + 4, class: 'radar-ring-label' }, [document.createTextNode(lvl)]),
    ]);
  });
  const spokes = player.map((p, i) => {
    const [x, y] = point(i, count, RADIUS);
    const [lx, ly] = point(i, count, RADIUS + 22);
    return svg('g', {}, [
      svg('line', { x1: CENTER, y1: CENTER, x2: x, y2: y, class: 'radar-spoke' }),
      svg('text', { x: lx, y: ly + 4, 'text-anchor': 'middle', class: 'radar-label' }, [document.createTextNode(p.id)]),
    ]);
  });
  const dots = (series, cls) => series.map((s, i) => {
    const [x, y] = point(i, count, radiusFor(s.rating));
    return radiusFor(s.rating) ? svg('circle', { cx: x, cy: y, r: 4, class: cls }) : null;
  }).filter(Boolean);

  const layers = [...rings, ...spokes];
  if (expert) layers.push(polygon(expert, 'radar-expert'), ...dots(expert, 'radar-dot-expert'));
  layers.push(polygon(player, 'radar-player'), ...dots(player, 'radar-dot-player'));

  const title = t(expert ? 'Process area ratings: yours and the expert’s' : 'Your process area ratings');
  const chart = svg('svg', { viewBox: `-20 -10 ${SIZE + 40} ${SIZE + 20}`, class: 'radar', role: 'img', 'aria-label': title }, [
    svg('title', {}, [document.createTextNode(title)]),
    ...layers,
  ]);

  const legend = document.createElement('div');
  legend.className = 'radar-legend';
  legend.append(legendItem('radar-key-player', 'You'));
  if (expert) legend.append(legendItem('radar-key-expert', 'Expert'));
  legend.append(legendNote('NR (not rated) sits at the centre'));

  // Grow the shapes only when the data changed, not on every stage re-render.
  const signature = JSON.stringify([player, expert]);
  const wrap = document.createElement('figure');
  wrap.className = signature === lastSignature ? 'radar-wrap' : 'radar-wrap is-new';
  lastSignature = signature;
  wrap.append(chart, legend);
  return wrap;
}

let lastSignature = '';

function legendItem(cls, label) {
  const item = document.createElement('span');
  item.className = 'radar-key';
  const swatch = document.createElement('i');
  swatch.className = cls;
  item.append(swatch, document.createTextNode(t(label)));
  return item;
}

function legendNote(text) {
  const note = document.createElement('span');
  note.className = 'radar-note';
  note.textContent = t(text);
  return note;
}
