// Public world API (docs/GAME-CONTRACT.md). A singleton facade over the engine:
// it remembers mode/mood/hotspots set before mounting, and every call is a
// harmless no-op (or a resolved promise) when THREE or WebGL is unavailable.
//
//   const world = getWorld();
//   world.mount(document.getElementById('world-layer'));
//   world.setMode('explore'); world.setMood('evening'); world.setView('overview');
//   world.setHotspots(list, (id) => …); await world.walkTo('qa-desk');
import { ANCHORS, VIEWS } from './anchors.js';
import { PEOPLE } from './people.js';
import { prefersReducedMotion } from '../fx/motion.js';
import { postAvailable } from './post.js';
import { createEngine } from './engine.js';

const MODES = ['explore', 'backdrop', 'off'];
const WATCHDOG_MS = 1000;
const SAY_MS_PER_CHAR = 55;
const SAY_MIN_MS = 1800;

let instance = null;

export function getWorld() {
  if (!instance) instance = createWorld();
  return instance;
}

function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function threeReady() {
  const T = window.THREE;
  return Boolean(T && typeof T.WebGLRenderer === 'function');
}

function autoQuality() {
  const dpr = window.devicePixelRatio || 1;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (dpr > 2 || small || !postAvailable(window.THREE)) return 'low';
  return 'high';
}

