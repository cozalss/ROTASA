// The Rotaşa cast: look, name, role and home anchor for each person, the
// in-world cast manager used by world.js, and cached portraits.
// Importing this module never touches THREE; only calls do.
import { ANCHORS, planRoute, standYaw } from './anchors.js';
import { createPersonKit, buildPersonModel } from './person-model.js';
import { createAnimator } from './person-anim.js';
import { renderPortrait } from './portrait.js';
import { prefersReducedMotion } from '../fx/motion.js';

const WALK_SPEED = 2.2;
const TURN_RATE = 9;

// Colours here are literal (they also feed the CSS avatar fallback in the dialogue box).
export const PEOPLE = Object.freeze({
  murat: { id: 'murat', name: 'Murat Kaya', role: 'CTO', home: 'cto-office', seat: 0, state: 'typing', color: '#23365a', initials: 'MK',
    look: { skin: 0xe2b48f, hair: { style: 'short', color: 0x3b3a3e, grey: 0xa3a6ad }, top: { kind: 'blazer', color: 0x23365a, shirt: 0xf2f4f7 },
      pants: 0x2a2f3a, shoes: 0x1b1d22, extras: ['glasses'] } },
  deniz: { id: 'deniz', name: 'Deniz Arslan', role: 'QA lead', home: 'qa-desk', seat: 0, state: 'typing', color: '#2f9c93', initials: 'DA',
    look: { skin: 0xf1c7a5, hair: { style: 'bun', color: 0x231c1a }, top: { kind: 'cardigan', color: 0x2f9c93, shirt: 0xece6d8 },
      pants: 0x2b3340, shoes: 0x3a2a22, extras: ['lanyard'], accent: 0x1f4f7a } },
  kerem: { id: 'kerem', name: 'Kerem Demir', role: 'Product owner, Routing & Integration', home: 'po-desk', seat: 0, state: 'idle', color: '#c9951f', initials: 'KD',
    look: { skin: 0xd9a37e, hair: { style: 'curly', color: 0x6b4226 }, top: { kind: 'sweater', color: 0xd9a42b, trim: 0xb8861d },
      pants: 0x3a4458, shoes: 0x5a3a28, holds: 'notebook' } },
  aylin: { id: 'aylin', name: 'Aylin Çelik', role: 'Product owner, Field', home: 'po-desk', seat: 1, state: 'typing', color: '#6b7a3a', initials: 'AÇ',
    look: { skin: 0xf0c9a8, hair: { style: 'long', color: 0x8f3b1f }, top: { kind: 'jacket', color: 0x6b7a3a, shirt: 0xe9e2d0, trim: 0x5a6830 },
      pants: 0x2a2a35, shoes: 0x2a1f1a } },
  ece: { id: 'ece', name: 'Ece Yılmaz', role: 'Developer, Routing', home: 'routing-desk', seat: 0, state: 'typing', color: '#4a5578', initials: 'EY',
    look: { skin: 0xe8b996, hair: { style: 'crop', color: 0x121214 }, top: { kind: 'hoodie', color: 0x2a2f3d, trim: 0x232733 },
      pants: 0x1f2430, shoes: 0xe6edf5, extras: ['headphones'] } },
  burak: { id: 'burak', name: 'Burak Şahin', role: 'DevOps', home: 'devops-corner', seat: 0, state: 'typing', color: '#a8342e', initials: 'BŞ',
    look: { skin: 0xd9a37e, hair: { style: 'beanie', color: 0x3a2a1e, hat: 0x2f5e4e, hatTrim: 0x274f42, beard: 0x4a3020 },
      top: { kind: 'flannel', color: 0xa8342e, plaid: true }, pants: 0x34405a, shoes: 0x5a3a28, extras: ['beard'] } },
  onur: { id: 'onur', name: 'Onur Kılıç', role: 'Test engineer, Field', home: 'field-desk', seat: 0, state: 'idle', color: '#7d858e', initials: 'OK',
    look: { skin: 0xc68a63, hair: { style: 'buzz', color: 0x2a221c }, top: { kind: 'tshirt', color: 0x8d949c, trim: 0x7a8088 },
      pants: 0x2b3340, shoes: 0x1b1d22, holds: 'phone' } },
  assessor: { id: 'assessor', name: 'You', role: 'External assessor', home: 'entrance', seat: null, state: 'idle', color: '#ff8a3d', initials: 'You',
    look: { skin: 0xf0c09c, hair: { style: 'tidy', color: 0x4b3426 }, top: { kind: 'coat', color: 0x3a3f47 },
      pants: 0x23272e, shoes: 0x1b1d22, extras: ['scarf'], accent: 0xff8a3d, holds: 'clipboard' } },
});

