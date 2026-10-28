// Decorative SVG for the shell: the delivery truck and the drifting route
// lines behind the title and pause screens. All of it is aria-hidden.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  children.forEach((c) => { if (c) el.append(c); });
  return el;
}

/** The game's delivery truck (same shape as the chapter card). */
export function truckSvg(cls = '') {
  return svg('svg', { viewBox: '0 0 34 20', width: 34, height: 20, class: cls, 'aria-hidden': 'true', focusable: 'false' },
    svg('rect', { x: 1, y: 3, width: 20, height: 11, rx: 1.5, class: 'g-truck-body' }),
    svg('path', { d: 'M21 6.5h6l5 5V14H21z', class: 'g-truck-cab' }),
    svg('circle', { cx: 7, cy: 15.5, r: 2.6, class: 'g-truck-wheel' }),
    svg('circle', { cx: 26, cy: 15.5, r: 2.6, class: 'g-truck-wheel' }));
}

// Delivery routes across a 1600x900 map: [path, tone, waypoints].
const ROUTES = [
  ['M-40 720 C 220 640, 360 760, 560 610 S 900 420, 1120 500 S 1460 380, 1660 300', 'player', [[560, 610], [1120, 500]]],
  ['M-40 220 C 180 300, 420 160, 640 260 S 980 420, 1240 300 S 1500 180, 1660 240', 'expert', [[640, 260], [1240, 300]]],
  ['M200 960 C 260 760, 520 700, 700 520 S 980 160, 1180 -40', 'faint', [[700, 520]]],
  ['M-40 470 C 260 520, 520 420, 820 470 S 1300 600, 1660 560', 'faint', [[820, 470]]],
];

const TRUCK_LOOP_S = 46;

// A small truck that drives the player route (SMIL, so it scales with the viewBox).
function routeTruck() {
  const motion = svg('animateMotion', { dur: `${TRUCK_LOOP_S}s`, repeatCount: 'indefinite', rotate: 'auto', path: ROUTES[0][0] });
  return svg('g', { class: 'sh-route-truck' },
    svg('g', { transform: 'translate(-17 -14)' },
      svg('rect', { x: 1, y: 3, width: 20, height: 11, rx: 1.5, class: 'g-truck-body' }),
      svg('path', { d: 'M21 6.5h6l5 5V14H21z', class: 'g-truck-cab' })),
    motion);
}

/** Slowly drifting route lines with waypoints and (unless still) a truck, as an SVG backdrop. */
export function routeBackdrop({ cls = 'sh-routes', still = false } = {}) {
  const lines = ROUTES.map(([d, tone, points], i) => svg('g', { class: `sh-route sh-route-${tone}`, style: `--r:${i}` },
    svg('path', { d, class: 'sh-route-glow' }),
    svg('path', { d, class: 'sh-route-line' }),
    ...points.map(([cx, cy], j) => svg('g', { class: 'sh-waypoint', style: `--w:${i + j}` },
      svg('circle', { cx, cy, r: 14, class: 'sh-waypoint-ring' }),
      svg('circle', { cx, cy, r: 4, class: 'sh-waypoint-dot' })))));
  const grid = svg('pattern', { id: 'sh-grid', width: 64, height: 64, patternUnits: 'userSpaceOnUse' },
    svg('path', { d: 'M64 0H0V64', class: 'sh-grid-line' }));
  return svg('svg', { class: cls, viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', focusable: 'false' },
    svg('defs', {}, grid),
    svg('rect', { width: 1600, height: 900, fill: 'url(#sh-grid)', class: 'sh-grid' }),
    ...lines,
    still ? null : routeTruck());
}
