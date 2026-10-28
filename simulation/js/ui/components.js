// Shared building blocks used by every step screen.
import { h, formatMinutes, chip, button } from './dom.js';
import { STEP_IDS } from '../store.js';
import { findEvidence } from '../data/evidence.js';
import { knownEvidenceIds, minutesLeft, timeBudget } from '../logic/assessment.js';

export const STEP_TITLES = ['Briefing', 'Plan', 'Collect evidence', 'Assess', 'Conclude', 'Report', 'Improve', 'Reflect'];

// ---------- process map: a delivery route with seven stops ----------
export function renderProcessMap(state, onGo) {
  const stops = STEP_IDS.slice(1).map((_, i) => {
    const step = i + 1;
    const status = step === state.step ? 'current' : step <= state.maxStep ? 'done' : 'locked';
    return h('li', { class: `stop stop-${status}` },
      h('button', {
        type: 'button',
        class: 'stop-btn',
        disabled: status === 'locked',
        'aria-current': status === 'current' ? 'step' : null,
        onClick: () => onGo(step),
      },
      h('span', { class: 'stop-dot', 'aria-hidden': 'true' }),
      h('span', { class: 'stop-num' }, `Step ${step}`),
      h('span', { class: 'stop-name' }, STEP_TITLES[step])));
  });
  const progress = state.step === 0 ? 0 : ((state.step - 1) / 6) * 100;
  const truck = h('span', { class: 'route-truck', 'aria-hidden': 'true' }, truckIcon());
  const route = h('ol', { class: 'route', style: { '--progress': String(lastProgress) } }, stops, h('li', { class: 'truck-lane', 'aria-hidden': 'true' }, truck));
  // Start from the previous position so the truck drives to the new stop.
  if (lastProgress !== progress) {
    requestAnimationFrame(() => requestAnimationFrame(() => route.style.setProperty('--progress', String(progress))));
  }
  lastProgress = progress;
  return h('div', { class: 'route-wrap' }, route);
}

let lastProgress = 0;

function truckIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(ns, 'svg');
  icon.setAttribute('viewBox', '0 0 28 16');
  icon.setAttribute('width', '28');
  icon.setAttribute('height', '16');
  const parts = [
    ['rect', { x: 1, y: 2, width: 16, height: 9, rx: 1.5, class: 'truck-body' }],
    ['path', { d: 'M17 5h5l4 4v2h-9z', class: 'truck-cab' }],
    ['circle', { cx: 6, cy: 12.5, r: 2.2, class: 'truck-wheel' }],
    ['circle', { cx: 21, cy: 12.5, r: 2.2, class: 'truck-wheel' }],
  ];
  parts.forEach(([tag, attrs]) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    icon.append(el);
  });
  return icon;
}

// ---------- the time-window clock in the top bar ----------
export function renderClock(state) {
  // The time window only matters while collecting evidence.
  if (state.step !== 2) return h('span');
  const left = minutesLeft(state);
  const total = timeBudget(state.plan.scope);
  const ratio = Math.max(0, left) / total;
  const tone = ratio < 0.15 ? 'bad' : ratio < 0.4 ? 'warn' : 'good';
  return h('div', { class: `clock clock-${tone}`, role: 'status', 'aria-live': 'polite' },
    h('span', { class: 'clock-ring', style: { '--ratio': ratio }, 'aria-hidden': 'true' }),
    h('span', {},
      h('span', { class: 'eyebrow' }, 'Time left on site'),
      h('b', { class: 'tabular' }, `${formatMinutes(left)} / ${formatMinutes(total)}`)));
}

// ---------- step header ----------
export function stepHeader(step, title, lede) {
  return h('header', { class: 'step-header' },
    h('p', { class: 'eyebrow' }, `Step ${step} of 7`),
    h('h1', { class: 'step-title' }, title),
    lede ? h('p', { class: 'step-lede' }, lede) : null);
}

// ---------- two-column layout ----------
export function stepLayout(mainChildren, railChildren) {
  return h('div', { class: 'step-layout' },
    h('div', { class: 'step-main' }, mainChildren),
    h('div', { class: 'step-rail' }, railChildren));
}

