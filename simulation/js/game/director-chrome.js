// The director's chrome: HUD rendering, the evidence bag, the sound toggle,
// the pause menu and the Escape key (closes the dossier before pausing).
import { STEP_TITLES } from '../ui/components.js';
import { renderHud } from './hud.js';
import { showPause, bindPauseKey, canPause } from './shell.js';
import { setSetting } from './settings.js';
import { isOn as soundIsOn } from './audio.js';
import { showTrophies } from './trophies.js';
import { showBag } from './docs.js';

/**
 * createChrome({ store, dossier, openDossier, closeDossier, objective(state), onHelp, onTitle, canShowHud })
 * -> { renderHud(state|null), pause(), bindKeys() }
 */
export function createChrome(opts) {
  const slot = document.getElementById('hud-slot');

  function handlers(state) {
    return {
      onOpenDossier: () => opts.openDossier(),
      onOpenBag: () => showBag(opts.store.get(), { onOpenDossier: opts.openDossier }),
      onToggleSound: () => setSetting('sound', !soundIsOn()),
      onHelp: opts.onHelp,
      objective: opts.objective(state),
    };
  }

  // The HUD is rebuilt on every change; keyboard focus goes back to the same tool.
  function paint(state) {
    if (!slot) return;
    if (!state || !opts.canShowHud()) {
      slot.replaceChildren();
      return;
    }
    const focused = slot.contains(document.activeElement) ? [...document.activeElement.classList].find((c) => c.startsWith('g-hud-') && c !== 'g-hud-panel' && c !== 'g-hud-btn') : null;
    slot.replaceChildren(renderHud(state, handlers(state)));
    if (focused) slot.querySelector(`.${focused}`)?.focus({ preventScroll: true });
  }

  function chapterLabel(state) {
    return state.step === 0 ? 'Prologue · Briefing' : `Chapter ${state.step} · ${STEP_TITLES[state.step]}`;
  }

  function pauseOptions() {
    const state = opts.store.get();
    return {
      chapterLabel: chapterLabel(state),
      onResume: () => {},
      onDossier: () => opts.openDossier(),
      onTrophies: () => showTrophies(opts.store.get()),
      onTitle: () => opts.onTitle(),
    };
  }

  function bindKeys() {
    // Registered before the pause key, so Escape first closes an open dossier.
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.repeat || !opts.dossier.isOpen() || opts.dossier.isPinned() || !canPause()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      opts.closeDossier();
    }, true);
    bindPauseKey(() => (opts.canShowHud() ? pauseOptions() : null));
  }

  return {
    renderHud: paint,
    pause: () => showPause(pauseOptions()),
    bindKeys,
  };
}
