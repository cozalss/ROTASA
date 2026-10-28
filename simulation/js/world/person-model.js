// Procedural chibi people: capsule limbs, bean torso, big round head, per-style
// hair and accessories. Returns a rig of pivots the animator drives.
// Materials are toon-shaded with a 4-step ramp for a cohesive stylized look.
import { lin, capsuleGeometry, profileGeometry, canvasTexture, mergeParts } from './geo.js';

export const HIP_STAND = 0.415;
export const HIP_SEAT = 0.3;
const HEAD_R = 0.215;

// Shared resources for one renderer: toon ramp, material and geometry caches.
export function createPersonKit(THREE) {
  const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 140, 140, 140, 205, 205, 205, 255, 255, 255]), 4, 1, THREE.RGBFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  const mats = new Map();
  const geos = new Map();
  const textures = [ramp];
  const merged = [];
  const toonVC = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp });
  const flatVC = new THREE.MeshBasicMaterial({ vertexColors: true });
  const kit = {
    THREE,
    mat(hex, key = '') {
      const id = `${hex}|${key}`;
      if (!mats.has(id)) mats.set(id, new THREE.MeshToonMaterial({ color: lin(THREE, hex), gradientMap: ramp }));
      return mats.get(id);
    },
    flat(hex) {
      const id = `flat|${hex}`;
      if (!mats.has(id)) mats.set(id, new THREE.MeshBasicMaterial({ color: lin(THREE, hex) }));
      return mats.get(id);
    },
    textured(id, paint) {
      if (!mats.has(id)) {
        const map = canvasTexture(THREE, 64, 64, paint);
        textures.push(map);
        mats.set(id, new THREE.MeshToonMaterial({ map, gradientMap: ramp }));
      }
      return mats.get(id);
    },
    toonVC,
    flatVC,
    own(geometry) { merged.push(geometry); return geometry; },
    geo(id, make) {
      if (!geos.has(id)) geos.set(id, make());
      return geos.get(id);
    },
    dispose() {
      mats.forEach((m) => m.dispose());
      geos.forEach((g) => g.dispose());
      textures.forEach((t) => t.dispose());
      merged.forEach((g) => g.dispose());
      toonVC.dispose();
      flatVC.dispose();
      merged.length = 0;
      mats.clear();
      geos.clear();
    },
  };
  return kit;
}

