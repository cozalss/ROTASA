// Night rain outside the building (never over the office floor):
//   streaks   GPU-animated line segments over the street and the side alley
//   splashes  expanding rings on the ground, re-placed every cycle
//   wet road  stretched reflections under the street lamps and truck lights
//   glass     droplets and slow trails on the back windows
// Everything is driven by one time uniform; with reduced motion it freezes.
import { canvasTexture, mergeWithUV } from './geo.js';

const G = -0.5;
const TOP = 9;
const REGIONS = [
  { x0: -23, x1: 15, z0: -17.2, z1: -8.6 },  // street
  { x0: -23, x1: -12.7, z0: -8.6, z1: 9 },   // side alley
];
const COUNTS = { high: { streaks: 2400, splashes: 360 }, low: { streaks: 1000, splashes: 0 } };
const BAYS = [[-12.2, -5.9], [-3.5, -2.2], [1.4, 10.4]];
const GLASS_Z = -8.125;

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function samplePoint(rnd) {
  const areas = REGIONS.map((r) => (r.x1 - r.x0) * (r.z1 - r.z0));
  const total = areas.reduce((a, b) => a + b, 0);
  let k = rnd() * total;
  const r = REGIONS[areas.findIndex((a) => (k -= a) < 0)] || REGIONS[0];
  return [r.x0 + rnd() * (r.x1 - r.x0), r.z0 + rnd() * (r.z1 - r.z0)];
}

