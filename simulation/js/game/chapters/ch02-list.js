// Chapter 2 evidence list: everything on offer today as a DOM panel over the
// world (mirrors the hotspots), so nobody has to hunt for glowing desks.
// A row does what clicking its desk does; hovering a row lights up the desk.
// The panel folds away so the office stays visible.
import { h } from '../../ui/dom.js';
import { gameLayer } from '../toast.js';
import { availableEvidence } from '../../logic/assessment.js';
import { blockReason } from './ch02-spots.js';

const NARROW = '(max-width: 760px)';
const KIND_LABEL = Object.freeze({ document: 'Document', interview: 'Interview' });

function spotFor(id) {
  return document.querySelector(`.world-hotspot[data-id="ev-${id}"]`);
}

function highlight(id, on) {
  spotFor(id)?.classList.toggle('is-hover', on);
}

function row(state, item, onPick) {
  const done = state.collect.collected.includes(item.id);
  const reason = done ? null : blockReason(state, item);
  const detail = done ? 'In your bag · click to read' : reason || KIND_LABEL[item.kind] || 'Activity';
  return h('li', {},
    h('button', {
      type: 'button',
      class: `gd-board-person gd-list-row${done ? ' is-booked' : ''}`,
      id: `gd-ev-${item.id}`,
      'aria-disabled': reason ? 'true' : null,
      onClick: () => onPick(`ev-${item.id}`),
      onPointerenter: () => highlight(item.id, true),
      onPointerleave: () => highlight(item.id, false),
      onFocus: () => highlight(item.id, true),
      onBlur: () => highlight(item.id, false),
    },
    h('span', { class: 'gd-board-check', 'aria-hidden': 'true' }, done ? '✓' : item.id),
    h('span', { class: 'gd-board-text' },
      h('span', { class: 'gd-board-name' }, item.title),
      h('span', { class: 'gd-board-role' }, detail)),
    h('span', { class: 'gd-board-cost' }, `${item.cost} min`)));
}

/**
 * createEvidenceList({ onPick(spotId) }) -> { render(state), setHidden(bool), remove() }
 * Starts folded on phones, open elsewhere.
 */
export function createEvidenceList({ onPick }) {
  const root = h('section', { class: 'gd-board gd-list', 'aria-labelledby': 'gd-list-title' });
  gameLayer().append(root);
  let open = !window.matchMedia(NARROW).matches;
  let last = null;

  function render(state) {
    last = state;
    const focusedId = root.contains(document.activeElement) ? document.activeElement.id : null;
    const items = availableEvidence(state.plan.interviews);
    const done = items.filter((e) => state.collect.collected.includes(e.id)).length;
    root.classList.toggle('is-folded', !open);
    root.replaceChildren(
      h('div', { class: 'gd-list-head' },
        h('div', {},
          h('p', { class: 'gd-board-kicker' }, 'Today on offer'),
          h('h2', { class: 'gd-board-title', id: 'gd-list-title' }, 'Evidence list')),
        h('button', {
          type: 'button', class: 'gd-btn gd-btn-ghost gd-list-toggle', id: 'gd-list-toggle',
          'aria-expanded': String(open), 'aria-controls': 'gd-list-body',
          onClick: () => { open = !open; render(last); },
        }, open ? 'Hide' : `Show (${done} of ${items.length})`)),
      ...(open ? [h('div', { id: 'gd-list-body' },
        h('p', { class: 'gd-board-lede' }, 'Click a row or a glowing desk. Each one costs time from your day.'),
        h('ul', { class: 'gd-board-list' }, items.map((item) => row(state, item, onPick))))] : []));
    if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
  }

  return {
    render,
    setHidden: (hidden) => { root.hidden = hidden; },
    remove: () => root.remove(),
  };
}
