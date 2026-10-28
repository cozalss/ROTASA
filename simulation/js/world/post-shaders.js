// Full-screen shaders owned by the world (no extra scripts needed).
//
// TiltShift: one separable 9-tap Gaussian, run twice (horizontal, vertical).
//   Unlike the r128 example shaders it keeps a sharp focus *band* around
//   `focus` (uv.y) and only ramps the blur outside it, so the subject stays crisp.
// Grade: one pass for the whole colour grade (split-tone lift/gain, saturation,
//   contrast, brightness) plus film grain, instead of three example passes.
//   Runs after gamma correction, so it works on display-referred colours.

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const TiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    delta: { value: null },   // THREE.Vector2: blur step per tap in uv (direction * px / size)
    focus: { value: 0.5 },    // uv.y of the focus band centre
    band: { value: 0.16 },    // half-height of the sharp band
    feather: { value: 0.32 }, // ramp from sharp to full blur
  },
  vertexShader: VERT,
  fragmentShader: /* glsl */`
uniform sampler2D tDiffuse;
uniform vec2 delta;
uniform float focus;
uniform float band;
uniform float feather;
varying vec2 vUv;
void main() {
  float k = smoothstep(band, band + feather, abs(vUv.y - focus));
  vec2 d = delta * k;
  vec4 sum = texture2D(tDiffuse, vUv) * 0.1633;
  sum += texture2D(tDiffuse, vUv - d * 4.0) * 0.051;
  sum += texture2D(tDiffuse, vUv - d * 3.0) * 0.0918;
  sum += texture2D(tDiffuse, vUv - d * 2.0) * 0.12245;
  sum += texture2D(tDiffuse, vUv - d) * 0.1531;
  sum += texture2D(tDiffuse, vUv + d) * 0.1531;
  sum += texture2D(tDiffuse, vUv + d * 2.0) * 0.12245;
  sum += texture2D(tDiffuse, vUv + d * 3.0) * 0.0918;
  sum += texture2D(tDiffuse, vUv + d * 4.0) * 0.051;
  gl_FragColor = sum;
}`,
};

export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    lift: { value: null },       // THREE.Vector3 added in the shadows
    gain: { value: null },       // THREE.Vector3 multiplied in the highlights
    saturation: { value: 1 },
    contrast: { value: 1 },
    brightness: { value: 0 },
    grain: { value: 0 },
    seed: { value: 0 },
    resolution: { value: null }, // THREE.Vector2 in px
  },
  vertexShader: VERT,
  fragmentShader: /* glsl */`
uniform sampler2D tDiffuse;
uniform vec3 lift;
uniform vec3 gain;
uniform float saturation;
uniform float contrast;
uniform float brightness;
uniform float grain;
uniform float seed;
uniform vec2 resolution;
varying vec2 vUv;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float PIVOT = 0.32;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec4 src = texture2D(tDiffuse, vUv);
  vec3 col = src.rgb;
  float l = dot(col, LUMA);
  col = col * mix(vec3(1.0), gain, smoothstep(0.05, 0.8, l)) + lift * (1.0 - smoothstep(0.0, 0.45, l));
  l = dot(col, LUMA);
  col = mix(vec3(l), col, saturation);
  col = (col - PIVOT) * contrast + PIVOT + brightness;
  float n = hash(floor(vUv * resolution) + seed) - 0.5;
  col += n * grain * (1.0 - 0.6 * l);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
}`,
};

// Per-mood grades (display-referred). Evening: cool shadows, warm highlights.
export const GRADES = {
  evening:      { lift: [0.0, 0.008, 0.026], gain: [1.04, 1.0, 0.95], saturation: 1.06, contrast: 1.05, brightness: 0.0 },
  outage:       { lift: [0.03, 0.0, 0.004], gain: [1.1, 0.95, 0.93], saturation: 0.74, contrast: 1.1, brightness: -0.01 },
  'after-good': { lift: [0.012, 0.008, 0.012], gain: [1.07, 1.02, 0.93], saturation: 1.1, contrast: 1.04, brightness: 0.025 },
  'after-bad':  { lift: [0.0, 0.01, 0.034], gain: [0.94, 0.98, 1.06], saturation: 0.82, contrast: 1.07, brightness: -0.015 },
};
