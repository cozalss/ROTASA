// Step 1 · Plan. Three decisions, each locked once confirmed, as in an
// assessment plan agreed with the sponsor before the assessment starts.
import { h, conceptBox, designerNote, button, chip, formatMinutes } from '../dom.js';
import { stepHeader, stepLayout, optionList, feedbackBox, navRow } from '../components.js';
import { patchSlice, toggleInList } from '../../store.js';
import { SCOPE_OPTIONS, TYPE_OPTIONS, INTERVIEWEES, INTERVIEW_SLOTS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { findEvidence } from '../../data/evidence.js';
import { timeBudget, LEVEL3_SCOPE_PENALTY } from '../../logic/assessment.js';
import { joinAnd } from '../../i18n/i18n.js';

const DECISIONS = [
  { key: 'scope', lock: 'scopeLocked', letter: 'A', label: 'Scope' },
  { key: 'type', lock: 'typeLocked', letter: 'B', label: 'Assessment type' },
  { key: 'interviews', lock: 'interviewsLocked', letter: 'C', label: 'Interviews' },
];

const ORG = [
  ['CTO', 'Murat Kaya; all technical teams report to him'],
  ['Routing team', '8 developers, 1 test engineer'],
  ['Field team', '7 developers, 1 test engineer'],
  ['Integration team', '6 developers, 1 test engineer'],
  ['QA lead', 'Deniz Arslan; also tests in Routing'],
  ['DevOps', 'Burak Şahin; CI/CD and environments'],
  ['Product owners', 'Kerem Demir (Routing, Integration), Aylin Çelik (Field)'],
];

const QUADRANTS = [
  { name: 'Latents', where: 'High influence · low interest', how: 'Keep satisfied' },
  { name: 'Promoters', where: 'High influence · high interest', how: 'Manage closely' },
  { name: 'Apathetics', where: 'Low influence · low interest', how: 'Monitor' },
  { name: 'Defenders', where: 'Low influence · high interest', how: 'Keep informed' },
];

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

const titleOf = (options, id) => options.find((o) => o.id === id)?.title ?? '';
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const nameOf = (id) => INTERVIEWEES.find((p) => p.id === id)?.name ?? id;

// Re-rendering replaces the stage, so focus is put back where the player was.
function refocus(id) {
  document.getElementById(id)?.focus({ preventScroll: true });
}

function choose(ctx, decision, value, focusId) {
  ctx.update((s) => (s.plan[decision.lock] ? s : patchSlice(s, 'plan', { [decision.key]: value(s.plan) })));
  refocus(focusId);
}

function lock(ctx, decision) {
  ctx.update((s) => patchSlice(s, 'plan', { [decision.lock]: true }));
  refocus(`plan-${decision.key}-result`);
}

export function render(state, ctx) {
  const { plan } = state;
  const allLocked = DECISIONS.every((d) => plan[d.lock]);
  return h('div', { class: 'plan' },
    stepHeader(1, 'Plan the assessment',
      'Agree with the sponsor what you will assess, what kind of result you will deliver and whom you will talk to. Each decision locks when you confirm it.'),
    stepLayout(
      [
        pips(plan),
        scopeDecision(plan, ctx),
        typeDecision(plan, ctx),
        interviewDecision(plan, ctx),
        navRow({
          onBack: () => ctx.go(0),
          onNext: () => ctx.go(2),
          nextLabel: 'Continue to Step 2',
          canNext: allLocked,
          hint: 'Lock all three decisions to continue.',
        }),
      ],
      [caseAtAGlance(), stakeholderConcept()]));
}

function pips(plan) {
  return h('ol', { class: 'plan-pips', 'aria-label': 'Plan decisions' },
    DECISIONS.map((d) => h('li', { class: plan[d.lock] ? 'is-locked' : null },
      h('span', { class: 'plan-pip-letter', 'aria-hidden': 'true' }, d.letter),
      h('span', {}, d.label),
      h('span', { class: 'plan-pip-state' }, plan[d.lock] ? 'Locked' : 'Open'))));
}

// Shared frame for one decision: lettered gutter, situation, body, lock row.
function decisionCard(decision, plan, { title, situation, body, canLock, lockLabel, ctx, result }) {
  const locked = Boolean(plan[decision.lock]);
  const headingId = `plan-${decision.key}-title`;
  return h('section', { class: `plan-decision${locked ? ' is-locked' : ''}`, 'aria-labelledby': headingId },
    h('div', { class: 'plan-gutter', 'aria-hidden': 'true' }, h('span', {}, decision.letter)),
    h('div', { class: 'plan-card' },
      h('div', { class: 'plan-card-head' },
        h('p', { class: 'eyebrow' }, `Decision ${decision.letter} · ${decision.label}`),
        locked ? chip('Locked', 'player') : null),
      h('h2', { id: headingId, class: 'section-title' }, title),
      situation,
      body,
      locked
        ? h('div', { id: `plan-${decision.key}-result`, class: 'plan-result', tabindex: '-1' }, result())
        : h('div', { class: 'plan-lock-row' },
          button(lockLabel, () => lock(ctx, decision), { disabled: !canLock }),
          h('p', { class: 'muted plan-lock-hint' }, canLock ? 'Locked decisions cannot be changed.' : 'Choose first, then lock.'))));
}

function situationBox(speaker, quote, context) {
  return h('div', { class: 'situation' },
    h('p', { class: 'eyebrow' }, speaker),
    quote ? h('p', { class: 'quote' }, `“${quote}”`) : null,
    context ? h('p', {}, context) : null);
}

function singleChoice(decision, plan, ctx, options) {
  const locked = Boolean(plan[decision.lock]);
  const name = `plan-${decision.key}`;
  return optionList({
    name,
    options,
    selected: plan[decision.key],
    isDisabled: () => locked,
    onSelect: (id) => choose(ctx, decision, () => id, `${name}-${id}`),
    meta: () => null,
  });
}

function singleResult(options, playerId, expertId, why) {
  const option = options.find((o) => o.id === playerId);
  return feedbackBox(playerId === expertId, option?.feedback, titleOf(options, expertId), why);
}

// ---------- A · scope ----------
function scopeDecision(plan, ctx) {
  const d = DECISIONS[0];
  return decisionCard(d, plan, {
    ctx,
    title: 'What will you assess?',
    situation: situationBox('Opening call · Murat Kaya, CTO', 'I think if we increase automation, Level 2 will follow.',
      'The goal he set is TMMi Level 2 in 12 months. Release 4.1 was built by all three teams together.'),
    body: [
      singleChoice(d, plan, ctx, SCOPE_OPTIONS),
      designerNote('Requirement · Decision affects later steps',
        `Automation only makes every Level 2 process area Not Rated (NR) in Step 4, so no level can be concluded. Level 2 and 3 removes ${LEVEL3_SCOPE_PENALTY} minutes from the Step 2 time window. Step 7 shows the six-month consequence of each scope.`),
    ],
    canLock: Boolean(plan.scope),
    lockLabel: 'Lock scope',
    result: () => [
      singleResult(SCOPE_OPTIONS, plan.scope, EXPERT.scope, EXPERT_WHY.scope),
      h('p', { class: 'plan-consequence' },
        h('span', { class: 'eyebrow' }, 'Carried to Step 2'),
        h('span', {}, `Time on site for evidence: ${formatMinutes(timeBudget(plan.scope))}.`)),
    ],
  });
}

// ---------- B · assessment type ----------
function typeDecision(plan, ctx) {
  const d = DECISIONS[1];
  return decisionCard(d, plan, {
    ctx,
    title: 'What kind of result will you deliver?',
    situation: situationBox('Opening call · Murat Kaya, CTO',
      'We need a certificate we can show customers.',
      'One customer’s supplier assessment questionnaire asks: “Has your test process been assessed against a maturity model?”'),
    body: [formalVsInformal(), singleChoice(d, plan, ctx, TYPE_OPTIONS)],
    canLock: Boolean(plan.type),
    lockLabel: 'Lock assessment type',
    result: () => singleResult(TYPE_OPTIONS, plan.type, EXPERT.type, EXPERT_WHY.type),
  });
}

function formalVsInformal() {
  const rows = [
    ['Led by', 'An accredited lead assessor', 'An experienced assessor; accreditation not needed'],
    ['Team', 'At least 2, including another accredited assessor', 'May be one person'],
    ['Evidence', 'Interviews corroborated by documents', 'One type of evidence; no corroboration required'],
    ['Result', 'Can produce a formal maturity rating', 'Findings, not rated; no formal maturity rating'],
  ];
  return conceptBox('Formal vs informal assessment',
    h('div', { class: 'table-wrap plan-compare' },
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, 'Formal'), h('th', { scope: 'col' }, 'Informal'))),
        h('tbody', {}, rows.map(([label, formal, informal]) => h('tr', {},
          h('th', { scope: 'row' }, label), h('td', { 'data-label': 'Formal' }, formal), h('td', { 'data-label': 'Informal' }, informal)))))),
    h('p', { class: 'muted plan-source' }, 'Source: TAMAR R1.3, §1.3.1.1, §2.1.1.3, §2.2.3–2.2.4.'));
}