function mesh(kit, geo, mat, x = 0, y = 0, z = 0) {
  const m = new kit.THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

const capsule = (kit, r, len) => kit.geo(`cap${r}|${len}`, () => capsuleGeometry(kit.THREE, r, len, 10));
const sphere = (kit, r, seg = 14) => kit.geo(`sph${r}|${seg}`, () => new kit.THREE.SphereGeometry(r, seg, Math.max(6, (seg * 0.7) | 0)));
const box = (kit, w, h, d) => kit.geo(`box${w}|${h}|${d}`, () => new kit.THREE.BoxGeometry(w, h, d));
const cap = (kit, r, theta, phiStart = 0, phiLen = Math.PI * 2, thetaStart = 0) => kit.geo(`cap${r}|${theta}|${phiStart}|${phiLen}|${thetaStart}`,
  () => new kit.THREE.SphereGeometry(r, 18, 12, phiStart, phiLen, thetaStart, theta));

export function buildPersonModel(kit, look) {
  const { THREE } = kit;
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = HIP_STAND;
  root.add(body);
  const legs = [-1, 1].map((side) => buildLeg(kit, body, side, look));
  const torso = new THREE.Group();
  body.add(torso);
  buildTorso(kit, torso, look);
  const arms = [-1, 1].map((side) => buildArm(kit, torso, side, look));
  const head = new THREE.Group();
  head.position.y = 0.42;
  torso.add(head);
  const face = buildHead(kit, head, look);
  const rig = { root, body, torso, head, legs, arms, ...face, props: {} };
  addHandProps(kit, rig, look);
  consolidate(kit, rig);
  return rig;
}

// Groups that never animate (hands) hand their children to the parent pivot.
function flattenStatic(root) {
  const flat = [];
  root.traverse((o) => { if (o.isGroup && o.userData.flatten) flat.push(o); });
  flat.forEach((g) => {
    g.updateMatrix();
    [...g.children].forEach((c) => {
      c.applyMatrix4(g.matrix);
      g.parent.add(c);
    });
    g.parent.remove(g);
  });
}

// Merge each pivot's plain toon meshes into one vertex-coloured mesh: same look,
// far fewer draw calls. Animated parts (eyes, brows, mouth) and textured meshes stay.
function consolidate(kit, rig) {
  const { THREE } = kit;
  const keep = new Set([...rig.eyes, ...rig.brows, rig.mouth]);
  flattenStatic(rig.root);
  const pivots = [];
  rig.root.traverse((o) => { if (o.isGroup) pivots.push(o); });
  pivots.forEach((g) => {
    const plain = g.children.filter((c) => c.isMesh && !keep.has(c) && c.material.isMeshToonMaterial
      && !c.material.map && c.material.side === THREE.FrontSide);
    if (plain.length < 2) return;
    const parts = plain.map((c) => {
      c.updateMatrix();
      return { geometry: c.geometry, matrix: c.matrix.clone(), color: c.material.color };
    });
    const mesh = new THREE.Mesh(kit.own(mergeParts(THREE, parts)), kit.toonVC);
    mesh.castShadow = !g.userData.noShadow;
    plain.forEach((c) => g.remove(c));
    g.add(mesh);
  });
}

function buildLeg(kit, body, side, look) {
  const { THREE } = kit;
  const hip = new THREE.Group();
  hip.position.set(side * 0.085, 0, 0);
  body.add(hip);
  hip.add(mesh(kit, capsule(kit, 0.064, 0.1), kit.mat(look.pants), 0, -0.095, 0));
  const knee = new THREE.Group();
  knee.position.y = -0.19;
  hip.add(knee);
  knee.add(mesh(kit, capsule(kit, 0.056, 0.1), kit.mat(look.pants), 0, -0.095, 0));
  knee.add(mesh(kit, box(kit, 0.1, 0.06, 0.16), kit.mat(look.shoes), 0, -0.195, 0.03));
  return { hip, knee };
}

const TORSO_LOW = [[0.0001, 0], [0.15, 0], [0.19, 0.045], [0.199, 0.11], [0.0001, 0.11]];
const TORSO_UP = [[0.0001, 0.1], [0.2, 0.1], [0.2, 0.16], [0.194, 0.27], [0.17, 0.355], [0.1, 0.415], [0.0001, 0.43]];

function buildTorso(kit, torso, look) {
  const { THREE } = kit;
  const low = mesh(kit, kit.geo('torsoLow', () => profileGeometry(THREE, TORSO_LOW, 16)), kit.mat(look.pants));
  const topMat = look.top.plaid ? kit.textured(`plaid${look.top.color}`, plaidPainter(look.top.color)) : kit.mat(look.top.color);
  const up = mesh(kit, kit.geo('torsoUp', () => profileGeometry(THREE, TORSO_UP, 16)), topMat);
  low.scale.z = 0.82;
  up.scale.z = 0.82;
  torso.add(low, up);
  TOPS[look.top.kind]?.(kit, torso, look);
}

// Front details per garment (chest faces +z).
const TOPS = {
  blazer(kit, t, look) {
    t.add(mesh(kit, box(kit, 0.1, 0.24, 0.02), kit.mat(look.top.shirt), 0, 0.26, 0.152));
    t.add(mesh(kit, box(kit, 0.025, 0.16, 0.022), kit.mat(0x24324a), 0, 0.27, 0.163));
    [-1, 1].forEach((s) => {
      const lapel = mesh(kit, box(kit, 0.05, 0.2, 0.02), kit.mat(look.top.color), s * 0.06, 0.25, 0.158);
      lapel.rotation.z = s * 0.35;
      t.add(lapel);
    });
  },
  cardigan(kit, t, look) {
    t.add(mesh(kit, box(kit, 0.12, 0.3, 0.02), kit.mat(look.top.shirt), 0, 0.22, 0.152));
    [-1, 1].forEach((s) => t.add(mesh(kit, box(kit, 0.02, 0.3, 0.02), kit.mat(0x1f6f68), s * 0.065, 0.22, 0.158)));
  },
  sweater(kit, t, look) {
    const collar = mesh(kit, kit.geo('collar', () => new kit.THREE.TorusGeometry(0.085, 0.026, 8, 18)), kit.mat(look.top.trim));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.405;
    collar.scale.y = 0.85;
    t.add(collar);
  },
  jacket(kit, t, look) {
    t.add(mesh(kit, box(kit, 0.11, 0.26, 0.02), kit.mat(look.top.shirt), 0, 0.24, 0.152));
    [-1, 1].forEach((s) => {
      const flap = mesh(kit, box(kit, 0.07, 0.12, 0.03), kit.mat(look.top.trim), s * 0.07, 0.35, 0.13);
      flap.rotation.z = s * 0.5;
      t.add(flap);
    });
  },
  hoodie(kit, t, look) {
    const hood = mesh(kit, sphere(kit, 0.13, 12), kit.mat(look.top.trim), 0, 0.38, -0.12);
    hood.scale.set(1.2, 0.6, 0.8);
    t.add(hood);
    [-1, 1].forEach((s) => t.add(mesh(kit, box(kit, 0.012, 0.12, 0.012), kit.mat(0xd7e1ec), s * 0.04, 0.3, 0.16)));
    t.add(mesh(kit, box(kit, 0.2, 0.08, 0.02), kit.mat(look.top.trim), 0, 0.12, 0.158));
  },
  flannel(kit, t) {
    t.add(mesh(kit, box(kit, 0.02, 0.32, 0.02), kit.mat(0x3a1a18), 0, 0.22, 0.16));
  },
  tshirt(kit, t, look) {
    const collar = mesh(kit, kit.geo('tcollar', () => new kit.THREE.TorusGeometry(0.075, 0.012, 6, 16)), kit.mat(look.top.trim));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.41;
    t.add(collar);
  },
  coat(kit, t, look) {
    const skirt = mesh(kit, kit.geo('coatSkirt', () => new kit.THREE.CylinderGeometry(0.2, 0.235, 0.2, 16, 1, true)), kit.mat(look.top.color, 'ds'));
    skirt.material.side = kit.THREE.DoubleSide;
    skirt.position.y = -0.07;
    skirt.scale.z = 0.85;
    t.add(skirt);
    t.add(mesh(kit, box(kit, 0.02, 0.34, 0.02), kit.mat(0x22262c), 0.03, 0.12, 0.165));
    [0.05, 0.16].forEach((y) => t.add(mesh(kit, sphere(kit, 0.012, 6), kit.mat(0x9fb0c3), 0.06, y, 0.168)));
  },
};

function plaidPainter(base) {
  const hex = `#${base.toString(16).padStart(6, '0')}`;
  return (g, w, h) => {
    g.fillStyle = hex;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(20,10,10,0.45)';
    for (let i = 0; i < w; i += 16) { g.fillRect(i, 0, 6, h); g.fillRect(0, i, w, 6); }
    g.fillStyle = 'rgba(255,230,200,0.25)';
    for (let i = 10; i < w; i += 16) { g.fillRect(i, 0, 2, h); g.fillRect(0, i, w, 2); }
  };
}

function buildArm(kit, torso, side, look) {
  const { THREE } = kit;
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.205, 0.335, 0);
  shoulder.rotation.z = side * 0.12;
  torso.add(shoulder);
  const sleeve = look.top.plaid ? kit.textured(`plaid${look.top.color}`, plaidPainter(look.top.color)) : kit.mat(look.top.color);
  shoulder.add(mesh(kit, capsule(kit, 0.052, 0.1), sleeve, 0, -0.08, 0));
  const elbow = new THREE.Group();
  elbow.position.y = -0.165;
  shoulder.add(elbow);
  const forearm = look.top.kind === 'tshirt' ? kit.mat(look.skin) : sleeve;
  elbow.add(mesh(kit, capsule(kit, 0.046, 0.08), forearm, 0, -0.065, 0));
  const hand = new THREE.Group();
  hand.position.y = -0.15;
  hand.userData.flatten = true;
  shoulder.userData.noShadow = true;
  elbow.userData.noShadow = true;
  elbow.add(hand);
  hand.add(mesh(kit, sphere(kit, 0.05, 10), kit.mat(look.skin)));
  return { shoulder, elbow, hand, side };
}

