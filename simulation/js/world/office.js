// The diorama: an open-plan evening office floor (24 × 16 units) on a raised
// slab, with cutaway front walls. Static furniture is merged into a handful of
// draw calls; screens and boards are separate textured quads (see kit.js).
import { C } from './palette.js';
import { ANCHORS } from './anchors.js';
import {
  at, desk, chair, monitor, laptop, halo, deskLamp, floorLamp, plant, bookshelf, cabinet,
  sofa, rug, coffeeCorner, waterCooler, printer, glassWall, openDesk,
} from './furniture.js';
import { paintSlides } from './screens.js';
import { buildProps } from './props.js';

const PI = Math.PI;
const WALL_H = 2.6;
const BACK_Z = -8.1;
const LEFT_X = -12.1;

export function buildOffice(kit) {
  buildBase(kit);
  buildBackWall(kit);
  buildLeftWall(kit);
  buildCutaway(kit);
  buildRooms(kit);
  furnishBack(kit);
  furnishMiddle(kit);
  furnishFront(kit);
  buildProps(kit);
}

// ------------------------------------------------------------- structure ---
function buildBase(kit) {
  const m = kit.m;
  m.box(-6, -1.4, -11.5, 42, 0.88, 41, C.slabSide);
  m.box(-6, -0.52, -11.5, 42, 0.02, 41, C.ground);
  m.box(-6, -0.53, 8.99, 42.04, 0.03, 0.04, C.slabCut);
  m.box(15.0, -0.53, -11.5, 0.04, 0.03, 41.04, C.slabCut);
  m.box(0, -0.5, 0, 24.4, 0.47, 16.4, C.slabSide);
  m.box(0, -0.03, 0, 24.44, 0.03, 16.44, C.floor);
  m.box(0, -0.035, 8.21, 24.46, 0.04, 0.03, C.slabCut);
  m.box(12.21, -0.035, 0, 0.03, 0.04, 16.46, C.slabCut);
  // Floor zones (thin layers on the floor plane).
  m.box(-9.6, 0, -5.8, 4.8, 0.01, 4.4, C.floorWood);
  m.box(-4.7, 0, -5.8, 5.0, 0.01, 4.4, C.floorZone);
  m.box(-0.4, 0, -6.6, 3.6, 0.01, 2.8, 0x222c38);
  for (let x = -2.2; x <= 1.4; x += 0.6) m.box(x, 0.01, -6.6, 0.015, 0.004, 2.8, 0x323e4c);
  m.box(-9.25, 0, 5.6, 5.5, 0.01, 4.8, C.floorZone);
  m.box(0, 0, -2.75, 24, 0.012, 0.9, 0x263850);
  m.box(1, 0, 1.55, 22, 0.012, 0.9, 0x263850);
}

function buildBackWall(kit) {
  const solid = [[-2.2, 1.4], [-5.9, -3.5], [10.4, 12.2]];
  const isSolid = (x) => solid.some(([a, b]) => x >= a - 0.001 && x <= b + 0.001);
  const m = kit.m;
  solid.forEach(([a, b]) => wallSegment(kit, 'x', BACK_Z, a, b));
  // Window bays between the solid parts.
  const bays = [[-12.2, -5.9], [-3.5, -2.2], [1.4, 10.4]];
  bays.forEach(([a, b]) => {
    m.box((a + b) / 2, 0, BACK_Z, b - a, 0.5, 0.2, C.wall);
    m.box((a + b) / 2, 0.5, BACK_Z + 0.12, b - a, 0.05, 0.12, C.wallCap);
    m.box((a + b) / 2, 2.2, BACK_Z, b - a, WALL_H - 2.2, 0.2, C.wall);
    m.box((a + b) / 2, WALL_H, BACK_Z, b - a, 0.04, 0.22, C.wallCap);
    kit.glass.box((a + b) / 2, 0.5, BACK_Z, b - a, 1.7, 0.03, 0x7fb4d6);
    const panes = Math.max(1, Math.round((b - a) / 1.6));
    for (let i = 0; i <= panes; i++) {
      const x = a + ((b - a) * i) / panes;
      if (isSolid(x) && i !== 0 && i !== panes) continue;
      m.box(x, 0.5, BACK_Z, 0.09, 1.7, 0.16, C.mullion);
    }
    m.box((a + b) / 2, 1.35, BACK_Z, b - a, 0.05, 0.1, C.mullion);
  });
}

