// The settings panel: switches, a volume slider and segmented choices.
// Native radios and range inputs give full keyboard support for free.
import { h } from '../ui/dom.js';
import { openPanel } from './panel.js';
import { ui as sound } from './audio.js';
import { getSettings, setSetting, onSettingsChange } from './settings.js';
import { translate as t, LANGUAGES, getLang, setLang } from '../i18n/i18n.js';

const PERCENT = 100;

function row(label, help, control, id) {
  return h('div', { class: 'sh-set-row' },
    h('div', { class: 'sh-set-text' },
      h('span', { class: 'sh-set-label', id }, label),
      help ? h('span', { class: 'sh-set-help' }, help) : null),
    h('div', { class: 'sh-set-control' }, control));
}

function toggle(key, labelId) {
  const btn = h('button', {
    type: 'button', role: 'switch', class: 'sh-switch', 'aria-labelledby': labelId,
    onClick: () => {
      setSetting(key, !getSettings()[key]);
      sound('click');
    },
  }, h('span', { class: 'sh-switch-track', 'aria-hidden': 'true' }, h('span', { class: 'sh-switch-knob' })),
  h('span', { class: 'sh-switch-state', 'aria-hidden': 'true' }));
  const sync = (s) => {
    btn.setAttribute('aria-checked', String(Boolean(s[key])));
    btn.lastChild.textContent = t(s[key] ? 'On' : 'Off');
  };
  return { el: btn, sync };
}

function segmented(key, options, labelId) {
  const name = `sh-set-${key}`;
  const inputs = options.map(([value]) => h('input', {
    type: 'radio', name, value, class: 'sh-seg-input', id: `${name}-${value}`,
    onChange: () => { setSetting(key, value); sound('click'); },
  }));
  const el = h('div', { class: 'sh-seg', role: 'radiogroup', 'aria-labelledby': labelId },
    options.map(([value, text], i) => [inputs[i], h('label', { class: 'sh-seg-label', for: `${name}-${value}` }, text)]));
  const sync = (s) => inputs.forEach((input) => { input.checked = input.value === s[key]; });
  return { el, sync };
}

// Switching language reloads the page; the save survives in localStorage.
function languagePicker(labelId) {
  const name = 'sh-set-language';
  return h('div', { class: 'sh-seg', role: 'radiogroup', 'aria-labelledby': labelId },
    LANGUAGES.map(({ id, label }) => [
      h('input', {
        type: 'radio', name, value: id, class: 'sh-seg-input', id: `${name}-${id}`, checked: id === getLang(),
        onChange: () => { sound('click'); setLang(id); },
      }),
      h('label', { class: 'sh-seg-label', for: `${name}-${id}`, lang: id }, label),
    ]));
}

function volumeSlider(labelId) {
  const out = h('output', { class: 'sh-range-out', 'aria-hidden': 'true' });
  const input = h('input', {
    type: 'range', min: '0', max: String(PERCENT), step: '5', class: 'sh-range', 'aria-labelledby': labelId,
    onInput: (e) => setSetting('volume', Number(e.target.value) / PERCENT),
    onChange: () => sound('click'),
  });
  const el = h('div', { class: 'sh-range-wrap' }, input, out);
  const sync = (s) => {
    const pct = Math.round(s.volume * PERCENT);
    if (document.activeElement !== input) input.value = String(pct);
    input.style.setProperty('--fill', `${pct}%`);
    input.setAttribute('aria-valuetext', `${pct} percent`);
    out.textContent = `${pct}%`;
    el.classList.toggle('is-muted', !s.sound);
  };
  return { el, sync };
}

function controls() {
  return {
    sound: toggle('sound', 'sh-l-sound'),
    volume: volumeSlider('sh-l-volume'),
    textSpeed: segmented('textSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['instant', 'Instant']], 'sh-l-text'),
    quality: segmented('quality', [['high', 'High'], ['low', 'Low']], 'sh-l-quality'),
    motion: segmented('motion', [['system', 'System'], ['on', 'On'], ['off', 'Off']], 'sh-l-motion'),
    designerNotes: toggle('designerNotes', 'sh-l-notes'),
  };
}

function group(title, ...rows) {
  return h('section', { class: 'sh-set-group' }, h('h3', { class: 'sh-set-group-title' }, title), rows);
}

/** Opens the settings panel. onClose() runs after it closes. Returns close(). */
export function showSettings(onClose) {
  const c = controls();
  const body = h('div', { class: 'sh-settings' },
    group('Audio',
      row('Sound', 'Office hum, paper and stamps. Off by default.', c.sound.el, 'sh-l-sound'),
      row('Volume', null, c.volume.el, 'sh-l-volume')),
    group('Game',
      row('Text speed', 'How fast dialogue lines type out.', c.textSpeed.el, 'sh-l-text'),
      row('Designer notes', 'Show why each screen is built the way it is.', c.designerNotes.el, 'sh-l-notes'),
      row('Language', 'Official TMMi names stay in English. The page reloads; your save is kept.', languagePicker('sh-l-lang'), 'sh-l-lang')),
    group('Display',
      row('Graphics quality', 'Low turns off shadows and effects in the office.', c.quality.el, 'sh-l-quality'),
      row('Reduce motion', 'System follows your device setting.', c.motion.el, 'sh-l-motion')));

  const syncAll = (s) => Object.values(c).forEach((ctl) => ctl.sync(s));
  syncAll(getSettings());
  const unsubscribe = onSettingsChange(syncAll);
  return openPanel({
    kicker: 'Options',
    title: 'Settings',
    body: [body, h('p', { class: 'sh-panel-foot' }, 'Saved on this device. Changes apply at once.')],
    className: 'sh-panel-settings',
    onClose: () => { unsubscribe(); onClose?.(); },
  });
}
