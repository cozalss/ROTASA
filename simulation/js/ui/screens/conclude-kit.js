// Shared helpers for Steps 4–7 (conclude, report, improve, reflect):
// rating tones, CSS custom properties, number formatting and the
// "choose, lock, compare with the expert" decision block.
import { h, button } from '../dom.js';
import { optionList, feedbackBox } from '../components.js';
import { RATINGS } from '../../data/tmmi.js';

const TONES = { F: 'good', L: 'good', P: 'warn', N: 'bad' };

export function ratingTone(rating) {
  return TONES[rating] ?? 'neutral';
}

// Display text for a single rating cell: '?' stays '?', a missing goal is '–'.
export function ratingMark(rating) {
  if (!rating) return '–';
  return rating;
}

export function ratingLabel(rating) {
  if (!rating || rating === 'NR') return 'Not rated';
  if (rating === '?') return 'Not enough evidence';
  return RATINGS.find((r) => r.id === rating)?.label ?? rating;
}

const NUMBER = new Intl.NumberFormat('en-US');
export function formatNumber(n) {
  return NUMBER.format(n);
}

export function findOption(options, id) {
  return options.find((o) => o.id === id) ?? null;
}

// One spoken line in a meeting. `who` defaults to the CTO.
export function speech(text, { who = 'Murat Kaya, CTO', initials = 'MK', tone = 'cto' } = {}) {
  return h('figure', { class: `c-speech c-speech-${tone}` },
    h('span', { class: 'c-avatar', 'aria-hidden': 'true' }, initials),
    h('div', { class: 'c-speech-body' },
      h('blockquote', {}, h('p', {}, `“${text}”`)),
      h('figcaption', {}, who)));
}

// A decision: options, an optional extra block (e.g. a text area), a lock
// button, then the expert comparison once locked.
export function decisionBlock({
  name, options, selected, locked, onSelect, onLock,
  expertId, expertWhy, extra = null, canLock = selected != null,
  lockHint = 'Choose an answer first.', isDisabled = () => false, meta,
}) {
  const list = optionList({
    name,
    options,
    selected,
    onSelect: locked ? () => {} : onSelect,
    isDisabled: locked ? () => true : isDisabled,
    meta,
  });
  if (locked) {
    const chosen = findOption(options, selected);
    const expert = findOption(options, expertId);
    return h('div', { class: 'c-decision is-locked' },
      list,
      extra,
      feedbackBox(selected === expertId, chosen?.feedback, expert?.title ?? '—', expertWhy));
  }
  return h('div', { class: 'c-decision' },
    list,
    extra,
    h('div', { class: 'c-lock-row' },
      button('Lock answer', onLock, { disabled: !canLock, id: `${name}-lock` }),
      h('p', { class: 'muted c-lock-hint', id: `${name}-lock-hint` }, canLock ? 'Locked answers cannot be changed.' : lockHint)));
}

// Labelled step section with a numbered eyebrow.
export function section(eyebrow, title, ...children) {
  return h('section', { class: 'panel c-section' },
    h('p', { class: 'eyebrow' }, eyebrow),
    h('h2', { class: 'section-title' }, title),
    ...children);
}