// ---------- C · interviews ----------
function interviewDecision(plan, ctx) {
  const d = DECISIONS[2];
  const locked = Boolean(plan.interviewsLocked);
  const chosen = plan.interviews;
  const options = INTERVIEWEES.map((p) => ({
    id: p.id,
    title: p.name,
    body: `${p.role}. ${p.note}`,
    meta: `${findEvidence(p.evidence)?.cost ?? 30} min`,
  }));
  return decisionCard(d, plan, {
    ctx,
    title: 'Whom will you interview?',
    situation: situationBox('Sprint 38 · Scheduling', null,
      `Sprint 38 is busy. The CTO can release only ${NUMBER_WORDS[INTERVIEW_SLOTS] ?? INTERVIEW_SLOTS} people for a 30-minute interview this week. You already had the opening meeting with him.`),
    body: [
      h('p', { class: 'plan-count', 'aria-live': 'polite' },
        h('b', { class: 'tabular' }, `${chosen.length} of ${INTERVIEW_SLOTS}`), ' interview slots booked'),
      optionList({
        name: 'plan-interviews',
        options,
        selected: chosen,
        multi: true,
        isDisabled: () => locked || chosen.length >= INTERVIEW_SLOTS,
        onSelect: (id) => choose(ctx, d, (p) => toggleInList(p.interviews, id, INTERVIEW_SLOTS), `plan-interviews-${id}`),
      }),
      h('p', { class: 'plan-note' },
        h('strong', {}, 'Booked people only. '),
        'In Step 2 you can interview only the people you book now. Everyone else reaches you through documents.'),
      designerNote('Requirement · Decision changes later steps', 'Only booked people appear in Step 2. Booking the product owner also changes the Step 7 outcome for release decisions.'),
    ],
    canLock: chosen.length === INTERVIEW_SLOTS,
    lockLabel: 'Lock interview plan',
    result: () => interviewResult(chosen),
  });
}

