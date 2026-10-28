// Step 4 · Conclude: from goal ratings to a maturity level statement.
import { h, conceptBox, designerNote } from '../dom.js';
import { stepHeader, stepLayout, navRow, evidenceBag } from '../components.js';
import { patchSlice } from '../../store.js';
import { LEVEL_OPTIONS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { processAreaRatings, rateMaturityLevel, expertRatings } from '../../logic/assessment.js';
import { decisionBlock, section } from './conclude-kit.js';
import { weakestLinkBoard, paComparison } from './conclude-board.js';

const LEVEL1_OPTIONS = ['level1-formal', 'level1-indicative'];

// Does the chosen statement follow from the player's own computed result?
export function levelConsistency(ml, level) {
  if (!level) return null;
  if (ml.achieved && LEVEL1_OPTIONS.includes(level)) {
    return 'Your own ratings put every process area at Largely or Fully, so they say Level 2 is achieved. Yet you wrote Level 1. Either the ratings are too generous or the statement is too strict. A report must follow from its own ratings.';
  }
  if (!ml.achieved && level === 'level2') {
    return ml.rating === 'NR'
      ? 'Your own ratings leave at least one process area not rated. Nothing in them supports "close to Level 2". A report must follow from its own ratings.'
      : `Your own ratings put the weakest process area at ${ml.rating}. "Close to Level 2" needs every process area at Largely or better. A report must follow from its own ratings.`;
  }
  return null;
}

function scopeNote(scope) {
  if (scope === 'automation') {
    return h('div', { class: 'verdict bad' },
      h('strong', {}, 'Your scope from Step 1 left every Level 2 process area out.'),
      h('p', {}, 'TMMi has no automation process area. A process area outside the scope is Not Rated, and one NR process area makes the maturity level NR.'));
  }
  if (scope === 'level23') {
    return h('div', { class: 'verdict warn' },
      h('strong', {}, 'You also scoped Level 3.'),
      h('p', {}, 'A higher level cannot be achieved without the lower one (TAMAR §3.4.3.5). With Level 2 not achieved, Level 3 cannot be achieved either, whatever its own evidence shows.'));
  }
  return null;
}

function reasonField(state, ctx, locked) {
  return h('div', { class: 'field' },
    h('label', { for: 'level-reason' }, 'Your note for the report (optional)'),
    h('p', { class: 'hint', id: 'level-reason-hint' }, 'One or two sentences: why this statement, and which ratings support it.'),
    h('textarea', {
      id: 'level-reason',
      'aria-describedby': 'level-reason-hint',
      readonly: locked,
      onInput: (e) => {
        const value = e.target.value;
        ctx.update((s) => patchSlice(s, 'conclude', { levelReason: value }), { silent: true });
      },
    }, state.conclude.levelReason));
}

function afterLock(state, playerPAs, ml) {
  const expertPAs = processAreaRatings(expertRatings(), EXPERT.scope);
  const expertMl = rateMaturityLevel(expertPAs);
  const mismatch = levelConsistency(ml, state.conclude.level);
  return [
    mismatch ? h('div', { class: 'verdict warn', role: 'alert' },
      h('strong', {}, 'Your conclusion does not follow from your own ratings'),
      h('p', {}, mismatch)) : null,
    state.conclude.levelReason.trim()
      ? h('div', { class: 'compare' },
        h('div', { class: 'compare-side player' }, h('p', { class: 'eyebrow' }, 'Your note'), h('p', {}, state.conclude.levelReason)),
        h('div', { class: 'compare-side expert' }, h('p', { class: 'eyebrow' }, 'Expert note'), h('p', {}, EXPERT_WHY.level)))
      : null,
    h('h3', { class: 'c-subhead' }, 'Your process area ratings and the expert’s'),
    paComparison(playerPAs, expertPAs, ml, expertMl),
  ];
}

export function render(state, ctx) {
  const { ratings } = state.assess;
  const { scope } = state.plan;
  const { level, revealed: locked } = state.conclude;
  const playerPAs = processAreaRatings(ratings, scope);
  const ml = rateMaturityLevel(playerPAs);

  const decision = decisionBlock({
    name: 'level',
    options: LEVEL_OPTIONS,
    selected: level,
    locked,
    onSelect: (id) => ctx.update((s) => patchSlice(s, 'conclude', { level: id })),
    onLock: () => ctx.update((s) => patchSlice(s, 'conclude', { revealed: true })),
    expertId: EXPERT.level,
    expertWhy: EXPERT_WHY.level,
    extra: reasonField(state, ctx, locked),
  });

  const main = [
    section('Your result', 'The weakest link decides',
      h('p', {}, 'These are your own ratings from Step 3. Each process area takes the rating of its lowest goal. Level 2 takes the rating of its lowest process area.'),
      weakestLinkBoard({ paRatings: playerPAs, ml, ratings, scope }),
      scopeNote(scope),
      designerNote('Requirement · Rating rules (TAMAR §3.4.3.4–3.4.3.5)', 'The board is computed live from the player’s own Step 3 ratings, so every player sees the consequence of their own judgement. Highlighted chips are the goals that set each process area rating.')),
    section('Decision', 'What will you write in the report?',
      h('p', {}, 'Pick the sentence that goes into the report about the maturity level. Then lock it.'),
      decision,
      locked ? afterLock(state, playerPAs, ml) : null,
      designerNote('Requirement · Decision with expert feedback', 'After locking, the player’s statement is checked twice: against the expert’s choice and against the player’s own computed result. A statement that contradicts one’s own ratings is flagged even if it matches the expert.')),
    navRow({
      onBack: () => ctx.go(3),
      onNext: () => ctx.go(5),
      canNext: locked,
      hint: 'Lock your statement to continue.',
    }),
  ];

  const rail = [
    conceptBox('Staged model',
      h('p', {}, '“A Maturity Level may be rated as achieved by the organization if all Process Areas in scope have been rated as either Largely Achieved or Fully Achieved. Furthermore higher maturity level cannot be achieved without lower levels also being achieved.” (TAMAR §3.4.3.5)'),
      h('p', {}, 'Level 1 has no process areas: “every organization is at least at TMMi level 1” (TMMi v2.0, p.17).')),
    conceptBox('Indicative, not a rating',
      h('p', {}, 'In an informal assessment this is an indicative view for you. The report states findings, not a rating. (TAMAR §1.3.1.1.2, §2.2.4.5)')),
    evidenceBag(state, ctx.openDoc),
  ];

  return h('div', { class: 'screen screen-conclude' },
    stepHeader(4, 'Conclude', 'Turn twenty-one goal ratings into one honest sentence about the maturity level.'),
    stepLayout(main, rail));
}
