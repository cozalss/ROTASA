// Low-poly furniture, written into the shared kit:
//   kit.m      matte merger (one draw call for all static furniture)
//   kit.glow   unlit emissive merger (bulbs, LEDs, lit windows)
//   kit.glass  transparent merger
//   kit.screens  textured screen quads to build later  { w, h, pos, yaw, paint, tag }
//   kit.pools    soft light pools on surfaces           { x, y, z, r, color, tag }
//   kit.lamps    warm lamp positions (some get a real point light)
import { C } from './palette.js';
import { paintCode } from './screens.js';

const DESK_H = 0.5;

// Local (lx, lz) offset rotated by yaw, added to (x, z).
export function at(x, z, yaw, lx, lz) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x + lx * c + lz * s, z - lx * s + lz * c];
}

export function desk(kit, x, z, yaw, { w = 1.4, d = 0.75, top = C.deskTop } = {}) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, DESK_H - 0.05, 0, w, 0.05, d, top);
  f.box(-w / 2 + 0.05, 0, 0, 0.05, DESK_H - 0.05, d - 0.08, C.deskLeg);
  f.box(w / 2 - 0.05, 0, 0, 0.05, DESK_H - 0.05, d - 0.08, C.deskLeg);
  f.box(0, 0.16, d / 2 - 0.06, w - 0.1, 0.26, 0.03, C.deskLeg);
  return f;
}

export function chair(kit, x, z, yaw, seat = C.chairSeat) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, 0.035, 0, 0.46, 0.025, 0.06, C.deskLeg);
  f.box(0, 0.035, 0, 0.06, 0.025, 0.46, C.deskLeg);
  f.cyl(0, 0.05, 0, 0.03, 0.17, C.metal, 8);
  f.box(0, 0.21, 0.01, 0.42, 0.07, 0.4, seat);
  f.box(0, 0.3, -0.2, 0.4, 0.42, 0.06, C.chair);
}

// A monitor on a desk frame, screen facing the desk's local -z (towards the sitter).
// Returns the world position/yaw of its screen so callers can add a texture.
export function monitor(kit, x, z, yaw, lx, lz, turn = 0, { w = 0.5, h = 0.3 } = {}) {
  const [mx, mz] = at(x, z, yaw, lx, lz);
  const myaw = yaw + turn;
  const f = kit.m.frame(mx, DESK_H, mz, myaw);
  f.box(0, 0, 0.02, 0.2, 0.015, 0.13, C.monitor);
  f.box(0, 0.015, 0.04, 0.04, 0.12, 0.03, C.monitor);
  f.box(0, 0.1, 0.02, w, h, 0.035, C.monitor);
  const [sx, sz] = at(mx, mz, myaw, 0, 0.002);
  return { pos: [sx, DESK_H + 0.1 + h / 2, sz], yaw: myaw + Math.PI, w: w - 0.04, h: h - 0.04 };
}

export function laptop(kit, x, z, yaw, lx, lz, color = 0x9aa7b5) {
  const [px, pz] = at(x, z, yaw, lx, lz);
  const f = kit.m.frame(px, DESK_H, pz, yaw);
  f.box(0, 0, 0, 0.34, 0.015, 0.24, color);
  f.box(0, 0.01, 0.12, 0.34, 0.22, 0.012, color, { x: -0.25 });
  kit.pools.push({ x: px, y: DESK_H + 0.02, z: pz, r: 0.45, color: 0x8fc8ff, tag: 'screen' });
}

// Cool halo behind a monitor whose screen faces away from the camera, so it reads as "on".
export function halo(kit, screen, color = 0x8fd6ff) {
  kit.halos.push({ ...screen, color });
  kit.pools.push({ x: screen.pos[0], y: DESK_H + 0.015, z: screen.pos[2], r: 0.7, color, tag: 'screen' });
}

export function deskLamp(kit, x, z, yaw, lx, lz, { light = false } = {}) {
  const [px, pz] = at(x, z, yaw, lx, lz);
  const f = kit.m.frame(px, DESK_H, pz, yaw);
  f.cyl(0, 0, 0, 0.07, 0.02, C.trim, 10);
  f.box(0, 0.02, 0, 0.025, 0.3, 0.025, C.trim, { x: 0.25 });
  f.cone(0, 0.27, 0.1, 0.03, 0.09, 0.09, C.amber, 10, { x: 0.5 });
  kit.glow.sphere(px + Math.sin(yaw) * 0.12, DESK_H + 0.3, pz + Math.cos(yaw) * 0.12, 0.035, 0xfff0d0, 6);
  kit.pools.push({ x: px + Math.sin(yaw) * 0.2, y: DESK_H + 0.015, z: pz + Math.cos(yaw) * 0.2, r: 0.9, color: C.amber, tag: 'lamp' });
  kit.lamps.push({ x: px, y: DESK_H + 0.5, z: pz, light, kind: 'desk', head: [px + Math.sin(yaw) * 0.12, DESK_H + 0.29, pz + Math.cos(yaw) * 0.12], floor: DESK_H + 0.02 });
}