function wallSegment(kit, axis, c, a, b, h = WALL_H) {
  const mid = (a + b) / 2;
  const len = b - a;
  if (axis === 'x') {
    kit.m.box(mid, 0, c, len, h, 0.2, C.wall);
    kit.m.box(mid, h, c, len, 0.04, 0.22, C.wallCap);
    kit.m.box(mid, 0, c + 0.11, len, 0.1, 0.02, C.trim);
  } else {
    kit.m.box(c, 0, mid, 0.2, h, len, C.wall);
    kit.m.box(c, h, mid, 0.22, 0.04, len, C.wallCap);
    kit.m.box(c + 0.11, 0, mid, 0.02, 0.1, len, C.trim);
  }
}

function buildLeftWall(kit) {
  wallSegment(kit, 'z', LEFT_X, -8.2, 8.2);
  kit.m.box(LEFT_X + 0.1, 0.1, 0, 0.02, 2.5, 16.2, C.wallInner);
}

// Cutaway: the front and right walls are sliced near the floor, diorama style.
function buildCutaway(kit) {
  const m = kit.m;
  const stub = 0.32;
  [[-12.2, 9.35], [11.05, 12.2]].forEach(([a, b]) => {
    m.box((a + b) / 2, 0, 8.1, b - a, stub, 0.2, C.wall);
    m.box((a + b) / 2, stub, 8.1, b - a, 0.03, 0.22, C.wallCap);
  });
  m.box(12.1, 0, 0, 0.2, stub, 16.4, C.wall);
  m.box(12.1, stub, 0, 0.22, 0.03, 16.4, C.wallCap);
  // Entrance frame and mat.
  m.box(9.3, 0, 8.1, 0.12, 2.3, 0.24, C.glassFrame);
  m.box(11.1, 0, 8.1, 0.12, 2.3, 0.24, C.glassFrame);
  m.box(10.2, 2.3, 8.1, 1.92, 0.14, 0.24, C.glassFrame);
  kit.glow.box(10.2, 2.46, 8.1, 0.5, 0.14, 0.05, C.good);
  m.box(10.2, 0, 7.45, 1.4, 0.015, 0.9, 0x5a3a2e);
}

function buildRooms(kit) {
  glassWall(kit, 'z', -7.2, -8.0, -3.6);
  glassWall(kit, 'x', -3.6, -12.0, -7.2, 2.4, { door: [-8.65, -7.55] });
  glassWall(kit, 'z', -2.2, -8.0, -3.6);
  glassWall(kit, 'x', -3.6, -7.2, -2.2, 2.4, { door: [-3.4, -2.5] });
  glassWall(kit, 'z', 1.4, -8.0, -5.2);
  glassWall(kit, 'x', -5.2, -2.2, 1.4, 2.4, { door: [0.35, 1.25] });
  glassWall(kit, 'z', -6.5, 3.2, 8.0, 1.3);
  glassWall(kit, 'x', 3.2, -12.0, -6.5, 1.3, { door: [-8.5, -7.35] });
}

// ------------------------------------------------------------ furniture ---
// A seated workstation facing +z (person visible): monitor to the sitter's right.
function workstation(kit, anchorId, seatIndex, { lamp = false, light = false, laptopToo = false, w = 1.4 } = {}) {
  const [sx, sz, yaw] = ANCHORS[anchorId].seats[seatIndex];
  const [dx, dz] = at(sx, sz, yaw, 0, 0.65);
  desk(kit, dx, dz, yaw, { w });
  chair(kit, sx, sz, yaw);
  halo(kit, monitor(kit, dx, dz, yaw, -0.4, 0.12, -0.45));
  if (laptopToo) laptop(kit, dx, dz, yaw, 0.12, -0.05);
  if (lamp) deskLamp(kit, dx, dz, yaw, w / 2 - 0.18, 0.2, { light });
  paperStack(kit, dx, dz, yaw, 0.3, 0.18);
  return [dx, dz];
}

function paperStack(kit, x, z, yaw, lx, lz) {
  const [px, pz] = at(x, z, yaw, lx, lz);
  const f = kit.m.frame(px, 0.5, pz, yaw + 0.2);
  f.box(0, 0, 0, 0.22, 0.03, 0.3, C.paper);
  f.box(0.02, 0.03, 0.01, 0.22, 0.02, 0.3, 0xdcd3c0);
}

