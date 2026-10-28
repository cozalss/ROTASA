// Step 7 route recap: headline scores and the geometry of the "two routes"
// drawing (the expert's straight line, the player's line dipping at every
// decision that left it). Pure functions over pathRows / ratingSummary output.
import { pathRows, ratingSummary } from './outcome.js';

export const GOOD_MOOD_MAX_BAD = 2;

const isOnRoute = (row) => row.status.tone === 'good';

/** The three headline numbers, each as { n, of }. */
export function recapScores(rows, summary) {
  return {
    decisions: { n: rows.filter(isOnRoute).length, of: rows.length },
    accepted: { n: summary.filter((s) => s.tone === 'good').length, of: summary.length },
    off: { n: summary.filter((s) => s.tone === 'bad').length, of: summary.length },
  };
}

/** Everything the recap overlay needs from a game state. */
export function recapFor(state) {
  const rows = pathRows(state);
  const summary = ratingSummary(state);
  return { rows, summary, scores: recapScores(rows, summary), stops: routeStops(rows) };
}

/** One stop per decision row: its chapter number, label and whether it stayed on route. */
export function routeStops(rows) {
  return rows.map((row) => {
    const [chapter, ...rest] = row.step.split(' · ');
    return { chapter, label: rest.join(' · ') || row.step, onRoute: isOnRoute(row), tone: row.status.tone };
  });
}

const round = (n) => Math.round(n * 10) / 10;

/**
 * Layout for the route drawing in a width × height box.
 * Returns { baseline, expert: path d, player: path d, nodes: [{ x, y, onRoute }] }.
 * The player's line runs on the expert's line and dips by `dip` at off-route stops.
 */
export function routeGeometry(stops, { width = 640, height = 160, pad = 24, dip = 46 } = {}) {
  const baseline = round(height * 0.38);
  const span = width - pad * 2;
  const step = stops.length > 1 ? span / (stops.length - 1) : 0;
  const nodes = stops.map((s, i) => ({
    x: round(stops.length > 1 ? pad + step * i : width / 2),
    y: s.onRoute ? baseline : round(baseline + dip),
    onRoute: s.onRoute,
  }));
  const expert = `M${pad} ${baseline}H${width - pad}`;
  return { baseline, expert, player: smoothPath(nodes, pad, width - pad, baseline), nodes };
}

// A smooth line through every node (edge to edge when there are no nodes).
function smoothPath(nodes, x0, x1, baseline) {
  const pts = nodes.length ? nodes : [{ x: x0, y: baseline }, { x: x1, y: baseline }];
  return pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const mid = round((prev.x + p.x) / 2);
    return `${d}C${mid} ${prev.y} ${mid} ${p.y} ${p.x} ${p.y}`;
  }, '');
}

/** Step 7 mood: 'after-good' when at most two consequences went badly. */
export function afterMood(items) {
  const bad = items.filter((c) => c.tone === 'bad').length;
  return bad <= GOOD_MOOD_MAX_BAD ? 'after-good' : 'after-bad';
}
