// Building blocks for Step 3: process area tabs, goal cards, the rating
// scale, the written-reasoning form and the player/expert comparison.
import { h, chip, designerNote } from '../dom.js';
import { natureChip } from '../components.js';
import { patchSlice, setKey } from '../../store.js';
import { pulse } from '../../fx/motion.js';
import { PROCESS_AREAS, RATINGS, REASONED_GOALS, REASON_PROMPTS } from '../../data/tmmi.js';
import { findingsForGoal, knownEvidenceIds, compareRating, reasoningCues, COMPARE_LABELS } from '../../logic/assessment.js';

export const MIN_REASON = 40;
export const DEFAULT_PA = PROCESS_AREAS[0].id;

const ratingKey = (id) => (id === '?' ? 'NR' : id);
const shownRating = (id) => (id === '?' ? 'NR' : id);
const focusById = (id) => document.getElementById(id)?.focus({ preventScroll: true });
const canLock = (rating, text) => Boolean(rating) && (text || '').trim().length >= MIN_REASON;

// ---------- actions ----------

function rate(ctx, goalId, ratingId) {
  ctx.update((s) => (s.assess.revealed[goalId]
    ? s
    : patchSlice(s, 'assess', { ratings: setKey(s.assess.ratings, goalId, ratingId) })));
  focusById(`rate-${goalId}-${ratingKey(ratingId)}`);
  pulse(document.getElementById(`stamp-${goalId}`));
}

function lockReasoning(ctx, goalId) {
  ctx.update((s) => (canLock(s.assess.ratings[goalId], s.assess.reasons[goalId])
    ? patchSlice(s, 'assess', { revealed: setKey(s.assess.revealed, goalId, true) })
    : s));
  focusById(`reveal-${goalId}`);
  pulse(document.getElementById(`reveal-${goalId}`));
}

export function openPa(ctx, paId) {
  ctx.update((s) => patchSlice(s, 'assess', { openPa: paId }));
  focusById(`tab-${paId}`);
}

// ---------- process area tabs ----------

function onTabKey(event, ctx, index) {
  const last = PROCESS_AREAS.length - 1;
  const moves = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: last };
  if (!(event.key in moves)) return;
  event.preventDefault();
  const next = (moves[event.key] + PROCESS_AREAS.length) % PROCESS_AREAS.length;
  openPa(ctx, PROCESS_AREAS[next].id);
}

export function paTabs(state, ctx, openId) {
  const { ratings } = state.assess;
  return h('div', { class: 'pa-tabs', id: 'pa-tabs', role: 'tablist', 'aria-label': 'Level 2 process areas' },
    PROCESS_AREAS.map((pa, i) => {
      const selected = pa.id === openId;
      const rated = pa.goals.filter((g) => ratings[g.id]).length;
      const writes = pa.goals.some((g) => REASONED_GOALS.includes(g.id));
      return h('button', {
        type: 'button',
        role: 'tab',
        id: `tab-${pa.id}`,
        class: `pa-tab${rated === pa.goals.length ? ' is-complete' : ''}`,
        'aria-selected': String(selected),
        'aria-controls': 'pa-panel',
        tabindex: selected ? '0' : '-1',
        onClick: () => openPa(ctx, pa.id),
        onKeydown: (e) => onTabKey(e, ctx, i),
      },
      h('span', { class: 'pa-tab-code mono' }, pa.code, writes ? h('span', { class: 'pa-tab-flag' }, 'write') : null),
      h('span', { class: 'pa-tab-name' }, pa.name),
      h('span', { class: 'pa-tab-foot' },
        h('span', { class: 'pa-tab-dots', 'aria-hidden': 'true' },
          pa.goals.map((g) => h('span', { class: `dot${ratings[g.id] ? ' on' : ''}${REASONED_GOALS.includes(g.id) ? ' reasoned' : ''}` }))),
        h('span', { class: 'pa-tab-count mono' }, `${rated}/${pa.goals.length}`)));
    }));
}

// ---------- evidence findings for one goal ----------

