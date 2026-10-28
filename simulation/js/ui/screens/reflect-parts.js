// Step 7 building blocks: consequence timeline, path comparison (table on
// wide screens, cards on narrow ones) and the 21-goal ratings matrix.
import { h, chip } from '../dom.js';
import { PROCESS_AREAS } from '../../data/tmmi.js';
import { COMPARE_LABELS } from '../../logic/assessment.js';
import { ratingMark, ratingLabel } from './conclude-kit.js';

const TONE_WORD = { good: 'Good outcome', warn: 'Mixed outcome', bad: 'Bad outcome', neutral: 'Summary' };

export function consequenceTimeline(items) {
  return h('ol', { class: 'c-timeline' },
    items.map((c) => h('li', { class: `c-tl-item tone-${c.tone}` },
      h('span', { class: 'c-tl-dot', 'aria-hidden': 'true' }),
      h('div', { class: 'c-tl-body' },
        h('p', { class: 'c-tl-meta' },
          chip(c.from, 'neutral'),
          h('span', { class: `c-tl-tone tone-${c.tone}` }, TONE_WORD[c.tone] ?? '')),
        h('p', {}, c.text)))));
}

function statusChip(status) {
  return chip(status.label, status.tone);
}

// Identical paths are shown once, so the eye goes to where the player diverged.
function pathCells(r) {
  if (r.player === r.expert) {
    return [h('td', { class: 'c-path-same', colspan: '2' }, chip('Both', 'good'), ' ', r.player)];
  }
  return [h('td', { class: 'c-path-player' }, r.player), h('td', { class: 'c-path-expert' }, r.expert)];
}

export function pathTable(rows) {
  return h('div', { class: 'table-wrap c-path-table' },
    h('table', {},
      h('caption', { class: 'sr-only' }, 'Your path and the expert’s path, decision by decision'),
      h('thead', {}, h('tr', {},
        ['Step · decision', 'Your path', 'Expert path', 'Status', 'Why it matters'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', {}, rows.map((r) => h('tr', { class: `is-${r.status.tone}` },
        h('th', { scope: 'row' }, r.step),
        ...pathCells(r),
        h('td', {}, statusChip(r.status)),
        h('td', { class: 'muted' }, r.why))))));
}

export function pathCards(rows) {
  return h('ol', { class: 'c-path-cards' },
    rows.map((r) => h('li', { class: `c-path-card is-${r.status.tone}` },
      h('header', {}, h('b', {}, r.step), statusChip(r.status)),
      h('dl', {},
        ...(r.player === r.expert
          ? [h('dt', {}, 'You and the expert'), h('dd', {}, r.player)]
          : [h('dt', { class: 'c-path-player' }, 'Your path'), h('dd', {}, r.player),
            h('dt', { class: 'c-path-expert' }, 'Expert path'), h('dd', {}, r.expert)]),
        h('dt', {}, 'Why it matters'), h('dd', { class: 'muted' }, r.why)))));
}

function ratingCell(rating, who) {
  return h('td', { class: 'c-rm-cell' },
    h('span', { class: `c-rm-r c-rm-${who}`, title: ratingLabel(rating) }, ratingMark(rating)),
    h('span', { class: 'sr-only' }, ratingLabel(rating)));
}

export function ratingsMatrix(summary) {
  const groups = PROCESS_AREAS.map((pa) => {
    const items = summary.filter((s) => s.goal.pa === pa.id);
    return h('tbody', {},
      h('tr', { class: 'c-rm-group' },
        h('th', { scope: 'rowgroup', colspan: '4' }, h('span', { class: 'mono' }, pa.code), ' ', pa.name)),
      items.map((s) => h('tr', { class: `is-${s.tone}` },
        h('th', { scope: 'row' }, h('span', { class: 'mono c-rm-gid' }, s.goal.id), ' ', s.goal.name),
        ratingCell(s.player, 'player'),
        ratingCell(s.goal.expert, 'expert'),
        h('td', {}, chip(COMPARE_LABELS[s.status], s.tone)))));
  });
  return h('div', { class: 'table-wrap c-rm' },
    h('table', {},
      h('caption', { class: 'sr-only' }, 'Your goal ratings next to the expert’s, grouped by process area'),
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, 'Goal'),
        h('th', { scope: 'col', class: 'c-rm-cell' }, 'You'),
        h('th', { scope: 'col', class: 'c-rm-cell' }, 'Expert'),
        h('th', { scope: 'col' }, 'Status'))),
      groups));
}

// Headline numbers for the top of the reflection.
export function scoreTiles(rows, summary) {
  const sameDecisions = rows.filter((r) => r.status.tone === 'good').length;
  const goodGoals = summary.filter((s) => s.tone === 'good').length;
  const badGoals = summary.filter((s) => s.tone === 'bad').length;
  const tile = (n, of, label, tone) => h('li', { class: `c-tile tone-${tone}` },
    h('b', { class: 'tabular' }, String(n), h('span', {}, ` / ${of}`)),
    h('span', {}, label));
  return h('ul', { class: 'c-tiles', 'aria-label': 'Summary' },
    tile(sameDecisions, rows.length, 'decisions on the expert’s path', 'expert'),
    tile(goodGoals, summary.length, 'goal ratings the expert accepts', 'good'),
    tile(badGoals, summary.length, 'goal ratings far off or unsupported', 'bad'));
}
