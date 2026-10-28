// Document props at their anchors: each piece of evidence is a distinctive object.
import { C } from './palette.js';
import { ANCHORS } from './anchors.js';
import { at, cabinet, openDesk } from './furniture.js';
import {
  paintWiki, paintTestTool, paintKanban, paintMetrics, paintPipeline, paintMail, paintTerminal,
  paintRoutingCode, paintCork, paintSticky, paintLabel, paintRack,
} from './screens.js';

const PI = Math.PI;
const p = (id) => ANCHORS[id].pos;

export function buildProps(kit) {
  wikiKiosk(kit);
  planFolder(kit);
  testToolKiosk(kit);
  jiraBoard(kit);
  metricsBoard(kit);
  pipelineScreen(kit);
  mailTerminal(kit);
  hrCabinet(kit);
  codeDesk(kit);
  stagingConsole(kit);
  corkboard(kit);
  stagingRack(kit);
}

function screen(kit, w, h, pos, yaw, paint, size, tag) {
  kit.screens.push({ w, h, pos, yaw, paint, size, tag });
}

// A: the wiki, on a free-standing info kiosk turned towards the room.
function wikiKiosk(kit) {
  const [x, z] = p('wiki-terminal');
  const yaw = PI / 4;
  const f = kit.m.frame(x, 0, z, yaw);
  f.box(0, 0, 0, 0.6, 0.05, 0.45, C.trim);
  f.box(0, 0.05, -0.05, 0.16, 1.05, 0.12, C.wall);
  f.box(0, 1.0, 0, 0.78, 0.6, 0.08, C.monitor, { x: -0.2 });
  f.box(0, 1.62, -0.02, 0.78, 0.1, 0.06, C.wallInner);
  const [sx, sz] = at(x, z, yaw, 0, 0.06);
  screen(kit, 0.7, 0.52, [sx, 1.3, sz], yaw, paintWiki, [256, 200], 'doc');
  kit.screens[kit.screens.length - 1].tilt = -0.2;
  const [gx, gz] = at(x, z, yaw, 0, 0.012);
  kit.glow.box(gx, 1.64, gz, 0.6, 0.05, 0.02, C.expert);
  kit.pools.push({ x: sx, y: 0.015, z: sz, r: 1.2, color: 0x9fd0ff, tag: 'screen' });
}

// B: the test plan binder, on a low side cabinet next to the QA desk.
function planFolder(kit) {
  const [x, z] = p('plan-folder');
  cabinet(kit, x, z, 0, { w: 0.55, h: 0.6, d: 0.45, drawers: 2, color: 0x4a5d73 });
  kit.m.box(x - 0.02, 0.6, z, 0.34, 0.07, 0.42, 0x2f6f73, { y: 0.15 });
  kit.m.box(x - 0.02, 0.67, z, 0.3, 0.012, 0.38, C.paper, { y: 0.15 });
  kit.m.box(x + 0.18, 0.6, z - 0.08, 0.06, 0.32, 0.26, 0x8a6e55);
  kit.m.box(x + 0.12, 0.6, z - 0.08, 0.05, 0.3, 0.26, 0x5c6f9c);
  screen(kit, 0.24, 0.07, [x - 0.02, 0.684, z + 0.04], 0.15, paintLabel('TEST PLAN v0.3', '#ece6d8'), [256, 64], 'label');
  kit.screens[kit.screens.length - 1].flat = true;
}

// C: the test management tool on a stand-up kiosk against the left wall.
function testToolKiosk(kit) {
  const [x, z] = p('test-tool');
  const f = kit.m.frame(x, 0, z, PI / 2);
  f.box(0, 0, 0, 0.9, 0.95, 0.5, 0x3a4f66);
  f.box(0, 0.95, 0, 0.94, 0.04, 0.54, C.deskTop);
  f.box(0, 0.99, -0.12, 0.05, 0.2, 0.05, C.monitor);
  f.box(0, 1.15, -0.1, 0.86, 0.52, 0.04, C.monitor);
  screen(kit, 0.8, 0.46, [x - 0.075, 1.41, z], PI / 2, paintTestTool, [256, 150], 'doc');
  kit.m.box(x + 0.15, 0.99, z, 0.14, 0.015, 0.36, 0x2a3442);
  kit.pools.push({ x: x + 0.6, y: 0.015, z, r: 1.0, color: 0x8fd6ff, tag: 'screen' });
}

// D: a kanban board on a rolling whiteboard frame.
function jiraBoard(kit) {
  const [x, z] = p('jira-board');
  const m = kit.m;
  [-0.85, 0.85].forEach((dx) => {
    m.box(x + dx, 0, z, 0.05, 1.95, 0.05, C.metal);
    m.box(x + dx, 0.03, z, 0.06, 0.04, 0.5, C.metal);
    m.sphere(x + dx, 0.03, z - 0.22, 0.035, C.trim, 6);
    m.sphere(x + dx, 0.03, z + 0.22, 0.035, C.trim, 6);
  });
  m.box(x, 0.72, z, 1.76, 1.14, 0.04, 0xd7e1ec);
  m.box(x, 0.66, z + 0.05, 1.5, 0.03, 0.08, C.metal);
  screen(kit, 1.66, 1.04, [x, 1.29, z + 0.025], 0, paintKanban, [512, 320], 'doc');
}

