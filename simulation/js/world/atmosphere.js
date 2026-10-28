// Fake volumetric light: additive, depth-tested (never depth-writing) meshes.
//   moon shafts  one prism per back-window pane, extruded along the moonlight
//   lamp cones   soft open cones under desk and floor lamps
//   shaft dust   motes that only live inside the shafts and twinkle
// Faces fade along their length, at their seams and when seen edge-on, so the
// geometry never shows hard lines. All animation is a time uniform (GPU only).
import { MOON_POS } from './lighting.js';
import { mergeWithUV } from './geo.js';

const BACK_Z = -8.04;
const BAYS = [[-12.2, -5.9], [-3.5, -2.2], [1.4, 10.4]];
const PANE_Y = [0.56, 2.16];
const SHAFT_LEN = 3.6;
const DUST = 150;
const MOON_COLOR = 0xa9c3ff;
const LAMP_COLOR = 0xffc98a;

const VERT = /* glsl */`
uniform float time;
varying vec2 vUv;
varying float vFacing;
varying float vShimmer;
void main() {
  vUv = uv;
  vec3 n = normalize(normalMatrix * normal);
  vFacing = abs(n.z);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vShimmer = 0.86 + 0.14 * sin(time * 0.55 + wp.x * 1.7 + wp.z * 0.9);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */`
