// Outside the windows: a night street with RotaPlan delivery trucks, a side
// alley with a parked van, and distant city blocks with lit windows.
import { C } from './palette.js';
import { createMerger } from './geo.js';
import { plant } from './furniture.js';

const G = -0.5;            // street level (the office slab is raised)
const ROAD = { z0: -15.2, z1: -12.0 };
const X_MIN = -23;
const X_MAX = 15;

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Static street furniture goes into the shared kit; returns lamp-post positions.
export function buildStreet(kit) {
  const m = kit.m;
  m.box(-4, G, (ROAD.z0 + ROAD.z1) / 2, 38, 0.012, ROAD.z1 - ROAD.z0, C.asphalt);
  for (let x = X_MIN + 1; x < X_MAX; x += 2.2) m.box(x, G + 0.012, -13.6, 1.1, 0.004, 0.09, 0x9aa6b5);
  m.box(-4, G, -10.1, 38, 0.1, 3.8, C.sidewalk);
  for (let x = X_MIN + 0.5; x < X_MAX; x += 1.6) m.box(x, G + 0.1, -10.1, 0.02, 0.004, 3.8, 0x33445a);
  m.box(-4, G, -12.05, 38, 0.13, 0.12, C.curb);
  m.box(-4, G, -16.0, 38, 0.1, 1.6, C.sidewalk);
  m.box(-4, G, -15.25, 38, 0.13, 0.12, C.curb);
  // Side alley / parking to the left of the office.
  m.box(-17.2, G, 0.4, 9.6, 0.03, 17.2, C.ground);
  for (let z = -7; z <= 6; z += 2.6) m.box(-14.6, G + 0.03, z, 2.2, 0.004, 0.07, 0x55667a);
  m.box(-19.8, G, 0.4, 2.4, 0.06, 17.2, C.grass);
  [[-20.2, -6], [-19.6, -1.5], [-20.3, 3.2], [-19.7, 7.5]].forEach(([x, z], i) => tree(m, x, z, 1 + (i % 2) * 0.25));
  [[-6, -16.2], [2, -16.3], [9.5, -16.2], [-16.5, -16.2]].forEach(([x, z]) => tree(m, x, z, 1.1));
  [[-9, -10.6], [5.5, -10.7], [13, -10.6]].forEach(([x, z]) => tree(m, x, z, 0.9));
  bench(m, -17.6, 6.6);
  plant(kit, -12.8, 7.6, 1.0, true);
  const posts = [];
  for (let x = -18; x <= 14; x += 8) posts.push(lampPost(kit, x, -11.6));
  posts.push(lampPost(kit, -13.0, 1.5, Math.PI / 2));
  buildCity(kit);
  return posts;
}

function tree(m, x, z, s) {
  m.cyl(x, G, z, 0.08 * s, 0.9 * s, 0x4a3a2c, 6);
  m.sphere(x, G + 1.25 * s, z, 0.62 * s, 0x1f4a3e, 7);
  m.sphere(x + 0.25 * s, G + 1.6 * s, z + 0.1 * s, 0.42 * s, 0x2a5d4b, 7);
}

function bench(m, x, z) {
  m.box(x, G + 0.3, z, 1.4, 0.06, 0.45, 0x6a4f3c);
  m.box(x, G + 0.36, z - 0.2, 1.4, 0.35, 0.06, 0x6a4f3c);
  m.box(x - 0.6, G, z, 0.06, 0.3, 0.4, C.trim);
  m.box(x + 0.6, G, z, 0.06, 0.3, 0.4, C.trim);
}

function lampPost(kit, x, z, yaw = 0) {
  const f = kit.m.frame(x, G, z, yaw);
  f.cyl(0, 0, 0, 0.06, 3.0, C.trim, 8);
  f.box(0, 2.95, -0.35, 0.06, 0.06, 0.8, C.trim);
  f.box(0, 2.85, -0.7, 0.3, 0.12, 0.42, C.trim);
  const hx = x - Math.sin(yaw) * 0.7;
  const hz = z - Math.cos(yaw) * 0.7;
  kit.glow.box(hx, G + 2.83, hz, 0.24, 0.02, 0.34, 0xffd9a0);
  kit.pools.push({ x: hx, y: G + 0.02, z: hz, r: 2.6, color: 0xffb45e, tag: 'street' });
  return [hx, G + 2.8, hz];
}

function buildCity(kit) {
  const rand = seeded(2026);
  const rows = [{ z: -20.5, depth: 6, hMin: 3, hMax: 8 }, { z: -28, depth: 7, hMin: 6, hMax: 14 }];
  rows.forEach((row, ri) => {
    let x = X_MIN;
    while (x < X_MAX) {
      const w = 2.6 + rand() * 3.2;
      const h = row.hMin + rand() * (row.hMax - row.hMin);
      const color = C.building[Math.floor(rand() * C.building.length)];
      building(kit, x + w / 2, row.z, Math.min(w, X_MAX - x) - 0.3, h, row.depth, color, rand, ri);
      x += w;
    }
  });
  // Left of the alley: a few taller blocks.
  [[-24.8, -6, 9], [-24.8, 0, 6], [-24.8, 6, 11]].forEach(([x, z, h]) => building(kit, x, z, 4, h, 5.5, C.building[1], rand, 1, true));
}

