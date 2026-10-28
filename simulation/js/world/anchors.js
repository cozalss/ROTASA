// Named spots in the office, camera presets and the walking graph.
// Plain data plus a tiny shortest-path search; no THREE needed.
//
// Floor plan (x to the right, z towards the viewer), office floor is x -12..12, z -8..8:
//   back row  (z -8..-3.6): CTO office · meeting room · server room · integration · DevOps
//   middle    (z -2.4..2.2): QA · routing · field · kanban · product owners
//   front     (z 3..8):     war room · lounge · mail desk · coffee · entrance
// yaw 0 faces +z (towards the camera side); yaw PI faces -z.

const PI = Math.PI;

// pos: the prop or desk; stand: where a visitor stands; via: graph node the stand
// connects to; marker: hotspot marker height; seats: [x, z, yaw] for people;
// exits: per seat, the way out from the chair to open floor (default: straight back).
export const ANCHORS = {
  entrance:          { pos: [10.2, 7.4], stand: [10.2, 6.2], via: 'b13', marker: 1.4 },
  'cto-office':      { pos: [-9.8, -6.2], stand: [-9.6, -4.7], via: 'c1', marker: 1.9, seats: [[-9.8, -6.95, 0]],
    exits: [[[-8.45, -6.95], [-8.45, -4.6]]] },
  'meeting-room':    { pos: [-4.7, -5.8], stand: [-4.7, -4.3], via: 'm1', marker: 1.4,
    seats: [[-5.6, -6.75, 0], [-4.7, -6.75, 0], [-3.8, -6.75, 0], [-5.6, -4.85, PI], [-3.8, -4.85, PI], [-6.35, -5.8, PI / 2]],
    exits: [
      [[-5.6, -7.35], [-6.85, -7.35], [-6.85, -4.3]], [[-4.7, -7.35], [-2.65, -7.35], [-2.65, -4.3]],
      [[-3.8, -7.35], [-2.65, -7.35], [-2.65, -4.3]], [[-5.6, -4.3]], [[-3.8, -4.3]], [[-6.85, -5.8], [-6.85, -4.3]],
    ] },
  'qa-desk':         { pos: [-9.4, -0.4], stand: [-9.4, 0.75], via: 'b2', marker: 1.9, seats: [[-9.4, -1.05, 0]] },
  'routing-desk':    { pos: [-5.0, -0.4], stand: [-5.0, 0.75], via: 'b5', marker: 1.9, seats: [[-5.0, -1.05, 0]] },
  'field-desk':      { pos: [1.0, -0.4], stand: [1.0, 0.75], via: 'b8', marker: 1.9, seats: [[1.0, -1.05, 0]] },
  'integration-desk': { pos: [4.2, -6.4], stand: [4.2, -4.9], via: 'a8', marker: 1.4, seats: [[3.3, -5.75, PI], [5.1, -5.75, PI]] },
  'devops-corner':   { pos: [9.6, -6.3], stand: [9.6, -4.95], via: 'a11', marker: 1.9, seats: [[9.6, -7.05, 0]],
    exits: [[[8.35, -7.05], [8.35, -5.0]]] },
  'po-desk':         { pos: [7.4, -0.4], stand: [7.4, 0.75], via: 'b12', marker: 1.9, seats: [[6.6, -1.05, 0], [8.2, -1.05, 0]] },
  'server-room':     { pos: [-0.6, -7.4], stand: [-0.6, -6.3], via: 's2', marker: 2.45 },
  'wiki-terminal':   { pos: [-0.2, 4.0], stand: [0.4, 4.6], via: 'b8', marker: 1.9 },
  'plan-folder':     { pos: [-7.95, -0.85], stand: [-7.95, 0.25], via: 'b3', marker: 1.15 },
  'test-tool':       { pos: [-11.35, 0.6], stand: [-10.55, 0.6], via: 'b1', marker: 2.0 },
  'jira-board':      { pos: [3.4, -0.5], stand: [3.4, 0.65], via: 'b9', marker: 2.25 },
  'metrics-board':   { pos: [-11.9, -1.5], stand: [-10.9, -1.5], via: 'a1', marker: 2.35 },
  'pipeline-screen': { pos: [11.2, -7.85], stand: [11.2, -6.2], via: 'a12', marker: 2.55 },
  'mail-terminal':   { pos: [2.6, 4.6], stand: [3.4, 4.6], via: 'b9', marker: 1.75 },
  'hr-cabinet':      { pos: [-11.45, -4.3], stand: [-10.7, -4.3], via: 'c1', marker: 1.5 },
  'code-desk':       { pos: [-2.4, 0.6], stand: [-1.1, 0.95], via: 'b7', marker: 1.5 },
  'staging-console': { pos: [0.75, -7.2], stand: [0.75, -6.2], via: 's2', marker: 1.6 },
  'war-room':        { pos: [-11.7, 5.6], stand: [-8.3, 4.7], via: 'w1', marker: 2.3 },
};

// Camera presets: target point and visible height in world units (span).
// fitW keeps the preset readable on narrow screens: the camera widens to show at least fitW units.
export const VIEWS = {
  overview:        { target: [-0.6, 0, -1.2], span: 20.5, fitW: 31 },
  'cto-office':    { target: [-9.4, 0.6, -5.4], span: 6.6, fitW: 9 },
  'qa-area':       { target: [-9.3, 0.6, -0.4], span: 6.6, fitW: 9 },
  'dev-area':      { target: [-1.6, 0.6, -0.3], span: 8.0, fitW: 11 },
  'devops-corner': { target: [10.0, 0.6, -5.6], span: 6.6, fitW: 9 },
  'server-room':   { target: [-0.3, 0.8, -6.5], span: 5.4, fitW: 7.5 },
  'meeting-room':  { target: [-4.7, 0.6, -5.7], span: 6.4, fitW: 8.5 },
  'war-room':      { target: [-9.4, 0.7, 5.4], span: 6.4, fitW: 8.5 },
  street:          { target: [3.0, 0.0, -14.5], span: 10, fitW: 17 },
};

