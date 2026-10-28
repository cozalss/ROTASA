// Head-and-shoulders portraits rendered once per character with a small,
// dedicated offscreen renderer, composited onto a night background.
// The renderer is created lazily and released shortly after the last request.
import { createPersonKit, buildPersonModel } from './person-model.js';
import { createAnimator } from './person-anim.js';

const SIZE = 256;
const SUPER = 2;
const IDLE_RELEASE_MS = 3000;

let shared = null;
let queue = Promise.resolve();

function acquire(THREE) {
  if (shared) {
    clearTimeout(shared.timer);
    return shared;
  }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE * SUPER, SIZE * SUPER, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  shared = { renderer, timer: 0 };
  return shared;
}

function release() {
  if (!shared) return;
  const s = shared;
  s.timer = setTimeout(() => {
    if (shared !== s) return;
    shared = null;
    s.renderer.dispose();
    s.renderer.forceContextLoss?.();
  }, IDLE_RELEASE_MS);
}

export function renderPortrait(THREE, person) {
  const job = queue.then(() => draw(THREE, person));
  queue = job.catch(() => {});
  return job;
}

function draw(THREE, person) {
  const { renderer } = acquire(THREE);
  const kit = createPersonKit(THREE);
  try {
    const scene = new THREE.Scene();
    const rig = buildPersonModel(kit, person.look);
    createAnimator(rig, 2).update(0, { reduced: true });
    rig.head.rotation.y = 0.18;
    rig.head.rotation.x = -0.04;
    rig.root.rotation.y = -0.32;
    scene.add(rig.root);
    scene.add(new THREE.HemisphereLight(0x9fb8e0, 0x2a2018, 0.9));
    const key = new THREE.DirectionalLight(0xffe2c0, 1.25);
    key.position.set(-1.5, 2.4, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x3cc4b8, 0.9);
    rim.position.set(2.2, 1.6, -2.0);
    scene.add(rim);
    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 20);
    camera.position.set(0.12, 1.08, 2.25);
    camera.lookAt(0, 0.97, 0);
    renderer.render(scene, camera);
    return compose(renderer.domElement, person.color);
  } finally {
    kit.dispose();
    release();
  }
}

function compose(source, accent) {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(SIZE * 0.5, SIZE * 0.42, 10, SIZE * 0.5, SIZE * 0.5, SIZE * 0.72);
  bg.addColorStop(0, '#1c3550');
  bg.addColorStop(1, '#0d1a2b');
  g.fillStyle = bg;
  g.fillRect(0, 0, SIZE, SIZE);
  g.globalAlpha = 0.35;
  g.fillStyle = accent;
  g.beginPath();
  g.arc(SIZE * 0.5, SIZE * 1.05, SIZE * 0.55, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.drawImage(source, 0, 0, SIZE, SIZE);
  return c.toDataURL('image/png');
}