function buildHead(kit, head, look) {
  const { THREE } = kit;
  head.parent.add(mesh(kit, kit.geo('neck', () => new THREE.CylinderGeometry(0.055, 0.06, 0.08, 10)), kit.mat(look.skin), 0, 0.44, 0));
  const skull = new THREE.Group();
  skull.position.y = 0.2;
  head.add(skull);
  skull.add(mesh(kit, sphere(kit, HEAD_R, 22), kit.mat(look.skin)));
  [-1, 1].forEach((s) => skull.add(mesh(kit, sphere(kit, 0.04, 8), kit.mat(look.skin), s * 0.205, -0.01, 0)));
  const eyes = [-1, 1].map((s) => {
    const eye = mesh(kit, eyeGeometry(kit), kit.flatVC, s * 0.077, 0.0, 0.192);
    eye.castShadow = false;
    skull.add(eye);
    return eye;
  });
  const brows = [-1, 1].map((s) => {
    const brow = mesh(kit, box(kit, 0.065, 0.016, 0.014), kit.mat(look.hair.brow ?? look.hair.color), s * 0.078, 0.068, 0.198);
    brow.rotation.z = s * -0.08;
    brow.castShadow = false;
    skull.add(brow);
    return brow;
  });
  const mouth = mesh(kit, box(kit, 0.05, 0.014, 0.012), kit.flat(0x5a2e2a), 0, -0.088, 0.198);
  mouth.castShadow = false;
  skull.add(mouth);
  skull.add(mesh(kit, sphere(kit, 0.022, 8), kit.mat(look.skinShade ?? look.skin), 0, -0.035, 0.212));
  HAIR[look.hair.style]?.(kit, skull, look);
  (look.extras || []).forEach((x) => EXTRAS[x]?.(kit, skull, look));
  return { skull, eyes, brows, mouth };
}

