// Ambient background: a slow night-time route network drawn on a fixed 2D
// canvas behind the page. Colours come from the theme tokens, so it follows
// light and dark mode. With reduced motion it draws one still frame.
import { prefersReducedMotion } from './motion.js';

const NODE_COUNT = 46;
const LINK_DISTANCE = 0.2;
const SPEED = 0.00006;

function readTokens() {
  const css = getComputedStyle(document.documentElement);
  return {
    line: css.getPropertyValue('--line').trim() || '#26394f',
    player: css.getPropertyValue('--player').trim() || '#ff8a3d',
    expert: css.getPropertyValue('--expert').trim() || '#3cc4b8',
  };
}

// Deterministic pseudo-random so the network looks the same on every load.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createNodes() {
  const rand = seeded(4101);
  return Array.from({ length: NODE_COUNT }, () => ({
    x: rand(), y: rand(), vx: (rand() - 0.5) * SPEED, vy: (rand() - 0.5) * SPEED, hub: rand() > 0.88,
  }));
}

export function mountAmbient() {
  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => canvas.remove();

  const nodes = createNodes();
  let tokens = readTokens();
  let width = 0;
  let height = 0;
  let frame = 0;
  let t = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.max(width, height);
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = (nodes[i].x - nodes[j].x) * width;
        const dy = (nodes[i].y - nodes[j].y) * height;
        const d = Math.hypot(dx, dy) / scale;
        if (d > LINK_DISTANCE) continue;
        ctx.globalAlpha = (1 - d / LINK_DISTANCE) * 0.5;
        ctx.strokeStyle = tokens.line;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x * width, nodes[i].y * height);
        ctx.lineTo(nodes[j].x * width, nodes[j].y * height);
        ctx.stroke();
      }
    }
    nodes.forEach((n, i) => {
      const glow = n.hub ? 0.55 + 0.35 * Math.sin(t * 0.002 + i) : 0.35;
      ctx.globalAlpha = glow;
      ctx.fillStyle = n.hub ? tokens.player : tokens.expert;
      ctx.beginPath();
      ctx.arc(n.x * width, n.y * height, n.hub ? 2.6 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const step = (time) => {
    t = time;
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > 1) n.vx *= -1;
      if (n.y < 0 || n.y > 1) n.vy *= -1;
    });
    draw();
    frame = requestAnimationFrame(step);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    if (prefersReducedMotion() || document.hidden) draw();
    else frame = requestAnimationFrame(step);
  };

  const onTheme = () => { tokens = readTokens(); draw(); };
  const scheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  const observer = new MutationObserver(onTheme);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  scheme?.addEventListener?.('change', onTheme);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', start);

  resize();
  start();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    scheme?.removeEventListener?.('change', onTheme);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', start);
    canvas.remove();
  };
}
