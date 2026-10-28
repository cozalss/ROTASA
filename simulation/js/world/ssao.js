// SSAO tuned for the orthographic diorama camera. r128's SSAOPass supports an
// orthographic camera through its PERSPECTIVE_CAMERA define but never sets it,
// and only copies the projection matrix on resize; this wrapper fixes both,
// halves the AO resolution and kernel for laptop GPUs, keeps the beauty buffer
// in half float (no banding), adds an intensity control and keeps transparent
// meshes (glass, light shafts, pools) out of the normal/depth pass.
// Keep the depth texture 16-bit: switching it to UnsignedIntType in r128
// leaves it unreadable and silently removes all occlusion.
// Returns null when THREE.SSAOPass is not loaded or construction fails.

const KERNEL = 16;
const RADIUS = 0.62;        // world units (desk-scale contact shadows)
const MIN_UNITS = 0.02;     // ignore depth deltas smaller than this (16-bit depth precision)
const MAX_UNITS = 1.1;      // no occlusion across larger depth gaps (halo guard)
const INTENSITY = 0.85;

export function createSSAO(THREE, renderer, scene, camera) {
  if (!THREE.SSAOPass || !THREE.SSAOShader || !THREE.SimplexNoise) return null;
  let pass;
  try {
    pass = new THREE.SSAOPass(scene, camera, 2, 2);
  } catch {
    return null;
  }
  const isGL2 = renderer.capabilities.isWebGL2;
  const ortho = camera.isPerspectiveCamera ? 0 : 1;
  const range = camera.far - camera.near;

  [pass.ssaoMaterial, pass.depthRenderMaterial].forEach((m) => {
    m.defines.PERSPECTIVE_CAMERA = ortho ? 0 : 1;
    m.needsUpdate = true;
  });
  pass.kernel.length = 0;
  pass.kernelSize = KERNEL;
  pass.generateSampleKernel();
  pass.ssaoMaterial.defines.KERNEL_SIZE = KERNEL;
  pass.ssaoMaterial.uniforms.kernel.value = pass.kernel;

  const fs = pass.ssaoMaterial.fragmentShader;
  const target = 'gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );';
  if (fs.includes(target)) {
    pass.ssaoMaterial.uniforms.aoIntensity = { value: INTENSITY };
    pass.ssaoMaterial.fragmentShader = `uniform float aoIntensity;\n${fs.replace(target, 'gl_FragColor = vec4( vec3( 1.0 - occlusion * aoIntensity ), 1.0 );')}`;
  }
  pass.kernelRadius = RADIUS;
  pass.minDistance = MIN_UNITS / range;
  pass.maxDistance = MAX_UNITS / range;

  if (isGL2) {
    pass.beautyRenderTarget.dispose();
    pass.beautyRenderTarget = new THREE.WebGLRenderTarget(2, 2, {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
  }

  // Points and lines are already hidden by r128; also hide sprites, transparent
  // meshes and invisible pick proxies (the override material would draw them).
  const baseHide = pass.overrideVisibility.bind(pass);
  pass.overrideVisibility = () => {
    baseHide();
    scene.traverse((o) => {
      if (!o.visible) return;
      const m = o.material;
      if (o.isSprite || (o.isMesh && (m?.transparent || m?.visible === false || o.userData.noAO))) o.visible = false;
    });
  };

  // Full-resolution beauty, half-resolution normals / AO / blur.
  pass.setSize = (w, h) => {
    const hw = Math.max(1, Math.round(w / 2));
    const hh = Math.max(1, Math.round(h / 2));
    pass.width = w;
    pass.height = h;
    pass.beautyRenderTarget.setSize(w, h);
    [pass.normalRenderTarget, pass.ssaoRenderTarget, pass.blurRenderTarget].forEach((rt) => rt.setSize(hw, hh));
    pass.ssaoMaterial.uniforms.resolution.value.set(hw, hh);
    pass.blurMaterial.uniforms.resolution.value.set(hw, hh);
  };

  return {
    pass,
    // The ortho frustum changes with zoom: refresh the matrices every frame.
    sync() {
      const u = pass.ssaoMaterial.uniforms;      u.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
      u.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
    },
    dispose() {
      pass.dispose();
      pass.noiseTexture?.dispose();
      pass.ssaoMaterial.dispose();
    },
  };
}