// E: the QA lead's metrics, printed and pinned to the wall.
function metricsBoard(kit) {
  const [x, z] = p('metrics-board');
  kit.m.box(-11.97, 1.0, z, 0.03, 1.0, 1.36, 0x6a4f3c);
  screen(kit, 1.26, 0.9, [-11.948, 1.5, z], PI / 2, paintMetrics, [320, 230], 'doc');
}

// F: the CI pipeline wall screen in the DevOps corner, plus Burak's sticky note.
function pipelineScreen(kit) {
  const [x] = p('pipeline-screen');
  kit.m.box(x, 1.0, -7.99, 1.5, 0.95, 0.05, C.monitor);
  screen(kit, 1.4, 0.85, [x, 1.475, -7.955], 0, paintPipeline('evening'), [320, 200], 'pipeline');
  screen(kit, 0.24, 0.24, [x - 0.6, 1.08, -7.95], 0.12, paintSticky(['staging', 'is mine!']), [128, 128], 'label');
  kit.pools.push({ x, y: 0.015, z: -7.0, r: 1.6, color: 0x8fd6ff, tag: 'screen' });
}

// G: a shared standing mail terminal.
function mailTerminal(kit) {
  const [x, z] = p('mail-terminal');
  const f = kit.m.frame(x, 0, z, PI / 2);
  f.box(0, 0, 0, 0.08, 1.0, 0.08, C.metal);
  f.box(0, 0, 0, 0.5, 0.03, 0.4, C.trim);
  f.box(0, 1.0, 0, 0.75, 0.04, 0.45, C.deskTop);
  f.box(0, 1.04, -0.12, 0.6, 0.38, 0.04, C.monitor);
  f.box(0, 1.04, 0.08, 0.4, 0.015, 0.14, 0x2a3442);
  screen(kit, 0.54, 0.33, [x - 0.095, 1.23, z], PI / 2, paintMail, [256, 160], 'doc');
}

// J: a tall filing cabinet in the CTO office.
function hrCabinet(kit) {
  const [x, z] = p('hr-cabinet');
  cabinet(kit, x, z, PI / 2, { w: 0.55, h: 1.3, d: 0.6, drawers: 4, color: 0x4a5d73 });
  screen(kit, 0.2, 0.07, [x + 0.32, 1.12, z], PI / 2, paintLabel('HR · ROLES'), [192, 64], 'label');
  screen(kit, 0.2, 0.07, [x + 0.32, 0.82, z], PI / 2, paintLabel('TOOLS'), [192, 64], 'label');
  kit.m.box(x, 1.3, z, 0.3, 0.06, 0.4, 0x8a6e55);
}

// T1: the routing engine source, open on an empty developer desk.
function codeDesk(kit) {
  const [x, z] = p('code-desk');
  openDesk(kit, x, z, -PI / 2, 4, paintRoutingCode);
}

// T2: the staging console: a laptop on a rolling cart inside the server room.
function stagingConsole(kit) {
  const [x, z] = p('staging-console');
  const m = kit.m;
  m.box(x, 0.06, z, 0.6, 0.03, 0.45, C.metal);
  m.box(x, 0.7, z, 0.6, 0.03, 0.45, C.metal);
  [[-0.27, -0.2], [0.27, -0.2], [-0.27, 0.2], [0.27, 0.2]].forEach(([dx, dz]) => {
    m.box(x + dx, 0.03, z + dz, 0.03, 0.7, 0.03, C.metal);
    m.sphere(x + dx, 0.03, z + dz, 0.03, C.trim, 6);
  });
  m.box(x, 0.73, z + 0.05, 0.4, 0.015, 0.27, 0x3a4450);
  m.box(x, 0.745, z - 0.08, 0.4, 0.26, 0.015, 0x3a4450, { x: 0.25 });
  screen(kit, 0.36, 0.22, [x, 0.875, z - 0.068], 0, paintTerminal, [256, 150], 'terminal');
  kit.screens[kit.screens.length - 1].tilt = 0.25;
}

// War room: the evidence corkboard with red string.
function corkboard(kit) {
  const [, z] = p('war-room');
  kit.m.box(-11.97, 0.68, z, 0.05, 1.6, 2.5, 0x5a3f2c);
  screen(kit, 2.36, 1.48, [-11.935, 1.48, z], PI / 2, paintCork, [480, 300], 'doc');
}

function stagingRack(kit) {
  const [x] = p('server-room');
  screen(kit, 0.68, 1.95, [x, 1.03, -7.045], 0, paintRack, [128, 320], 'rack');
}
