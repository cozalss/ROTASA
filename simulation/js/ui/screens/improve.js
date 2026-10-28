// Step 6 · Improve: spend the quarter's budget on Document I's proposals,
// then decide which action starts first.
import { h, conceptBox, designerNote, button } from '../dom.js';
import { stepHeader, stepLayout, optionList, feedbackBox, navRow } from '../components.js';
import { patchSlice, toggleInList } from '../../store.js';
import { ACTIONS, BUDGET, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { canAddAction, actionTotals } from '../../logic/assessment.js';
import { formatNumber, section } from './conclude-kit.js';
import { idealStrip, budgetMeters, coverageStrip, actionBody, actionMeta, actionComparison } from './improve-parts.js';

function toggleAction(ctx, id) {
  ctx.update((s) => {
    const actions = toggleInList(s.improve.actions, id);
    const first = actions.includes(s.improve.first) ? s.improve.first : null;
    return patchSlice(s, 'improve', { actions, first });
  });
}

function actionPicker(state, ctx, locked) {
  const { actions } = state.improve;
  return optionList({
    name: 'actions',
    multi: true,
    options: ACTIONS.map((a) => ({ id: a.id, title: a.title, body: actionBody(a), action: a })),
    selected: actions,
    onSelect: locked ? () => {} : (id) => toggleAction(ctx, id),
    isDisabled: (o) => locked || !canAddAction(actions, o.id),
    meta: (o) => actionMeta(o.action),
  });
}

function firstPicker(state, ctx, locked) {
  const { actions, first } = state.improve;
  const options = ACTIONS.filter((a) => actions.includes(a.id)).map((a) => ({ id: a.id, title: a.title }));
  if (options.length === 0) return h('p', { class: 'muted c-waiting' }, 'Choose at least one action above first.');
  return optionList({
    name: 'first',
    options,
    selected: first,
    onSelect: locked ? () => {} : (id) => ctx.update((s) => patchSlice(s, 'improve', { first: id })),
    isDisabled: () => locked,
  });
}

function lockRow(state, ctx) {
  const { actions, first } = state.improve;
  const ready = actions.length > 0 && actions.includes(first);
  return h('div', { class: 'c-lock-row' },
    button('Lock the plan', () => ctx.update((s) => patchSlice(s, 'improve', { revealed: true })), { disabled: !ready, id: 'improve-lock' }),
    h('p', { class: 'muted c-lock-hint' }, ready ? 'Locked plans cannot be changed.' : 'Choose actions and the one that starts first.'));
}

function afterLock(state) {
  const { actions, first } = state.improve;
  const firstTitle = ACTIONS.find((a) => a.id === first)?.title;
  const expertFirst = ACTIONS.find((a) => a.id === EXPERT.first)?.title ?? '—';
  const overlap = actions.filter((id) => EXPERT.actions.includes(id)).length;
  return [
    h('p', { class: 'c-score' },
      h('b', { class: 'tabular' }, `${overlap} of ${EXPERT.actions.length}`),
      ' of the expert’s actions are in your plan.'),
    actionComparison(actions),
    h('div', { class: 'verdict good c-expert-why' }, h('strong', {}, 'Why the expert chose this set'), h('p', {}, EXPERT_WHY.actions)),
    h('h3', { class: 'c-subhead' }, 'First action'),
    feedbackBox(first === EXPERT.first, firstTitle ? `You start with: ${firstTitle}.` : null, expertFirst, EXPERT_WHY.first),
  ];
}

export function render(state, ctx) {
  const locked = state.improve.revealed;
  const { actions } = state.improve;
  const t = actionTotals(actions);

  const main = [
    section('Document I · improvement proposals', 'Spend one quarter',
      h('p', {}, `People across the company proposed fifteen actions. The CTO gives ${formatNumber(BUDGET.hours)} person-hours and TRY ${formatNumber(BUDGET.money)} for one quarter. No new hires. Choose the actions that close your weakest Level 2 gaps.`),
      budgetMeters(actions),
      coverageStrip(actions, state),
      actionPicker(state, ctx, locked),
      h('p', { class: 'muted c-hint' }, 'An action you cannot afford is greyed out. Remove another action to make room.'),
      designerNote('Requirement · Decision under a constrained resource', 'Two budgets bind at once: hours and cash. The per-PR environments alone take 120 hours and 60% of the cash, so choosing them visibly squeezes the governance work. The coverage strip ties each action back to the player’s own Step 4 ratings.')),
    section('Decision', 'Which action starts first, in Sprint 39?',
      h('p', {}, `Your plan: ${t.hours} h and TRY ${formatNumber(t.money)}. One action must start first; the others wait for it or run beside it.`),
      firstPicker(state, ctx, locked),
      locked ? afterLock(state) : lockRow(state, ctx),
      designerNote('Requirement · Prioritization with expert comparison', 'After locking, every action shows whether the player, the expert, or both chose it, and the expert explains the set and the first step.')),
    navRow({
      onBack: () => ctx.go(5),
      onNext: () => ctx.go(7),
      canNext: locked,
      hint: 'Lock your plan to continue.',
    }),
  ];

  const rail = [
    conceptBox('IDEAL: where are we?',
      h('p', {}, 'TMMi does not say how to improve. IDEAL is a common cycle for it (TMMi v2.0 §1.6.1). Initiating is not finished: there is a sponsor and a goal, but no owner or improvement team yet. The assessment was Diagnosing; Establishing (set priorities, plan actions) comes next, and this step drafts it.'),
      idealStrip()),
    conceptBox('Fix the weakest links',
      h('p', {}, 'A level is only as strong as its weakest process area. Work on the goals that hold the level you are aiming for down. Level 3 topics can wait until Level 2 holds.')),
  ];

  return h('div', { class: 'screen screen-improve' },
    stepHeader(6, 'Improve', 'Turn findings into a plan the budget can carry.'),
    stepLayout(main, rail));
}
