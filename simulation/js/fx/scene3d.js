// Night-time route network for the briefing hero. One route is highlighted:
// a 22:00–02:00 delivery window that breaks at midnight, as in RotaPlan 4.1.
// Three.js (global THREE) is optional. Without it, or without WebGL, the same
// motif is drawn once on a 2D canvas. Nothing in here throws to the caller.
import { prefersReducedMotion } from './motion.js';
import { buildNetwork, clockTime, BREAK_FROM, BREAK_TO, mountFlatScene } from './scene2d.js';

const HEX = {
  bg: 0x060d17, ground: 0x08131f, grid: 0x14283d, gridMajor: 0x1d3a57, block: 0x10243a,
  stop: 0x8fd6cf, depot: 0x3cc4b8, route: 0x2b7d86, truck: 0xe6edf5, hot: 0xff8a3d, alert: 0xff5a4f, dial: 0x2b4a66,
};
const HOT_LAP_S = 26;
const ORBIT_SPEED = 0.045;
const STILL_PROGRESS = 0.62; // reduced motion: freeze just after midnight
const WATCHDOG_MS = 1000;

export function mountRouteScene(container, { onDispose } = {}) {
  if (!container) return () => {};
  let stop = () => {};
  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    clearInterval(watchdog);
    safely(stop);
    container.replaceChildren();
    if (onDispose) safely(onDispose);
  };
  const fallback = () => {
    safely(stop);
    container.replaceChildren();
    stop = safeFlat(container);
  };
  const watchdog = setInterval(() => { if (!container.isConnected) cleanup(); }, WATCHDOG_MS);
  const THREE = window.THREE;
  if (THREE && typeof THREE.WebGLRenderer === 'function') {
    try {
      stop = mountWebGL(container, THREE, { onDetached: cleanup, onLost: fallback });
    } catch {
      fallback();
    }
  } else {
    stop = safeFlat(container);
  }
  return cleanup;
}

function safely(fn) {
  try { fn(); } catch { /* cleanup must never break the screen */ }
}

function safeFlat(container) {
  try { return mountFlatScene(container); } catch { return () => {}; }
}

// ---------------------------------------------------------------- WebGL ---
function mountWebGL(container, THREE, { onDetached, onLost }) {
  const reduced = prefersReducedMotion();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(HEX.bg, 1);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    container.append(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(HEX.bg, 0.022);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    const net = buildNetwork();
    const glow = track(glowTexture(THREE));
    const world = buildWorld(THREE, scene, net, glow);
    const dial = buildDial(THREE, glow, track);
    dial.group.position.set(0, 7.4, 0);
    scene.add(dial.group);

    let width = 0;
    let height = 0;
    const resize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      if (w === width && h === height) return;
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Wide heroes put the copy on the left, narrow ones at the bottom; shift the network away from it.
      if (camera.aspect > 1.25) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      else if (camera.aspect < 0.9) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      if (reduced) draw(0);
    };

    let orbit = 4.1; // starts with the highlighted route on the open (right) side
    let hotU = reduced ? STILL_PROGRESS : 0.05;
    const draw = (dt) => {
      orbit += dt * ORBIT_SPEED;
      hotU = (hotU + dt / HOT_LAP_S) % 1;
      const fit = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.55) : 1;
      const radius = 31 * fit;
      camera.position.set(Math.cos(orbit) * radius, 17 * fit, Math.sin(orbit) * radius);
      camera.lookAt(0, 0.5, 0);
      world.update(dt, hotU);
      dial.update(dt, hotU, camera);
      renderer.render(scene, camera);
    };

    let raf = 0;
    let last = 0;
    let visible = true;
    let stopped = false;
    const frame = (now) => {
      raf = 0;
      if (stopped) return;
      if (!container.isConnected) { onDetached(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      draw(dt);
      schedule();
    };
    const schedule = () => {
      if (reduced || stopped || raf || !visible || document.hidden) { if (!raf) last = 0; return; }
      raf = requestAnimationFrame(frame);
    };

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container); else window.addEventListener('resize', resize);
    const io = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); })
      : null;
    if (io) io.observe(container);
    document.addEventListener('visibilitychange', schedule);
    const onContextLost = (e) => { e.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', onContextLost);

    resize();
    draw(0);
    schedule();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      disposeAll(THREE, scene, disposables);
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    };
  } catch (err) {
    disposables.forEach((d) => safely(() => d.dispose()));
    renderer.dispose();
    renderer.domElement.remove();
    throw err;
  }
}

