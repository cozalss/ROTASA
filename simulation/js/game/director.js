// The director: boots the game (loading → title → chapter), owns the world,
// the HUD and the dossier, and plays the chapter transitions. Chapters stage
// the world through ctx (docs/CHAPTER-CONTRACT.md); the state model is the
// store's, shared with the dossier screens.
import { createStore, createInitialState, goToStep } from '../store.js';
import { STEP_TITLES } from '../ui/components.js';
import { getWorld } from '../world/world.js';
import { mountAmbient } from '../fx/ambient.js';
import { openDialogue } from './dialogue.js';
import { showChapter } from './chapter.js';
import { toast } from './toast.js';
import { audio } from './audio.js';
import { showLoading, showTitle } from './shell.js';
import { applySettings, getSettings, onSettingsChange } from './settings.js';
import { showTrophies, notifyNewAchievements, markAnnounced } from './trophies.js';
import { createDossier } from './dossier.js';
import { createPointer } from './pointer.js';
import { showRecap, setCta } from './cues.js';
import { closeTalk } from './talk.js';
import { openDoc } from './docs.js';
import { hasSavedGame, loadSaved, save } from './save.js';
import * as mentorBridge from './mentor-bridge.js';
import { createChrome } from './director-chrome.js';
import { loadChapter, cardFor, objectiveOf } from './chapters/index.js';
import { chapterSummary } from '../logic/summary.js';
import { SCREENS } from './screens.js';

const FONT_TIMEOUT_MS = 3000;

function safely(fn) {
  try { return fn(); } catch { return undefined; }
}

