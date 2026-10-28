// Pointer input on the world canvas: hover picking, click picking, drag to
// pan and wheel to zoom. Only active while the world is interactive.

const DRAG_PX = 6;
const ZOOM_STEP = 1.12;

export function createInput(THREE, canvas, { camera, targets, onHover, onPick, onPan, onZoom, isInteractive }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  let dragging = false;

  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(targets(), true);
    for (const hit of hits) {
      let o = hit.object;
      while (o) {
        if (o.userData.hotspotId) return { hotspot: o.userData.hotspotId };
        if (o.userData.personId) return { person: o.userData.personId };
        o = o.parent;
      }
    }
    return null;
  }

  const onMove = (e) => {
    if (!isInteractive()) return;
    if (down) {
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!dragging && Math.hypot(dx, dy) > DRAG_PX) {
        dragging = true;
        canvas.setPointerCapture?.(e.pointerId);
      }
      if (dragging) {
        onPan(e.clientX - down.lx, e.clientY - down.ly);
        down.lx = e.clientX;
        down.ly = e.clientY;
        canvas.style.cursor = 'grabbing';
        return;
      }
    }
    const hit = pickAt(e.clientX, e.clientY);
    onHover(hit);
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  };
  const onDown = (e) => {
    if (!isInteractive() || e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY };
    dragging = false;
  };
  const onUp = (e) => {
    if (!down) return;
    const wasDrag = dragging;
    down = null;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
    canvas.style.cursor = '';
    if (!wasDrag && isInteractive()) {
      const hit = pickAt(e.clientX, e.clientY);
      if (hit) onPick(hit);
    }
  };
  const onLeave = () => {
    if (!dragging) onHover(null);
  };
  const onWheel = (e) => {
    if (!isInteractive()) return;
    e.preventDefault();
    onZoom(e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
  };

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  return {
    dispose() {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
    },
  };
}