function furnishBack(kit) {
  // CTO office.
  const [cdx, cdz] = workstation(kit, 'cto-office', 0, { lamp: true, light: true, w: 1.9 });
  rug(kit, cdx, cdz + 0.5, 3.0, 2.2, 0x4a3b4f, 0x8a6e55);
  chair(kit, -10.3, -5.15, PI, 0x6a4f3c);
  chair(kit, -9.3, -5.15, PI, 0x6a4f3c);
  bookshelf(kit, -11.8, -6.6, PI / 2, { w: 1.5, h: 1.8, seed: 11 });
  plant(kit, -7.6, -7.55, 1.2, true);
  // Meeting room.
  const t = kit.m;
  t.box(-4.7, 0.47, -5.8, 2.6, 0.06, 1.2, C.deskTopDark);
  t.box(-5.6, 0, -5.8, 0.12, 0.47, 0.7, C.deskLeg);
  t.box(-3.8, 0, -5.8, 0.12, 0.47, 0.7, C.deskLeg);
  ANCHORS['meeting-room'].seats.forEach(([x, z, yaw]) => chair(kit, x, z, yaw));
  kit.screens.push({ w: 2.0, h: 1.1, pos: [-4.7, 1.55, -7.97], yaw: 0, paint: paintSlides('evening'), size: [512, 280], tag: 'slides' });
  kit.m.box(-4.7, 0.98, -7.99, 2.1, 1.2, 0.03, C.monitor);
  floorLamp(kit, -6.85, -7.5, { light: true });
  plant(kit, -2.6, -7.55, 0.9);
  t.box(-4.2, 0.53, -5.6, 0.3, 0.02, 0.22, C.paper);
  t.cyl(-5.2, 0.53, -6.0, 0.04, 0.09, 0xece6d8, 8);
  // Server room racks.
  [-1.6, -0.6].forEach((x) => t.box(x, 0, -7.45, 0.75, 2.05, 0.8, C.rack));
  t.box(-1.6, 2.05, -7.45, 0.75, 0.03, 0.8, C.metal);
  t.box(-0.6, 2.05, -7.45, 0.75, 0.03, 0.8, C.metal);
  t.box(0.8, 2.1, -7.6, 1.2, 0.06, 0.3, C.metal);
  kit.pools.push({ x: -0.4, y: 0.015, z: -6.6, r: 1.4, color: 0x2a7f8a, tag: 'screen' });
  // Integration desks (empty tonight, screens towards us).
  openDesk(kit, 3.3, -6.4, PI, 5);
  openDesk(kit, 5.1, -6.4, PI, 9);
  deskLamp(kit, 5.1, -6.4, PI, -0.5, 0.1);
  plant(kit, 6.5, -7.55, 1.1, true);
  plant(kit, 2.0, -7.55, 0.8);
  // DevOps corner: two monitors, router shelf.
  const [bx, bz] = workstation(kit, 'devops-corner', 0, { lamp: true, w: 2.0 });
  halo(kit, monitor(kit, bx, bz, 0, -0.8, 0.1, -0.6));
  kit.m.box(11.65, 0, -7.6, 0.6, 1.0, 0.45, C.trim);
  for (let i = 0; i < 3; i++) kit.m.box(11.65, 0.25 + i * 0.25, -7.55, 0.5, 0.06, 0.38, 0x3a4a5c);
  for (let i = 0; i < 6; i++) kit.glow.box(11.45 + i * 0.07, 0.6, -7.34, 0.025, 0.02, 0.01, i % 2 ? C.good : C.amber);
  kit.m.cyl(10.95, 0, -7.5, 0.2, 0.42, 0x2f3e4f, 10);
  plant(kit, 8.1, -7.6, 1.0);
}