export const BOUNDS = { minX: -15, maxX: 15, minZ: -17, maxZ: 9, minSpan: 4.5, maxSpan: 24 };

const NODES = {
  a1: [-10.9, -2.75], a2: [-8.1, -2.75], a3: [-6.2, -2.75], a4: [-2.95, -2.75], a6: [0.8, -2.75],
  a8: [5.0, -2.75], a10: [7.4, -2.75], a11: [10.2, -2.75], a12: [11.2, -2.75],
  c1: [-8.1, -4.15], m1: [-2.95, -4.15], m2: [-6.85, -4.3], s1: [0.8, -4.6], s2: [0.8, -5.75],
  b1: [-10.55, 1.55], b2: [-9.4, 1.55], b3: [-7.95, 1.55], b4: [-6.2, 1.55], b5: [-5.0, 1.55],
  b7: [-1.1, 1.55], b8: [1.0, 1.55], b9: [3.4, 1.55], b10: [5.0, 1.55], b12: [7.4, 1.55], b13: [10.2, 1.55],
  w1: [-7.9, 2.9],
};

const EDGES = [
  ['a1', 'a2'], ['a2', 'a3'], ['a3', 'a4'], ['a4', 'a6'], ['a6', 'a8'], ['a8', 'a10'], ['a10', 'a11'], ['a11', 'a12'],
  ['b1', 'b2'], ['b2', 'b3'], ['b3', 'b4'], ['b4', 'b5'], ['b5', 'b7'], ['b7', 'b8'], ['b8', 'b9'], ['b9', 'b10'],
  ['b10', 'b12'], ['b12', 'b13'],
  ['a3', 'b4'], ['a8', 'b10'], ['a11', 'b13'],
  ['a2', 'c1'], ['a4', 'm1'], ['m1', 'm2'], ['a6', 's1'], ['s1', 's2'], ['b3', 'w1'],
];

export function anchorOf(id) {
  return ANCHORS[id] || null;
}

// Nav graph as lines, for the demo's debug overlay.
export function navSegments() {
  return EDGES.map(([a, b]) => [NODES[a], NODES[b]]);
}

function neighbours() {
  const map = new Map(Object.keys(NODES).map((k) => [k, []]));
  EDGES.forEach(([a, b]) => {
    const d = Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
    map.get(a).push([b, d]);
    map.get(b).push([a, d]);
  });
  return map;
}

let graph = null;

function shortestNodes(from, to) {
  if (from === to) return [from];
  graph = graph || neighbours();
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const open = new Set([from]);
  while (open.size) {
    let cur = null;
    open.forEach((n) => { if (cur === null || dist.get(n) < dist.get(cur)) cur = n; });
    open.delete(cur);
    if (cur === to) break;
    graph.get(cur).forEach(([next, d]) => {
      const alt = dist.get(cur) + d;
      if (!dist.has(next) || alt < dist.get(next)) {
        dist.set(next, alt);
        prev.set(next, cur);
        open.add(next);
      }
    });
  }
  if (!prev.has(to)) return [from, to];
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0]));
  return path;
}

function nearestNode(x, z) {
  let best = 'b8';
  let bestD = Infinity;
  Object.entries(NODES).forEach(([id, [nx, nz]]) => {
    const d = Math.hypot(nx - x, nz - z);
    if (d < bestD) { bestD = d; best = id; }
  });
  return best;
}

export function seatExits(anchorId, index) {
  const a = ANCHORS[anchorId];
  const seat = a?.seats?.[index];
  if (!seat) return [];
  if (a.exits?.[index]) return a.exits[index];
  const [x, z, yaw] = seat;
  return [[x - Math.sin(yaw) * 0.9, z - Math.cos(yaw) * 0.9]];
}

// Waypoints [x, z]. from: { anchor, seat, point }, to: { anchor, seat }.
// Seated people leave and reach their chair through the seat's exit points.
export function planRoute(from, to) {
  const target = ANCHORS[to.anchor];
  if (!target) return [];
  const head = [];
  let startNode;
  if (from.anchor && from.seat != null) {
    head.push(...seatExits(from.anchor, from.seat));
    startNode = nearestNode(...head[head.length - 1]);
  } else if (from.anchor && ANCHORS[from.anchor]) {
    head.push(ANCHORS[from.anchor].stand);
    startNode = ANCHORS[from.anchor].via;
  } else {
    startNode = nearestNode(from.point?.[0] ?? 0, from.point?.[1] ?? 0);
  }
  const tail = [];
  let endNode;
  if (to.seat != null) {
    const exits = [...seatExits(to.anchor, to.seat)].reverse();
    tail.push(...exits);
    endNode = nearestNode(...exits[0]);
  } else {
    tail.push(target.stand);
    endNode = target.via;
  }
  const nodes = shortestNodes(startNode, endNode).map((n) => NODES[n]);
  return dedupe([...head, ...nodes, ...tail]);
}

function dedupe(points) {
  return points.filter((p, i) => i === 0 || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 0.01);
}

// Direction a visitor faces when standing at an anchor: towards its prop.
export function standYaw(anchor) {
  return Math.atan2(anchor.pos[0] - anchor.stand[0], anchor.pos[1] - anchor.stand[1]);
}
