// Optional r128 example scripts, injected at runtime so the boot never waits
// for them. Each feature is a group of scripts loaded in order; when any
// script of a group fails (network, CSP, timeout) the feature is skipped and
// the world keeps rendering without it. The promise is shared by all callers.
//
// CSP: the page needs script-src https://cdn.jsdelivr.net for these to load.

const BASE = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
const TIMEOUT_MS = 8000;

// feature -> { present(THREE): already loaded?, files: in dependency order }
const FEATURES = {
  ssao: {
    present: (T) => Boolean(T.SSAOPass && T.SSAOShader && T.SimplexNoise),
    files: ['math/SimplexNoise.js', 'shaders/SSAOShader.js', 'postprocessing/SSAOPass.js'],
  },
};

const scripts = new Map();
let shared = null;

function loadScript(src) {
  if (scripts.has(src)) return scripts.get(src);
  const p = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    let timer = 0;
    const done = (ok) => {
      clearTimeout(timer);
      el.onload = null;
      el.onerror = null;
      if (ok) resolve();
      else {
        el.remove();
        scripts.delete(src);
        reject(new Error(`extra script failed: ${src}`));
      }
    };
    el.src = src;
    el.async = false;
    el.crossOrigin = 'anonymous';
    el.onload = () => done(true);
    el.onerror = () => done(false);
    timer = setTimeout(() => done(false), TIMEOUT_MS);
    document.head.append(el);
  });
  scripts.set(src, p);
  return p;
}

async function loadFeature(THREE, feature) {
  if (feature.present(THREE)) return true;
  if (typeof THREE.Pass !== 'function') return false;
  try {
    for (const file of feature.files) await loadScript(BASE + file);
  } catch {
    return false;
  }
  return feature.present(THREE);
}

// Resolves to { ssao: boolean }; never rejects.
export function loadExtras(THREE) {
  if (shared) return shared;
  const entries = Object.entries(FEATURES);
  shared = Promise.all(entries.map(([, f]) => loadFeature(THREE, f).catch(() => false)))
    .then((oks) => Object.fromEntries(entries.map(([id], i) => [id, oks[i]])));
  return shared;
}

// Synchronous view of what is usable right now (for the first post build).
export function extrasPresent(THREE) {
  return Object.fromEntries(Object.entries(FEATURES).map(([id, f]) => [id, f.present(THREE)]));
}