export function createDirector() {
  const world = getWorld();
  const hot = window.claude?.hot?.data?.state;
  const hadSave = hasSavedGame();
  const store = createStore(hot ?? loadSaved() ?? createInitialState());
  window.claude?.hot?.snapshot?.(() => ({ state: store.get() }));

  const st = { active: null, syncing: false, inTitle: true, worldMode: 'explore', prev: store.get(), closeTitle: null };
  const go = (step) => store.update((s) => goToStep(s, step));

  // ---------- world, with the dossier owning the mode while it is open ----------
  const worldProxy = Object.freeze({
    ...world,
    setMode(mode) {
      st.worldMode = mode;
      if (!dossier.isOpen()) world.setMode(mode);
    },
  });

  const screenCtx = {
    update: (fn, opts) => store.update(fn, opts),
    go,
    openDoc,
    reset: () => newGame(),
  };

  const dossier = createDossier({
    screens: SCREENS,
    screenCtx,
    objectiveOf: (state) => objectiveOf(st.active?.mod, state),
    onGo: go,
    onClose: () => closeDossier(),
    onMenu: () => chrome.pause(),
    onRendered: (root) => mentorBridge.decorate(root),
  });

  function openDossier() {
    if (!dossier.isOpen() && world.isAvailable()) world.setMode('backdrop');
    dossier.open(store.get());
    chrome.renderHud(store.get());
  }

  function closeDossier() {
    if (!dossier.isOpen() || dossier.isPinned()) return;
    dossier.close();
    if (world.isAvailable()) world.setMode(st.worldMode);
    chrome.renderHud(store.get());
  }

  const pointer = createPointer(world, () => !dossier.isOpen() && document.body.dataset.world === 'explore');

  const ctx = Object.freeze({
    store: Object.freeze({ get: store.get, update: store.update, subscribe: store.subscribe }),
    world: worldProxy,
    go,
    dossier: Object.freeze({ open: openDossier, close: closeDossier, isOpen: () => dossier.isOpen() }),
    dialogue: openDialogue,
    toast,
    audio,
    mentor: (step, opts) => mentorBridge.mentor(step, opts),
    tip: (id, text) => mentorBridge.tip(id, text),
    openDoc,
    pointTo: (anchor) => pointer.pointTo(anchor),
    cta: setCta,
    refresh: () => chrome.renderHud(store.get()),
  });

  const chrome = createChrome({
    store,
    dossier,
    openDossier,
    closeDossier,
    objective: (state) => objectiveOf(st.active?.mod, state),
    onHelp: () => { if (st.active) mentorBridge.mentor(st.active.step, { force: true }); },
    onTitle: () => quitToTitle(),
    canShowHud: () => !st.inTitle,
  });

  // ---------- chapters ----------
  function leaveChapter() {
    const leaving = st.active;
    st.active = null;
    if (leaving) safely(() => leaving.mod.exit(ctx));
    closeTalk();
    setCta(null);
    pointer.pointTo(null);
    world.setHotspots([]);
    closeDossier();
  }

  async function playTransition(from, to) {
    if (from !== null && to > from) {
      const kicker = from === 0 ? 'Prologue complete' : `Chapter ${from} complete`;
      await showRecap({ kicker, line: chapterSummary(store.get(), from) });
    }
    const mod = await loadChapter(to);
    if (store.get().step !== to || st.inTitle) return null;
    await showChapter(cardFor(mod, to));
    return store.get().step === to && !st.inTitle ? mod : null;
  }

  async function syncChapter() {
    if (st.syncing || st.inTitle) return;
    st.syncing = true;
    try {
      while (!st.inTitle && st.active?.step !== store.get().step) {
        const from = st.active ? st.active.step : null;
        const to = store.get().step;
        leaveChapter();
        const mod = await playTransition(from, to);
        if (!mod) continue;
        st.active = { step: to, mod };
        audio.ambience('office');
        safely(() => mod.enter(ctx));
        chrome.renderHud(store.get());
        dossier.render(store.get());
      }
    } finally {
      st.syncing = false;
    }
  }

  function onState(next) {
    notifyNewAchievements(st.prev, next);
    st.prev = next;
    save(next);
    if (st.inTitle) return;
    chrome.renderHud(next);
    dossier.render(next);
    if (st.active && st.active.step === next.step) safely(() => st.active.mod.update(next, ctx));
    else syncChapter();
  }

  // ---------- title ----------
  function stageTitleWorld() {
    world.setHotspots([]);
    world.setMood('evening');
    world.setView('street', { instant: true });
    world.setMode(world.isAvailable() ? 'explore' : 'off');
  }

  function saveLabel(state) {
    return state.step === 0 ? 'Prologue · Briefing' : `Chapter ${state.step} · ${STEP_TITLES[state.step]}`;
  }

  function startPlaying() {
    st.inTitle = false;
    st.closeTitle?.();
    st.closeTitle = null;
    chrome.renderHud(store.get());
    dossier.render(store.get());
    syncChapter();
  }

  function newGame() {
    leaveChapter();
    mentorBridge.resetTips();
    st.inTitle = false;
    st.closeTitle?.();
    st.closeTitle = null;
    st.prev = createInitialState();
    store.replace(createInitialState());
    syncChapter();
  }

  function title(hasSave) {
    st.inTitle = true;
    chrome.renderHud(null);
    stageTitleWorld();
    audio.ambience('none');
    st.closeTitle = showTitle({
      hasSave,
      saveLabel: saveLabel(store.get()),
      onContinue: startPlaying,
      onNewGame: newGame,
      onTrophies: () => showTrophies(store.get()),
    });
  }

  function quitToTitle() {
    leaveChapter();
    title(true);
  }

  // ---------- boot ----------
  function mountWorld() {
    world.mount(document.getElementById('world-layer'));
    if (world.isAvailable()) return;
    world.setMode('off');
    document.body.classList.add('world-off');
    dossier.setPinned(true, store.get());
  }

  function syncDesignerNotes() {
    document.body.classList.toggle('designer-on', getSettings().designerNotes);
  }

  async function boot() {
    document.body.classList.add('is-game');
    await safely(() => applySettings());
    syncDesignerNotes();
    onSettingsChange((_s, key) => { if (key === 'designerNotes') syncDesignerNotes(); if (key === 'sound') chrome.renderHud(store.get()); });
    mountAmbient();
    mountWorld();
    markAnnounced(store.get());
    store.subscribe(onState);
    chrome.bindKeys();
    const worldReady = new Promise((resolve) => world.onReady(resolve));
    const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => window.setTimeout(r, FONT_TIMEOUT_MS))]);
    stageTitleWorld();
    await showLoading({ label: 'Preparing the office', tasks: [fonts, worldReady, mentorBridge.loadMentor()] });
    if (hot) startPlaying();
    else title(hadSave);
  }

  return { boot, store, world };
}
