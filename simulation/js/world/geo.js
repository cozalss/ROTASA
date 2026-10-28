// Geometry and texture helpers shared by the world modules.
// Nothing here touches THREE at import time: every function takes it as an argument.
//
// Colours are authored as sRGB hex and converted to linear, because the renderer
// outputs sRGB (r128 has no automatic colour management).

export function lin(THREE, hex) {
  return new THREE.Color(hex).convertSRGBToLinear();
}

// A rounded capsule standing on the y axis, centred on the origin.
export function capsuleGeometry(THREE, radius, length, segments = 10) {
  const pts = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius - length / 2));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius + length / 2));
  }
  pts[0].x = 0.0001;
  pts[pts.length - 1].x = 0.0001;
  return new THREE.LatheGeometry(pts, segments);
}

// A lathe from [radius, height] pairs (bottom to top).
export function profileGeometry(THREE, profile, segments = 14) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), segments);
}

// ------------------------------------------------------------------ merging ---
// Collects coloured primitives and merges them into one indexed geometry with
// vertex colours, so a whole furniture set costs one draw call.
export function createMerger(THREE) {
  const parts = [];
  const owned = [];
  const unit = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new Map(),
    sphere: new Map(),
  };
  const root = makeAdder(THREE, parts, unit, new THREE.Matrix4(), owned);
  return {
    ...root,
    get count() { return parts.length; },
    mesh(material, { castShadow = true, receiveShadow = true } = {}) {
      const geometry = mergeParts(THREE, parts);
      owned.splice(0).forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      return mesh;
    },
    dispose() {
      unit.box.dispose();
      unit.cyl.forEach((g) => g.dispose());
      unit.sphere.forEach((g) => g.dispose());
    },
  };
}

function makeAdder(THREE, parts, unit, parent, owned) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const local = (x, y, z, sx, sy, sz, rot) => {
    e.set(rot?.x || 0, rot?.y || 0, rot?.z || 0);
    q.setFromEuler(e);
    m.compose(p.set(x, y, z), q, s.set(sx, sy, sz));
    return new THREE.Matrix4().multiplyMatrices(parent, m);
  };
  const push = (geometry, matrix, color) => parts.push({ geometry, matrix, color: lin(THREE, color) });
  const cylGeo = (seg) => {
    if (!unit.cyl.has(seg)) unit.cyl.set(seg, new THREE.CylinderGeometry(1, 1, 1, seg));
    return unit.cyl.get(seg);
  };
  const sphGeo = (seg) => {
    if (!unit.sphere.has(seg)) unit.sphere.set(seg, new THREE.SphereGeometry(1, seg, Math.max(6, seg * 0.6 | 0)));
    return unit.sphere.get(seg);
  };
  return {
    // Box resting on y (bottom face at y).
    box(x, y, z, w, h, d, color, rot) {
      push(unit.box, local(x, y + h / 2, z, w, h, d, rot), color);
    },
    // Cylinder resting on y; rTop/rBottom ratio via a cone is approximated by a scaled unit cylinder.
    cyl(x, y, z, r, h, color, seg = 12, rot) {
      push(cylGeo(seg), local(x, y + h / 2, z, r, h, r, rot), color);
    },
    // Centred cylinder with its own taper (not shared, but still merged).
    cone(x, y, z, rTop, rBottom, h, color, seg = 12, rot) {
      const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
      owned.push(g);
      push(g, local(x, y + h / 2, z, 1, 1, 1, rot), color);
    },
    sphere(x, y, z, r, color, seg = 12, scale = [1, 1, 1]) {
      push(sphGeo(seg), local(x, y, z, r * scale[0], r * scale[1], r * scale[2]), color);
    },
    // Arbitrary geometry; with own = true the merger disposes it after merging.
    geo(geometry, x, y, z, color, rot, scale = [1, 1, 1], own = false) {
      if (own) owned.push(geometry);
      push(geometry, local(x, y, z, scale[0], scale[1], scale[2], rot), color);
    },
    frame(x, y, z, yaw = 0) {
      return makeAdder(THREE, parts, unit, local(x, y, z, 1, 1, 1, { y: yaw }), owned);
    },
  };
}

export function mergeParts(THREE, parts) {
  let vertexCount = 0;
  let indexCount = 0;
  parts.forEach(({ geometry }) => {
    const n = geometry.attributes.position.count;
    vertexCount += n;
    indexCount += geometry.index ? geometry.index.count : n;
  });
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
  const indices = new IndexArray(indexCount);
  const v = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  let vo = 0;
  let io = 0;
  parts.forEach(({ geometry, matrix, color }) => {
    const pos = geometry.attributes.position;
    const nor = geometry.attributes.normal;
    nm.getNormalMatrix(matrix);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      positions.set([v.x, v.y, v.z], (vo + i) * 3);
      if (nor) v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      else v.set(0, 1, 0);
      normals.set([v.x, v.y, v.z], (vo + i) * 3);
      colors.set([color.r, color.g, color.b], (vo + i) * 3);
    }
    if (geometry.index) {
      const idx = geometry.index.array;
      for (let i = 0; i < idx.length; i++) indices[io + i] = idx[i] + vo;
      io += idx.length;
    } else {
      for (let i = 0; i < pos.count; i++) indices[io + i] = vo + i;
      io += pos.count;
    }
    vo += pos.count;
  });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

// Merges [{ geometry, matrix, color? }] keeping uvs (for shader-driven effect
// meshes); disposes the source geometries. color is an sRGB hex (default white).
export function mergeWithUV(THREE, parts) {
  const pos = [];
  const nor = [];
  const uv = [];
  const col = [];
  const idx = [];
  const v = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  let base = 0;
  parts.forEach(({ geometry, matrix, color = 0xffffff }) => {
    const g = geometry;
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const t = g.attributes.uv;
    const c = lin(THREE, color);
    nm.getNormalMatrix(matrix);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(matrix);
      pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      nor.push(v.x, v.y, v.z);
      uv.push(t.getX(i), t.getY(i));
      col.push(c.r, c.g, c.b);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
    else for (let i = 0; i < p.count; i++) idx.push(i + base);
    base += p.count;
    geometry.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  out.computeBoundingSphere();
  return out;
}

// ----------------------------------------------------------------- textures ---
export function canvasTexture(THREE, width, height, draw) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  draw(g, width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}

// Soft radial sprite. No mipmaps: averaged low mips are non-zero in the
// corners and would show square edges on large additive quads.
export function glowTexture(THREE) {
  const tex = canvasTexture(THREE, 64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  });
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

// Night sky behind the diorama (screen-space background): deep zenith, a faint
// sodium haze of city light low on the horizon band, and a dark ground.
export function skyTexture(THREE) {
  return canvasTexture(THREE, 16, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#08142a');
    grad.addColorStop(0.18, '#0f2240');
    grad.addColorStop(0.34, '#1b2c48');
    grad.addColorStop(0.42, '#22304a');
    grad.addColorStop(0.55, '#0d1a2e');
    grad.addColorStop(1, '#050b15');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

// Soft dark blob for contact shadows under people.
export function blobTexture(THREE) {
  return canvasTexture(THREE, 64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  });
}

// Disposes geometries, materials and their maps under a root object.
export function disposeTree(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose?.();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    mats.forEach((mat) => {
      mat.map?.dispose?.();
      mat.dispose?.();
    });
  });
}