export function floorLamp(kit, x, z, { light = true, h = 1.55 } = {}) {
  kit.m.cyl(x, 0, z, 0.16, 0.03, C.trim, 12);
  kit.m.cyl(x, 0.03, z, 0.018, h - 0.2, C.metal, 6);
  kit.m.cone(x, h - 0.25, z, 0.15, 0.22, 0.3, 0xf3d9a8, 14);
  kit.glow.cyl(x, h - 0.255, z, 0.2, 0.01, 0xffe9c2, 14);
  kit.pools.push({ x, y: 0.012, z, r: 1.9, color: C.amber, tag: 'lamp' });
  kit.lamps.push({ x, y: h - 0.1, z, light, kind: 'floor', head: [x, h - 0.27, z], floor: 0.02 });
}

export function plant(kit, x, z, size = 1, tall = false) {
  const m = kit.m;
  m.cone(x, 0, z, 0.17 * size, 0.13 * size, 0.28 * size, C.pot, 9);
  m.cyl(x, 0.27 * size, z, 0.15 * size, 0.02, 0x3b2a20, 9);
  if (tall) {
    m.cyl(x, 0.28 * size, z, 0.025 * size, 0.7 * size, 0x5a4636, 6);
    [[0, 1.05, 0, 0.3], [0.14, 0.86, 0.06, 0.22], [-0.12, 0.92, -0.05, 0.2], [0.02, 1.28, 0.03, 0.2]].forEach(([dx, dy, dz, r], i) => {
      m.sphere(x + dx * size, dy * size, z + dz * size, r * size, i % 2 ? C.leafLight : C.leaf, 7);
    });
    return;
  }
  [[0, 0.42, 0, 0.2], [0.1, 0.5, 0.05, 0.14], [-0.09, 0.52, -0.04, 0.13], [0.03, 0.62, -0.02, 0.11]].forEach(([dx, dy, dz, r], i) => {
    m.sphere(x + dx * size, dy * size, z + dz * size, r * size, i % 2 ? C.leafLight : C.leaf, 7);
  });
}

export function bookshelf(kit, x, z, yaw, { w = 1.2, h = 1.7, d = 0.34, seed = 3 } = {}) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(-w / 2, 0, 0, 0.04, h, d, C.shelf);
  f.box(w / 2, 0, 0, 0.04, h, d, C.shelf);
  f.box(0, 0, -d / 2 + 0.02, w, h, 0.03, C.trim);
  const shelves = 4;
  let s = seed;
  for (let i = 0; i <= shelves; i++) {
    const y = (i / shelves) * (h - 0.04);
    f.box(0, y, 0, w, 0.035, d, C.shelf);
    if (i === shelves) continue;
    let bx = -w / 2 + 0.06;
    while (bx < w / 2 - 0.12) {
      s = (s * 9301 + 49297) % 233280;
      const bw = 0.04 + (s % 5) * 0.012;
      const bh = 0.2 + (s % 7) * 0.025;
      if (s % 11 !== 0) f.box(bx + bw / 2, y + 0.035, 0.01, bw, bh, d * 0.7, C.book[s % C.book.length]);
      bx += bw + 0.008;
    }
  }
}

export function cabinet(kit, x, z, yaw, { w = 0.5, h = 0.75, d = 0.5, drawers = 2, color = C.metal } = {}) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, 0, 0, w, h, d, color);
  for (let i = 0; i < drawers; i++) {
    const y = 0.04 + (i * (h - 0.06)) / drawers;
    f.box(0, y, d / 2, w - 0.06, (h - 0.06) / drawers - 0.03, 0.015, 0x8193a6);
    f.box(0, y + (h - 0.06) / drawers - 0.1, d / 2 + 0.015, 0.14, 0.025, 0.02, C.trim);
  }
}

export function sofa(kit, x, z, yaw, w = 1.8) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, 0.05, 0, w, 0.25, 0.75, C.sofa);
  f.box(0, 0.05, -0.3, w, 0.62, 0.18, 0x415e7c);
  f.box(-w / 2 + 0.09, 0.05, 0.02, 0.18, 0.45, 0.72, 0x415e7c);
  f.box(w / 2 - 0.09, 0.05, 0.02, 0.18, 0.45, 0.72, 0x415e7c);
  f.box(-w / 4 + 0.05, 0.3, 0.04, w / 2 - 0.2, 0.08, 0.55, 0x5577a0);
  f.box(w / 4 - 0.05, 0.3, 0.04, w / 2 - 0.2, 0.08, 0.55, 0x5577a0);
  f.box(-w / 2 + 0.2, 0.36, -0.12, 0.3, 0.26, 0.1, C.rugBorder, { x: -0.2, z: 0.15 });
}

