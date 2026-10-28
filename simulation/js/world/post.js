// Optional post-processing ('high' quality only):
//   RenderPass | SSAO (when the extra scripts loaded; replaces the RenderPass)
//   → UnrealBloom (high threshold: only lamps, screens, LEDs, alarm, headlights)
//   → tilt-shift H + V (miniature look, sharp band around the focus)
//   → Outline (hovered hotspot, player orange) → Vignette → GammaCorrection
//   → Grade (per-mood split tone, saturation, contrast + film grain) → SMAA/FXAA.
// Needs the classic r128 example scripts on the THREE global; returns null
// when any required piece is missing, and the world renders directly.
//
// Adaptive tiers (see adaptive.js): 0 everything, 1 no SSAO, 2 no tilt-shift,
// 3 half-resolution bloom.
import { TiltShiftShader, GradeShader } from './post-shaders.js';
import { createSSAO } from './ssao.js';

const BLOOM = { strength: 0.62, radius: 0.42, threshold: 0.8 };
export const MAX_TIER = 3;

export function postAvailable(THREE) {
  return Boolean(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.UnrealBloomPass
    && THREE.CopyShader && THREE.LuminosityHighPassShader && THREE.GammaCorrectionShader);
}

function addOutline(THREE, composer, size, scene, camera) {
  if (!THREE.OutlinePass) return null;
  const outline = new THREE.OutlinePass(size.clone(), scene, camera);
  outline.visibleEdgeColor.set(0xff8a3d);
  outline.hiddenEdgeColor.set(0x7a3a12);
  outline.edgeStrength = 3.2;
  outline.edgeThickness = 1.4;
  outline.edgeGlow = 0.5;
  outline.pulsePeriod = 2;
  outline.enabled = false;
  composer.addPass(outline);
  return outline;
}

function addVignette(THREE, composer) {
  if (!THREE.VignetteShader) return;
  const vignette = new THREE.ShaderPass(THREE.VignetteShader);
  // darkness 1.0 mixes towards black (a proportional darkening); above 1.0 the
  // shader mixes towards a negative colour and crushes the night shadows.
  vignette.uniforms.offset.value = 0.9;
  vignette.uniforms.darkness.value = 1.0;
  composer.addPass(vignette);
}

function addAA(THREE, composer) {
  if (THREE.SMAAPass && THREE.SMAAEdgeDetectionShader) {
    composer.addPass(new THREE.SMAAPass(1, 1));
    return null;
  }
  if (!THREE.FXAAShader) return null;
  const fxaa = new THREE.ShaderPass(THREE.FXAAShader);
  composer.addPass(fxaa);
  return fxaa;
}

function tiltPass(THREE, horizontal) {
  const p = new THREE.ShaderPass(TiltShiftShader);
  p.uniforms.delta.value = new THREE.Vector2();
  p.userData = { horizontal };
  return p;
}

function gradePass(THREE) {
  const p = new THREE.ShaderPass(GradeShader);
  p.uniforms.lift.value = new THREE.Vector3();
  p.uniforms.gain.value = new THREE.Vector3(1, 1, 1);
  p.uniforms.resolution.value = new THREE.Vector2(1, 1);
  return p;
}

export function createPost(THREE, renderer, scene, camera, { ssao: wantSSAO = true } = {}) {
  if (!postAvailable(THREE)) return null;
  const size = new THREE.Vector2(1, 1);
  // Half-float buffers avoid banding in the dark gradients (WebGL2 only).
  const target = renderer.capabilities.isWebGL2
    ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })
    : undefined;
  const composer = new THREE.EffectComposer(renderer, target);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);
  const ao = wantSSAO ? createSSAO(THREE, renderer, scene, camera) : null;
  if (ao) composer.addPass(ao.pass);
  const bloom = new THREE.UnrealBloomPass(size.clone(), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
  composer.addPass(bloom);
  const tiltH = tiltPass(THREE, true);
  const tiltV = tiltPass(THREE, false);
  composer.addPass(tiltH);
  composer.addPass(tiltV);
  const outline = addOutline(THREE, composer, size, scene, camera);
  addVignette(THREE, composer);
  composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
  const grade = gradePass(THREE);
  composer.addPass(grade);
  const fxaa = addAA(THREE, composer);

  const px = { w: 1, h: 1 };
  const tilt = { focus: 0.5, amount: 0 };
  let tier = 0;

  function applyTilt() {
    const on = tier < 2 && tilt.amount > 0.05;
    [tiltH, tiltV].forEach((p) => {
      p.enabled = on;
      p.uniforms.focus.value = tilt.focus;
      p.uniforms.delta.value.set(p.userData.horizontal ? tilt.amount / px.w : 0, p.userData.horizontal ? 0 : tilt.amount / px.h);
    });
  }

  function applyBloomSize() {
    const k = tier >= 3 ? 0.5 : 1;
    bloom.setSize?.(Math.max(1, px.w * k), Math.max(1, px.h * k));
  }

  function applyTier() {
    const aoOn = Boolean(ao) && tier < 1;
    if (ao) ao.pass.enabled = aoOn;
    renderPass.enabled = !aoOn;
    applyTilt();
    applyBloomSize();
  }
  applyTier();

  return {
    setSize(w, h, pixelRatio) {
      px.w = w * pixelRatio;
      px.h = h * pixelRatio;
      composer.setPixelRatio(pixelRatio);
      composer.setSize(w, h);
      applyBloomSize();
      applyTilt();
      grade.uniforms.resolution.value.set(px.w, px.h);
      fxaa?.uniforms.resolution.value.set(1 / px.w, 1 / px.h);
    },
    setOutline(objects) {
      if (!outline) return;
      outline.selectedObjects = objects;
      outline.enabled = objects.length > 0;
    },
    // focus: uv.y of the sharp band; amount: blur step in CSS px per tap (0 = off).
    setTiltShift(focus, amount, band) {
      tilt.focus = focus;
      tilt.amount = amount * (renderer.getPixelRatio() || 1);
      if (band != null) [tiltH, tiltV].forEach((p) => { p.uniforms.band.value = band; });
      applyTilt();
    },
    setGrade(g) {
      const u = grade.uniforms;
      u.lift.value.set(...g.lift);
      u.gain.value.set(...g.gain);
      u.saturation.value = g.saturation;
      u.contrast.value = g.contrast;
      u.brightness.value = g.brightness;
    },
    setGrain(amount, seed) {
      grade.uniforms.grain.value = amount;
      grade.uniforms.seed.value = seed;
    },
    setTier(n) {
      tier = Math.max(0, Math.min(MAX_TIER, n));
      applyTier();
    },
    // Whether stepping up to tier n would switch something off.
    tierMatters(n) {
      if (n === 1) return Boolean(ao);
      return n === 2 || n === 3;
    },
    get tier() { return tier; },
    features() {
      return { ssao: Boolean(ao) && ao.pass.enabled, ssaoLoaded: Boolean(ao), tiltShift: tiltH.enabled, bloomScale: tier >= 3 ? 0.5 : 1, grade: true, outline: Boolean(outline) };
    },
    render(dt) {
      if (ao?.pass.enabled) ao.sync();
      composer.render(dt);
    },
    dispose() {
      composer.passes.forEach((p) => { if (p !== ao?.pass) p.dispose?.(); });
      ao?.dispose();
      [tiltH, tiltV, grade].forEach((p) => p.material.dispose());
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
    },
  };
}
