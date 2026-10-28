// Game audio: WebAudio synthesis only, no files. Off until the player turns it
// on; the choice is remembered. Every call is safe when WebAudio is missing.

const STORE_KEY = 'rotasa-sound-v1';
const MASTER_VOLUME = 0.22;
const TICK_MIN_GAP_MS = 2200;
const TICK_MAX_GAP_MS = 7000;

let ctx = null;
let master = null;
let volume = 1;
let noiseBuffer = null;
let on = readPref();
let wantedAmbience = 'none';
let ambienceNodes = [];
let tickTimer = null;

function readPref() {
  try {
    return localStorage.getItem(STORE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writePref(value) {
  try {
    localStorage.setItem(STORE_KEY, value ? 'on' : 'off');
  } catch {
    // Storage unavailable (private window): the setting lasts for this visit.
  }
}

// Creates the context lazily; browsers only let it run after a user gesture.
function context() {
  if (!on) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME * volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function noise(ac) {
  if (noiseBuffer) return noiseBuffer;
  const length = ac.sampleRate * 2;
  noiseBuffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// One enveloped voice: an oscillator or a noise burst through a filter.
function voice(ac, { type = 'sine', freq = 440, to, filter, q = 1, fq = 1200, gain = 0.2, attack = 0.005, dur = 0.1, at = 0, dest = master }) {
  const t0 = ac.currentTime + at;
  const src = type === 'noise' ? ac.createBufferSource() : ac.createOscillator();
  if (type === 'noise') {
    src.buffer = noise(ac);
  } else {
    src.type = type;
    src.frequency.setValueAtTime(freq, t0);
    if (to) src.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  }
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + dur);
  let head = src;
  if (filter) {
    const f = ac.createBiquadFilter();
    f.type = filter;
    f.frequency.value = fq;
    f.Q.value = q;
    src.connect(f);
    head = f;
  }
  head.connect(env).connect(dest);
  src.start(t0, type === 'noise' ? Math.random() : 0);
  src.stop(t0 + attack + dur + 0.05);
}

const SOUNDS = {
  click: (ac) => voice(ac, { freq: 1900, to: 1300, gain: 0.12, dur: 0.035 }),
  pick: (ac) => {
    voice(ac, { type: 'noise', filter: 'bandpass', fq: 2600, q: 0.9, gain: 0.22, attack: 0.01, dur: 0.09 });
    voice(ac, { type: 'noise', filter: 'bandpass', fq: 3800, q: 1.2, gain: 0.14, attack: 0.01, dur: 0.07, at: 0.08 });
  },
  stamp: (ac) => {
    voice(ac, { freq: 140, to: 48, gain: 0.5, dur: 0.22 });
    voice(ac, { type: 'noise', filter: 'lowpass', fq: 500, gain: 0.35, dur: 0.08 });
  },
  alarm: (ac) => {
    [0, 0.22, 0.44, 0.66].forEach((at, i) => voice(ac, {
      type: 'triangle', freq: i % 2 ? 660 : 880, gain: 0.16, attack: 0.01, dur: 0.17, at,
    }));
  },
  chapter: (ac) => swell(ac),
};

function swell(ac) {
  const t0 = ac.currentTime;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, t0);
  filter.frequency.exponentialRampToValueAtTime(900, t0 + 0.9);
  filter.frequency.exponentialRampToValueAtTime(160, t0 + 2.4);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(0.28, t0 + 0.8);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
  filter.connect(env).connect(master);
  [55, 55.6, 82.4].forEach((freq) => {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + 2.7);
  });
}

/** Plays a short interface sound: 'click' | 'pick' | 'stamp' | 'alarm' | 'chapter'. */
export function ui(kind) {
  const ac = context();
  const play = SOUNDS[kind];
  if (!ac || !play) return;
  try {
    play(ac);
  } catch {
    // A failed sound is never worth breaking the game for.
  }
}

// ---------- ambience ----------

function hum(ac) {
  const src = ac.createBufferSource();
  src.buffer = noise(ac);
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.09, ac.currentTime + 1.5);
  src.connect(filter).connect(gain).connect(master);
  src.start();
  return [src, gain];
}

// A slow, distant two-tone pulse for the staging outage.
function alarmPulse(ac) {
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 520;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.45;
  const depth = ac.createGain();
  depth.gain.value = 0.025;
  const gain = ac.createGain();
  gain.gain.value = 0.025;
  lfo.connect(depth).connect(gain.gain);
  osc.connect(gain).connect(master);
  osc.start();
  lfo.start();
  return [osc, lfo, gain];
}

function scheduleTicks() {
  const gap = TICK_MIN_GAP_MS + Math.random() * (TICK_MAX_GAP_MS - TICK_MIN_GAP_MS);
  tickTimer = window.setTimeout(() => {
    const ac = context();
    if (ac && wantedAmbience !== 'none') {
      const count = 3 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i += 1) {
        voice(ac, { type: 'noise', filter: 'highpass', fq: 3200, gain: 0.05, attack: 0.002, dur: 0.018, at: i * (0.09 + Math.random() * 0.08) });
      }
    }
    scheduleTicks();
  }, gap);
}

function stopAmbience() {
  window.clearTimeout(tickTimer);
  tickTimer = null;
  ambienceNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      node.disconnect();
    } catch {
      // Already stopped.
    }
  });
  ambienceNodes = [];
}

function startAmbience(kind) {
  const ac = context();
  if (!ac || kind === 'none') return;
  try {
    ambienceNodes = hum(ac);
    if (kind === 'outage') ambienceNodes = [...ambienceNodes, ...alarmPulse(ac)];
    scheduleTicks();
  } catch {
    stopAmbience();
  }
}

/** Sets the background loop: 'office' | 'outage' | 'none'. Remembered while sound is off. */
export function ambience(kind = 'none') {
  const next = ['office', 'outage'].includes(kind) ? kind : 'none';
  if (next === wantedAmbience && ambienceNodes.length) return;
  wantedAmbience = next;
  stopAmbience();
  if (on) startAmbience(next);
}

// ---------- on / off ----------

/** Turns sound on. Call it from a click or key handler (a user gesture). */
export function enable() {
  on = true;
  writePref(true);
  if (!context()) return;
  stopAmbience();
  startAmbience(wantedAmbience);
}

export function disable() {
  on = false;
  writePref(false);
  stopAmbience();
  if (ctx) ctx.suspend().catch(() => {});
}

export function isOn() {
  return on;
}

// A saved "on" still needs a gesture before the browser lets audio play.
function unlockOnGesture() {
  const unlock = () => {
    if (on && context()) startAmbienceIfIdle();
  };
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
  window.addEventListener('keydown', unlock, { once: true, capture: true });
}

function startAmbienceIfIdle() {
  if (!ambienceNodes.length) startAmbience(wantedAmbience);
}

function onVisibility() {
  if (!ctx || !on) return;
  if (document.hidden) ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
}

if (typeof window !== 'undefined') {
  unlockOnGesture();
  document.addEventListener('visibilitychange', onVisibility);
}

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0));
  if (master) master.gain.value = MASTER_VOLUME * volume;
}

export const audio = { enable, disable, isOn, ui, ambience, setVolume };
export default audio;