function evidenceList(goalId, known, openDoc) {
  const findings = findingsForGoal(goalId, known);
  if (findings.length === 0) {
    return h('p', { class: 'goal-empty' },
      'You collected nothing about this goal. Rate it ‘?’ (not enough evidence) or rate from what you know.');
  }
  return h('ul', { class: 'evidence-list goal-evidence' }, findings.map(({ evidence, text }) =>
    h('li', { class: 'evidence-item' },
      h('span', { class: 'goal-evidence-meta' },
        natureChip(evidence.nature),
        h('button', { type: 'button', class: 'src-btn mono', onClick: () => openDoc(evidence.id), 'aria-label': `Open source ${evidence.id}: ${evidence.title}` }, evidence.id)),
      h('span', {}, text))));
}

// ---------- rating scale ----------

function ratingScale(ctx, goal, current, locked) {
  return h('div', { class: 'rating-scale', role: 'group', 'aria-label': `Your rating for ${goal.name}` },
    RATINGS.map((r) => h('button', {
      type: 'button',
      class: 'rating-btn',
      id: `rate-${goal.id}-${ratingKey(r.id)}`,
      'aria-pressed': String(current === r.id),
      'aria-label': `${r.id === '?' ? 'Not rated' : r.id}: ${r.label}, ${r.range}`,
      disabled: locked,
      onClick: () => rate(ctx, goal.id, r.id),
    },
    h('b', {}, r.id),
    h('span', {}, r.label))));
}

// ---------- written reasoning and the reveal ----------

function reasonForm(state, ctx, goal) {
  const text = state.assess.reasons[goal.id] ?? '';
  const rating = state.assess.ratings[goal.id];
  const areaId = `reason-${goal.id}`;
  const countText = (v) => `${v.trim().length} / ${MIN_REASON} characters minimum`;
  const counter = h('span', { class: 'reason-count mono', id: `${areaId}-count` }, countText(text));
  const lockBtn = h('button', {
    type: 'button',
    class: 'btn btn-primary',
    id: `lock-${goal.id}`,
    disabled: !canLock(rating, text),
    onClick: () => lockReasoning(ctx, goal.id),
  }, 'Lock rating and compare');
  const onInput = (e) => {
    const value = e.target.value;
    ctx.update((s) => patchSlice(s, 'assess', { reasons: setKey(s.assess.reasons, goal.id, value) }), { silent: true });
    counter.textContent = countText(value);
    lockBtn.disabled = !canLock(rating, value);
  };
  return h('div', { class: 'field reason-form' },
    h('label', { for: areaId }, 'Your reasoning (cite the documents or interviews behind it)'),
    h('p', { class: 'hint', id: `${areaId}-hint` }, rating
      ? 'Write why the evidence supports your rating. Once locked, the rating cannot change.'
      : 'Choose a rating above, then write why the evidence supports it.'),
    h('textarea', { id: areaId, required: true, 'aria-describedby': `${areaId}-hint ${areaId}-count`, onInput }, text),
    h('div', { class: 'reason-foot' }, counter, lockBtn));
}

const VERDICT_TEXT = {
  match: () => 'You reached the expert’s rating.',
  defensible: (g) => `An expert panel would also accept ${g.accept.join(' or ')}.`,
  differs: () => 'One step from the expert. Look again at which evidence pulls the rating up or down.',
  contradicts: () => 'Two or more steps from the expert. The evidence points the other way.',
  unsupported: () => 'You rated without the evidence the expert relied on. Collect it next time, or rate ‘?’.',
  'honest-gap': () => 'You did not collect the key evidence and said so. TAMAR rates such a goal NR, which makes the whole process area NR.',
  avoided: () => 'The key evidence was in your bag, so a rating was possible.',
  missing: () => 'No rating was given.',
};