uniform vec3 color;
uniform float opacity;
uniform float sideSoft;
uniform float lengthFlip;
varying vec2 vUv;
varying float vFacing;
varying float vShimmer;
void main() {
  float t = mix(vUv.y, 1.0 - vUv.y, lengthFlip);
  float along = pow(1.0 - t, 1.5) * smoothstep(0.0, 0.07, t);
  float side = mix(1.0, smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x), sideSoft);
  float a = opacity * along * side * pow(vFacing, 0.9) * vShimmer;
  gl_FragColor = linearToOutputTexel(vec4(color, a));
}`;

function beamMaterial(THREE, hex, { sideSoft, lengthFlip }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(hex).convertSRGBToLinear() },
      opacity: { value: 0 },
      sideSoft: { value: sideSoft },
      lengthFlip: { value: lengthFlip },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function panes() {
  const out = [];
  BAYS.forEach(([a, b]) => {
    const n = Math.max(1, Math.round((b - a) / 1.6));
    for (let i = 0; i < n; i++) {
      const x0 = a + ((b - a) * i) / n + 0.07;
      const x1 = a + ((b - a) * (i + 1)) / n - 0.07;
      out.push([x0, x1]);
    }
  });
  return out;
}

// A quad from edge p→q extruded by e; uv.x across the edge, uv.y along e.
function quad(THREE, p, q, e) {
  const g = new THREE.BufferGeometry();
  const v = [p, q, [q[0] + e.x, q[1] + e.y, q[2] + e.z], [p[0] + e.x, p[1] + e.y, p[2] + e.z]];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

function moonShafts(THREE, dir) {
  const e = dir.clone().multiplyScalar(SHAFT_LEN);
  const id = new THREE.Matrix4();
  const parts = [];
  const [y0, y1] = PANE_Y;
  panes().forEach(([x0, x1]) => {
    const c = [[x0, y0, BACK_Z], [x1, y0, BACK_Z], [x1, y1, BACK_Z], [x0, y1, BACK_Z]];
    [[0, 1], [3, 2], [0, 3], [1, 2]].forEach(([i, j]) => parts.push({ geometry: quad(THREE, c[i], c[j], e), matrix: id }));
  });
  return mergeWithUV(THREE, parts);
}

function lampCones(THREE, lamps) {
  const m = new THREE.Matrix4();
  const parts = lamps.filter((l) => l.head).map((l) => {
    const [hx, hy, hz] = l.head;
    const h = hy - l.floor;
    const rTop = l.kind === 'floor' ? 0.19 : 0.035;
    const rBottom = l.kind === 'floor' ? 0.95 : 0.3;
    const geometry = new THREE.CylinderGeometry(rTop, rBottom, h, 20, 1, true);
    return { geometry, matrix: m.clone().makeTranslation(hx, l.floor + h / 2, hz) };
  });
  return parts.length ? mergeWithUV(THREE, parts) : null;
}

function shaftDust(THREE, dir) {
  const rnd = seeded(77);
  const list = panes();
  const pos = new Float32Array(DUST * 3);
  const seed = new Float32Array(DUST * 2);
  for (let i = 0; i < DUST; i++) {
    const [x0, x1] = list[Math.floor(rnd() * list.length)];
    const t = Math.pow(rnd(), 1.3) * 0.85 + 0.05;
    const p = new THREE.Vector3(x0 + rnd() * (x1 - x0), PANE_Y[0] + rnd() * (PANE_Y[1] - PANE_Y[0]), BACK_Z).addScaledVector(dir, t * SHAFT_LEN);
    if (p.y < 0.08) p.y = 0.08 + rnd() * 0.4;
    pos.set([p.x, p.y, p.z], i * 3);
    seed.set([rnd(), 1 - t], i * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, opacity: { value: 0 }, pixelRatio: { value: 1 }, color: { value: new THREE.Color(0xdfe9ff).convertSRGBToLinear() } },
    vertexShader: /* glsl */`
      uniform float time;
      uniform float pixelRatio;
      attribute vec2 aSeed;
      varying float vA;
      void main() {
        float s = aSeed.x;
        vec3 p = position + vec3(sin(time * 0.13 + s * 6.0) * 0.14, sin(time * 0.09 + s * 11.0) * 0.18, cos(time * 0.11 + s * 3.0) * 0.12);
        vA = aSeed.y * (0.25 + 0.75 * pow(0.5 + 0.5 * sin(time * 0.8 + s * 40.0), 3.0));
        gl_PointSize = pixelRatio * (1.6 + 2.2 * fract(s * 7.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 color;
      uniform float opacity;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.1, d) * vA * opacity;
        gl_FragColor = linearToOutputTexel(vec4(color, a));
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Per-mood strengths: [moon shafts, shaft dust].
const MOOD_MOON = { evening: [0.16, 0.9], outage: [0.1, 0.6], 'after-good': [0.22, 1.0], 'after-bad': [0.13, 0.7] };
const LAMP_CONE = 0.2;

export function createAtmosphere(THREE, parent, { lamps }) {
  const group = new THREE.Group();
  group.name = 'atmosphere';
  parent.add(group);
  const dir = new THREE.Vector3(...MOON_POS).negate().normalize();
  const shaftMat = beamMaterial(THREE, MOON_COLOR, { sideSoft: 1, lengthFlip: 0 });
  const shafts = new THREE.Mesh(moonShafts(THREE, dir), shaftMat);
  shafts.renderOrder = 6;
  shafts.userData.noAO = true;
  group.add(shafts);
  const coneMat = beamMaterial(THREE, LAMP_COLOR, { sideSoft: 0, lengthFlip: 1 });
  const coneGeo = lampCones(THREE, lamps);
  const cones = coneGeo ? new THREE.Mesh(coneGeo, coneMat) : null;
  if (cones) {
    cones.renderOrder = 6;
    cones.userData.noAO = true;
    group.add(cones);
  }
  const dust = shaftDust(THREE, dir);
  dust.renderOrder = 7;
  group.add(dust);

  return {
    setMood(id, params) {
      const [moon, motes] = MOOD_MOON[id] || MOOD_MOON.evening;
      shaftMat.uniforms.opacity.value = moon;
      dust.material.uniforms.opacity.value = motes;
      coneMat.uniforms.opacity.value = LAMP_CONE * (params?.pools ?? 1);
      coneMat.uniforms.color.value.set(params?.lampColor ?? LAMP_COLOR).convertSRGBToLinear();
    },
    setPixelRatio(pr) { dust.material.uniforms.pixelRatio.value = pr; },
    update(t) {
      shaftMat.uniforms.time.value = t;
      coneMat.uniforms.time.value = t;
      dust.material.uniforms.time.value = t;
    },
    dispose() {
      parent.remove(group);
      group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    },
  };
}