function furnishMiddle(kit) {
  // QA (Deniz): laptop, monitor, lamp.
  workstation(kit, 'qa-desk', 0, { lamp: true, light: true, laptopToo: true, w: 1.5 });
  plant(kit, -11.5, -2.3, 0.9);
  // Routing (Ece) + one empty colleague desk; the code desk is a document prop.
  workstation(kit, 'routing-desk', 0, { lamp: true });
  openDesk(kit, -2.4, -0.85, -PI / 2, 2);
  // Field (Onur): phones and test devices.
  const [fx, fz] = workstation(kit, 'field-desk', 0, { lamp: false });
  for (let i = 0; i < 4; i++) {
    const [px, pz] = at(fx, fz, 0, 0.15 + i * 0.12, -0.05 + (i % 2) * 0.08);
    kit.m.box(px, 0.5, pz, 0.07, 0.012, 0.13, C.monitor);
    kit.glow.box(px, 0.513, pz, 0.055, 0.002, 0.11, i === 2 ? 0xff7a6b : 0x8fd6ff);
  }
  kit.m.box(fx + 0.5, 0.5, fz + 0.2, 0.3, 0.12, 0.08, C.trim);
  cabinet(kit, 2.15, -1.2, 0, { w: 0.5, h: 0.55, drawers: 2 });
  // Product owners (Kerem, Aylin).
  workstation(kit, 'po-desk', 0, { laptopToo: true });
  workstation(kit, 'po-desk', 1, { lamp: true, light: true, laptopToo: true });
  plant(kit, 9.4, -1.4, 1.1, true);
  waterCooler(kit, 11.5, 0.3);
  plant(kit, 11.5, -1.0, 0.9);
}

function furnishFront(kit) {
  // War room: the assessor's temporary desk.
  desk(kit, -9.8, 5.85, 0, { w: 1.6, top: C.deskTopDark });
  chair(kit, -9.8, 5.2, 0);
  laptop(kit, -9.8, 5.85, 0, 0.1, -0.05, 0x5a6878);
  deskLamp(kit, -9.8, 5.85, 0, -0.6, 0.15, { light: true });
  paperStack(kit, -9.8, 5.85, 0, 0.5, 0.1);
  rug(kit, -9.4, 5.4, 3.4, 2.6, 0x3d4a5f, 0x8a6e55);
  [[-11.5, 7.5], [-11.0, 7.6]].forEach(([x, z], i) => {
    kit.m.box(x, 0, z, 0.45, 0.32, 0.35, 0x9c7a55);
    kit.m.box(x, 0.32, z, 0.47, 0.03, 0.37, 0x8a6a48);
    if (i === 0) kit.m.box(x, 0.35, z, 0.45, 0.28, 0.35, 0xa98563);
  });
  plant(kit, -6.9, 7.6, 1.0, true);
  // Lounge.
  rug(kit, -3.0, 5.7, 4.4, 3.2);
  sofa(kit, -4.6, 5.7, PI / 2, 2.0);
  kit.m.box(-3.1, 0, 5.7, 0.9, 0.3, 0.6, C.deskTopDark);
  kit.m.cyl(-3.0, 0.3, 5.6, 0.05, 0.09, C.player, 8);
  kit.m.sphere(-1.6, 0.2, 6.6, 0.32, 0xc98e5a, 9, [1, 0.7, 1]);
  kit.m.sphere(-1.5, 0.2, 5.0, 0.3, 0x3f7f8c, 9, [1, 0.7, 1]);
  floorLamp(kit, -5.3, 7.4, { light: true });
  bookshelf(kit, -0.9, 7.55, 0, { w: 1.3, h: 0.9, d: 0.32, seed: 5 });
  plant(kit, -5.5, 3.8, 1.0);
  // Mail / printer corner and coffee.
  printer(kit, 4.6, 6.9, 0);
  cabinet(kit, 5.5, 6.95, 0, { w: 0.5, h: 0.9, drawers: 3 });
  coffeeCorner(kit, 7.0, 4.0, 0);
  kit.m.cyl(7.1, 0, 6.0, 0.4, 0.04, C.deskLeg, 12);
  kit.m.cyl(7.1, 0.04, 6.0, 0.04, 0.6, C.metal, 6);
  kit.m.cyl(7.1, 0.64, 6.0, 0.42, 0.04, C.deskTop, 16);
  [[6.5, 6.4], [7.7, 5.7]].forEach(([x, z]) => {
    kit.m.cyl(x, 0, z, 0.03, 0.4, C.metal, 6);
    kit.m.cyl(x, 0.4, z, 0.17, 0.05, C.chairSeat, 12);
  });
  // Entrance.
  plant(kit, 8.85, 7.6, 1.1, true);
  plant(kit, 11.6, 7.55, 0.9);
  kit.m.cyl(11.55, 0, 6.5, 0.025, 1.6, C.trim, 6);
  kit.m.sphere(11.55, 1.45, 6.5, 0.16, 0x7a3b3b, 7, [1, 1.3, 0.8]);
}