function building(kit, cx, cz, w, h, d, color, rand, row, sideFacing = false) {
  if (w < 1) return;
  kit.m.box(cx, G, cz, w, h, d, color);
  kit.m.box(cx, G + h, cz, w + 0.1, 0.12, d + 0.1, 0x4a6385);
  if (rand() > 0.6) kit.m.box(cx + (rand() - 0.5) * w * 0.4, G + h + 0.12, cz, 0.8, 0.5, 0.8, 0x1a2738);
  const winW = 0.32;
  const winH = 0.42;
  const front = sideFacing ? null : cz + d / 2 + 0.01;
  const side = cx + w / 2 + 0.01;
  for (let y = G + 0.9; y < G + h - 0.5; y += 0.9) {
    if (front !== null) {
      for (let x = cx - w / 2 + 0.45; x < cx + w / 2 - 0.3; x += 0.7) windowAt(kit, x, y, front, 'z', rand, row);
    }
    for (let z = cz - d / 2 + 0.45; z < cz + d / 2 - 0.3; z += 0.75) windowAt(kit, side, y, z, 'x', rand, row);
  }
  function windowAt(k, x, y, z, axis, r) {
    const lit = r();
    if (lit > 0.42) {
      k.m.box(x, y, z, axis === 'z' ? winW : 0.02, winH, axis === 'z' ? 0.02 : winW, 0x0e1825);
      return;
    }
    const warm = lit < 0.3 ? C.windowWarm : C.windowCool;
    k.glow.box(x, y, z, axis === 'z' ? winW : 0.02, winH, axis === 'z' ? 0.02 : winW, dim(warm, row ? 0.55 : 0.8));
  }
}

function dim(hex, f) {
  const r = ((hex >> 16) & 255) * f;
  const g = ((hex >> 8) & 255) * f;
  const b = (hex & 255) * f;
  return (r << 16) | (g << 8) | b;
}

// ------------------------------------------------------------------ trucks ---
export function createTraffic(THREE, parent, glowTex) {
  const body = createMerger(THREE);
  truckBody(body);
  const lights = createMerger(THREE);
  lights.box(1.42, 0.38, 0.32, 0.04, 0.1, 0.16, C.headlight);
  lights.box(1.42, 0.38, -0.32, 0.04, 0.1, 0.16, C.headlight);
  lights.box(-1.42, 0.45, 0.4, 0.03, 0.12, 0.1, C.taillight);
  lights.box(-1.42, 0.45, -0.4, 0.03, 0.12, 0.1, C.taillight);
  const bodyMesh = body.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), { castShadow: false, receiveShadow: false });
  const lightMesh = lights.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), { castShadow: false, receiveShadow: false });
  body.dispose();
  lights.dispose();
  const beamGeo = new THREE.PlaneGeometry(3.2, 1.8);
  beamGeo.rotateX(-Math.PI / 2);
  beamGeo.translate(3.0, 0.02, 0);
  const beamMat = new THREE.MeshBasicMaterial({
    map: glowTex, color: 0xffe2b0, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const lanes = [
    { z: -12.9, dir: 1, speed: 3.2, offsets: [0, 0.45] },
    { z: -14.3, dir: -1, speed: 2.6, offsets: [0.2, 0.7] },
  ];
  const trucks = [];
  lanes.forEach((lane) => lane.offsets.forEach((o) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(bodyMesh.geometry, bodyMesh.material);
    const l = new THREE.Mesh(lightMesh.geometry, lightMesh.material);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    g.add(b, l, beam);
    g.rotation.y = lane.dir > 0 ? 0 : Math.PI;
    g.position.set(0, G + 0.01, lane.z);
    g.userData.size = 0.78;
    parent.add(g);
    trucks.push({ g, lane, u: o });
  }));
  const span = X_MAX - X_MIN;
  return {
    groups: trucks.map((t) => t.g),
    update(dt) {
      trucks.forEach((t) => {
        t.u = (t.u + (dt * t.lane.speed) / span) % 1;
        const x = t.lane.dir > 0 ? X_MIN + t.u * span : X_MAX - t.u * span;
        const edge = Math.min(x - X_MIN, X_MAX - x);
        t.g.position.x = x;
        t.g.scale.setScalar(t.g.userData.size * Math.max(0.001, Math.min(1, edge / 1.2)));
      });
    },
    dispose() {
      bodyMesh.geometry.dispose();
      bodyMesh.material.dispose();
      lightMesh.geometry.dispose();
      lightMesh.material.dispose();
      beamGeo.dispose();
      beamMat.dispose();
    },
  };
}

function truckBody(m) {
  m.box(-0.35, 0.28, 0, 2.1, 1.25, 1.12, C.truckBody);
  m.box(-0.35, 0.62, 0.565, 1.9, 0.16, 0.01, C.truckCab);
  m.box(-0.35, 0.62, -0.565, 1.9, 0.16, 0.01, C.truckCab);
  m.box(1.05, 0.28, 0, 0.75, 0.92, 1.06, C.truckCab);
  m.box(1.25, 0.72, 0, 0.36, 0.38, 1.0, 0x0f1a26, { z: 0.35 });
  m.box(0.4, 0.15, 0, 2.9, 0.16, 0.9, C.trim);
  [[-1.0, 0.5], [-1.0, -0.5], [1.05, 0.5], [1.05, -0.5]].forEach(([x, z]) => {
    m.cyl(x, 0.1, z, 0.17, 0.14, C.tyre, 10, { x: Math.PI / 2 });
  });
}
