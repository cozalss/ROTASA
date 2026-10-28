// Small living details: blinking rack LEDs, dust in lamp light, a wall clock
// with the in-game time, scrolling code and CI progress, outage flicker.
// With reduced motion none of this loops; the clock still shows the time.
import { C } from './palette.js';
import { lin } from './geo.js';
import { paintCode, paintPipeline, paintSlides } from './screens.js';

const LED_TICK = 0.14;
const SCREEN_TICK = 0.22;
const DUST_PER_LAMP = 22;

export function createEffects(THREE, parent, { glowTex, screens, halos, lamps }) {
  const leds = rackLeds(THREE, parent, glowTex);
  const dust = dustMotes(THREE, parent, glowTex, lamps);
  const clock = wallClock(THREE, parent);
  const dev = screens.get('dev') || [];
  const pipeline = (screens.get('pipeline') || [])[0];
  const slides = (screens.get('slides') || [])[0];
  let mood = 'evening';
  let ledT = 0;
  let scrT = 0;
  let tick = 0;

  // Outage: slow, uneven dimming (well under 3 flashes per second, no strobing).
  // Otherwise a barely visible breathing, so the screens feel alive.
  function flicker(t, on) {
    dev.forEach((s, i) => {
      const k = on
        ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * (2.0 + i * 0.35) + i)) * (0.93 + 0.07 * Math.sin(t * 7.1 + i * 2.3))
        : 0.965 + 0.035 * Math.sin(t * (0.6 + i * 0.11) + i * 1.9);
      s.mesh.material.color.copy(s.base).multiplyScalar(k);
    });
    if (halos) halos.material.opacity = halos.userData.baseOpacity * (on ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.3)) : 1);
  }

  return {
    setMood(id) {
      mood = id;
      pipeline?.repaint(paintPipeline(id));
      slides?.repaint(paintSlides(id));
      flicker(0, false);
    },
    setClock(minutes) { clock.set(minutes); },
    update(t, dt, reduced) {
      if (reduced) return;
      ledT += dt;
      if (ledT > LED_TICK) { ledT = 0; leds.blink(mood === 'outage'); }
      dust.update(dt, t);
      scrT += dt;
      if (scrT > SCREEN_TICK) {
        scrT = 0;
        tick += 1;
        dev.forEach((s) => { if (s.spec.seed != null) s.repaint(paintCode(s.spec.seed, tick)); });
        if (pipeline && (mood === 'evening' || mood === 'outage')) pipeline.repaint(paintPipeline(mood, (tick % 40) / 40));
      }
      flicker(t, mood === 'outage');
    },
  };
}

function rackLeds(THREE, parent, glowTex) {
  const pts = [];
  [-1.6, -0.6].forEach((x) => {
    for (let r = 0; r < 9; r++) for (let k = 0; k < 3; k++) pts.push(x + 0.18 + k * 0.05, 0.4 + r * 0.17, -7.04);
  });
  const count = pts.length / 3;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const colors = new Float32Array(count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 7, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = 4;
  parent.add(points);
  const green = lin(THREE, C.good);
  const amber = lin(THREE, C.amber);
  const red = lin(THREE, C.alert);
  const blink = (alarm) => {
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const c = alarm ? (r > 0.35 ? red : amber) : r > 0.15 ? green : amber;
      const on = Math.random() > (alarm ? 0.5 : 0.25);
      colors.set(on ? [c.r, c.g, c.b] : [0.02, 0.03, 0.03], i * 3);
    }
    geo.attributes.color.needsUpdate = true;
  };
  blink(false);
  return { blink };
}

function dustMotes(THREE, parent, glowTex, lamps) {
  const sources = lamps.slice(0, 8);
  const n = sources.length * DUST_PER_LAMP;
  const base = new Float32Array(n * 3);
  const pos = new Float32Array(n * 3);
  sources.forEach((l, li) => {
    for (let k = 0; k < DUST_PER_LAMP; k++) {
      const i = (li * DUST_PER_LAMP + k) * 3;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.75;
      base.set([l.x + Math.cos(a) * r, 0.5 + Math.random() * Math.max(0.6, l.y - 0.3), l.z + Math.sin(a) * r], i);
    }
  });
  pos.set(base);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 3, map: glowTex, color: lin(THREE, 0xffe2b0), transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = 4;
  parent.add(points);
  return {
    update(dt, t) {
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        pos[j] = base[j] + Math.sin(t * 0.3 + i) * 0.08;
        pos[j + 1] = base[j + 1] + Math.sin(t * 0.21 + i * 1.7) * 0.12;
        pos[j + 2] = base[j + 2] + Math.cos(t * 0.27 + i * 0.6) * 0.08;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// A wall clock on the left wall, between the QA corner and the war room.
function wallClock(THREE, parent) {
  const g = new THREE.Group();
  g.position.set(-11.96, 2.02, 2.75);
  g.rotation.y = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ color: lin(THREE, 0xe9e3d4), toneMapped: false }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.03, 8, 32), new THREE.MeshStandardMaterial({ color: lin(THREE, C.trim), roughness: 0.5 }));
  g.add(face, rim);
  const tickMat = new THREE.MeshBasicMaterial({ color: lin(THREE, 0x2b3a4c) });
  const tickGeo = new THREE.PlaneGeometry(0.018, 0.05);
  for (let i = 0; i < 12; i++) {
    const t = new THREE.Mesh(tickGeo, tickMat);
    const a = (i / 12) * Math.PI * 2;
    t.position.set(Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0.004);
    t.rotation.z = -a;
    g.add(t);
  }
  const hand = (len, w, color) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len).translate(0, len / 2 - 0.02, 0), new THREE.MeshBasicMaterial({ color: lin(THREE, color) }));
    m.position.z = 0.008;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  };
  const hour = hand(0.12, 0.028, 0x142233);
  const minute = hand(0.18, 0.018, 0x142233);
  parent.add(g);
  const set = (minutes) => {
    const mins = ((Number(minutes) % 1440) + 1440) % 1440;
    minute.rotation.z = -((mins % 60) / 60) * Math.PI * 2;
    hour.rotation.z = -(((mins / 60) % 12) / 12) * Math.PI * 2;
  };
  set(21 * 60 + 40);
  return { set };
}
