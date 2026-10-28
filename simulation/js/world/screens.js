// Canvas artwork for screens, boards and paper props. Each painter takes a 2D
// context and its size. Colours are literal: they are pixels, not CSS.

const MONO = "'JetBrains Mono', Consolas, monospace";
const SANS = "'Public Sans', 'Segoe UI', system-ui, sans-serif";
const HAND = "'Segoe Print', 'Comic Sans MS', 'Bradley Hand', cursive";

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function screenBase(g, w, h, top = '#0f1d2e', bottom = '#0a1421') {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
}

function text(g, str, x, y, size, color, font = SANS, weight = 600, align = 'left') {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(str, x, y);
}

function bar(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

// Scrolling code: line k is derived from (seed, k), so offset scrolls deterministically.
export function paintCode(seed, offset = 0) {
  return (g, w, h) => {
    screenBase(g, w, h, '#101a26', '#0b131d');
    const cols = ['#7fd1c7', '#ffb45e', '#9fb9ff', '#d0d8e2', '#c792ea', '#6f8296'];
    let row = 0;
    for (let y = 14; y < h - 8; y += 13, row++) {
      const rand = seeded(seed * 7919 + row + offset);
      let x = 12 + Math.floor(rand() * 4) * 12;
      const n = 1 + Math.floor(rand() * 4);
      for (let i = 0; i < n && x < w - 20; i++) {
        const len = 14 + rand() * 60;
        bar(g, x, y, len, 6, cols[Math.floor(rand() * cols.length)]);
        x += len + 8;
      }
    }
    bar(g, 12, h - 12, 8, 3, (offset % 2) ? '#0b131d' : '#d0d8e2');
  };
}

export function paintRoutingCode(g, w, h) {
  screenBase(g, w, h, '#0f1824', '#0a121b');
  bar(g, 0, 0, w, 22, '#1a2838');
  text(g, 'time_window.py — routing-engine', 10, 11, 12, '#9fb0c3', MONO, 400);
  const lines = [
    ['def ', '#c792ea', 'fits_window(stop, eta):', '#d0d8e2'],
    ['  start, end = stop.window', '#d0d8e2'],
    ['  # TODO: windows over midnight?', '#6f8296'],
    ['  return start <= eta <= end', '#d0d8e2'],
    ['', ''],
    ['def ', '#c792ea', 'test_window_22_to_02():', '#7fd1c7'],
    ['  assert fits(22:00, 01:30)', '#ffb45e'],
  ];
  lines.forEach((parts, i) => {
    let x = 10;
    for (let k = 0; k < parts.length; k += 2) {
      text(g, parts[k], x, 40 + i * 18, 13, parts[k + 1] || '#d0d8e2', MONO, 400);
      g.font = `400 13px ${MONO}`;
      x += g.measureText(parts[k]).width;
    }
  });
}

export function paintWiki(g, w, h) {
  screenBase(g, w, h, '#f2f5f8', '#dfe6ee');
  bar(g, 0, 0, w, 34, '#2b4058');
  text(g, 'Rotaşa Wiki', 14, 17, 16, '#e6edf5');
  text(g, 'Rotaşa Test Policy', 14, 58, 19, '#142233', SANS, 700);
  g.fillStyle = '#f0b94a';
  g.fillRect(14, 74, 62, 20);
  text(g, 'DRAFT', 22, 84, 12, '#3b2a05', SANS, 700);
  text(g, 'viewed 3× in 6 months', 86, 84, 11, '#4a5a6c', SANS, 400);
  for (let i = 0; i < 6; i++) bar(g, 14, 108 + i * 15, 60 + ((i * 53) % 150), 6, '#9fb0c3');
  text(g, 'Approval: (empty)', 14, h - 18, 12, '#b3261e', SANS, 700);
}

export function paintTestTool(g, w, h) {
  screenBase(g, w, h, '#132235', '#0d1828');
  bar(g, 0, 0, w, 28, '#1d3550');
  text(g, 'TestDesk · Time-window engine', 10, 14, 13, '#d0d8e2');
  const rows = [['TC-1201', '#6fcf86'], ['TC-1202', '#6fcf86'], ['TC-1203', '#6fcf86'], ['TC-1204', '#6fcf86'],
    ['TC-1205', '#6fcf86'], ['TC-1206', '#ff5a4f'], ['TC-1207', '#6f8296'], ['TC-1208', '#f0b94a']];
  rows.forEach(([id, col], i) => {
    const y = 44 + i * 22;
    bar(g, 8, y - 9, w - 16, 18, i % 2 ? '#14263b' : '#172c44');
    text(g, id, 16, y, 12, '#9fb0c3', MONO, 400);
    bar(g, 90, y - 3, 90 + ((i * 37) % 60), 6, '#4f6a88');
    g.fillStyle = col;
    g.beginPath();
    g.arc(w - 22, y, 6, 0, Math.PI * 2);
    g.fill();
  });
}

export function paintKanban(g, w, h) {
  g.fillStyle = '#f4f6f8';
  g.fillRect(0, 0, w, h);
  const colsW = w / 3;
  ['TO DO', 'DOING', 'DONE'].forEach((title, c) => {
    text(g, title, c * colsW + 12, 20, 15, '#2b4058', SANS, 800);
    if (c) bar(g, c * colsW, 8, 2, h - 16, '#c5ced8');
  });
  const notes = ['#ffd66b', '#9fe0d6', '#ffb3a7', '#b9cbff', '#ffd66b', '#c8e6a0'];
  const rand = seeded(42);
  const counts = [5, 3, 4];
  counts.forEach((n, c) => {
    for (let i = 0; i < n; i++) {
      const x = c * colsW + 10 + (i % 2) * (colsW / 2 - 4);
      const y = 38 + Math.floor(i / 2) * 44;
      g.save();
      g.translate(x + 30, y + 18);
      g.rotate((rand() - 0.5) * 0.12);
      bar(g, -30, -18, colsW / 2 - 12, 36, notes[Math.floor(rand() * notes.length)]);
      bar(g, -24, -8, 40, 4, 'rgba(20,34,51,0.45)');
      bar(g, -24, 2, 28, 4, 'rgba(20,34,51,0.35)');
      g.restore();
    }
  });
  text(g, 'ROTA-1188', 2 * colsW + 12, h - 16, 12, '#b3261e', MONO, 600);
}

export function paintMetrics(g, w, h) {
  g.fillStyle = '#efe9dc';
  g.fillRect(0, 0, w, h);
  text(g, 'Test metrics · last 6 sprints', 16, 22, 16, '#142233', SANS, 700);
  text(g, 'QA lead · personal sheet', 16, 42, 11, '#4a5a6c', SANS, 400);
  const base = h - 30;
  [62, 70, 55, 80, 74, 66].forEach((v, i) => {
    bar(g, 30 + i * 38, base - v, 22, v, '#3f7f8c');
  });
  g.strokeStyle = '#d9620f';
  g.lineWidth = 3;
  g.beginPath();
  [30, 44, 38, 60, 70, 82].forEach((v, i) => {
    const x = 41 + i * 38;
    const y = base - v - 8;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  });
  g.stroke();
  bar(g, 20, base, w - 40, 2, '#4a5a6c');
  text(g, 'open defects ↑', w - 18, 62, 11, '#d9620f', SANS, 700, 'right');
}

const PIPELINE = {
  evening: { title: 'CI · main', bars: ['#6fcf86', '#6fcf86', '#ff5a4f', '#6fcf86', '#ff5a4f', '#6fcf86', '#f0b94a', '#6fcf86'], banner: null },
  outage: { title: 'STAGING DOWN', bars: ['#ff5a4f', '#ff5a4f', '#ff5a4f', '#6f8296', '#ff5a4f', '#ff5a4f', '#6f8296', '#ff5a4f'], banner: '#ff5a4f' },
  'after-good': { title: 'ALL SYSTEMS OPERATIONAL', bars: ['#6fcf86', '#6fcf86', '#6fcf86', '#6fcf86', '#6fcf86', '#6fcf86', '#6fcf86', '#6fcf86'], banner: '#2c7a3f' },
  'after-bad': { title: 'KVKK INCIDENT · DATA LEAK', bars: ['#ff5a4f', '#f0b94a', '#ff5a4f', '#ff5a4f', '#6f8296', '#ff5a4f', '#ff5a4f', '#ff5a4f'], banner: '#b3261e' },
};

export function paintPipeline(mood, phase = 0.6) {
  const spec = PIPELINE[mood] || PIPELINE.evening;
  return (g, w, h) => {
    screenBase(g, w, h, '#0f1b2a', '#0a121c');
    if (spec.banner) {
      bar(g, 0, 0, w, 44, spec.banner);
      text(g, spec.title, w / 2, 23, 18, '#ffffff', SANS, 800, 'center');
    } else {
      bar(g, 0, 0, w, 32, '#1a2a3d');
      text(g, spec.title, 12, 16, 15, '#d0d8e2', MONO, 600);
    }
    spec.bars.forEach((col, i) => {
      const y = 58 + i * 17;
      text(g, `#${4120 + i}`, 12, y + 5, 11, '#6f8296', MONO, 400);
      bar(g, 64, y, w - 80, 11, '#1b2a3b');
      const running = col === '#f0b94a' || (mood === 'outage' && i === 3);
      const fillTo = running ? phase : 0.55 + ((i * 29) % 45) / 100;
      bar(g, 64, y, (w - 80) * fillTo, 11, col);
    });
  };
}

export function paintMail(g, w, h) {
  screenBase(g, w, h, '#eef2f6', '#dde4ec');
  bar(g, 0, 0, w, 26, '#2b4058');
  text(g, 'Mail · Release 4.1', 10, 13, 12, '#e6edf5');
  const items = [['Deniz → Murat', 'Re: 4.1 go/no-go', true], ['Murat', 'Ship it tonight', false], ['Kerem', 'Customers waiting', false], ['Deniz', 'Regression not done', true]];
  items.forEach(([from, subj, flag], i) => {
    const y = 42 + i * 30;
    bar(g, 6, y - 12, w - 12, 26, i === 0 ? '#ffe8d4' : '#ffffff');
    text(g, from, 14, y - 3, 11, '#142233', SANS, 700);
    text(g, subj, 14, y + 8, 10, '#4a5a6c', SANS, 400);
    if (flag) bar(g, w - 18, y - 6, 6, 12, '#d9620f');
  });
}

export function paintTerminal(g, w, h) {
  screenBase(g, w, h, '#05090d', '#05090d');
  const lines = ['$ kubectl get pods -n staging', 'routing-7f9c   Running', 'import-4b2a    CrashLoop', 'field-api-91   Running', '$ ./rerun-regression 4.1', '> 312 tests queued…', '$ _'];
  lines.forEach((l, i) => text(g, l, 10, 18 + i * 18, 12, i === 2 ? '#ff7a6b' : '#7fe0a8', MONO, 400));
}

const SLIDES = {
  evening: { title: 'RotaPlan 4.2', sub: 'Sprint 38 review', subColor: '#8fd6cf', bars: [0.7, 0.45, 0.85], top: '#16324a' },
  outage: { title: 'INCIDENT', sub: 'Staging down · bridge open', subColor: '#ffb3a7', bars: [0.2, 0.1, 0.35], top: '#4a1a1c' },
  'after-good': { title: 'Release 4.2', sub: 'All exit criteria met ✓', subColor: '#9fe0b0', bars: [1, 0.95, 1], top: '#173a2c' },
  'after-bad': { title: 'KVKK incident', sub: 'Personal data exposed · day 3', subColor: '#ffb3a7', bars: [0.3, 0.15, 0.2], top: '#3d1618' },
};

export function paintSlides(mood = 'evening') {
  const spec = SLIDES[mood] || SLIDES.evening;
  const good = mood === 'after-good';
  const bad = mood === 'outage' || mood === 'after-bad';
  return (g, w, h) => {
    screenBase(g, w, h, spec.top, '#0f2236');
    text(g, spec.title, 24, 46, 30, '#e6edf5', SANS, 800);
    text(g, spec.sub, 24, 80, 16, spec.subColor, SANS, 600);
    spec.bars.forEach((v, i) => {
      bar(g, 24, 112 + i * 26, (w - 48), 12, '#21405e');
      bar(g, 24, 112 + i * 26, (w - 48) * v, 12, good ? '#6fcf86' : bad ? '#ff5a4f' : i === 1 ? '#ffb45e' : '#3cc4b8');
    });
  };
}

export function paintCork(g, w, h) {
  const rand = seeded(7);
  g.fillStyle = '#a7774a';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = rand() > 0.5 ? 'rgba(80,48,22,0.25)' : 'rgba(230,190,140,0.18)';
    g.fillRect(rand() * w, rand() * h, 2, 2);
  }
  const cards = [[40, 30, 'A'], [170, 24, 'B'], [300, 40, 'C'], [70, 150, 'D'], [210, 140, 'E'], [340, 160, 'F'], [130, 250, 'G'], [280, 255, 'J']];
  const pins = cards.map(([x, y]) => [x + 40, y + 6]);
  g.strokeStyle = '#d33a2c';
  g.lineWidth = 3;
  [[0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [0, 1]].forEach(([a, b]) => {
    g.beginPath();
    g.moveTo(pins[a][0], pins[a][1]);
    g.quadraticCurveTo((pins[a][0] + pins[b][0]) / 2, Math.max(pins[a][1], pins[b][1]) + 18, pins[b][0], pins[b][1]);
    g.stroke();
  });
  cards.forEach(([x, y, label], i) => {
    g.save();
    g.translate(x + 40, y + 40);
    g.rotate((rand() - 0.5) * 0.16);
    bar(g, -40, -34, 80, 70, i % 3 === 1 ? '#fff3b8' : '#f4efe4');
    text(g, label, -30, -18, 18, '#142233', SANS, 800);
    bar(g, -30, 0, 56, 4, '#9fb0c3');
    bar(g, -30, 10, 44, 4, '#9fb0c3');
    g.restore();
  });
  pins.forEach(([x, y]) => {
    g.fillStyle = '#ff8a3d';
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fill();
  });
}

export function paintSticky(lines, bg = '#ffd66b', ink = '#3a2a05') {
  return (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(0, 0, w, h * 0.16);
    lines.forEach((l, i) => text(g, l, w / 2, h * 0.45 + i * (h * 0.24) - ((lines.length - 1) * h * 0.12), Math.round(h * 0.2), ink, HAND, 700, 'center'));
  };
}

export function paintPolicyFrame(g, w, h) {
  g.fillStyle = '#f7f4ec';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9b48a';
  g.lineWidth = 6;
  g.strokeRect(10, 10, w - 20, h - 20);
  text(g, 'Test policy v1.0', w / 2, 52, 26, '#142233', SANS, 800, 'center');
  for (let i = 0; i < 5; i++) bar(g, 40, 84 + i * 16, w - 80 - (i % 2) * 40, 6, '#9fb0c3');
  g.save();
  g.translate(w - 78, h - 62);
  g.rotate(-0.25);
  g.strokeStyle = '#2c7a3f';
  g.lineWidth = 4;
  g.strokeRect(-56, -20, 112, 40);
  text(g, 'APPROVED', 0, 1, 18, '#2c7a3f', SANS, 800, 'center');
  g.restore();
}

export function paintLabel(str, bg = '#ece6d8', ink = '#142233') {
  return (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    text(g, str, w / 2, h / 2 + 1, Math.round(h * 0.5), ink, SANS, 800, 'center');
  };
}

export function paintRack(g, w, h) {
  g.fillStyle = '#151d26';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) {
    const y = 34 + i * 24;
    bar(g, 8, y, w - 16, 18, '#222d39');
    for (let k = 0; k < 10; k++) bar(g, 18 + k * 7, y + 6, 4, 6, '#0d1218');
  }
  bar(g, 6, 4, w - 12, 22, '#ffb45e');
  text(g, 'STAGING', w / 2, 16, 14, '#1a1205', SANS, 800, 'center');
}
