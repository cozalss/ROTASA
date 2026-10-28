// Mood-specific props: each mood owns a group that is shown only in that mood.
//   outage      red rotating alarm beacon on the staging rack, red spill
//   after-good  plants, a framed "Test policy v1.0 — approved", tidy desks
//   after-bad   clutter, red sticky notes, the KVKK incident (on the DevOps screen)
import { C } from './palette.js';
import { createKit, finalizeKit } from './kit.js';
import { plant } from './furniture.js';
import { paintPolicyFrame, paintSticky } from './screens.js';

const PI = Math.PI;

export function createMoodProps(THREE, parent, glowTex) {
  const groups = {};
  const build = (id, fill) => {
    const g = new THREE.Group();
    g.visible = false;
    g.name = `mood-${id}`;
    const kit = createKit(THREE);
    const extra = fill(kit, g) || {};
    finalizeKit(THREE, kit, g, { glowTex });
    parent.add(g);
    groups[id] = { group: g, ...extra };
  };
  build('outage', outage(THREE, glowTex));
  build('after-good', afterGood);
  build('after-bad', afterBad);
  let active = 'evening';
  return {
    set(mood) {
      active = mood;
      Object.entries(groups).forEach(([id, m]) => { m.group.visible = id === mood; });
    },
    update(t, reduced) {
      const o = groups.outage;
      if (active === 'outage' && o.beam) {
        o.beam.rotation.y = reduced ? 0.6 : t * 3.4;
        o.sweep.rotation.y = o.beam.rotation.y;
      }
    },
  };
}

function outage(THREE, glowTex) {
  return (kit, g) => {
    const x = -0.6;
    const z = -7.45;
    kit.m.cyl(x, 2.08, z, 0.12, 0.05, C.trim, 12);
    kit.glow.sphere(x, 2.2, z, 0.1, 0xff3a2c, 12, [1, 1.1, 1]);
    kit.pools.push({ x, y: 0.015, z: -6.4, r: 2.4, color: C.alert, tag: 'alarm' });
    kit.pools.push({ x: 0.8, y: 0.015, z: -4.4, r: 1.8, color: C.alert, tag: 'alarm' });
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff4a3a, map: glowTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    const beam = new THREE.Group();
    beam.position.set(x, 2.2, z);
    [0, PI].forEach((a) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), beamMat);
      plane.position.set(Math.sin(a) * 1.6, 0, Math.cos(a) * 1.6);
      plane.rotation.y = a + PI / 2;
      plane.renderOrder = 5;
      beam.add(plane);
    });
    g.add(beam);
    const sweepMat = beamMat.clone();
    sweepMat.opacity = 0.35;
    const sweep = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-PI / 2).translate(1.3, 0, 0), sweepMat);
    sweep.position.set(x, 0.02, -6.4);
    sweep.renderOrder = 3;
    g.add(sweep);
    return { beam, sweep };
  };
}

function afterGood(kit) {
  kit.screens.push({ w: 0.95, h: 0.7, pos: [-11.94, 1.55, 1.95], yaw: PI / 2, paint: paintPolicyFrame, size: [320, 236], tag: 'frame' });
  kit.m.box(-11.97, 1.15, 1.95, 0.04, 0.8, 1.05, 0xc9b48a);
  [[-6.6, -2.2, 1.1, true], [-0.4, -2.2, 0.9, false], [4.9, -2.2, 1.0, true], [9.9, 2.2, 1.0, true], [-7.5, 2.6, 0.9, false],
    [2.4, 2.6, 0.9, false], [-11.5, -2.8, 1.1, true], [6.2, -7.55, 0.9, false], [-2.0, 3.3, 0.8, false]].forEach(([x, z, s, tall]) => plant(kit, x, z, s, tall));
  [[-9.0, -0.15], [-4.6, -0.15], [7.9, -0.15]].forEach(([x, z]) => {
    kit.m.cyl(x, 0.5, z, 0.05, 0.14, 0xd7e1ec, 8);
    kit.m.sphere(x, 0.68, z, 0.07, 0xff9ab0, 7);
    kit.m.sphere(x + 0.05, 0.66, z + 0.03, 0.05, 0xffd66b, 6);
  });
}

function afterBad(kit) {
  const m = kit.m;
  [[-6.6, -2.3], [-6.2, -1.9], [4.7, -2.2], [9.0, 2.4], [-1.0, 2.5], [2.3, -3.3], [-11.3, 3.6]].forEach(([x, z], i) => {
    m.box(x, 0, z, 0.5, 0.36, 0.42, 0x9c7a55, { y: i * 0.4 });
    m.box(x, 0.36, z, 0.52, 0.03, 0.44, 0x8a6a48, { y: i * 0.4 });
    if (i % 2 === 0) m.box(x + 0.05, 0.39, z, 0.42, 0.3, 0.36, 0xa98563, { y: i * 0.4 + 0.3 });
  });
  [[-9.0, -0.3], [-4.5, -0.25], [1.4, -0.3], [6.9, -0.25], [8.6, -0.3], [9.9, -6.1], [-9.4, -6.0], [-4.3, -5.6]].forEach(([x, z], i) => {
    m.box(x, 0.5, z, 0.24, 0.05 + (i % 3) * 0.04, 0.32, 0xe4dccb, { y: i * 0.5 });
    m.cyl(x + 0.2, 0.5, z + 0.12, 0.04, 0.09, i % 2 ? 0xece6d8 : 0x8a6e55, 8);
  });
  m.box(-3.0, 0.3, 5.7, 0.45, 0.04, 0.45, 0xd9b45a, { y: 0.3 });
  m.box(-2.9, 0.34, 5.6, 0.45, 0.04, 0.45, 0xd9b45a, { y: -0.2 });
  m.box(5.6, 0, -3.4, 0.46, 0.32, 0.42, C.chair, { x: PI / 2, y: 0.6 });
  const red = 0xff5a4f;
  [[3.0, 1.3, -0.47, 0], [3.6, 1.0, -0.47, 0], [2.7, 0.9, -0.47, 0], [-4.4, 0.95, -7.97, 0], [-5.4, 1.25, -7.97, 0], [11.9, 1.2, -7.95, 0]].forEach(([x, y, z, yaw], i) => {
    kit.screens.push({ w: 0.16, h: 0.16, pos: [x, y, z], yaw: yaw + (i % 2 ? 0.1 : -0.08), paint: paintSticky(i % 2 ? ['FIX!'] : ['why?'], '#ff6b5e', '#3a0a05'), size: [64, 64], tag: 'label' });
  });
  [[-11.94, 1.1, -0.3], [-11.94, 1.35, 0.2], [-11.94, 0.95, 0.6]].forEach(([x, y, z], i) => {
    kit.screens.push({ w: 0.2, h: 0.2, pos: [x, y, z], yaw: PI / 2, paint: paintSticky(i ? ['URGENT'] : ['KVKK??'], '#ff6b5e', '#3a0a05'), size: [64, 64], tag: 'label' });
  });
  kit.pools.push({ x: 10.9, y: 0.015, z: -6.6, r: 2.2, color: red, tag: 'alarm' });
}