// Dark eye with a white glint, one geometry so a blink (scale.y) moves both.
function eyeGeometry(kit) {
  const { THREE } = kit;
  return kit.geo('eye', () => {
    const m = (x, y, z, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
    return mergeParts(THREE, [
      { geometry: sphere(kit, 0.029, 10), matrix: m(0, 0, 0, 1, 1, 0.6), color: lin(THREE, 0x161a20) },
      { geometry: sphere(kit, 0.009, 6), matrix: m(0.009, 0.011, 0.016, 1, 1, 1), color: lin(THREE, 0xffffff) },
    ]);
  });
}

function capMesh(kit, skull, color, r, theta, tilt) {
  const m = mesh(kit, cap(kit, r, theta), kit.mat(color));
  m.rotation.x = tilt;
  skull.add(m);
  return m;
}

const HAIR = {
  short(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.226, 1.3, -0.4);
    [-1, 1].forEach((side) => {
      const g = mesh(kit, sphere(kit, 0.07, 8), kit.mat(look.hair.grey), side * 0.192, 0.03, -0.05);
      g.scale.set(0.45, 1, 1.1);
      s.add(g);
    });
  },
  bun(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.226, 1.42, -0.45);
    s.add(mesh(kit, sphere(kit, 0.09, 12), kit.mat(look.hair.color), 0, 0.15, -0.17));
  },
  curly(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.222, 1.3, -0.3);
    for (let i = 0; i < 18; i++) {
      const el = 0.25 + (i % 3) * 0.38;
      const az = (i / 18) * Math.PI * 2;
      const r = 0.212;
      const x = Math.sin(el) * Math.sin(az) * r;
      const z = Math.sin(el) * Math.cos(az) * r - 0.02;
      if (z > 0.13 && el > 0.9) continue;
      s.add(mesh(kit, sphere(kit, 0.068, 8), kit.mat(look.hair.color), x, Math.cos(el) * r + 0.01, z));
    }
  },
  long(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.228, 1.5, -0.25);
    const back = mesh(kit, capsule(kit, 0.16, 0.2), kit.mat(look.hair.color), 0, -0.13, -0.09);
    back.scale.z = 0.6;
    s.add(back);
    [-1, 1].forEach((side) => s.add(mesh(kit, capsule(kit, 0.055, 0.2), kit.mat(look.hair.color), side * 0.175, -0.13, 0.03)));
    const fringe = mesh(kit, sphere(kit, 0.13, 10), kit.mat(look.hair.color), 0.05, 0.13, 0.11);
    fringe.scale.set(1.3, 0.45, 0.8);
    fringe.rotation.z = -0.3;
    s.add(fringe);
  },
  crop(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.226, 1.38, -0.32);
    const fringe = mesh(kit, box(kit, 0.24, 0.06, 0.08), kit.mat(look.hair.color), -0.02, 0.135, 0.15);
    fringe.rotation.set(0.5, 0, 0.18);
    s.add(fringe);
  },
  buzz(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.219, 1.5, -0.45);
  },
  beanie(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.221, 1.7, -0.55);
    const dome = capMesh(kit, s, look.hair.hat, 0.238, 1.2, -0.15);
    dome.position.y = 0.01;
    const band = mesh(kit, kit.geo('beanieBand', () => new kit.THREE.CylinderGeometry(0.236, 0.236, 0.075, 18, 1, true)), kit.mat(look.hair.hatTrim, 'ds'));
    band.material.side = kit.THREE.DoubleSide;
    band.position.set(0, 0.095, -0.012);
    band.rotation.x = -0.15;
    s.add(band);
    s.add(mesh(kit, sphere(kit, 0.05, 8), kit.mat(look.hair.hatTrim), 0, 0.245, -0.03));
  },
  tidy(kit, s, look) {
    capMesh(kit, s, look.hair.color, 0.226, 1.36, -0.38);
    const lock = mesh(kit, sphere(kit, 0.1, 10), kit.mat(look.hair.color), -0.08, 0.15, 0.1);
    lock.scale.set(1.2, 0.5, 0.9);
    s.add(lock);
  },
};

