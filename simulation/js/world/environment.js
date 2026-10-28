// Image-based lighting for the night office. Instead of r128's RoomEnvironment
// (a bright white studio that washes out the night mood even at low intensity)
// the same technique is used on a purpose-built "night room": dark navy walls,
// a cool moonlit window band, a warm city-glow strip and a few amber lamp
// panels. PMREMGenerator prefilters it once; scene.environment then gives the
// standard materials soft, mood-correct reflections and the glass a sheen.
// Core THREE only, so it never depends on the extra scripts.

const ENV_MATTE = 0.55;
const ENV_GLASS = 1.4;
const SIGMA = 0.04;

function panel(THREE, group, w, h, color, scale, pos, rotY = 0, rotX = 0) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).convertSRGBToLinear().multiplyScalar(scale), side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(...pos);
  mesh.rotation.set(rotX, rotY, 0);
  group.add(mesh);
}

function nightRoom(THREE) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(20, 8, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0x101c2e).convertSRGBToLinear(), side: THREE.BackSide }),
  );
  room.position.y = 3;
  scene.add(room);
  const g = new THREE.Group();
  scene.add(g);
  // Moonlit window band on the back wall (-z), city glow under it.
  panel(THREE, g, 16, 2.4, 0xa9c3ff, 1.4, [0, 3.6, -9.9]);
  panel(THREE, g, 18, 1.0, 0xffb877, 0.55, [0, 0.6, -9.9]);
  // Dim cool fill from the left, warm lamp panels on the ceiling.
  panel(THREE, g, 10, 3, 0x5a78b0, 0.5, [-9.9, 3, 0], Math.PI / 2);
  [[-4, -3], [3, -2], [-2, 4], [5, 4]].forEach(([x, z]) => panel(THREE, g, 1.6, 1.6, 0xffc27a, 2.6, [x, 6.9, z], 0, Math.PI / 2));
  // Floor: a warm, very dark bounce.
  panel(THREE, g, 20, 20, 0x2a2018, 0.6, [0, -0.95, 0], 0, -Math.PI / 2);
  return scene;
}

export function createEnvironment(THREE, renderer) {
  let rt = null;
  let applied = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = nightRoom(THREE);
    rt = pmrem.fromScene(room, SIGMA);
    room.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    pmrem.dispose();
  } catch {
    rt = null;
  }

  return {
    available: Boolean(rt),
    // Attach to (or detach from) the scene; a change recompiles standard materials once.
    apply(scene, on) {
      const next = on && rt ? rt.texture : null;
      if (applied === next) return;
      applied = next;
      scene.environment = next;
      if (!next) return;
      scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => {
          if (!m.isMeshStandardMaterial || m.userData.envSet) return;
          m.envMapIntensity = m.transparent && m.roughness < 0.2 ? ENV_GLASS : ENV_MATTE;
          m.userData.envSet = true;
        });
      });
    },
    get active() { return Boolean(applied); },
    dispose() {
      rt?.dispose();
      rt = null;
    },
  };
}
