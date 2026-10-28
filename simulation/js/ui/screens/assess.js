// Step 3: rate the 21 goals of the six Level 2 process areas from the
// evidence collected in Step 2. Two goals ask for written reasoning first.
import { h, conceptBox, designerNote } from '../dom.js';
import { stepHeader, stepLayout, navRow, evidenceBag } from '../components.js';
import { PROCESS_AREAS, ALL_GOALS, RATINGS, REASONED_GOALS } from '../../data/tmmi.js';
import { DEFAULT_PA, paTabs, goalCard, ratingSheet, openPa } from './assess-parts.js';
import { joinAnd } from '../../i18n/i18n.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function progress(state) {
  const rated = ALL_GOALS.filter((g) => state.assess.ratings[g.id]).length;
  const locked = REASONED_GOALS.filter((id) => state.assess.revealed[id]).length;
  return { rated, total: ALL_GOALS.length, locked };
}

function nextHint(state) {
  const { rated, total } = progress(state);
  const open = REASONED_GOALS.filter((id) => !state.assess.revealed[id]);
  const parts = [
    rated < total ? `Rate ${plural(total - rated, 'more goal')}.` : null,
    open.length ? `Write and lock your reasoning for ${joinAnd(open)}.` : null,
  ];
  return parts.filter(Boolean).join(' ');
}

function scopeBanner(state) {
  if (state.plan.scope !== 'automation') return null;
  return h('div', { class: 'scope-banner', role: 'note' },
    h('p', { class: 'eyebrow' }, 'Scope warning'),
    h('p', {},
      h('b', {}, 'Your scope covered test automation only. '),
      'TMMi has no automation process area, so all six Level 2 process areas are outside your scope. In Step 4 every one of them will be NR (Not Rated), and so will the maturity level. Rate the goals anyway: it shows what your scope left out.'));
}

function concepts() {
  return h('div', { class: 'concept-pair' },
    conceptBox('Rating scale',
      h('ul', { class: 'scale-legend' }, RATINGS.map((r) => h('li', {},
        h('b', { class: 'mono' }, r.id),
        h('span', {}, r.id === '?'
          ? 'Not enough evidence. Maps to NR, Not Rated: TAMAR rates a goal NR when the data is insufficient.'
          : `${r.label}: a practice at this level is ${r.range} achieved; a goal takes the rating its practices support.`)))),
      h('p', {}, 'In an informal assessment these ratings are indicative. They show the gap; they are not a formal rating.')),
    conceptBox('Weakest link',
      h('p', {}, 'A process area is rated at its lowest goal rating. Goals F, L and P give the process area P.'),
      h('p', {}, 'Any goal rated NR makes the process area NR, and any NR process area makes the maturity level NR.')));
}

function toolbar(state) {
  const { rated, total, locked } = progress(state);
  return h('div', { class: 'assess-toolbar' },
    h('p', { class: 'assess-count tabular', role: 'status' },
      h('b', {}, `${rated} / ${total}`), ' rated'),
    h('div', { class: 'assess-bar', 'aria-hidden': 'true' },
      h('span', { style: { transform: `scaleX(${rated / total})` } })),
    h('p', { class: 'assess-locked mono' }, `Written reasoning ${locked}/${REASONED_GOALS.length}`));
}

function paPanel(state, ctx, pa) {
  const index = PROCESS_AREAS.indexOf(pa);
  const next = PROCESS_AREAS[index + 1];
  return h('section', { class: 'pa-panel', id: 'pa-panel', role: 'tabpanel', 'aria-labelledby': `tab-${pa.id}` },
    h('header', { class: 'pa-head' },
      h('p', { class: 'eyebrow' }, `${pa.code} · ${plural(pa.goals.length, 'goal')}`),
      h('h2', { class: 'section-title' }, pa.name),
      h('p', { class: 'pa-purpose' }, h('b', {}, 'Purpose. '), pa.purpose)),
    h('div', { class: 'goal-list' }, pa.goals.map((goal) => goalCard(state, ctx, goal))),
    next
      ? h('button', { type: 'button', class: 'btn btn-secondary pa-next', onClick: () => openPa(ctx, next.id) },
        `Next: ${next.code} ${next.name} →`)
      : null);
}

export function render(state, ctx) {
  const openId = state.assess.openPa ?? DEFAULT_PA;
  const pa = PROCESS_AREAS.find((p) => p.id === openId) ?? PROCESS_AREAS[0];
  const { rated, total } = progress(state);
  const done = rated === total && REASONED_GOALS.every((id) => state.assess.revealed[id]);

  const main = [
    stepHeader(3, 'Assess',
      'Rate each Level 2 goal from the evidence you collected. Read what you have, then choose how far the goal is achieved.'),
    scopeBanner(state),
    concepts(),
    designerNote('Decision changes later steps',
      'Only evidence collected in Step 2 appears here. A goal whose key evidence was skipped shows an empty evidence list, so the earlier time choices become visible.'),
    h('div', { class: 'assess-board' },
      toolbar(state),
      paTabs(state, ctx, pa.id),
      paPanel(state, ctx, pa)),
    navRow({
      onBack: () => ctx.go(2),
      onNext: () => ctx.go(4),
      canNext: done,
      hint: nextHint(state),
    }),
  ];

  return h('div', { class: 'screen screen-assess' },
    stepLayout(main, [ratingSheet(state, ctx, pa.id), evidenceBag(state, ctx.openDoc)]));
}