function parseClock(value) {
  if (typeof value === 'number') return value;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function safely(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

function createWorld() {
  let engine = null;
  let container = null;
  let failed = false;
  let watchdog = 0;
  let ready = false;
  const readyCbs = [];
  const s = { mode: 'off', mood: 'evening', view: 'overview', list: [], onPick: null, quality: null, clock: null, people: new Map(), sayToken: new Map() };

  const available = () => !failed && threeReady() && webglSupported();

  function markReady() {
    if (ready) return;
    ready = true;
    readyCbs.splice(0).forEach((cb) => safely(() => cb(api)));
  }

  function setBodyMode(mode) {
    if (document.body) document.body.dataset.world = mode;
  }

  // html[data-motion] (the in-game setting) wins over the OS preference; both can change live.
  let motionWatch = null;
  function watchMotion() {
    if (motionWatch) return;
    const update = () => { if (engine) safely(() => engine.setReduced(prefersReducedMotion())); };
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(update) : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    mq?.addEventListener?.('change', update);
    motionWatch = () => { mo?.disconnect(); mq?.removeEventListener?.('change', update); };
  }

  function teardown() {
    clearInterval(watchdog);
    watchdog = 0;
    motionWatch?.();
    motionWatch = null;
    if (engine) safely(() => engine.dispose());
    engine = null;
  }

  function onLost() {
    failed = true;
    teardown();
  }

  function pick(id) {
    const h = s.list.find((x) => x.id === id);
    if (!h || h.state === 'hidden' || !s.onPick) return;
    safely(() => s.onPick(id));
  }

  // Mood 'outage' makes everyone at work stressed; explicit states win otherwise.
  function effectiveState(id, state) {
    if (s.mood === 'outage' && id !== 'assessor' && (state === 'idle' || state === 'typing')) return 'stressed';
    return state;
  }

  function personBaseState(id) {
    return s.people.get(id)?.state ?? PEOPLE[id]?.state ?? 'idle';
  }

  function applyMoodToPeople() {
    if (!engine) return;
    Object.keys(PEOPLE).forEach((id) => {
      if (id === 'assessor') return;
      const cur = engine.personState(id);
      if (cur === 'walking' || cur === 'away' || cur === 'talking') return;
      engine.setPerson(id, { state: effectiveState(id, personBaseState(id)) });
    });
  }

  function applyAll() {
    engine.setQuality(s.quality || autoQuality());
    engine.setMood(s.mood);
    engine.setHotspots(s.list);
    s.people.forEach((opts, id) => engine.setPerson(id, { ...opts, state: effectiveState(id, opts.state ?? personBaseState(id)) }));
    applyMoodToPeople();
    if (s.clock != null) engine.setClock(s.clock);
    engine.setView(s.view, { instant: true });
    engine.setMode(s.mode);
  }

  const api = {
    mount(el) {
      if (!el) return api;
      if (engine && container === el) return api;
      if (engine) teardown();
      container = el;
      if (!available()) {
        failed = !threeReady() || !webglSupported() || failed;
        markReady();
        return api;
      }
      try {
        engine = createEngine(el, window.THREE, { reduced: prefersReducedMotion(), onLost, onActivate: pick });
      } catch {
        engine = null;
        failed = true;
      }
      if (engine) {
        applyAll();
        if (s.adaptive === false) engine.setAdaptive(false);
        watchMotion();
        engine.start();
        watchdog = setInterval(() => { if (!el.isConnected) teardown(); }, WATCHDOG_MS);
      }
      markReady();
      return api;
    },
    isAvailable() {
      return engine ? true : available() && !container;
    },
    setMode(mode) {
      s.mode = MODES.includes(mode) ? mode : 'off';
      setBodyMode(s.mode);
      if (engine) engine.setMode(s.mode);
    },
    setView(viewId, { instant = false } = {}) {
      if (!VIEWS[viewId]) return Promise.resolve();
      s.view = viewId;
      return engine ? engine.setView(viewId, { instant }) : Promise.resolve();
    },
    setMood(mood) {
      s.mood = ['evening', 'outage', 'after-good', 'after-bad'].includes(mood) ? mood : 'evening';
      if (!engine) return;
      engine.setMood(s.mood);
      applyMoodToPeople();
    },
    setHotspots(list, onPick) {
      s.list = Array.isArray(list) ? list.map((h) => ({ ...h })) : [];
      if (typeof onPick === 'function') s.onPick = onPick;
      if (engine) engine.setHotspots(s.list);
    },
    walkTo(anchor) {
      if (!engine || !ANCHORS[anchor]) return Promise.resolve();
      return engine.walk('assessor', anchor, {});
    },
    focus(anchor) {
      if (!engine || !ANCHORS[anchor]) return;
      engine.focus(anchor);
    },
    screenPosition(anchor) {
      if (!engine || !ANCHORS[anchor]) return { x: 0, y: 0, visible: false };
      return engine.anchorScreen(anchor);
    },
    onReady(cb) {
      if (typeof cb !== 'function') return;
      if (ready) queueMicrotask(() => safely(() => cb(api)));
      else readyCbs.push(cb);
    },
    setPerson(id, { anchor, state, facing } = {}) {
      if (!PEOPLE[id]) return Promise.resolve();
      const prev = s.people.get(id) || {};
      const next = { ...prev, ...(anchor ? { anchor } : {}), ...(state ? { state } : {}), ...(facing != null ? { facing } : {}) };
      s.people.set(id, next);
      if (!engine) return Promise.resolve();
      const eff = state ? effectiveState(id, state) : undefined;
      return engine.setPerson(id, { anchor, state: eff, facing });
    },
    say(id, text, ms) {
      if (!PEOPLE[id] || !text) return;
      const str = String(text);
      const dur = Number.isFinite(ms) && ms > 0 ? ms : Math.max(SAY_MIN_MS, str.length * SAY_MS_PER_CHAR);
      if (!engine) return;
      engine.say(id, PEOPLE[id].name, str, dur);
      const before = engine.personState(id);
      if (before === 'walking' || before === 'away') return;
      const token = {};
      s.sayToken.set(id, token);
      engine.setPerson(id, { state: 'talking' });
      setTimeout(() => {
        if (s.sayToken.get(id) !== token || !engine) return;
        s.sayToken.delete(id);
        if (engine.personState(id) === 'talking') engine.setPerson(id, { state: effectiveState(id, personBaseState(id)) });
      }, dur);
    },
    // Extras beyond the contract (safe to ignore).
    setQuality(q) {
      s.quality = q === 'low' ? 'low' : 'high';
      if (engine) engine.setQuality(s.quality);
    },
    getQuality() { return engine ? engine.quality : 'off'; },
    // Adaptive quality (on by default): steps effects down when frames get slow on 'high'.
    setAdaptive(on) {
      s.adaptive = Boolean(on);
      if (engine) engine.setAdaptive(s.adaptive);
    },
    getStats() { return engine ? engine.stats() : null; },
    setClock(time) {
      const minutes = parseClock(time);
      if (minutes == null) return;
      s.clock = minutes;
      if (engine) engine.setClock(minutes);
    },
    unmount() {
      teardown();
      container = null;
    },
  };
  return api;
}