function rainStreaks(THREE, count) {
  const rnd = seeded(404);
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const [x, z] = samplePoint(rnd);
    const phase = rnd() * (TOP - G);
    pos.set([x, phase, z, x, phase, z], i * 6);
    end.set([0, 1], i * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, opacity: { value: 0.32 }, color: { value: new THREE.Color(0xb7cdf0).convertSRGBToLinear() } },
    vertexShader: /* glsl */`
      uniform float time;
      uniform float opacity;
      attribute float aEnd;
      varying float vA;
      const float TOP = ${TOP.toFixed(2)};
      const float BOTTOM = ${G.toFixed(2)};
      const float SPEED = 13.0;
      const float LEN = 0.42;
      const vec2 WIND = vec2(0.09, 0.05);
      void main() {
        float y = TOP - mod(position.y + time * SPEED, TOP - BOTTOM);
        float fall = TOP - y;
        vec3 p = vec3(position.x + WIND.x * fall, y, position.z + WIND.y * fall);
        p += vec3(-WIND.x, 1.0, -WIND.y) * LEN * aEnd;
        vA = opacity * smoothstep(BOTTOM, BOTTOM + 0.3, y) * (1.0 - smoothstep(TOP - 2.0, TOP, y)) * (1.0 - 0.9 * aEnd);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 color;
      varying float vA;
      void main() { gl_FragColor = linearToOutputTexel(vec4(color, vA)); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 8;
  return lines;
}

function splashes(THREE, count) {
  const rnd = seeded(808);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const [x, z] = samplePoint(rnd);
    const onRoad = z > -15.2 && z < -12.0;
    pos.set([x, G + (onRoad ? 0.02 : 0.11), z], i * 3);
    seed[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, opacity: { value: 0.5 }, pixelRatio: { value: 1 }, color: { value: new THREE.Color(0xc8d8f2).convertSRGBToLinear() } },
    vertexShader: /* glsl */`
      uniform float time;
      uniform float pixelRatio;
      attribute float aSeed;
      varying float vA;
      void main() {
        float c = time * 1.6 + aSeed * 17.0;
        float phase = fract(c);
        float cycle = floor(c);
        vec2 j = vec2(fract(sin(cycle * 12.99 + aSeed * 78.2) * 43758.5), fract(sin(cycle * 39.35 + aSeed * 11.1) * 24634.6)) - 0.5;
        vec3 p = position + vec3(j.x * 1.4, 0.0, j.y * 1.4);
        vA = (1.0 - phase) * (1.0 - phase);
        gl_PointSize = pixelRatio * mix(1.5, 7.0, phase);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 color;
      uniform float opacity;
      varying float vA;
      void main() {
        vec2 q = (gl_PointCoord - 0.5) * vec2(2.0, 4.0);
        float d = length(q);
        float ring = smoothstep(0.55, 0.85, d) * (1.0 - smoothstep(0.85, 1.0, d));
        gl_FragColor = linearToOutputTexel(vec4(color, ring * vA * opacity));
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  return pts;
}

// Vertical streak: soft across, bright near the source and broken into ripples.
function streakTexture(THREE) {
  const tex = canvasTexture(THREE, 32, 128, (g, w, h) => {
    const rnd = seeded(5);
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const along = Math.pow(1 - t, 1.6) * Math.min(1, t * 8) * (0.55 + 0.45 * rnd());
      const grad = g.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, `rgba(255,255,255,${along.toFixed(3)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, y, w, 1);
    }
  });
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function reflectionMaterial(THREE, tex) {
  return new THREE.MeshBasicMaterial({
    map: tex, vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false,
  });
}

// One streak quad lying on the ground: starts at the origin and runs along +z.
function streakQuad(THREE, w, len) {
  return new THREE.PlaneGeometry(w, len).rotateX(-Math.PI / 2).translate(0, 0, len / 2);
}

function lampReflections(THREE, posts, yaw, mat) {
  const m = new THREE.Matrix4();
  const r = new THREE.Matrix4().makeRotationY(yaw);
  const parts = posts.map(([x, , z]) => ({ geometry: streakQuad(THREE, 0.55, 4.2), matrix: m.clone().makeTranslation(x, G + 0.14, z).multiply(r), color: 0xffc27a }));
  const mesh = new THREE.Mesh(mergeWithUV(THREE, parts), mat);
  mesh.renderOrder = 3;
  return mesh;
}

// Headlights (warm white) and tail lights (red), as children of a truck group.
function truckReflections(THREE, group, worldYaw, mat) {
  const r = new THREE.Matrix4().makeRotationY(worldYaw - group.rotation.y);
  const m = new THREE.Matrix4();
  const lights = [[1.5, 0.32, 0xfff1cf, 1.9], [1.5, -0.32, 0xfff1cf, 1.9], [-1.48, 0.4, 0xff4a3d, 1.2], [-1.48, -0.4, 0xff4a3d, 1.2]];
  const parts = lights.map(([x, z, color, len]) => ({ geometry: streakQuad(THREE, 0.28, len), matrix: m.clone().makeTranslation(x, 0.03, z).multiply(r), color }));
  const mesh = new THREE.Mesh(mergeWithUV(THREE, parts), mat);
  mesh.renderOrder = 3;
  group.add(mesh);
  return mesh;
}

function dropsTexture(THREE, trails) {
  const size = trails ? [128, 256] : [256, 256];
  const tex = canvasTexture(THREE, size[0], size[1], (g, w, h) => {
    const rnd = seeded(trails ? 31 : 13);
    if (trails) {
      for (let i = 0; i < 9; i++) {
        const x = rnd() * w;
        const y0 = rnd() * h;
        const len = 40 + rnd() * 120;
        const grad = g.createLinearGradient(0, y0, 0, y0 + len);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,0.55)');
        g.strokeStyle = grad;
        g.lineWidth = 1 + rnd();
        g.beginPath();
        g.moveTo(x, y0);
        g.bezierCurveTo(x + rnd() * 4 - 2, y0 + len * 0.3, x + rnd() * 6 - 3, y0 + len * 0.6, x + rnd() * 4 - 2, y0 + len);
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.beginPath();
        g.ellipse(x, y0 + len, 2.2, 3, 0, 0, Math.PI * 2);
        g.fill();
      }
      return;
    }
    for (let i = 0; i < 90; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 1 + rnd() * 3.2;
      const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.75)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.12)');
      grad.addColorStop(1, 'rgba(255,255,255,0.4)');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function glassLayer(THREE, tex, tile, opacity) {
  const m = new THREE.Matrix4();
  const parts = BAYS.map(([a, b]) => {
    const w = b - a;
    const geometry = new THREE.PlaneGeometry(w, 1.7);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (a + uv.getX(i) * w) / tile[0], (0.5 + uv.getY(i) * 1.7) / tile[1]);
    return { geometry, matrix: m.clone().makeTranslation((a + b) / 2, 1.35, GLASS_Z) };
  });
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color: 0xc4d8ff, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const mesh = new THREE.Mesh(mergeWithUV(THREE, parts), mat);
  mesh.renderOrder = 1;
  return mesh;
}

export function createWeather(THREE, parent, { posts, trucks, cameraYaw, quality = 'high' }) {
  const group = new THREE.Group();
  group.name = 'weather';
  parent.add(group);
  const streakTex = streakTexture(THREE);
  const reflMat = reflectionMaterial(THREE, streakTex);
  const lampRefl = lampReflections(THREE, posts, cameraYaw, reflMat);
  group.add(lampRefl);
  const truckRefl = trucks.map((g) => truckReflections(THREE, g, cameraYaw, reflMat));
  const dropTex = dropsTexture(THREE, false);
  const trailTex = dropsTexture(THREE, true);
  const drops = glassLayer(THREE, dropTex, [1.3, 1.3], 0.22);
  const trails = glassLayer(THREE, trailTex, [1.1, 2.2], 0.28);
  group.add(drops, trails);
  let rain = null;
  let splash = null;
  let level = null;
  let raining = true;
  let pixelRatio = 1;

  function buildRain(q) {
    if (level === q) return;
    level = q;
    [rain, splash].forEach((o) => { if (o) { group.remove(o); o.geometry.dispose(); o.material.dispose(); } });
    const c = COUNTS[q] || COUNTS.high;
    rain = rainStreaks(THREE, c.streaks);
    splash = c.splashes ? splashes(THREE, c.splashes) : null;
    group.add(rain);
    if (splash) {
      splash.material.uniforms.pixelRatio.value = pixelRatio;
      group.add(splash);
    }
    show();
  }

  function show() {
    [rain, splash, drops, trails].forEach((o) => { if (o) o.visible = raining; });
    reflMat.opacity = raining ? 0.55 : 0.12;
  }

  buildRain(quality);

  return {
    setQuality(q) { buildRain(q === 'low' ? 'low' : 'high'); },
    setRain(on) { raining = Boolean(on); show(); },
    get raining() { return raining; },
    setPixelRatio(pr) {
      pixelRatio = pr;
      if (splash) splash.material.uniforms.pixelRatio.value = pr;
    },
    update(t, reduced) {
      rain.material.uniforms.time.value = t;
      if (splash) splash.material.uniforms.time.value = t;
      // With reduced motion the rain is frozen and quieter.
      rain.material.uniforms.opacity.value = reduced ? 0.18 : 0.32;
      if (splash) splash.visible = raining && !reduced;
      trailTex.offset.y = reduced ? 0 : -t * 0.035;
    },
    dispose() {
      parent.remove(group);
      truckRefl.forEach((m) => { m.parent?.remove(m); m.geometry.dispose(); });
      group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      [streakTex, dropTex, trailTex].forEach((t) => t.dispose());
      reflMat.dispose();
    },
  };
}
