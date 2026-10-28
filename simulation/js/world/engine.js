// The running 3D world: renderer, scene, render loop and per-frame overlay
// projection. Created by world.js on mount; everything here assumes THREE and
// WebGL exist (world.js guards that) and is fully disposed by dispose().
import { ANCHORS } from './anchors.js';
import { skyTexture, glowTexture, blobTexture, disposeTree } from './geo.js';
import { createKit, finalizeKit } from './kit.js';
import { buildOffice } from './office.js';
import { buildStreet, createTraffic } from './street.js';
import { createLighting, MOODS } from './lighting.js';
import { createMoodProps } from './moods.js';
import { createEffects } from './effects.js';
import { createCast, PEOPLE } from './people.js';
import { createHotspots } from './hotspots.js';
import { createOverlay } from './overlay.js';
import { createCameraRig } from './camera.js';
import { createInput } from './input.js';
import { createPost, postAvailable } from './post.js';
import { loadExtras, extrasPresent } from './extras.js';
import { createLook } from './look.js';

const MAX_DPR = 1.5;
const TAG_NEAR = 2.3;
const EDGE_PAD = 14;
const SHADOW_EVERY = 3;

export function createEngine(container, THREE, { reduced: reducedAtStart, onLost, onActivate }) {
  let reduced = reducedAtStart;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const textures = [];
  const keep = (t) => { textures.push(t); return t; };
  const root = document.createElement('div');
  root.className = 'world-root';
  const canvas = renderer.domElement;
  canvas.className = 'world-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  container.append(root);
  try {
    return build();
  } catch (err) {
    textures.forEach((t) => t.dispose());
    renderer.dispose();
    root.remove();
    throw err;
  }

  function build() {
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.info.autoReset = false;
    // The static office dominates the shadow pass; refresh it every few frames only.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));

    const scene = new THREE.Scene();
    scene.background = keep(skyTexture(THREE));
    scene.fog = new THREE.Fog(0x1a2c45, 76, 112);
    const glowTex = keep(glowTexture(THREE));
    const blobTex = keep(blobTexture(THREE));
    const rig = createCameraRig(THREE);
    const world = buildWorld(THREE, scene, glowTex, blobTex);
    const overlay = createOverlay(root, overlayHandlers());
    const state = {
      mode: 'off', mood: 'evening', quality: 'high', list: [], hoverHotspot: null, focusHotspot: null, hoverPerson: null,
      width: 1, height: 1, raf: 0, last: 0, t: 0, dirty: true, disposed: false, post: null, follow: false,
      extras: extrasPresent(THREE).ssao ? 'ready' : 'idle',
    };
    const look = createLook(THREE, {
      renderer, scene, rig, glowTex, reduced, lamps: world.lamps, posts: world.posts, trucks: world.traffic.groups,
      focusTarget: () => (state.follow && world.cast.isWalking('assessor') ? world.cast.members.get('assessor').rig.root.position : null),
    });
    Object.values(PEOPLE).forEach((p) => { if (p.id !== 'assessor') overlay.ensureTag(p.id, p.name, p.role); });
    const input = createInput(THREE, canvas, {
      camera: rig.camera,
      targets: () => [...world.hotspots.pickables(), ...world.cast.pickables()],
      isInteractive: () => state.mode === 'explore',
      onHover: (hit) => setPointerHover(hit),
      onPick: (hit) => pick(hit),
      onPan: (dx, dy) => { rig.pan(dx, dy); invalidate(); },
      onZoom: (f) => { rig.zoom(f); invalidate(); },
    });

    const v = new THREE.Vector3();
    const head = new THREE.Vector3();

    function overlayHandlers() {
      return {
        onActivate: (id) => onActivate(id),
        onFocus: (id) => { state.focusHotspot = id; highlight(); ensureVisible(id); },
        onBlur: (id) => { if (state.focusHotspot === id) state.focusHotspot = null; highlight(); },
        onEnter: (id) => { state.hoverHotspot = id; highlight(); },
        onLeave: (id) => { if (state.hoverHotspot === id) state.hoverHotspot = null; highlight(); },
      };
    }

    function setPointerHover(hit) {
      state.hoverHotspot = hit?.hotspot ?? (hit?.person ? hotspotForPerson(hit.person) : null);
      state.hoverPerson = hit?.person ?? null;
      highlight();
    }

    function hotspotForPerson(personId) {
      const anchor = world.cast.anchorOf(personId);
      return state.list.find((h) => h.kind === 'person' && h.anchor === anchor && h.state !== 'hidden')?.id ?? null;
    }

    function pick(hit) {
      const id = hit.hotspot ?? (hit.person ? hotspotForPerson(hit.person) : null);
      if (id) onActivate(id);
    }

    function activeHotspot() {
      return state.focusHotspot || state.hoverHotspot;
    }

    function highlight() {
      const id = activeHotspot();
      world.hotspots.setHover(id);
      overlay.setHover(id);
      if (state.post) {
        const targets = id ? world.hotspots.outlineTargets(id, outlineExtras)
          : state.hoverPerson ? [world.cast.members.get(state.hoverPerson).rig.root] : [];
        state.post.setOutline(targets);
      }
      invalidate();
    }

    function outlineExtras(h) {
      const people = [...world.cast.members.values()].filter((m) => m.anchor === h.anchor && m.id !== 'assessor').map((m) => m.rig.root);
      return [...(world.screensByAnchor.get(h.anchor) || []), ...people];
    }

    function ensureVisible(id) {
      const m = world.hotspots.get(id);
      if (!m) return;
      const p = project(m.icon.position);
      if (!p.onscreen) focusAnchor(m.h.anchor);
    }

    function project(worldPos) {
      v.copy(worldPos).project(rig.camera);
      const x = (v.x + 1) / 2 * state.width;
      const y = (1 - v.y) / 2 * state.height;
      return { x, y, onscreen: Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1 };
    }

    function updateOverlay() {
      if (state.mode !== 'explore') return;
      state.list.forEach((h) => {
        const m = world.hotspots.get(h.id);
        if (!m) return;
        const p = project(m.icon.position);
        const x = Math.min(state.width - EDGE_PAD, Math.max(EDGE_PAD, p.x));
        const y = Math.min(state.height - EDGE_PAD, Math.max(EDGE_PAD, p.y));
        overlay.placeHotspot(h.id, x, y, p.onscreen);
      });
      const assessor = world.cast.members.get('assessor').rig.root.position;
      const active = state.list.find((h) => h.id === activeHotspot());
      world.cast.members.forEach((m, id) => {
        if (id === 'assessor') return;
        const near = m.rig.root.position.distanceTo(assessor) < TAG_NEAR;
        const named = active?.label === PEOPLE[id].name;
        const show = m.rig.root.visible && !named && (state.hoverPerson === id || active?.anchor === m.anchor || near);
        world.cast.headPosition(id, head);
        head.y += 0.36;
        const p = project(head);
        overlay.placeTag(id, p.x, p.y, show && p.onscreen);
      });
      overlay.bubbleIds().forEach((id) => {
        world.cast.headPosition(id, head);
        head.y += 0.5;
        const p = project(head);
        overlay.placeBubble(id, p.x, p.y, p.onscreen);
      });
    }

    function step(dt) {
      state.t += dt;
      state.frame = (state.frame || 0) + 1;
      if (reduced || state.frame % SHADOW_EVERY === 0 || world.cast.isWalking('assessor')) renderer.shadowMap.needsUpdate = true;
      const t = state.t;
      world.cast.update(dt, t, reduced);
      world.hotspots.update(t, reduced);
      if (!reduced) {
        world.effects.update(t, dt, false);
        world.traffic.update(dt);
        world.moods.update(t, false);
        world.lighting.update(t, false);
        if (state.mode === 'backdrop') rig.setDrift(t, 1);
        else if (state.follow && world.cast.isWalking('assessor')) rig.follow(world.cast.members.get('assessor').rig.root.position, dt);
      }
    }

    function render(dt) {
      renderer.info.reset();
      if (state.post) state.post.render(dt);
      else renderer.render(scene, rig.camera);
    }

    function frame(now) {
      state.raf = 0;
      if (state.disposed) return;
      const frameMs = state.last ? now - state.last : 0;
      const dt = state.last ? Math.min(0.05, frameMs / 1000) : 0;
      state.last = now;
      step(dt);
      updateOverlay();
      look.frame(dt, state.t, now, frameMs);
      render(dt);
      state.dirty = false;
      if (reduced) state.last = 0;
      schedule();
    }

    function canRun() {
      return !state.disposed && state.mode !== 'off' && !document.hidden;
    }

    function schedule() {
      if (state.raf || !canRun() || (reduced && !state.dirty)) {
        if (!state.raf) state.last = 0;
        return;
      }
      state.raf = requestAnimationFrame(frame);
    }

    function invalidate() {
      state.dirty = true;
      schedule();
    }

    function resize() {
      const w = Math.max(1, container.clientWidth || window.innerWidth);
      const h = Math.max(1, container.clientHeight || window.innerHeight);
      state.width = w;
      state.height = h;
      renderer.setSize(w, h, false);
      rig.resize(w, h);
      state.post?.setSize(w, h, renderer.getPixelRatio());
      look.setPixelRatio(renderer.getPixelRatio());
      invalidate();
    }

    function buildPost() {
      state.post?.dispose();
      state.post = createPost(THREE, renderer, scene, rig.camera);
      look.attachPost(state.post);
    }

    // SSAO needs extra example scripts: load them in the background and
    // rebuild the composer once they arrive (never blocks, skipped on failure).
    function requestExtras() {
      if (state.extras !== 'idle') return;
      state.extras = 'loading';
      loadExtras(THREE).then((r) => {
        state.extras = r.ssao ? 'ready' : 'failed';
        if (state.disposed || !r.ssao || state.quality !== 'high' || !state.post || state.post.features().ssaoLoaded) return;
        buildPost();
        resize();
        highlight();
      });
    }

    function focusAnchor(anchorId, opts = {}) {
      const a = ANCHORS[anchorId];
      if (!a) return Promise.resolve();
      return rig.focus(a.pos[0] * 0.75 + a.stand[0] * 0.25, 0.6, a.pos[1] * 0.75 + a.stand[1] * 0.25, { instant: reduced || opts.instant, span: opts.span });
    }

    function setQuality(q) {
      state.quality = q === 'low' ? 'low' : 'high';
      const high = state.quality === 'high';
      renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio || 1, MAX_DPR) : 1);
      world.lighting.setShadowSize(high ? 1024 : 512);
      look.setQuality(state.quality);
      if (high && postAvailable(THREE)) {
        if (!state.post) buildPost();
        else look.attachPost(state.post);
        requestExtras();
      }
      if (!high && state.post) { state.post.dispose(); state.post = null; look.attachPost(null); }
      resize();
      highlight();
    }

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container); else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', schedule);
    const onContextLost = (e) => { e.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', onContextLost);

    rig.setView('overview', { instant: true });
    world.lighting.setMood('evening', renderer);

    return {
      overlay,
      get camera() { return rig.camera; },
      invalidate,
      setQuality,
      get quality() { return state.quality; },
      setMode(mode) {
        state.mode = mode;
        root.dataset.mode = mode;
        overlay.setInteractive(mode === 'explore');
        look.setMode(mode);
        world.hotspots.setVisible(mode === 'explore');
        if (mode !== 'backdrop') rig.setDrift(0, 0);
        if (mode !== 'explore') { state.hoverHotspot = null; state.hoverPerson = null; highlight(); }
        if (mode === 'off' && state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        invalidate();
      },
      setMood(mood) {
        state.mood = MOODS[mood] ? mood : 'evening';
        const params = world.lighting.setMood(state.mood, renderer);
        world.moods.set(state.mood);
        world.effects.setMood(state.mood);
        look.setMood(state.mood, params);
        world.pools.forEach((mesh, tag) => {
          const k = tag === 'lamp' ? params.pools : tag === 'screen' ? params.screen : 1;
          mesh.material.opacity = mesh.userData.baseOpacity * k;
        });
        invalidate();
      },
      setView(id, opts = {}) {
        const p = rig.setView(id, { instant: reduced || opts.instant });
        invalidate();
        return p;
      },
      focus(anchorId, opts) {
        const p = focusAnchor(anchorId, opts);
        invalidate();
        return p;
      },
      setHotspots(list) {
        state.list = list.filter((h) => h && ANCHORS[h.anchor] && h.state !== 'hidden');
        world.hotspots.set(state.list);
        overlay.setHotspots(state.list);
        highlight();
      },
      walk(id, anchor, opts) {
        state.follow = id === 'assessor';
        const p = world.cast.walk(id, anchor, opts);
        invalidate();
        return p.then(() => { invalidate(); });
      },
      setPerson(id, opts) {
        const p = world.cast.setPerson(id, opts);
        invalidate();
        return p.then(() => { invalidate(); });
      },
      stats() {
        const { calls, triangles } = renderer.info.render;
        const drawables = {};
        scene.traverseVisible((o) => {
          if (!o.isMesh && !o.isPoints && !o.isSprite) return;
          if (o.material?.visible === false) return;
          const key = o.parent?.name || o.parent?.type || 'scene';
          drawables[key] = (drawables[key] || 0) + 1;
        });
        return {
          calls, triangles, programs: renderer.info.programs?.length ?? 0, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries,
          post: Boolean(state.post), quality: state.quality, reduced, extras: state.extras, ...look.stats(), drawables,
        };
      },
      setReduced(on) {
        reduced = Boolean(on);
        look.setReduced(reduced);
        invalidate();
      },
      setAdaptive(on) { look.setAdaptive(on); },
      personState(id) { return world.cast.members.get(id)?.anim.state ?? null; },
      say(id, name, text, ms) { overlay.bubble(id, name, text, ms); invalidate(); },
      setClock(minutes) { world.effects.setClock(minutes); invalidate(); },
      anchorScreen(anchorId) {
        const a = ANCHORS[anchorId];
        const p = project(v.set(a.pos[0], a.marker, a.pos[1]).clone());
        const r = container.getBoundingClientRect();
        return { x: r.left + p.x, y: r.top + p.y, visible: p.onscreen && state.mode !== 'off' };
      },
      dispose() {
        state.disposed = true;
        if (state.raf) cancelAnimationFrame(state.raf);
        rig.dispose();
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', schedule);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        input.dispose();
        overlay.dispose();
        look.dispose();
        world.dispose();
        state.post?.dispose();
        disposeTree(scene);
        textures.forEach((t) => t.dispose());
        renderer.dispose();
        renderer.forceContextLoss?.();
        root.remove();
      },
      start: resize,
    };
  }
}

