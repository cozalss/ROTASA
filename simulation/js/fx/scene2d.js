// Shared route-network layout for the briefing hero, plus the static 2D
// canvas version used when Three.js or WebGL is not available.
// Colours here are drawn into a canvas, so they are literal on purpose.

const STOP_COUNT = 30;
const ROUTE_COUNT = 5;
const BLOCK_COUNT = 90;

// The highlighted truck's lap runs 21:00 → 03:00. The delivery window is
// 22:00 → 02:00; the part after midnight is where 4.1 failed.
const LAP_START_H = 21;
const LAP_SPAN_H = 6;
export const BREAK_FROM = (24 - LAP_START_H) / LAP_SPAN_H;
export const BREAK_TO = (26 - LAP_START_H) / LAP_SPAN_H;

export function clockTime(progress) {
  return LAP_START_H + progress * LAP_SPAN_H;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Deterministic, so the 3D scene and the 2D fallback show the same city.
export function buildNetwork() {
  const rand = seeded(4101);
  const stops = [];
  for (let guard = 0; stops.length < STOP_COUNT && guard < 4000; guard++) {
    const a = rand() * Math.PI * 2;
    const r = 4 + Math.sqrt(rand()) * 13;
    const p = { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.8 };
    if (stops.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 2.2)) stops.push(p);
  }
  const sectors = Array.from({ length: ROUTE_COUNT }, () => []);
  stops.forEach((p) => {
    const angle = (Math.atan2(p.z, p.x) + Math.PI * 2) % (Math.PI * 2);
    const radius = Math.hypot(p.x, p.z);
    sectors[Math.floor((angle / (Math.PI * 2)) * ROUTE_COUNT) % ROUTE_COUNT].push({ ...p, angle, radius });
  });
  const depot = { x: 0, z: 0 };
  // Each route is a petal: out along one side of its sector, back along the other.
  const routes = sectors.filter((s) => s.length >= 2).map((s) => {
    const byAngle = [...s].sort((a, b) => a.angle - b.angle);
    const half = Math.ceil(byAngle.length / 2);
    const out = byAngle.slice(0, half).sort((a, b) => a.radius - b.radius);
    const back = byAngle.slice(half).sort((a, b) => b.radius - a.radius);
    return [depot, ...out, ...back, depot];
  });
  const hot = routes.reduce((best, r, i) => (r.length > routes[best].length ? i : best), 0);
  const blocks = Array.from({ length: BLOCK_COUNT }, () => {
    const a = rand() * Math.PI * 2;
    const r = 20 + rand() * 16;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, w: 0.8 + rand() * 1.6, d: 0.8 + rand() * 1.6, h: 0.3 + rand() * rand() * 3 };
  });
  return { stops, routes, hot, blocks };
}

// ------------------------------------------------------------ 2D canvas ---
const INK = {
  bg: '#060d17', grid: '#10243a', route: 'rgba(43,125,134,0.75)', stop: '143,214,207',
  depot: '#3cc4b8', hot: '#ff8a3d', alert: '#ff5a4f', dial: '#2b4a66', text: '#e6edf5',
};

export function mountFlatScene(container) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.append(canvas);
  const net = buildNetwork();
  const paint = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFlat(g, w, h, net);
  };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(paint) : null;
  if (ro) ro.observe(container); else window.addEventListener('resize', paint);
  paint();
  return () => {
    if (ro) ro.disconnect(); else window.removeEventListener('resize', paint);
    canvas.remove();
  };
}

function smoothPath(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const end = pts[pts.length - 1];
  g.lineTo(end[0], end[1]);
}

function glowDot(g, x, y, r, rgb) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.3, `rgba(${rgb},0.6)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawFlat(g, w, h, net) {
  g.fillStyle = INK.bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = INK.grid;
  g.lineWidth = 1;
  for (let x = 0.5; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0.5; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }

  const wide = w / h > 1.25;
  const cx = wide ? w * 0.66 : w * 0.5;
  const cy = h * (wide ? 0.56 : 0.3);
  const s = Math.min((wide ? w * 0.34 : w * 0.46) / 17, (h * 0.42) / (17 * 0.6));
  const at = (p) => [cx + p.x * s, cy + p.z * s * 0.6];

  g.lineWidth = 1.5;
  g.strokeStyle = INK.route;
  net.routes.forEach((r, i) => { if (i !== net.hot) { smoothPath(g, r.map(at)); g.stroke(); } });

  const hot = net.routes[net.hot].map(at);
  g.lineWidth = 3;
  g.strokeStyle = INK.hot;
  smoothPath(g, hot);
  g.stroke();
  const last = hot.length - 1;
  const from = Math.round(last * BREAK_FROM);
  const to = Math.max(from + 1, Math.round(last * BREAK_TO));
  g.strokeStyle = INK.alert;
  g.lineWidth = 4;
  g.setLineDash([6, 5]);
  smoothPath(g, hot.slice(from, to + 1));
  g.stroke();
  g.setLineDash([]);

  net.stops.forEach((p) => { const [x, y] = at(p); glowDot(g, x, y, 7, INK.stop); });
  const [dx, dy] = at({ x: 0, z: 0 });
  g.fillStyle = INK.depot;
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    g.lineTo(dx + Math.cos(a) * 9, dy + Math.sin(a) * 6);
  }
  g.closePath();
  g.fill();

  const [mx, my] = hot[from];
  g.strokeStyle = INK.alert;
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(mx, my, 11, 7, 0, 0, Math.PI * 2);
  g.stroke();
  glowDot(g, mx, my, 16, '255,90,79');
  g.font = '600 11px "JetBrains Mono", Consolas, monospace';
  g.textAlign = 'center';
  g.fillStyle = INK.alert;
  g.fillText('00:00', mx, my - 14);

  const r = Math.max(30, Math.min(72, Math.min(w, h) * 0.1));
  if (wide) drawDial(g, cx + s * 13, Math.max(r + 26, cy - h * 0.3), r);
  else drawDial(g, w - r - 34, r + 30, r);
}

// 24-hour dial, midnight at the top: 22→00 in orange, 00→02 broken in red.
function drawDial(g, x, y, r) {
  const ang = (hr) => -Math.PI / 2 + (hr / 24) * Math.PI * 2;
  g.fillStyle = 'rgba(6,13,23,0.7)';
  g.beginPath(); g.arc(x, y, r + 10, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK.dial;
  g.lineWidth = 1.5;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  for (let hr = 0; hr < 24; hr++) {
    const a = ang(hr);
    const inner = hr % 6 === 0 ? r - 9 : r - 5;
    g.beginPath();
    g.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    g.stroke();
  }
  g.lineWidth = 6;
  g.strokeStyle = INK.hot;
  g.beginPath(); g.arc(x, y, r + 5, ang(22), ang(23.85)); g.stroke();
  g.strokeStyle = INK.alert;
  g.setLineDash([4, 4]);
  g.beginPath(); g.arc(x, y, r + 5, ang(24.15), ang(26)); g.stroke();
  g.setLineDash([]);
  const hand = ang(24.9);
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(hand) * (r - 8), y + Math.sin(hand) * (r - 8)); g.stroke();
  g.font = '600 10px "JetBrains Mono", Consolas, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  [['22:00', 22, INK.hot], ['00:00', 24, INK.text], ['02:00', 26, INK.alert]].forEach(([label, hr, color]) => {
    const a = ang(hr);
    g.fillStyle = color;
    g.fillText(label, x + Math.cos(a) * (r + 24), y + Math.sin(a) * (r + 18));
  });
}
