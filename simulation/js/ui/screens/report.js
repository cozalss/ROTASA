// Step 5 · Report: the findings meeting with the CTO, three objections in a row.
import { h, chip, conceptBox, designerNote } from '../dom.js';
import { stepHeader, stepLayout, navRow, evidenceBag } from '../components.js';
import { patchSlice, setKey } from '../../store.js';
import { AUTOMATION_OPTIONS, ATTRIBUTION_OPTIONS, KVKK_OPTIONS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { reasoningCues } from '../../logic/assessment.js';
import { decisionBlock, speech, section } from './conclude-kit.js';
import { findingsBrief, opener, metricTiles, AUTOMATION_EXPERT_REPLY, AUTOMATION_CUES } from './report-parts.js';
import { translate as t } from '../../i18n/i18n.js';

const MIN_REPLY = 40;

export function knewTestData(state) {
  const c = state.collect.collected;
  return c.includes('F') || c.includes('H5');
}

export function reportComplete(state) {
  const r = state.report.revealed;
  return Boolean(r.automation && r.attribution && (!knewTestData(state) || r.kvkk));
}

const pick = (ctx, key) => (id) => ctx.update((s) => patchSlice(s, 'report', { [key]: id }));
const lock = (ctx, key) => () => ctx.update((s) => patchSlice(s, 'report', { revealed: setKey(s.report.revealed, key, true) }));

function objection(num, total, title, status, body) {
  const label = { open: 'Your turn', locked: 'Answered', waiting: 'Waiting', blank: 'No finding' }[status];
  const tone = { open: 'player', locked: 'good', waiting: 'neutral', blank: 'warn' }[status];
  return h('section', { class: `panel c-objection is-${status}`, 'aria-label': `Objection ${num} of ${total}: ${title}` },
    h('header', { class: 'c-objection-head' },
      h('span', { class: 'c-objection-num', 'aria-hidden': 'true' }, String(num).padStart(2, '0')),
      h('div', {}, h('p', { class: 'eyebrow' }, `Objection ${num} of ${total}`), h('h2', { class: 'section-title' }, title)),
      chip(label, tone)),
    status === 'waiting'
      ? h('p', { class: 'muted c-waiting' }, `The CTO raises this after you answer objection ${num - 1}.`)
      : body);
}

// ---------- (a) automation ----------
function replyField(state, ctx, locked) {
  const hasChoice = state.report.automation != null;
  const count = state.report.automationText.trim().length;
  return h('div', { class: 'field' },
    h('label', { for: 'automation-text' }, 'Your reply to the CTO, in his language'),
    h('p', { class: 'hint', id: 'automation-text-hint' }, `Write at least ${MIN_REPLY} characters. Point to evidence, not opinion.`),
    h('textarea', {
      id: 'automation-text',
      'aria-describedby': 'automation-text-hint automation-count',
      readonly: locked,
      onInput: (e) => {
        const value = e.target.value;
        ctx.update((s) => patchSlice(s, 'report', { automationText: value }), { silent: true });
        const len = value.trim().length;
        const counter = document.getElementById('automation-count');
        if (counter) counter.textContent = `${len} / ${MIN_REPLY}`;
        const btn = document.getElementById('automation-lock');
        const ready = hasChoice && len >= MIN_REPLY;
        if (btn) btn.disabled = !ready;
        const hint = document.getElementById('automation-lock-hint');
        if (hint) hint.textContent = t(ready ? 'Locked answers cannot be changed.' : `Choose an answer and write at least ${MIN_REPLY} characters.`);
      },
    }, state.report.automationText),
    locked ? null : h('p', { class: 'c-count tabular', id: 'automation-count', 'aria-live': 'polite' }, `${count} / ${MIN_REPLY}`));
}

function automationAfter(state) {
  const text = state.report.automationText;
  const cues = reasoningCues(text, AUTOMATION_CUES);
  return [
    h('div', { class: 'compare' },
      h('div', { class: 'compare-side player' }, h('p', { class: 'eyebrow' }, 'Your reply'), h('p', {}, text)),
      h('div', { class: 'compare-side expert' }, h('p', { class: 'eyebrow' }, 'Expert reply'), h('p', {}, AUTOMATION_EXPERT_REPLY))),
    h('p', { class: 'c-cues' },
      h('span', { class: 'eyebrow' }, `Your reply uses ${cues.length} of the expert’s key points`),
      ' ',
      cues.length ? cues.map((c) => chip(c, 'expert')) : h('span', { class: 'muted' }, 'none of them')),
    metricTiles(state.collect.collected.includes('E')),
  ];
}

function automationObjection(state, ctx) {
  const { automation, automationText, revealed } = state.report;
  const locked = Boolean(revealed.automation);
  const hasE = state.collect.collected.includes('E');
  const missing = (o) => Boolean(o.needs) && !state.collect.collected.includes(o.needs);
  return objection(1, 3, 'More automation', locked ? 'locked' : 'open', [
    speech('If we increase automation, Level 2 will follow. I want to put 300 of the 400 hours into automation.'),
    decisionBlock({
      name: 'automation',
      options: AUTOMATION_OPTIONS,
      selected: automation,
      locked,
      onSelect: pick(ctx, 'automation'),
      onLock: lock(ctx, 'automation'),
      expertId: EXPERT.automation,
      expertWhy: EXPERT_WHY.automation,
      isDisabled: missing,
      meta: (o) => (missing(o) ? 'You did not collect the metrics spreadsheet' : null),
      extra: locked ? null : replyField(state, ctx, locked),
      canLock: automation != null && automationText.trim().length >= MIN_REPLY,
      lockHint: `Choose an answer and write at least ${MIN_REPLY} characters.`,
    }),
    locked ? automationAfter(state) : null,
    designerNote(hasE ? 'Requirement · Evidence from Step 2 is usable here' : 'Requirement · Step 2 choice limits Step 5',
      hasE
        ? 'The player collected Document E, so the strongest answer is available: Rotaşa’s own numbers.'
        : 'Document E was not collected, so the data-based answer is disabled. A gap in evidence collection removes the best argument later.'),
    designerNote('Requirement · Written reasoning', 'The reply text is a required written justification. After locking it is shown next to the expert reply, with the expert’s key points it mentions.'),
  ]);
}

// ---------- (b) attribution ----------
function attributionObjection(state, ctx) {
  const { revealed, attribution } = state.report;
  const status = !revealed.automation ? 'waiting' : revealed.attribution ? 'locked' : 'open';
  return objection(2, 3, 'Who said it?', status, [
    speech('Who told you our test plans are not really approved? I want names next to each finding.'),
    conceptBox('Non-attribution',
      h('p', {}, 'The data sources are confidential and the data is non-attributable to any individual (TAMAR §3.3.1.1.1–2).'),
      h('p', {}, 'The sponsor owns the assessment data, but this does not let him demand the source of each item (TAMAR §3.2.6.2.7).')),
    decisionBlock({
      name: 'attribution',
      options: ATTRIBUTION_OPTIONS,
      selected: attribution ?? null,
      locked: Boolean(revealed.attribution),
      onSelect: pick(ctx, 'attribution'),
      onLock: lock(ctx, 'attribution'),
      expertId: EXPERT.attribution,
      expertWhy: EXPERT_WHY.attribution,
    }),
  ]);
}

// ---------- (c) test data ----------
function testDataObjection(state, ctx) {
  const { revealed, kvkk } = state.report;
  const knew = knewTestData(state);
  const status = !revealed.attribution ? 'waiting' : !knew ? 'blank' : revealed.kvkk ? 'locked' : 'open';
  if (!knew) {
    return objection(3, 3, 'Test data', status, [
      h('div', { class: 'c-blank', role: 'note' },
        h('p', { class: 'c-blank-head' }, 'You did not learn how staging data is created'),
        h('p', {}, 'You collected neither the pipeline notes (F) nor the DevOps interview (H5). There is no test data finding to defend, so the CTO has nothing to object to.')),
      designerNote('Requirement · Missing evidence has a later cost', 'No decision is offered here and report.kvkk stays empty. The consequence of the unseen unmasked production copy appears in Step 7.'),
    ]);
  }
  return objection(3, 3, 'Test data', status, [
    speech('The production data copy in staging is a DevOps and legal matter. Take it out of a test report.'),
    decisionBlock({
      name: 'kvkk',
      options: KVKK_OPTIONS,
      selected: kvkk,
      locked: Boolean(revealed.kvkk),
      onSelect: pick(ctx, 'kvkk'),
      onLock: lock(ctx, 'kvkk'),
      expertId: EXPERT.kvkk,
      expertWhy: EXPERT_WHY.kvkk,
    }),
  ]);
}

export function render(state, ctx) {
  const done = reportComplete(state);
  const main = [
    section('Before the meeting', 'Your findings, by process area',
      h('p', {}, 'Generated from your Step 3 ratings. For each process area: the goals that set its rating, and any strengths.'),
      findingsBrief(state)),
    section('Findings meeting · CTO office', 'Murat Kaya reads your findings',
      opener(state.plan.type),
      designerNote('Requirement · An early decision changes a later step', 'The CTO’s opening line and the verdict under it depend on the assessment type agreed in Step 1. A promised certificate turns into a credibility problem here.')),
    automationObjection(state, ctx),
    attributionObjection(state, ctx),
    testDataObjection(state, ctx),
    navRow({
      onBack: () => ctx.go(4),
      onNext: () => ctx.go(6),
      canNext: done,
      hint: 'Answer and lock every objection to continue.',
    }),
  ];
  const rail = [
    conceptBox('Report for your audience',
      h('p', {}, 'Report in the audience’s language (W1 p.19). A CTO decides on money and risk.'),
      h('p', {}, 'Report residual risk, not pass/fail counts (W2 p.26). “73% of the regression ran” means little; “last week’s routing-engine changes went out not fully tested” is a risk he can act on.'),
      h('p', {}, 'Ratings stay in your working notes; the CTO receives strengths and weaknesses, not ratings (TAMAR §3.5.2.7).')),
    evidenceBag(state, ctx.openDoc),
  ];
  return h('div', { class: 'screen screen-report' },
    stepHeader(5, 'Report', 'Present your findings to the sponsor. He will push back three times.'),
    stepLayout(main, rail));
}
