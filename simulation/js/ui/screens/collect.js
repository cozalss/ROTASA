// Step 2: collect evidence inside a fixed time window. Every request spends
// minutes that cannot be won back; a staging outage interrupts the visit.
import { h, conceptBox, designerNote, chip } from '../dom.js';
import { stepHeader, stepLayout, optionList, feedbackBox, navRow, evidenceBag, natureChip } from '../components.js';
import { patchSlice, toggleInList } from '../../store.js';
import { EVIDENCE, OPENING_MEETING, OUTAGE_EVENT, findEvidence } from '../../data/evidence.js';
import { INTERVIEWEES, OUTAGE_OPTIONS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { timeBudget, minutesLeft, availableEvidence, canCollect, outageCost, BASE_MINUTES, LEVEL3_SCOPE_PENALTY } from '../../logic/assessment.js';
import { pulse, prefersReducedMotion } from '../../fx/motion.js';
import { translate as t } from '../../i18n/i18n.js';

const OUTAGE_TRIGGER = 3;
const EXCERPT_MAX = 170;

const isOutageTriggered = (state) => state.collect.collected.length >= OUTAGE_TRIGGER;
const isOutagePending = (state) => isOutageTriggered(state) && !state.collect.outage;
const sumCost = (items) => items.reduce((t, e) => t + e.cost, 0);

// First readable line of an item, shortened at a word boundary.
function excerptOf(item) {
  const first = item.body.find((b) => b.p || b.qa || b.list);
  if (!first) return '';
  // Translate before shortening, so the dictionary sees the whole sentence.
  const text = t(first.p ?? (first.qa ? `“${first.qa[1]}”` : first.list[0]));
  if (text.length <= EXCERPT_MAX) return text;
  return `${text.slice(0, text.lastIndexOf(' ', EXCERPT_MAX))} …`;
}

// ---------- actions ----------

function request(ctx, id) {
  ctx.update((s) => (canCollect(s, id) && !isOutagePending(s)
    ? patchSlice(s, 'collect', { collected: toggleInList(s.collect.collected, id) })
    : s));
  const outage = document.getElementById('outage');
  if (outage && outage.dataset.fresh === 'true') {
    outage.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    outage.focus({ preventScroll: true });
    return;
  }
  pulse(document.getElementById(`ev-${id}`));
  document.getElementById(`open-${id}`)?.focus({ preventScroll: true });
}

function decideOutage(ctx, optionId) {
  ctx.update((s) => {
    if (s.collect.outage || !isOutageTriggered(s)) return s;
    if (outageCost(optionId) > minutesLeft(s)) return s;
    return patchSlice(s, 'collect', { outage: optionId });
  });
  document.getElementById('outage-result')?.focus({ preventScroll: true });
}

// ---------- time ledger: the budget as a dispatch board ----------

function ledger(state) {
  const budget = timeBudget(state.plan.scope);
  const left = minutesLeft(state);
  const onOffer = sumCost(availableEvidence(state.plan.interviews));
  const segments = [
    ...state.collect.collected.map((id) => ({ id, min: findEvidence(id)?.cost ?? 0, outage: false })),
    ...(state.collect.outage && outageCost(state.collect.outage) > 0
      ? [{ id: 'Outage', min: outageCost(state.collect.outage), outage: true }] : []),
  ];
  const why = state.plan.scope === 'level23'
    ? `Your Level 2 + 3 scope spends ${LEVEL3_SCOPE_PENALTY} min on Level 3 interviews and documents, so only ${budget} of ${BASE_MINUTES} min are left for Level 2.`
    : `You have ${BASE_MINUTES} min on site after the opening meeting.`;

  return h('section', { class: 'ledger', 'aria-labelledby': 'ledger-title' },
    h('div', { class: 'ledger-top' },
      h('div', {},
        h('p', { class: 'eyebrow', id: 'ledger-title' }, 'Time window · today on site'),
        h('p', { class: 'ledger-left tabular' }, h('b', {}, String(left)), h('span', {}, ' min left'))),
      h('dl', { class: 'ledger-stats' },
        stat('Window', `${budget} min`),
        stat('Spent', `${budget - left} min`),
        stat('On offer', `${onOffer} min`))),
    h('div', { class: 'ledger-bar', role: 'img', 'aria-label': `${budget - left} of ${budget} minutes spent` },
      segments.map((seg, i) => h('span', {
        class: `ledger-seg${seg.outage ? ' is-outage' : ''}${i === segments.length - 1 ? ' is-new' : ''}`,
        style: { flexBasis: `${(seg.min / budget) * 100}%` },
        title: `${seg.id}: ${seg.min} min`,
      }, seg.id)),
      h('span', { class: 'ledger-rest' })),
    h('p', { class: 'ledger-why' }, why, ' Requests cannot be undone: once you ask, the time is spent.'));
}

function stat(label, value) {
  return h('div', {}, h('dt', {}, label), h('dd', { class: 'tabular' }, value));
}

// ---------- staging outage event ----------

function outageBlock(state, ctx) {
  const chosen = state.collect.outage;
  const left = minutesLeft(state);
  const option = OUTAGE_OPTIONS.find((o) => o.id === chosen);
  const expertOption = OUTAGE_OPTIONS.find((o) => o.id === EXPERT.outage);
  const options = OUTAGE_OPTIONS.map((o) => ({ ...o, meta: o.cost > 0 ? `${o.cost} min` : '0 min' }));

  return h('section', {
    class: `outage${chosen ? ' is-decided' : ''}`,
    id: 'outage',
    tabindex: '-1',
    'aria-labelledby': 'outage-title',
    dataset: { fresh: String(!chosen && state.collect.collected.length === OUTAGE_TRIGGER) },
  },
  h('div', { class: 'outage-head' },
    h('span', { class: 'live-dot', 'aria-hidden': 'true' }),
    h('span', { class: 'outage-time mono' }, '14:10'),
    h('span', { class: 'eyebrow' }, chosen ? 'On-site event · decided' : 'On-site event · decide now')),
  h('h2', { class: 'outage-title', id: 'outage-title' }, 'Staging is down'),
  h('p', { class: 'outage-text' },
    'The Integration team’s data migration broke the Routing team’s API tests. Two teams are arguing in Slack about who may use staging. Burak from DevOps is trying to bring it back. How do you use the next hour?'),
  optionList({
    name: 'outage',
    options,
    selected: chosen,
    onSelect: (id) => decideOutage(ctx, id),
    isDisabled: (o) => Boolean(chosen) || o.cost > left,
  }),
  chosen
    ? h('div', { class: 'outage-result', id: 'outage-result', tabindex: '-1' },
      feedbackBox(chosen === EXPERT.outage, option.feedback, expertOption.title, EXPERT_WHY.outage),
      chosen === 'observe'
        ? h('div', { class: 'outage-obs' },
          h('p', {}, `Your notes are in the evidence bag as ${OUTAGE_EVENT.id}: “${OUTAGE_EVENT.title}”.`),
          h('button', { type: 'button', class: 'btn btn-secondary', onClick: () => ctx.openDoc(OUTAGE_EVENT.id) }, 'Open observation'))
        : null)
    : h('p', { class: 'muted outage-note' }, 'Your choice is final. New requests wait until you decide. Options that cost more than your time left are disabled.'),
  designerNote('Event · the plan meets reality',
    'The outage appears after the third request. Watching it is the only source of first-hand evidence for TEV G3 (managing test environments) and feeds IH G3 (configuration management).'));
}

// ---------- evidence cards ----------

function blockReason(state, item) {
  if (isOutagePending(state)) return 'Respond to the outage first';
  if (item.cost > minutesLeft(state)) return 'Not enough time';
  return null;
}

function evidenceCard(state, ctx, item) {
  const isCollected = state.collect.collected.includes(item.id);
  const reason = isCollected ? null : blockReason(state, item);
  const titleId = `ev-title-${item.id}`;
  return h('article', { class: `ev-card${isCollected ? ' is-collected' : ''}${reason ? ' is-blocked' : ''}`, id: `ev-${item.id}`, 'aria-labelledby': titleId },
    h('div', { class: 'ev-stub' },
      h('span', { class: 'ev-id' }, item.id),
      h('span', { class: 'ev-cost mono' }, `${item.cost} min`)),
    h('div', { class: 'ev-body' },
      h('div', { class: 'ev-meta' }, natureChip(item.nature), isCollected ? chip('Collected', 'player') : null),
      h('h3', { class: 'ev-title', id: titleId }, item.title),
      h('p', { class: 'ev-teaser' }, item.teaser),
      isCollected
        ? [h('blockquote', { class: 'ev-excerpt' }, excerptOf(item)),
          h('div', { class: 'ev-actions' },
            h('button', { type: 'button', class: 'btn btn-secondary', id: `open-${item.id}`, onClick: () => ctx.openDoc(item.id), 'aria-label': `Open ${item.id}: ${item.title}` }, 'Open'))]
        : h('div', { class: 'ev-actions' },
          h('button', {
            type: 'button',
            class: 'btn btn-primary',
            id: `request-${item.id}`,
            disabled: Boolean(reason),
            'aria-label': `Request ${item.id}: ${item.title} (${item.cost} min)`,
            'aria-describedby': reason ? `ev-block-${item.id}` : null,
            onClick: () => request(ctx, item.id),
          }, `Request (${item.cost} min)`),
          reason ? h('span', { class: 'ev-block', id: `ev-block-${item.id}` }, reason) : null)));
}

function group(id, title, sub, items, cards, extra) {
  return h('section', { class: 'ev-group', 'aria-labelledby': `grp-${id}` },
    h('header', { class: 'ev-group-head' },
      h('div', {},
        h('h2', { class: 'section-title', id: `grp-${id}` }, title),
        h('p', { class: 'muted' }, sub)),
      h('span', { class: 'ev-group-sum mono' }, `${items.length} · ${sumCost(items)} min`)),
    cards.length ? h('div', { class: 'ev-grid' }, cards) : null,
    extra);
}

function interviewExtras(state, ctx) {
  const unbooked = INTERVIEWEES.filter((p) => !state.plan.interviews.includes(p.id));
  return h('div', { class: 'ev-roster' },
    h('div', { class: 'ev-held' },
      h('span', { class: 'mono' }, OPENING_MEETING.id),
      h('span', {}, h('b', {}, 'Opening meeting with the CTO'), ' · already held, no cost. It is in your evidence bag.'),
      h('button', { type: 'button', class: 'btn btn-secondary', onClick: () => ctx.openDoc(OPENING_MEETING.id) }, 'Open')),
    unbooked.length
      ? h('ul', { class: 'ev-unbooked', 'aria-label': 'People you did not book' },
        unbooked.map((p) => h('li', {},
          h('span', {}, h('b', {}, p.name), ` · ${p.role}`),
          h('span', { class: 'ev-block' }, 'Not booked in Step 1'))))
      : null);
}

// ---------- screen ----------

export function render(state, ctx) {
  const available = availableEvidence(state.plan.interviews);
  const docs = available.filter((e) => e.kind === 'document');
  const talks = available.filter((e) => e.kind === 'interview');
  const others = EVIDENCE.filter((e) => e.kind === 'trap');
  const card = (item) => evidenceCard(state, ctx, item);
  const triggered = isOutageTriggered(state);
  const budget = timeBudget(state.plan.scope);

  const main = [
    stepHeader(2, 'Collect evidence',
      'You are on site at Rotaşa for one day. Choose what to read and whom to talk to. The time window is smaller than everything on offer, so every request is a choice.'),
    ledger(state),
    triggered ? outageBlock(state, ctx) : null,
    conceptBox('Evidence in TAMAR',
      h('p', {}, 'TAMAR names the evidence types: staff interviews, documents, evaluation questionnaires and customer surveys (§2.1.2). An informal assessment needs only one type and accepts it as it stands (§2.2.4.6–7). Your own observation on site is another source: nobody prepared it for you.'),
      h('p', {}, 'Each card is tagged: document (a work product), record (a by-product the work leaves), interview, account (compiled for you: F and J) or observation.')),
    group('docs', 'Documents', 'Documents, records and accounts from the case pack.', docs, docs.map(card)),
    group('talks', 'Interviews', 'Only the people you booked in Step 1 are free to meet you.', talks, talks.map(card), interviewExtras(state, ctx)),
    group('other', 'Other ways to spend time', 'Things you could also do while you are on site.', others, others.map(card)),
    designerNote('Requirement 4 · Limited resource',
      `Total requestable time is far above the budget: ${sumCost(available)} min on offer against a ${budget} min window. Requests are irreversible, so the player has to prioritise.`),
    designerNote('Decision changes later steps',
      'Only collected evidence appears in Step 3. Document E unlocks the data argument in Step 5. Document F (or the DevOps interview) decides whether you learn about the unmasked test data.'),
    navRow({
      onBack: () => ctx.go(1),
      onNext: () => ctx.go(3),
      canNext: Boolean(state.collect.outage),
      hint: triggered ? 'Decide how to handle the staging outage.' : `Collect at least ${OUTAGE_TRIGGER} items.`,
    }),
  ];

  return h('div', { class: 'screen screen-collect' },
    stepLayout(main, [evidenceBag(state, ctx.openDoc)]));
}
