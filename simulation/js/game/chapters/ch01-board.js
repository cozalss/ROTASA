// Chapter 1 booking board: the five people the CTO can release, as a DOM
// panel over the world (mirrors the hotspots), with the Confirm button.
import { h } from '../../ui/dom.js';
import { gameLayer } from '../toast.js';
import { INTERVIEWEES, INTERVIEW_SLOTS } from '../../data/decisions.js';
import { PERSON_ANCHORS } from './ch02-spots.js';

export const BOOK_PREFIX = 'book-';

/** World hotspots for the five interviewees. */
export function bookingHotspots(plan) {
  return INTERVIEWEES.map((p) => {
    const booked = plan.interviews.includes(p.id);
    return {
      id: `${BOOK_PREFIX}${p.id}`,
      anchor: PERSON_ANCHORS[p.id],
      label: p.name,
      sublabel: `${p.role} · 30 min${booked ? ' · booked' : ''}`,
      kind: 'person',
      state: booked ? 'done' : 'available',
    };
  });
}

function confirmReason(count) {
  if (count === INTERVIEW_SLOTS) return null;
  return `Pick ${INTERVIEW_SLOTS} people first (${count} of ${INTERVIEW_SLOTS} picked).`;
}

function personRow(p, booked, full, onToggle) {
  return h('li', {},
    h('button', {
      type: 'button',
      class: `gd-board-person${booked ? ' is-booked' : ''}`,
      id: `gd-book-${p.id}`,
      'aria-pressed': String(booked),
      'aria-disabled': !booked && full ? 'true' : null,
      title: p.note,
      onClick: () => onToggle(p.id),
    },
    h('span', { class: 'gd-board-check', 'aria-hidden': 'true' }, booked ? '✓' : ''),
    h('span', { class: 'gd-board-text' },
      h('span', { class: 'gd-board-name' }, p.name),
      h('span', { class: 'gd-board-role' }, p.role)),
    h('span', { class: 'gd-board-cost' }, '30 min')));
}

/**
 * createBoard({ onToggle(id), onConfirm(), onDossier() }) -> { render(plan), remove() }
 * The board keeps keyboard focus on the same row across re-renders.
 */
export function createBoard({ onToggle, onConfirm, onDossier }) {
  const root = h('section', { class: 'gd-board', 'aria-labelledby': 'gd-board-title' });
  gameLayer().append(root);

  function render(plan) {
    const focusedId = root.contains(document.activeElement) ? document.activeElement.id : null;
    const count = plan.interviews.length;
    const full = count >= INTERVIEW_SLOTS;
    const reason = confirmReason(count);
    root.replaceChildren(
      h('p', { class: 'gd-board-kicker' }, 'Decision 3 of 3 · Interviews'),
      h('h2', { class: 'gd-board-title', id: 'gd-board-title' }, `Book ${INTERVIEW_SLOTS} people`),
      h('p', { class: 'gd-board-lede' }, 'Click people in the office or here. Only the people you book will talk to you tomorrow.'),
      h('ul', { class: 'gd-board-list' }, INTERVIEWEES.map((p) => personRow(p, plan.interviews.includes(p.id), full, onToggle))),
      h('div', { class: 'gd-board-foot' },
        h('p', { class: 'gd-board-count', 'aria-live': 'polite' }, h('b', {}, `${count} of ${INTERVIEW_SLOTS}`), ' booked'),
        h('button', { type: 'button', class: 'gd-btn gd-btn-ghost', onClick: onDossier }, 'Notes'),
        h('button', {
          type: 'button', class: 'gd-btn gd-btn-primary', id: 'gd-book-confirm',
          'aria-disabled': reason ? 'true' : null, 'aria-describedby': reason ? 'gd-board-why' : null,
          onClick: () => { if (!confirmReason(plan.interviews.length)) onConfirm(); },
        }, 'Confirm bookings')),
      ...(reason ? [h('p', { class: 'gd-board-why', id: 'gd-board-why' }, reason)] : []));
    if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
  }

  return {
    render,
    remove: () => root.remove(),
  };
}
