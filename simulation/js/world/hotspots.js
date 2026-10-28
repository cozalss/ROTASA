// 3D hotspot markers: a floating marker above the prop, a ring on the floor
// and an invisible pick volume. Hover/focus turns the marker player-orange.
import { ANCHORS } from './anchors.js';
import { C } from './palette.js';

const KIND_COLOR = { document: 0xffc67a, trap: 0xffc67a, person: C.expert, event: C.alert, exit: 0x9fc4ff };
const DONE = 0x7d8b99;
const LOCKED = 0x4a5868;

export function createHotspots(THREE, parent, glowTex) {
  const geo = {
    diamond: new THREE.OctahedronGeometry(0.13, 0),
    bubble: bubbleGeometry(THREE),
    bang: new THREE.CylinderGeometry(0.035, 0.05, 0.22, 8).translate(0, 0.08, 0),
    arrow: new THREE.ConeGeometry(0.13, 0.24, 4).rotateX(Math.PI),
    ring: new THREE.RingGeometry(0.3, 0.36, 48).rotateX(-Math.PI / 2),
    proxy: new THREE.CylinderGeometry(0.6, 0.6, 1, 10),
  };
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const markers = new Map();
  let hovered = null;
  let visible = true;

  function shapeFor(kind) {
    if (kind === 'person') return geo.bubble;
    if (kind === 'event') return geo.bang;
    if (kind === 'exit') return geo.arrow;
    return geo.diamond;
  }

  function create(h) {
    const a = ANCHORS[h.anchor];
    const group = new THREE.Group();
    const [px, pz] = a.pos;
    const [sx, sz] = a.stand;
    const fx = px + (sx - px) * 0.4;
    const fz = pz + (sz - pz) * 0.4;
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const icon = new THREE.Mesh(shapeFor(h.kind), mat);
    icon.position.set(px, a.marker, pz);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    glow.scale.setScalar(0.5);
    glow.position.copy(icon.position);
    const ringMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8 });
    const ring = new THREE.Mesh(geo.ring, ringMat);
    ring.position.set(fx, 0.03, fz);
    const proxy = new THREE.Mesh(geo.proxy, proxyMat);
    proxy.scale.y = a.marker + 0.3;
    proxy.position.set(px, (a.marker + 0.3) / 2, pz);
    proxy.userData.hotspotId = h.id;
    icon.userData.hotspotId = h.id;
    [icon, glow, ring].forEach((o) => { o.renderOrder = 4; });
    group.add(icon, glow, ring, proxy);
    parent.add(group);
    return { h, group, icon, glow, ring, proxy, base: a.marker, phase: Math.random() * 6 };
  }

  function paint(m) {
    const isHover = hovered === m.h.id;
    const state = m.h.state;
    const color = isHover ? C.player : state === 'done' ? DONE : state === 'locked' ? LOCKED : KIND_COLOR[m.h.kind] ?? KIND_COLOR.document;
    m.icon.material.color.setHex(color);
    m.glow.material.color.setHex(color);
    m.ring.material.color.setHex(color);
    const quiet = state === 'done' || state === 'locked';
    m.glow.material.opacity = quiet && !isHover ? 0.15 : isHover ? 0.9 : 0.45;
    m.ring.material.opacity = quiet && !isHover ? 0.3 : 0.7;
    m.icon.scale.setScalar(isHover ? 1.35 : quiet ? 0.8 : 1);
  }

  return {
    set(list) {
      const keep = new Set();
      (list || []).forEach((h) => {
        if (!h || !ANCHORS[h.anchor] || h.state === 'hidden') return;
        keep.add(h.id);
        const old = markers.get(h.id);
        if (old && old.h.anchor === h.anchor && old.h.kind === h.kind) old.h = h;
        else {
          if (old) removeMarker(old);
          markers.set(h.id, create(h));
          markers.get(h.id).group.visible = visible;
        }
        paint(markers.get(h.id));
      });
      [...markers.keys()].filter((id) => !keep.has(id)).forEach((id) => { removeMarker(markers.get(id)); markers.delete(id); });
      if (hovered && !markers.has(hovered)) hovered = null;
    },
    setHover(id) {
      if (hovered === id) return false;
      const prev = hovered;
      hovered = id && markers.has(id) ? id : null;
      [prev, hovered].forEach((k) => { if (k && markers.has(k)) paint(markers.get(k)); });
      return true;
    },
    get hovered() { return hovered; },
    setVisible(on) { visible = on; markers.forEach((m) => { m.group.visible = on; }); },
    get(id) { return markers.get(id) || null; },
    pickables() { return [...markers.values()].flatMap((m) => [m.proxy, m.icon]); },
    // Objects to outline for a hotspot (marker plus anything registered for its anchor).
    outlineTargets(id, extra) {
      const m = markers.get(id);
      return m ? [m.icon, ...(extra(m.h) || [])] : [];
    },
    update(t, reduced) {
      markers.forEach((m) => {
        const quiet = m.h.state === 'done' || m.h.state === 'locked';
        const hover = hovered === m.h.id;
        const bob = reduced || quiet ? 0 : Math.sin(t * 2.2 + m.phase) * 0.07;
        m.icon.position.y = m.base + bob;
        m.glow.position.y = m.icon.position.y;
        if (!reduced && !quiet) m.icon.rotation.y = t * 1.4 + m.phase;
        const pulse = reduced ? 0.5 : (t * 0.8 + m.phase * 0.1) % 1;
        m.ring.scale.setScalar(hover ? 1.15 : 0.9 + (quiet ? 0 : pulse * 0.25));
        if (!quiet && !reduced) m.ring.material.opacity = hover ? 1 : 0.7 * (1 - pulse * 0.6);
      });
    },
    dispose() {
      markers.forEach(removeMarker);
      markers.clear();
      Object.values(geo).forEach((g) => g.dispose());
      proxyMat.dispose();
    },
  };

  function removeMarker(m) {
    parent.remove(m.group);
    [m.icon, m.glow, m.ring].forEach((o) => o.material.dispose());
  }
}

function bubbleGeometry(THREE) {
  const shape = new THREE.Shape();
  const w = 0.16;
  const h = 0.11;
  shape.moveTo(-w, -h + 0.03);
  shape.quadraticCurveTo(-w, -h, -w + 0.03, -h);
  shape.lineTo(-0.02, -h);
  shape.lineTo(-0.07, -h - 0.07);
  shape.lineTo(0.03, -h);
  shape.lineTo(w - 0.03, -h);
  shape.quadraticCurveTo(w, -h, w, -h + 0.03);
  shape.lineTo(w, h - 0.03);
  shape.quadraticCurveTo(w, h, w - 0.03, h);
  shape.lineTo(-w + 0.03, h);
  shape.quadraticCurveTo(-w, h, -w, h - 0.03);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  g.translate(0, 0, -0.025);
  return g;
}
