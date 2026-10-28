// Step 6 building blocks: IDEAL strip, budget meters, process area coverage
// strip and the comparison with the expert's action set.
import { h, chip } from '../dom.js';
import { ACTIONS, BUDGET, EXPERT } from '../../data/decisions.js';
import { PROCESS_AREAS } from '../../data/tmmi.js';
import { actionTotals, processAreaRatings } from '../../logic/assessment.js';
import { formatNumber, ratingTone } from './conclude-kit.js';

const IDEAL = [
  { id: 'I', name: 'Initiating', note: 'Sponsor and goal set; no owner or improvement team yet', status: 'current' },
  { id: 'D', name: 'Diagnosing', note: 'This assessment', status: 'done' },
  { id: 'E', name: 'Establishing', note: 'Prioritize and plan actions', status: 'next' },
  { id: 'A', name: 'Acting', note: 'Pilot and roll out', status: 'next' },
  { id: 'L', name: 'Learning', note: 'Check the benefits, start again', status: 'next' },
];

export function idealStrip() {
  return h('ol', { class: 'c-ideal', 'aria-label': 'IDEAL improvement cycle' },
    IDEAL.map((p) => h('li', { class: `c-ideal-${p.status}`, 'aria-current': p.status === 'current' ? 'step' : null },
      h('span', { class: 'c-ideal-dot', 'aria-hidden': 'true' }, p.id),
      h('span', { class: 'c-ideal-text' }, h('b', {}, p.name), h('span', {}, p.note)))));
}

function meter(label, used, total, unit, fmt) {
  const ratio = Math.min(1, used / total);
  const tone = used > total ? 'bad' : ratio > 0.9 ? 'warn' : 'player';
  const fill = h('span', { class: 'c-meter-fill', style: { '--fill': ratio } });
  return h('div', { class: `c-meter tone-${tone}` },
    h('div', { class: 'c-meter-head' },
      h('span', { class: 'eyebrow' }, label),
      h('span', { class: 'c-meter-num tabular' }, h('b', {}, fmt(used)), ` / ${fmt(total)} ${unit}`)),
    h('div', {
      class: 'c-meter-track',
      role: 'meter',
      'aria-label': label,
      'aria-valuemin': '0',
      'aria-valuemax': String(total),
      'aria-valuenow': String(used),
      'aria-valuetext': `${fmt(used)} of ${fmt(total)} ${unit}, ${fmt(total - used)} left`,
    }, fill),
    h('p', { class: 'c-meter-left tabular' }, `${fmt(Math.max(0, total - used))} ${unit} left`));
}

export function budgetMeters(actionIds) {
  const t = actionTotals(actionIds);
  return h('div', { class: 'c-meters', 'aria-live': 'polite' },
    meter('Person-hours', t.hours, BUDGET.hours, 'h', formatNumber),
    meter('Cash', t.money, BUDGET.money, 'TRY', formatNumber));
}

// How many chosen actions touch each Level 2 process area, next to the
// player's own process area rating from Step 4.
export function coverageStrip(actionIds, state) {
  const chosen = ACTIONS.filter((a) => actionIds.includes(a.id));
  const pas = processAreaRatings(state.assess.ratings, state.plan.scope);
  const cells = PROCESS_AREAS.map((pa, i) => {
    const n = chosen.filter((a) => a.pa === pa.id).length;
    const rating = pas[i].rating;
    const gap = n === 0;
    return h('li', { class: `c-cov-cell${gap ? ' is-gap' : ''}`, title: pa.name },
      h('span', { class: 'c-cov-code' }, pa.id),
      h('b', { class: 'c-cov-n tabular' }, String(n)),
      h('span', { class: `c-cov-r tone-${ratingTone(rating)}` }, `You: ${rating}`),
      gap ? h('span', { class: 'c-cov-flag' }, 'No action') : null);
  });
  const l3 = chosen.filter((a) => a.pa === 'L3').length;
  cells.push(h('li', { class: `c-cov-cell is-l3${l3 ? ' is-on' : ''}`, title: 'Level 3 topic' },
    h('span', { class: 'c-cov-code' }, 'L3'),
    h('b', { class: 'c-cov-n tabular' }, String(l3)),
    h('span', { class: 'c-cov-r' }, 'Level 3'),
    l3 ? h('span', { class: 'c-cov-flag' }, 'Not a Level 2 gap') : null));
  return h('figure', { class: 'c-cov' },
    h('figcaption', { class: 'eyebrow' }, 'Coverage · chosen actions per process area'),
    h('ol', { class: 'c-cov-list' }, cells));
}

export function actionBody(a) {
  return h('span', { class: 'c-action-sub' },
    h('span', {}, `Proposed by ${a.by}`),
    chip(a.pa === 'L3' ? 'Level 3' : a.pa, a.pa === 'L3' ? 'warn' : 'neutral'));
}

export function actionMeta(a) {
  return h('span', { class: 'c-action-cost tabular' },
    h('span', {}, `${a.hours} h`),
    h('span', { class: a.money ? '' : 'muted' }, a.money ? `TRY ${formatNumber(a.money)}` : 'no cash'));
}

const MARKS = {
  both: { label: 'Both', tone: 'good' },
  player: { label: 'Only you', tone: 'player' },
  expert: { label: 'Only expert', tone: 'expert' },
  none: { label: 'Neither', tone: 'neutral' },
};

function markOf(id, actionIds) {
  const you = actionIds.includes(id);
  const exp = EXPERT.actions.includes(id);
  if (you && exp) return 'both';
  if (you) return 'player';
  return exp ? 'expert' : 'none';
}

export function actionComparison(actionIds) {
  const rows = ACTIONS.map((a) => {
    const mark = markOf(a.id, actionIds);
    return h('li', { class: `c-cmp-row is-${mark}` },
      h('span', { class: 'c-lane c-lane-player', 'aria-hidden': 'true' }),
      h('span', { class: 'c-lane c-lane-expert', 'aria-hidden': 'true' }),
      h('span', { class: 'c-cmp-title' }, a.title, a.id === EXPERT.first ? h('span', { class: 'c-first-tag' }, ' · expert starts here') : null),
      chip(MARKS[mark].label, MARKS[mark].tone));
  });
  const you = actionTotals(actionIds);
  const exp = actionTotals(EXPERT.actions);
  return h('div', { class: 'c-cmp' },
    h('div', { class: 'c-cmp-legend' },
      h('span', { class: 'c-legend-player' }, `You: ${you.hours} h · TRY ${formatNumber(you.money)}`),
      h('span', { class: 'c-legend-expert' }, `Expert: ${exp.hours} h · TRY ${formatNumber(exp.money)}`)),
    h('ul', { class: 'c-cmp-list', 'aria-label': 'Your actions compared with the expert’s' }, rows));
}
