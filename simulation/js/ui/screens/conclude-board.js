// Step 4 visual: the "weakest link" board. Six process area columns; each
// column stacks its goal ratings, and the lowest one drops down to become the
// process area rating. The lowest process area becomes the Level 2 result.
import { h, chip } from '../dom.js';
import { PROCESS_AREAS } from '../../data/tmmi.js';
import { ratingTone, ratingMark, ratingLabel } from './conclude-kit.js';

function goalChip(goal, rating, isWeak) {
  const short = goal.id.split('-')[1];
  return h('li', {
    class: `wl-goal tone-${ratingTone(rating)}${isWeak ? ' is-weak' : ''}`,
    title: goal.name,
  },
  h('span', { class: 'wl-gid' }, short),
  h('span', { class: 'wl-gname' }, goal.name),
  h('b', { class: 'wl-r', 'aria-label': ratingLabel(rating) }, ratingMark(rating)),
  isWeak ? h('span', { class: 'sr-only' }, ' (weakest link)') : null);
}

function paColumn(pa, paRating, ratings, scope) {
  const left = scope === 'automation';
  const weakTarget = paRating === 'NR' ? null : paRating;
  const goals = pa.goals.map((g) => {
    const r = left ? null : ratings[g.id];
    const weak = left ? false : weakTarget ? r === weakTarget : !(r in { N: 1, P: 1, L: 1, F: 1 });
    return goalChip(g, r, weak);
  });
  return h('li', { class: `wl-col tone-${ratingTone(paRating)}` },
    h('header', { class: 'wl-head' },
      h('span', { class: 'wl-code' }, pa.id),
      h('span', { class: 'wl-name' }, pa.name)),
    left
      ? h('p', { class: 'wl-out' }, 'Left out of scope')
      : h('ol', { class: 'wl-goals', 'aria-label': `${pa.name} goals` }, goals),
    h('div', { class: 'wl-drop', 'aria-hidden': 'true' }),
    h('div', { class: 'wl-pa' },
      h('span', { class: 'wl-pa-label' }, 'PA rating'),
      h('b', { class: 'wl-pa-r' }, paRating),
      h('span', { class: 'wl-pa-text' }, ratingLabel(paRating))));
}

export function mlVerdict(ml) {
  if (ml.rating === 'NR') {
    return { tone: 'neutral', head: 'Level 2: not rated (indicative)',
      text: 'At least one process area is not rated, so the maturity level cannot be rated either.' };
  }
  if (ml.achieved) {
    return { tone: 'good', head: 'Level 2: achieved (indicative)',
      text: `Every process area is rated Largely or Fully. The lowest is ${ml.rating}.` };
  }
  return { tone: 'bad', head: 'Level 2: not achieved (indicative)',
    text: `The lowest process area is rated ${ml.rating} (${ratingLabel(ml.rating)}). Level 2 needs every process area at L or F.` };
}

export function weakestLinkBoard({ paRatings, ml, ratings, scope }) {
  const byId = Object.fromEntries(paRatings.map((p) => [p.id, p.rating]));
  const verdict = mlVerdict(ml);
  return h('figure', { class: 'wl-board', 'aria-labelledby': 'wl-caption' },
    h('figcaption', { class: 'wl-caption', id: 'wl-caption' },
      h('span', { class: 'eyebrow' }, 'Your ratings · weakest link'),
      h('span', { class: 'wl-legend', 'aria-hidden': 'true' },
        h('span', { class: 'wl-key tone-bad' }, 'N'),
        h('span', { class: 'wl-key tone-warn' }, 'P'),
        h('span', { class: 'wl-key tone-good' }, 'L / F'),
        h('span', { class: 'wl-key tone-neutral' }, '? / –'),
        h('span', { class: 'wl-key is-weak' }, 'weakest'))),
    h('ol', { class: 'wl-cols' }, PROCESS_AREAS.map((pa) => paColumn(pa, byId[pa.id], ratings, scope))),
    h('div', { class: `wl-result tone-${verdict.tone}`, role: 'status' },
      h('span', { class: 'wl-result-r', 'aria-hidden': 'true' }, ml.rating),
      h('div', {},
        h('p', { class: 'wl-result-head' }, verdict.head),
        h('p', { class: 'wl-result-text' }, verdict.text))));
}

// After locking: player PA ratings next to the expert's.
export function paComparison(playerPAs, expertPAs, playerMl, expertMl) {
  const rows = playerPAs.map((p, i) => {
    const e = expertPAs[i];
    const same = p.rating === e.rating;
    return h('tr', {},
      h('th', { scope: 'row' }, h('span', { class: 'mono' }, p.id), ' ', p.name),
      h('td', {}, chip(p.rating, 'player')),
      h('td', {}, chip(e.rating, 'expert')),
      h('td', {}, chip(same ? 'Same' : 'Different', same ? 'good' : 'warn')));
  });
  const mlSame = playerMl.rating === expertMl.rating;
  return h('div', { class: 'table-wrap' },
    h('table', { class: 'c-compare-table' },
      h('caption', { class: 'sr-only' }, 'Process area ratings: yours and the expert’s'),
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, 'Process area'),
        h('th', { scope: 'col' }, 'You'),
        h('th', { scope: 'col' }, 'Expert'),
        h('th', { scope: 'col' }, 'Match'))),
      h('tbody', {}, rows),
      h('tfoot', {}, h('tr', {},
        h('th', { scope: 'row' }, 'Maturity Level 2'),
        h('td', {}, chip(playerMl.rating, 'player')),
        h('td', {}, chip(expertMl.rating, 'expert')),
        h('td', {}, chip(mlSame ? 'Same' : 'Different', mlSame ? 'good' : 'warn'))))));
}
