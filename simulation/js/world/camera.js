// Orthographic isometric camera: presets tweened with GSAP, drag-pan and
// wheel-zoom within limits, and a slow drift for backdrop mode.
import { VIEWS, BOUNDS } from './anchors.js';

const AZIMUTH = 0.74;     // radians from +z towards +x
const ELEVATION = 0.6;    // radians above the horizon
const DISTANCE = 70;
const TWEEN_S = 1.15;

export function createCameraRig(THREE) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 220);
  const dir = new THREE.Vector3(Math.sin(AZIMUTH) * Math.cos(ELEVATION), Math.sin(ELEVATION), Math.cos(AZIMUTH) * Math.cos(ELEVATION));
  const right = new THREE.Vector3(Math.cos(AZIMUTH), 0, -Math.sin(AZIMUTH));
  const ahead = new THREE.Vector3(-Math.sin(AZIMUTH), 0, -Math.cos(AZIMUTH));
  const v = VIEWS.overview;
  const s = { x: v.target[0], y: v.target[1], z: v.target[2], span: v.span, fitW: v.fitW };
  const drift = new THREE.Vector3();
  const look = new THREE.Vector3();
  let aspect = 1;
  let viewportH = 1;
  let tween = null;

  function visibleHeight() {
    return Math.max(s.span, s.fitW / aspect);
  }

  function apply() {
    look.set(s.x, s.y, s.z).add(drift);
    camera.position.copy(look).addScaledVector(dir, DISTANCE);
    camera.lookAt(look);
    const h = visibleHeight() / 2;
    camera.left = -h * aspect;
    camera.right = h * aspect;
    camera.top = h;
    camera.bottom = -h;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function clamp() {
    s.x = Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, s.x));
    s.z = Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, s.z));
    s.span = Math.min(BOUNDS.maxSpan, Math.max(BOUNDS.minSpan, s.span));
  }

  function kill() {
    if (tween) tween.kill();
    tween = null;
  }

  // Move to a target/span; resolves when the camera arrives.
  function moveTo(target, span, fitW, { instant = false } = {}) {
    kill();
    const to = { x: target[0], y: target[1], z: target[2], span, fitW };
    const gsap = window.gsap;
    if (instant || !gsap) {
      Object.assign(s, to);
      clamp();
      apply();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      tween = gsap.to(s, {
        ...to, duration: TWEEN_S, ease: 'power3.inOut', onUpdate: apply,
        onComplete: () => { tween = null; resolve(); },
        onInterrupt: resolve,
      });
    });
  }

  return {
    camera,
    dir,
    get span() { return s.span; },
    setView(id, opts) {
      const view = VIEWS[id];
      if (!view) return Promise.resolve();
      return moveTo(view.target, view.span, view.fitW, opts);
    },
    focus(x, y, z, opts = {}) {
      const span = opts.span ?? Math.min(s.span, 9);
      return moveTo([x, y, z], span, Math.min(s.fitW, span * 1.4), opts);
    },
    resize(w, h) {
      aspect = Math.max(0.1, w / Math.max(1, h));
      viewportH = Math.max(1, h);
      apply();
    },
    // Drag-pan by a pixel delta.
    pan(dx, dy) {
      kill();
      const upp = visibleHeight() / viewportH;
      s.x += (-right.x * dx + ahead.x * dy / Math.sin(ELEVATION)) * upp;
      s.z += (-right.z * dx + ahead.z * dy / Math.sin(ELEVATION)) * upp;
      clamp();
      apply();
    },
    zoom(factor) {
      kill();
      s.span *= factor;
      s.fitW = Math.min(s.fitW, s.span * 1.6);
      clamp();
      apply();
    },
    // Keep a point (the walking avatar) inside the central part of the view.
    follow(p, dt) {
      if (tween) return;
      const rel = look.set(p.x - s.x, 0, p.z - s.z);
      const sx = rel.dot(right);
      const sy = rel.dot(ahead) * Math.sin(ELEVATION);
      const h = visibleHeight() / 2;
      const w = h * aspect;
      const k = Math.min(1, dt * 2.5);
      const ox = Math.abs(sx) > w * 0.6 ? (sx - Math.sign(sx) * w * 0.6) * k : 0;
      const oy = Math.abs(sy) > h * 0.55 ? (sy - Math.sign(sy) * h * 0.55) * k : 0;
      if (!ox && !oy) return;
      s.x += right.x * ox + ahead.x * oy / Math.sin(ELEVATION);
      s.z += right.z * ox + ahead.z * oy / Math.sin(ELEVATION);
      clamp();
      apply();
    },
    setDrift(t, amount) {
      drift.set(Math.sin(t * 0.045) * 1.4 * amount, 0, Math.cos(t * 0.037) * 0.9 * amount);
      apply();
    },
    apply,
    dispose: kill,
  };
}