function disposeAll(THREE, scene, extra) {
  scene.traverse((obj) => {
    obj.geometry?.dispose?.();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    mats.forEach((m) => { m.map?.dispose?.(); m.dispose(); });
  });
  extra.forEach((d) => safely(() => d.dispose()));
}

function glowTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function glowPoints(THREE, glow, positions, color, size) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size, map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

function textSprite(THREE, text, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.font = '600 34px "JetBrains Mono", Consolas, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, 128, 34);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// Ground, city blocks, stops, depot, routes and trucks.
function buildWorld(THREE, scene, net, glow) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshBasicMaterial({ color: HEX.ground }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const grid = new THREE.GridHelper(80, 40, HEX.gridMajor, HEX.grid);
  grid.position.y = 0.01;
  scene.add(grid);
  scene.add(new THREE.AmbientLight(0x6a86a6, 0.55));
  const sun = new THREE.DirectionalLight(0x9cc2e6, 0.55);
  sun.position.set(-8, 14, 6);
  scene.add(sun);

  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: HEX.block }), net.blocks.length);
  const m = new THREE.Matrix4();
  net.blocks.forEach((b, i) => {
    m.makeScale(b.w, b.h, b.d).setPosition(b.x, b.h / 2, b.z);
    blocks.setMatrixAt(i, m);
  });
  scene.add(blocks);

  scene.add(glowPoints(THREE, glow, net.stops.flatMap((s) => [s.x, 0.2, s.z]), HEX.stop, 1.6));
  const depot = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.4, 6), new THREE.MeshBasicMaterial({ color: HEX.depot }));
  depot.position.y = 0.2;
  scene.add(depot);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.32, 48), new THREE.MeshBasicMaterial({ color: HEX.depot, transparent: true, side: THREE.DoubleSide }));
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.03;
  scene.add(pulse);

  const curves = net.routes.map((r) => new THREE.CatmullRomCurve3(r.map((p) => new THREE.Vector3(p.x, 0.06, p.z)), false, 'centripetal'));
  curves.forEach((curve, i) => {
    if (i === net.hot) return;
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(240));
    scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: HEX.route, transparent: true, opacity: 0.9 })));
  });

  const hotCurve = curves[net.hot];
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(hotCurve, 360, 0.07, 6, false), new THREE.MeshBasicMaterial({ color: HEX.hot })));
  const brokenPts = Array.from({ length: 60 }, (_, i) => hotCurve.getPointAt(BREAK_FROM + ((BREAK_TO - BREAK_FROM) * i) / 59).setY(0.08));
  const broken = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(brokenPts), 120, 0.13, 6, false),
    new THREE.MeshBasicMaterial({ color: HEX.alert, transparent: true, opacity: 0.2, depthWrite: false }),
  );
  scene.add(broken);

  const midnight = hotCurve.getPointAt(BREAK_FROM);
  const gate = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 32), new THREE.MeshBasicMaterial({ color: HEX.alert, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  gate.rotation.x = -Math.PI / 2;
  gate.position.set(midnight.x, 0.05, midnight.z);
  scene.add(gate);
  const post = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(midnight.x, 0, midnight.z), new THREE.Vector3(midnight.x, 1.8, midnight.z)]),
    new THREE.LineBasicMaterial({ color: HEX.alert }),
  );
  scene.add(post);
  const tag = textSprite(THREE, '00:00', '#ff5a4f');
  tag.position.set(midnight.x, 2.3, midnight.z);
  scene.add(tag);

  const others = curves.map((_, i) => i).filter((i) => i !== net.hot);
  const offsets = others.map((_, i) => (i * 0.37) % 1);
  const laps = others.map((_, i) => 34 + i * 7);
  const fleet = glowPoints(THREE, glow, new Array(others.length * 3).fill(0), HEX.truck, 1.5);
  scene.add(fleet);
  const hotTruck = glowPoints(THREE, glow, [0, 0, 0], HEX.hot, 2.4);
  scene.add(hotTruck);
  const TRAIL = 28;
  const trail = glowPoints(THREE, glow, new Array(TRAIL * 3).fill(0), HEX.hot, 0.5);
  trail.material.opacity = 0.55;
  scene.add(trail);

  let t = 0;
  const v = new THREE.Vector3();
  return {
    update(dt, hotU) {
      t += dt;
      const pos = fleet.geometry.attributes.position;
      others.forEach((ci, k) => {
        curves[ci].getPointAt((offsets[k] + t / laps[k]) % 1, v);
        pos.setXYZ(k, v.x, 0.35, v.z);
      });
      pos.needsUpdate = true;
      hotCurve.getPointAt(hotU, v);
      hotTruck.geometry.attributes.position.setXYZ(0, v.x, 0.4, v.z);
      hotTruck.geometry.attributes.position.needsUpdate = true;
      const tp = trail.geometry.attributes.position;
      for (let i = 0; i < TRAIL; i++) {
        hotCurve.getPointAt((hotU - i * 0.0035 + 1) % 1, v);
        tp.setXYZ(i, v.x, 0.3, v.z);
      }
      tp.needsUpdate = true;
      const inBreak = hotU >= BREAK_FROM && hotU <= BREAK_TO;
      const flicker = inBreak ? 0.55 + 0.45 * Math.abs(Math.sin(t * 17) * Math.sin(t * 5.3)) : 0.18;
      broken.material.opacity = flicker;
      hotTruck.material.color.setHex(inBreak ? HEX.alert : HEX.hot);
      trail.material.color.setHex(inBreak ? HEX.alert : HEX.hot);
      const wave = (t * 0.6) % 1;
      pulse.scale.setScalar(1 + wave * 1.6);
      pulse.material.opacity = 0.6 * (1 - wave);
      gate.material.opacity = inBreak ? flicker : 0.5;
    },
  };
}