// ---------------------------------------------------------------- portraits ---
const portraitCache = new Map();

export function getPortrait(id) {
  if (portraitCache.has(id)) return portraitCache.get(id);
  const person = PEOPLE[id];
  const THREE = window.THREE;
  if (!person || !THREE || typeof THREE.WebGLRenderer !== 'function') {
    return Promise.reject(new Error(person ? 'portrait unavailable' : `unknown person: ${id}`));
  }
  const promise = renderPortrait(THREE, person).catch((err) => {
    portraitCache.delete(id);
    throw err;
  });
  portraitCache.set(id, promise);
  return promise;
}

// ------------------------------------------------------------------- cast ---
// The people in the world. `scene` is the world scene; `shadowTex` a soft blob.
export function createCast(THREE, scene, { shadowTex }) {
  const kit = createPersonKit(THREE);
  const blobGeo = new THREE.PlaneGeometry(0.75, 0.75).rotateX(-Math.PI / 2);
  const blobMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55, color: 0x000000 });
  const members = new Map();
  Object.values(PEOPLE).forEach((p, i) => {
    const rig = buildPersonModel(kit, p.look);
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.position.y = 0.012;
    blob.renderOrder = 1;
    rig.root.add(blob);
    rig.root.userData.personId = p.id;
    scene.add(rig.root);
    const anim = createAnimator(rig, i + 3);
    const m = { id: p.id, rig, anim, anchor: p.home, path: null, resolve: null, endState: p.state, endYaw: 0, endSeated: false };
    members.set(p.id, m);
    placeAt(m, p.home, p.state);
  });

  function spotFor(m, anchorId) {
    const a = ANCHORS[anchorId];
    const p = PEOPLE[m.id];
    if (a.seats && m.id !== 'assessor') {
      const taken = new Set([...members.values()].filter((o) => o !== m && o.anchor === anchorId && o.seatIndex != null).map((o) => o.seatIndex));
      const preferred = anchorId === p.home && p.seat != null ? p.seat : null;
      const index = preferred != null && !taken.has(preferred) ? preferred : a.seats.findIndex((_, k) => !taken.has(k));
      if (index >= 0) {
        const [x, z, yaw] = a.seats[index];
        return { x, z, yaw, seated: true, seatIndex: index };
      }
    }
    const others = [...members.values()].filter((o) => o !== m && o.anchor === anchorId && o.seatIndex == null).length;
    const off = others ? (others % 2 ? 0.55 : -0.55) * Math.ceil(others / 2) : 0;
    const yaw = standYaw(a);
    return { x: a.stand[0] + Math.cos(yaw) * off, z: a.stand[1] - Math.sin(yaw) * off, yaw, seated: false, seatIndex: null };
  }

  function placeAt(m, anchorId, state) {
    const spot = spotFor(m, anchorId);
    m.anchor = anchorId;
    m.seatIndex = spot.seatIndex;
    m.rig.root.position.set(spot.x, 0, spot.z);
    m.rig.root.rotation.y = spot.yaw;
    m.anim.setSeated(spot.seated);
    m.anim.setState(state);
  }

  function finishWalk(m) {
    m.path = null;
    placeAt(m, m.anchor, m.endState);
    if (m.endYaw != null) m.rig.root.rotation.y = m.endYaw;
    const r = m.resolve;
    m.resolve = null;
    if (r) r();
  }

  // Walk along the nav graph; resolves on arrival (immediately with reduced motion).
  function walk(id, anchorId, { state, facing } = {}) {
    const m = members.get(id);
    if (!m || !ANCHORS[anchorId]) return Promise.resolve();
    if (m.resolve) { const r = m.resolve; m.resolve = null; r(); }
    const from = m.path
      ? { point: [m.rig.root.position.x, m.rig.root.position.z] }
      : { anchor: m.anchor, seat: m.seatIndex };
    const startAnchor = m.anchor;
    m.anchor = anchorId;
    m.endState = state && state !== 'walking' ? state : (id === 'assessor' ? 'idle' : PEOPLE[id].state);
    const spot = spotFor(m, anchorId);
    m.seatIndex = spot.seatIndex;
    m.endYaw = resolveFacing(facing, spot, m);
    const pts = planRoute(from, { anchor: anchorId, seat: spot.seatIndex });
    if (prefersReducedMotion() || (startAnchor === anchorId && !m.path)) {
      finishWalk(m);
      return Promise.resolve();
    }
    m.path = [...pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), new THREE.Vector3(spot.x, 0, spot.z)];
    if (spot.seated) m.endYaw = facing != null ? m.endYaw : spot.yaw;
    m.anim.setSeated(false);
    m.anim.setState('walking');
    return new Promise((resolve) => { m.resolve = resolve; });
  }

  function resolveFacing(facing, spot, m) {
    if (typeof facing === 'number') return facing;
    const target = facing === 'assessor' ? members.get('assessor')?.rig.root.position
      : ANCHORS[facing] ? { x: ANCHORS[facing].pos[0], z: ANCHORS[facing].pos[1] } : null;
    if (!target || m.id === 'assessor' && facing === 'assessor') return spot.yaw;
    return Math.atan2(target.x - spot.x, target.z - spot.z);
  }

  function step(m, dt) {
    const pos = m.rig.root.position;
    let budget = WALK_SPEED * dt;
    while (budget > 0 && m.path.length) {
      const next = m.path[0];
      const dx = next.x - pos.x;
      const dz = next.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.001) { m.path.shift(); continue; }
      const move = Math.min(d, budget);
      pos.x += (dx / d) * move;
      pos.z += (dz / d) * move;
      budget -= move;
      m.anim.stride(move);
      turnToward(m.rig.root, Math.atan2(dx, dz), dt);
      if (move >= d) m.path.shift();
    }
    if (!m.path.length) finishWalk(m);
  }

  return {
    members,
    walk,
    setPerson(id, { anchor, state, facing } = {}) {
      const m = members.get(id);
      if (!m) return Promise.resolve();
      if (anchor && anchor !== m.anchor) return walk(id, anchor, { state, facing });
      if (state && state !== 'walking') {
        m.endState = state;
        if (!m.path) m.anim.setState(state);
      }
      if (facing != null && !m.path) m.rig.root.rotation.y = resolveFacing(facing, { x: m.rig.root.position.x, z: m.rig.root.position.z, yaw: m.rig.root.rotation.y }, m);
      return Promise.resolve();
    },
    anchorOf(id) { return members.get(id)?.anchor ?? null; },
    isWalking(id) { return Boolean(members.get(id)?.path); },
    headPosition(id, out) {
      const m = members.get(id);
      if (!m) return null;
      m.rig.skull.getWorldPosition(out);
      return out;
    },
    pickables() { return [...members.values()].filter((m) => m.rig.root.visible).map((m) => m.rig.root); },
    update(dt, t, reduced) {
      const look = members.get('assessor').rig.root.position;
      members.forEach((m) => {
        if (m.path) step(m, dt);
        m.anim.update(t, { reduced, look: m.id === 'assessor' ? null : look });
      });
    },
    dispose() {
      members.forEach((m) => scene.remove(m.rig.root));
      members.clear();
      blobGeo.dispose();
      blobMat.dispose();
      kit.dispose();
    },
  };
}

function turnToward(obj, target, dt) {
  let d = target - obj.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  obj.rotation.y += d * Math.min(1, dt * TURN_RATE);
}
