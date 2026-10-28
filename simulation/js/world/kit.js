// A "kit" collects everything a builder adds, then turns it into a few meshes:
// one merged matte mesh, one glass mesh, one unlit glow mesh, textured screen
// quads and additive light pools/halos grouped by tag.
import { createMerger, canvasTexture, lin } from './geo.js';

export function createKit(THREE) {
  return {
    m: createMerger(THREE),
    glass: createMerger(THREE),
    glow: createMerger(THREE),
    screens: [],
    pools: [],
    halos: [],
    lamps: [],
  };
}

const SCREEN_DIM = 0xd2d2d2;

export function finalizeKit(THREE, kit, parent, { glowTex, shadows = true } = {}) {
  const out = { screens: new Map(), pools: new Map(), halos: null, solids: [] };
  if (kit.m.count) {
    const matte = kit.m.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, dithering: true }), { castShadow: shadows, receiveShadow: true });
    parent.add(matte);
    out.solids.push(matte);
  }
  if (kit.glass.count) {
    const glass = kit.glass.mesh(new THREE.MeshStandardMaterial({
      vertexColors: true, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, depthWrite: false,
    }), { castShadow: false, receiveShadow: false });
    glass.renderOrder = 2;
    parent.add(glass);
  }
  if (kit.glow.count) {
    parent.add(kit.glow.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), { castShadow: false, receiveShadow: false }));
  }
  [kit.m, kit.glass, kit.glow].forEach((mg) => mg.dispose());
  kit.screens.forEach((spec) => {
    const entry = buildScreen(THREE, spec);
    parent.add(entry.mesh);
    if (!out.screens.has(spec.tag)) out.screens.set(spec.tag, []);
    out.screens.get(spec.tag).push(entry);
  });
  const poolTags = [...new Set(kit.pools.map((p) => p.tag))];
  poolTags.forEach((tag) => {
    const mesh = quadMesh(THREE, kit.pools.filter((p) => p.tag === tag), glowTex, 'flat');
    parent.add(mesh);
    out.pools.set(tag, mesh);
  });
  if (kit.halos.length) {
    out.halos = quadMesh(THREE, kit.halos, glowTex, 'upright');
    parent.add(out.halos);
  }
  return out;
}

function buildScreen(THREE, spec) {
  const [cw, ch] = spec.size;
  const tex = canvasTexture(THREE, cw, ch, spec.paint);
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: lin(THREE, SCREEN_DIM) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), mat);
  mesh.position.set(...spec.pos);
  mesh.rotation.order = 'YXZ';
  mesh.rotation.y = spec.yaw;
  if (spec.flat) mesh.rotation.x = -Math.PI / 2;
  else if (spec.tilt) mesh.rotation.x = spec.tilt;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return {
    mesh,
    tex,
    spec,
    base: mat.color.clone(),
    repaint(paint) {
      const g = tex.image.getContext('2d');
      paint(g, cw, ch);
      tex.needsUpdate = true;
    },
  };
}

// Additive quads with the glow texture: 'flat' pools on a surface, 'upright' halos behind screens.
function quadMesh(THREE, items, glowTex, mode) {
  const pos = [];
  const col = [];
  const uv = [];
  const idx = [];
  items.forEach((it, i) => {
    const c = lin(THREE, it.color);
    const corners = mode === 'flat' ? flatCorners(it) : uprightCorners(it);
    corners.forEach((v) => { pos.push(...v); col.push(c.r, c.g, c.b); });
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    const b = i * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  const mat = new THREE.MeshBasicMaterial({
    map: glowTex, vertexColors: true, transparent: true, opacity: mode === 'flat' ? 0.32 : 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 3;
  mesh.userData.baseOpacity = mat.opacity;
  return mesh;
}

function flatCorners({ x, y, z, r }) {
  return [[x - r, y, z + r], [x + r, y, z + r], [x + r, y, z - r], [x - r, y, z - r]];
}

// Behind the screen (towards the viewer of the screen), slightly larger than it.
function uprightCorners({ pos, yaw, w, h }) {
  const hw = w * 0.95;
  const hh = h * 1.0;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const [x, y, z] = [pos[0] + s * 0.03, pos[1], pos[2] + c * 0.03];
  return [[x - c * hw, y - hh, z + s * hw], [x + c * hw, y - hh, z - s * hw], [x + c * hw, y + hh, z - s * hw], [x - c * hw, y + hh, z + s * hw]];
}