function interviewResult(chosen) {
  const match = sameSet(chosen, EXPERT.interviews);
  const names = (ids) => joinAnd(ids.map(nameOf));
  const yours = `In Step 2 you can interview ${names(chosen)}.`;
  return feedbackBox(match, match ? `${yours} ${EXPERT_WHY.interviews}` : yours, names(EXPERT.interviews), EXPERT_WHY.interviews);
}

// ---------- right rail ----------
function caseAtAGlance() {
  return h('section', { class: 'panel plan-glance', 'aria-labelledby': 'plan-glance-title' },
    h('p', { class: 'eyebrow' }, 'Case at a glance'),
    h('h2', { id: 'plan-glance-title', class: 'panel-title' }, 'Who is who at Rotaşa'),
    h('dl', { class: 'plan-org' },
      ORG.map(([unit, people]) => h('div', {}, h('dt', {}, unit), h('dd', {}, people)))),
    h('p', { class: 'muted plan-glance-foot' }, 'Scrum, two-week sprints. A major release every six sprints. 4.2 runs in Sprints 37–42.'));
}

function stakeholderConcept() {
  return conceptBox('Stakeholders: influence × interest',
    h('p', {}, 'Map each stakeholder by how much they can change testing and how much they care about it.'),
    h('div', { class: 'plan-matrix', role: 'list', 'aria-label': 'Stakeholder matrix' },
      QUADRANTS.map((q) => h('div', { class: 'plan-quad', role: 'listitem' },
        h('b', {}, q.name),
        h('span', {}, q.where),
        h('span', { class: 'plan-quad-how' }, q.how)))),
    h('p', { class: 'plan-matrix-axes muted' }, '↑ influence · interest →'),
    h('p', {}, 'Ask: who can change how testing is planned and how releases are decided? Whose view will the documents give you anyway?'),
    h('p', { class: 'muted plan-source' }, 'Source: course lecture, Week 1, p.27.'));
}