export function rug(kit, x, z, w, d, color = C.rug, border = C.rugBorder) {
  kit.m.box(x, 0, z, w, 0.012, d, border);
  kit.m.box(x, 0.002, z, w - 0.16, 0.012, d - 0.16, color);
  kit.m.box(x, 0.004, z, w - 0.5, 0.012, d - 0.5, 0x2f4b5c);
}

export function coffeeCorner(kit, x, z, yaw) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, 0, 0, 2.0, 0.85, 0.6, 0x3a4f66);
  f.box(0, 0.85, 0, 2.06, 0.05, 0.64, 0xcfc6b6);
  f.box(-0.55, 0.9, -0.05, 0.36, 0.48, 0.38, 0x222b35);
  f.box(-0.55, 1.15, 0.1, 0.24, 0.12, 0.1, 0x3d4a58);
  f.box(-0.55, 0.92, 0.12, 0.08, 0.1, 0.08, 0xece6d8);
  f.cyl(0.15, 0.9, 0.05, 0.05, 0.09, 0xff8a3d, 8);
  f.cyl(0.3, 0.9, -0.08, 0.05, 0.09, 0xece6d8, 8);
  f.cyl(0.62, 0.9, 0, 0.12, 0.22, 0x8a6e55, 10);
  const [gx, gz] = at(x, z, yaw, -0.55, 0.16);
  kit.glow.box(gx, 1.2, gz, 0.06, 0.03, 0.01, C.good);
}

export function waterCooler(kit, x, z) {
  kit.m.box(x, 0, z, 0.32, 0.9, 0.32, 0xd7e1ec);
  kit.glass.cyl(x, 0.9, z, 0.14, 0.38, 0x8fd6ff, 12);
}

export function printer(kit, x, z, yaw) {
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, 0, 0, 0.7, 0.55, 0.55, 0x3a4f66);
  f.box(0, 0.55, 0, 0.62, 0.28, 0.5, 0xd7e1ec);
  f.box(0, 0.83, 0.08, 0.5, 0.02, 0.28, C.paper);
}

// A glass partition along x (axis 'x') or z (axis 'z') with a frame, from a to b at c.
export function glassWall(kit, axis, c, a, b, h = 2.4, { door = null } = {}) {
  const spans = door ? [[a, door[0]], [door[1], b]] : [[a, b]];
  spans.forEach(([s0, s1]) => {
    if (s1 - s0 < 0.05) return;
    const mid = (s0 + s1) / 2;
    const len = s1 - s0;
    const [x, z, w, d] = axis === 'x' ? [mid, c, len, 0.04] : [c, mid, 0.04, len];
    kit.glass.box(x, 0.05, z, w, h - 0.1, d, 0x9fd0e0);
    kit.m.box(x, 0, z, axis === 'x' ? len : 0.07, 0.06, axis === 'x' ? 0.07 : len, C.glassFrame);
    kit.m.box(x, h - 0.06, z, axis === 'x' ? len : 0.07, 0.06, axis === 'x' ? 0.07 : len, C.glassFrame);
    [s0, s1].forEach((p) => {
      const [px, pz] = axis === 'x' ? [p, c] : [c, p];
      kit.m.box(px, 0, pz, 0.07, h, 0.07, C.glassFrame);
    });
  });
}

// An empty desk facing away from the camera so its screen is visible.
export function openDesk(kit, x, z, yaw, seed, paint = null) {
  desk(kit, x, z, yaw, { w: 1.3 });
  const [cx, cz] = at(x, z, yaw, 0.1, -0.8);
  chair(kit, cx, cz, yaw + 0.3);
  const scr = monitor(kit, x, z, yaw, 0, 0.12, 0, { w: 0.56, h: 0.33 });
  kit.screens.push({ ...scr, paint: paint || paintCode(seed), size: [256, 150], tag: 'dev', seed: paint ? null : seed });
  kit.pools.push({ x: scr.pos[0], y: 0.52, z: scr.pos[2], r: 0.8, color: 0x8fd6ff, tag: 'screen' });
  const [mx, mz] = at(x, z, yaw, 0.45, -0.1);
  kit.m.cyl(mx, 0.5, mz, 0.04, 0.09, C.paper, 8);
}