function buildWorld(THREE, scene, glowTex, blobTex) {
  const statics = new THREE.Group();
  statics.name = 'office';
  scene.add(statics);
  const kit = createKit(THREE);
  buildOffice(kit);
  const posts = buildStreet(kit);
  const built = finalizeKit(THREE, kit, statics, { glowTex });
  const traffic = createTraffic(THREE, scene, glowTex);
  const lighting = createLighting(THREE, scene, kit.lamps);
  const moods = createMoodProps(THREE, scene, glowTex);
  const effects = createEffects(THREE, scene, { glowTex, screens: built.screens, halos: built.halos, lamps: kit.lamps });
  const cast = createCast(THREE, scene, { shadowTex: blobTex });
  const hotspots = createHotspots(THREE, scene, glowTex);
  return {
    traffic, lighting, moods, effects, cast, hotspots, posts,
    lamps: kit.lamps,
    pools: built.pools,
    screensByAnchor: screensNearAnchors(built.screens),
    dispose() {
      hotspots.dispose();
      cast.dispose();
      traffic.dispose();
      lighting.dispose();
    },
  };
}

// Screen meshes that belong to a document prop (within reach of its anchor).
function screensNearAnchors(screens) {
  const map = new Map();
  const all = [...screens.values()].flat().filter((s) => s.spec.tag !== 'slides');
  Object.entries(ANCHORS).forEach(([id, a]) => {
    const near = all.filter((s) => Math.hypot(s.spec.pos[0] - a.pos[0], s.spec.pos[2] - a.pos[1]) < 1.3).map((s) => s.mesh);
    if (near.length) map.set(id, near);
  });
  return map;
}
