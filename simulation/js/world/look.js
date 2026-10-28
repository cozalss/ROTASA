// The "look" layer on top of the engine: image-based lighting, volumetric
// light, weather, stars, the per-mood colour grade, tilt-shift focus and the
// adaptive quality tiers. The engine calls it on mood/quality changes and once
// per rendered frame; everything here is optional eye candy and disposable.
import { createEnvironment } from './environment.js';
import { createAtmosphere } from './atmosphere.js';
import { createWeather } from './weather.js';
import { createSky } from './sky.js';
import { createAdaptive } from './adaptive.js';
import { GRADES } from './post-shaders.js';
import { MAX_TIER } from './post.js';

const RAIN = { evening: true, outage: true, 'after-good': false, 'after-bad': true };
const GRADE_S = 0.9;
const GRAIN = 0.032;
const GRAIN_STILL = 0.016;
const GRAIN_FPS = 24;
const STILL_T = 3.7;         // frozen effect time with reduced motion
// Tilt-shift blur step (CSS px per tap) and sharp band from overview to close-up.
const TILT = { farSpan: 20.5, nearSpan: 5.4, far: 0.75, near: 1.1, farBand: 0.2, nearBand: 0.18 };
const FOCUS_CLAMP = [0.32, 0.68];
const FOCUS_RATE = 3;
const BACKDROP_TIER = 2;     // no SSAO, no tilt-shift

const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => a.map((x, i) => lerp(x, b[i], k));

function mixGrade(a, b, k) {
  return {
    lift: lerp3(a.lift, b.lift, k), gain: lerp3(a.gain, b.gain, k),
    saturation: lerp(a.saturation, b.saturation, k), contrast: lerp(a.contrast, b.contrast, k), brightness: lerp(a.brightness, b.brightness, k),
  };
}

export function createLook(THREE, { renderer, scene, rig, lamps, posts, trucks, glowTex, reduced, focusTarget }) {
  const env = createEnvironment(THREE, renderer);
  const atmosphere = createAtmosphere(THREE, scene, { lamps });
  const weather = createWeather(THREE, scene, { posts, trucks, cameraYaw: Math.atan2(rig.dir.x, rig.dir.z) });
  const sky = createSky(THREE, scene, { glowTex });
  const s = { post: null, quality: 'high', reduced, tier: 0, backdrop: false, focus: 0.5, grade: GRADES.evening, from: GRADES.evening, to: GRADES.evening, k: 1 };
  const v = new THREE.Vector3();
  const adaptive = createAdaptive({ onSlow: stepDown });

  // Backdrop mode is CSS-blurred behind the dossier: AO and tilt-shift would be wasted.
  function applyTier() {
    s.post?.setTier(Math.max(s.tier, s.backdrop ? BACKDROP_TIER : 0));
  }

  function stepDown() {
    if (!s.post || s.tier >= MAX_TIER) return false;
    let next = s.tier + 1;
    while (next < MAX_TIER && !s.post.tierMatters(next)) next += 1;
    s.tier = next;
    applyTier();
    return true;
  }

  function updateGrade(dt) {
    if (s.k < 1) {
      s.k = s.reduced ? 1 : Math.min(1, s.k + dt / GRADE_S);
      const e = s.k * s.k * (3 - 2 * s.k);
      s.grade = mixGrade(s.from, s.to, e);
    }
    s.post?.setGrade(s.grade);
  }

  function updateTilt(dt) {
    if (!s.post) return;
    const k = Math.min(1, Math.max(0, (TILT.farSpan - rig.span) / (TILT.farSpan - TILT.nearSpan)));
    let target = 0.5;
    const p = focusTarget();
    if (p) {
      v.copy(p).project(rig.camera);
      target = Math.min(FOCUS_CLAMP[1], Math.max(FOCUS_CLAMP[0], 0.5 + v.y * 0.5));
    }
    s.focus = s.reduced ? target : s.focus + (target - s.focus) * Math.min(1, dt * FOCUS_RATE);
    s.post.setTiltShift(s.focus, lerp(TILT.far, TILT.near, k), lerp(TILT.farBand, TILT.nearBand, k));
  }

  return {
    setMood(id, params) {
      const rain = RAIN[id] ?? true;
      atmosphere.setMood(id, params);
      weather.setRain(rain);
      sky.setClear(!rain);
      s.from = s.grade;
      s.to = GRADES[id] || GRADES.evening;
      s.k = s.reduced ? 1 : 0;
      if (s.reduced) s.grade = s.to;
      updateGrade(0);
    },
    setQuality(q) {
      s.quality = q === 'low' ? 'low' : 'high';
      env.apply(scene, s.quality === 'high');
      weather.setQuality(s.quality);
      s.tier = 0;
      applyTier();
      adaptive.reset();
    },
    setMode(mode) {
      s.backdrop = mode === 'backdrop';
      applyTier();
    },
    attachPost(post) {
      s.post = post;
      if (!post) return;
      applyTier();
      updateGrade(0);
      updateTilt(1);
    },
    setReduced(r) {
      s.reduced = Boolean(r);
      adaptive.reset();
    },
    setAdaptive(on) { adaptive.setEnabled(on); },
    setPixelRatio(pr) {
      atmosphere.setPixelRatio(pr);
      weather.setPixelRatio(pr);
    },
    // Once per rendered frame, before rendering.
    frame(dt, t, now, frameMs) {
      const still = s.reduced;
      const et = still ? STILL_T : t;
      atmosphere.update(et);
      weather.update(et, still);
      updateGrade(dt);
      updateTilt(dt);
      s.post?.setGrain(still ? GRAIN_STILL : GRAIN, still ? 0 : (Math.floor(t * GRAIN_FPS) % 97) * 7.31);
      if (s.post && s.quality === 'high' && !still) adaptive.sample(frameMs, now);
    },
    stats() {
      return { tier: s.tier, ...adaptive.stats(), ...(s.post ? s.post.features() : {}), ibl: env.active, rain: weather.raining };
    },
    dispose() {
      env.apply(scene, false);
      env.dispose();
      atmosphere.dispose();
      weather.dispose();
      sky.dispose();
    },
  };
}