// ---------- option list (single or multi choice) ----------
// options: [{id, title, body?, meta?}]; selected: id or array of ids.
export function optionList({ name, options, selected, onSelect, multi = false, isDisabled = () => false, meta = (o) => o.meta }) {
  const isOn = (id) => (multi ? selected.includes(id) : selected === id);
  return h('div', { class: 'options', role: multi ? 'group' : 'radiogroup', 'aria-label': name },
    options.map((o) => h('button', {
      type: 'button',
      id: `${name}-${o.id}`,
      class: `option${multi ? ' multi' : ''}`,
      role: multi ? null : 'radio',
      'aria-checked': multi ? null : String(isOn(o.id)),
      'aria-pressed': multi ? String(isOn(o.id)) : null,
      disabled: !isOn(o.id) && isDisabled(o),
      onClick: () => onSelect(o.id),
    },
    h('span', { class: 'option-mark', 'aria-hidden': 'true' }),
    h('span', {},
      h('span', { class: 'option-title' }, o.title),
      o.body ? h('span', { class: 'option-body', style: { display: 'block' } }, o.body) : null),
    meta(o) ? h('span', { class: 'option-meta' }, meta(o)) : h('span'))));
}

// ---------- feedback after a decision is locked ----------
// The "filed" stamp animates only the first time a verdict appears, not on
// every re-render of the stage.
const seenVerdicts = new Set();

export function feedbackBox(isExpertChoice, playerText, expertTitle, expertWhy) {
  const key = `${expertTitle}|${playerText}`;
  const isNew = !seenVerdicts.has(key);
  seenVerdicts.add(key);
  return h('div', { class: `verdict verdict-filed ${isExpertChoice ? 'good' : 'warn'}${isNew ? ' is-new' : ''}` },
    h('span', { class: 'stamp', 'aria-hidden': 'true' }, isExpertChoice ? 'Matches expert' : 'Filed'),
    h('strong', {}, isExpertChoice ? 'Same choice as the expert.' : `The expert chose: ${expertTitle}`),
    playerText ? h('p', {}, playerText) : null,
    !isExpertChoice && expertWhy ? h('p', {}, expertWhy) : null);
}

// ---------- evidence bag in the right rail ----------
export function evidenceBag(state, openDoc) {
  const ids = knownEvidenceIds(state);
  return h('section', { class: 'panel bag', 'aria-label': 'Evidence collected' },
    h('p', { class: 'eyebrow' }, `Evidence bag · ${ids.length}`),
    h('ul', { class: 'bag-list' }, ids.map((id) => {
      const e = findEvidence(id);
      return h('li', {},
        h('button', { type: 'button', class: 'bag-item', onClick: () => openDoc(id) },
          h('span', { class: 'mono' }, e.id),
          h('span', {}, e.title)));
    })));
}

// Evidence nature: document (work product), record (by-product), interview
// (statement), account (compiled for the assessor), observation (seen on site).
const NATURE_TONES = { document: 'expert', record: 'neutral', interview: 'warn', account: 'neutral', observation: 'player' };

export function natureChip(nature) {
  return chip(nature, NATURE_TONES[nature] ?? 'neutral');
}

// ---------- document viewer (slide-over sheet) ----------
export function renderDocument(evidence, onClose) {
  const blocks = evidence.body.map((b) => {
    if (b.h) return h('h4', {}, b.h);
    if (b.p) return h('p', {}, b.p);
    if (b.list) return h('ul', {}, b.list.map((li) => h('li', {}, li)));
    if (b.qa) return h('div', { class: 'qa' }, h('p', { class: 'qa-q' }, b.qa[0]), h('p', { class: 'qa-a quote' }, `“${b.qa[1]}”`));
    if (b.table) {
      return h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, b.table.head.map((c) => h('th', {}, c)))),
        h('tbody', {}, b.table.rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c)))))));
    }
    return null;
  });
  return h('div', { class: 'doc-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'doc-title' },
    h('div', { class: 'btn-row', style: { justifyContent: 'space-between' } },
      h('span', { class: 'btn-row' }, chip(`Document ${evidence.id}`, 'neutral'), natureChip(evidence.nature)),
      button('Close', onClose, { variant: 'secondary', id: 'doc-close' })),
    h('h2', { id: 'doc-title' }, evidence.title),
    h('div', { class: 'doc-body' }, blocks));
}

// ---------- navigation row at the bottom of each step ----------
export function navRow({ onBack, onNext, nextLabel = 'Continue', canNext = true, hint }) {
  return h('div', { class: 'nav-row' },
    onBack ? button('Back', onBack, { variant: 'secondary' }) : h('span'),
    h('div', { class: 'nav-next' },
      hint && !canNext ? h('p', { class: 'muted nav-hint' }, hint) : null,
      button(nextLabel, onNext, { disabled: !canNext, id: 'next-step' })));
}