// A 24-hour dial, billboarded above the depot. Midnight is at the top.
function buildDial(THREE, glow, track) {
  const group = new THREE.Group();
  group.renderOrder = 5;
  const R = 2.8;
  const flat = (geo, color, opacity = 1) => {
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthTest: false }));
    mesh.renderOrder = 6;
    group.add(mesh);
    return mesh;
  };
  const arc = (h0, h1, inner, outer, color, opacity) => {
    const len = ((h1 - h0) / 24) * Math.PI * 2;
    const start = Math.PI / 2 - (h1 / 24) * Math.PI * 2;
    return flat(new THREE.RingGeometry(inner, outer, 64, 1, start, len), color, opacity);
  };
  flat(new THREE.CircleGeometry(R + 0.35, 64), HEX.bg, 0.55);
  flat(new THREE.RingGeometry(R - 0.03, R + 0.03, 96), HEX.dial);
  const ticks = [];
  for (let hr = 0; hr < 24; hr++) {
    const a = Math.PI / 2 - (hr / 24) * Math.PI * 2;
    const inner = hr % 6 === 0 ? R - 0.38 : R - 0.2;
    ticks.push(Math.cos(a) * inner, Math.sin(a) * inner, 0, Math.cos(a) * R, Math.sin(a) * R, 0);
  }
  const tickGeo = new THREE.BufferGeometry();
  tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
  const tickLines = new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({ color: 0x5b7a99, depthTest: false }));
  tickLines.renderOrder = 6;
  group.add(tickLines);

  arc(22, 23.88, R + 0.08, R + 0.34, HEX.hot, 1);
  const after = arc(24.12, 26, R + 0.08, R + 0.34, HEX.alert, 0.35);

  const hand = flat(new THREE.PlaneGeometry(0.07, R - 0.25), HEX.truck);
  hand.geometry.translate(0, (R - 0.25) / 2, 0);
  const hub = glowPoints(THREE, glow, [0, 0, 0.01], HEX.hot, 0.9);
  hub.material.depthTest = false;
  hub.renderOrder = 7;
  group.add(hub);

  [['22:00', 22, '#ff8a3d'], ['00:00', 24, '#e6edf5'], ['02:00', 26, '#ff5a4f']].forEach(([text, hr, color]) => {
    const a = Math.PI / 2 - (hr / 24) * Math.PI * 2;
    const s = textSprite(THREE, text, color);
    s.scale.set(3.4, 0.85, 1);
    s.position.set(Math.cos(a) * (R + 1.5), Math.sin(a) * (R + 1.0), 0);
    group.add(s);
  });
  track(tickGeo);

  let t = 0;
  return {
    group,
    update(dt, hotU, camera) {
      t += dt;
      group.quaternion.copy(camera.quaternion);
      const hour = clockTime(hotU);
      hand.rotation.z = -((hour % 24) / 24) * Math.PI * 2;
      const inBreak = hotU >= BREAK_FROM && hotU <= BREAK_TO;
      after.material.opacity = inBreak ? 0.5 + 0.5 * Math.abs(Math.sin(t * 19)) : 0.35;
      hand.material.color.setHex(inBreak ? HEX.alert : HEX.truck);
    },
  };
}