function reveal(state, goal) {
  const known = knownEvidenceIds(state);
  const rating = state.assess.ratings[goal.id];
  const text = state.assess.reasons[goal.id] ?? '';
  const prompt = REASON_PROMPTS[goal.id];
  const cmp = compareRating(goal.id, rating, known);
  const hits = reasoningCues(text, prompt.cues);
  return h('div', { class: 'reveal', id: `reveal-${goal.id}`, tabindex: '-1', 'aria-label': `Your rating compared with the expert for ${goal.name}` },
    h('div', { class: 'compare' },
      h('div', { class: 'compare-side player' },
        h('p', { class: 'eyebrow' }, 'You'),
        h('p', { class: 'compare-grade' }, shownRating(rating)),
        h('p', { class: 'compare-text' }, text)),
      h('div', { class: 'compare-side expert' },
        h('p', { class: 'eyebrow' }, 'Expert'),
        h('p', { class: 'compare-grade' }, goal.expert),
        h('p', { class: 'compare-text' }, prompt.expert))),
    h('div', { class: `verdict ${cmp.tone}` },
      h('strong', {}, COMPARE_LABELS[cmp.status]),
      h('p', {}, VERDICT_TEXT[cmp.status](goal))),
    h('p', { class: 'cue-line' },
      h('span', { class: 'cue-meter', 'aria-hidden': 'true' },
        prompt.cues.map((_, i) => h('span', { class: i < hits.length ? 'on' : '' }))),
      `Your reasoning mentions ${hits.length} of the expert’s ${prompt.cues.length} key points.`),
    h('p', { class: 'key-line' },
      h('span', { class: 'eyebrow' }, 'Expert’s key evidence'),
      goal.key.map((id) => chip(`${id} · ${known.includes(id) ? 'in your bag' : 'not collected'}`, known.includes(id) ? 'good' : 'neutral'))));
}

// ---------- goal card ----------

export function goalCard(state, ctx, goal) {
  const rating = state.assess.ratings[goal.id];
  const reasonedIndex = REASONED_GOALS.indexOf(goal.id);
  const isReasoned = reasonedIndex >= 0;
  const revealed = Boolean(state.assess.revealed[goal.id]);
  const known = knownEvidenceIds(state);
  const [, short] = goal.id.split('-');

  return h('article', { class: `goal-card${isReasoned ? ' is-reasoned' : ''}${rating ? ' is-rated' : ''}`, 'aria-labelledby': `goal-${goal.id}` },
    h('header', { class: 'goal-head' },
      h('span', { class: 'goal-code', 'aria-hidden': 'true' }, short),
      h('div', { class: 'goal-titles' },
        h('p', { class: 'eyebrow' }, `${goal.id}${isReasoned ? ' · written reasoning' : ''}${revealed ? ' · locked' : ''}`),
        h('h3', { class: 'goal-name', id: `goal-${goal.id}` }, goal.name)),
      h('span', { class: `goal-stamp${rating ? ' on' : ''}`, id: `stamp-${goal.id}`, 'aria-label': rating ? `Rated ${shownRating(rating)}` : 'Not rated yet' },
        rating ? shownRating(rating) : '–')),
    h('div', { class: 'goal-section' },
      h('p', { class: 'eyebrow' }, 'Your evidence'),
      evidenceList(goal.id, known, ctx.openDoc)),
    isReasoned ? h('p', { class: 'goal-question' }, REASON_PROMPTS[goal.id].question) : null,
    ratingScale(ctx, goal, rating, revealed),
    isReasoned ? (revealed ? reveal(state, goal) : reasonForm(state, ctx, goal)) : null,
    isReasoned
      ? designerNote(`Requirement · Written reasoning (${reasonedIndex + 1} of 2)`,
        'The player justifies a rating in free text, locks it, and then sees the expert’s rating and reasoning side by side, with a check of which key points and key evidence they used.')
      : null);
}

// ---------- rating sheet in the rail ----------

export function ratingSheet(state, ctx, openId) {
  const { ratings } = state.assess;
  return h('section', { class: 'panel rating-sheet', 'aria-label': 'Rating sheet' },
    h('p', { class: 'eyebrow' }, 'Rating sheet'),
    h('ul', { class: 'sheet-rows' }, PROCESS_AREAS.map((pa) => h('li', {},
      h('button', {
        type: 'button',
        class: `sheet-row${pa.id === openId ? ' is-open' : ''}`,
        onClick: () => {
          openPa(ctx, pa.id);
          document.getElementById('pa-tabs')?.scrollIntoView({ block: 'start' });
        },
        'aria-label': `${pa.code} ${pa.name}: ${pa.goals.filter((g) => ratings[g.id]).length} of ${pa.goals.length} rated`,
      },
      h('span', { class: 'sheet-code mono' }, pa.id),
      h('span', { class: 'sheet-cells', 'aria-hidden': 'true' },
        pa.goals.map((g) => h('span', { class: `sheet-cell${ratings[g.id] ? ' on' : ''}` }, ratings[g.id] ? shownRating(ratings[g.id]) : ''))))))),
    h('p', { class: 'muted sheet-note' }, 'You can change any rating except the two locked with written reasoning.'));
}