const EXTRAS = {
  glasses(kit, s) {
    const ring = kit.geo('lens', () => new kit.THREE.TorusGeometry(0.046, 0.009, 6, 16));
    [-1, 1].forEach((side) => s.add(mesh(kit, ring, kit.mat(0x1a1d22), side * 0.077, 0.0, 0.214)));
    s.add(mesh(kit, box(kit, 0.04, 0.01, 0.01), kit.mat(0x1a1d22), 0, 0.01, 0.222));
  },
  headphones(kit, s) {
    const band = mesh(kit, kit.geo('hpBand', () => new kit.THREE.TorusGeometry(0.24, 0.022, 6, 20, Math.PI)), kit.mat(0xd9dde3));
    band.rotation.x = -0.1;
    s.add(band);
    [-1, 1].forEach((side) => {
      const cup = mesh(kit, kit.geo('hpCup', () => new kit.THREE.CylinderGeometry(0.075, 0.075, 0.06, 14)), kit.mat(0x2f6f73), side * 0.235, 0, -0.02);
      cup.rotation.z = Math.PI / 2;
      s.add(cup);
    });
  },
  beard(kit, s, look) {
    const b = mesh(kit, cap(kit, 0.223, Math.PI - 1.82, Math.PI / 2 - 1.35, 2.7, 1.82), kit.mat(look.hair.beard));
    s.add(b);
    const mo = mesh(kit, box(kit, 0.11, 0.025, 0.03), kit.mat(look.hair.beard), 0, -0.06, 0.205);
    s.add(mo);
  },
  // Lanyard and scarf hang from the torso (skull -> head -> torso), not the turning head.
  lanyard(kit, s, look) {
    const t = s.parent.parent;
    const strap = mesh(kit, kit.geo('lanyard', () => new kit.THREE.TorusGeometry(0.11, 0.008, 4, 16)), kit.mat(look.accent));
    strap.position.set(0, 0.32, 0.06);
    strap.rotation.x = Math.PI / 2 + 0.75;
    strap.scale.set(1, 1.5, 1);
    t.add(strap);
    t.add(mesh(kit, box(kit, 0.06, 0.08, 0.01), kit.mat(0xf4f6f8), 0, 0.2, 0.17));
  },
  scarf(kit, s, look) {
    const t = s.parent.parent;
    const wrap = mesh(kit, kit.geo('scarf', () => new kit.THREE.TorusGeometry(0.1, 0.045, 8, 18)), kit.mat(look.accent));
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = 0.42;
    t.add(wrap);
    const tail = mesh(kit, box(kit, 0.08, 0.22, 0.035), kit.mat(look.accent), 0.07, 0.29, 0.16);
    tail.rotation.z = 0.12;
    t.add(tail);
  },
};

// Things held in the left hand (side +1 is the character's left).
function addHandProps(kit, rig, look) {
  const hand = rig.arms[1].hand;
  const add = (geo, color, x, y, z) => {
    const m = mesh(kit, geo, kit.mat(color), x, y, z);
    hand.add(m);
    return m;
  };
  if (look.holds === 'clipboard') {
    rig.props.held = add(box(kit, 0.17, 0.23, 0.015), 0x8a6e55, 0, -0.04, 0.06);
    add(box(kit, 0.14, 0.18, 0.006), 0xf4efe4, 0, -0.05, 0.07);
    add(box(kit, 0.06, 0.02, 0.012), 0x9fb0c3, 0, 0.07, 0.07);
  } else if (look.holds === 'notebook') {
    rig.props.held = add(box(kit, 0.13, 0.17, 0.025), 0x2f5e4e, 0, -0.04, 0.05);
  } else if (look.holds === 'phone') {
    rig.props.held = add(box(kit, 0.06, 0.11, 0.012), 0x1b232d, 0, -0.03, 0.05);
    const glow = new kit.THREE.Mesh(box(kit, 0.05, 0.09, 0.002), kit.flat(0x8fd6ff));
    glow.position.set(0, -0.03, 0.057);
    hand.add(glow);
  }
}
