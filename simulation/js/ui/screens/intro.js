// Step 0 · Briefing. An editorial landing: the 4.1 overnight window as the
// hero, then the case brief, the seven steps and a one-minute TMMi primer.
import { h, conceptBox, designerNote, button, chip } from '../dom.js';
import { STEP_TITLES } from '../components.js';
import { mountRouteScene } from '../../fx/scene3d.js';
import { PROCESS_AREAS, RATINGS, ALL_GOALS } from '../../data/tmmi.js';
import { BUDGET } from '../../data/decisions.js';

// The 3D scene survives re-renders of this screen: the same host node is moved
// into each new tree. It is disposed when the host leaves the document.
let scene = null; // { host, cleanup }

function sceneHost() {
  if (scene) return scene.host;
  const host = h('div', { class: 'intro-scene', 'aria-hidden': 'true' });
  const entry = { host, cleanup: null };
  scene = entry;
  requestAnimationFrame(() => {
    if (scene !== entry) return;
    if (!host.isConnected) { scene = null; return; }
    entry.cleanup = mountRouteScene(host, { onDispose: () => { if (scene === entry) scene = null; } });
  });
  return host;
}

const COMPANY = [
  ['85', 'employees'],
  ['140', 'business customers on RotaPlan'],
  ['~12,000', 'deliveries planned a day'],
  ['3', 'development teams'],
];

const INCIDENT = [
  ['41 h', 'in production before the fix'],
  ['~1,900', 'deliveries affected'],
  ['1', 'contract penalty applied'],
  ['0', 'written post-incident reviews'],
];

const TIMELINE = [
  ['End of Sprint 36', 'RotaPlan 4.1 is released.'],
  ['Two days later', 'Three large customers report overnight deliveries scheduled outside their customers’ windows. For windows that cross midnight, such as 22:00–02:00, the routing engine did not move the end time to the next day.'],
  ['Patch 4.1.1', 'The fix ships. The issue is discussed in a Slack channel and closed. Nobody writes a post-incident review.'],
];

const STEP_LINES = [
  'Set the scope, agree what kind of assessment this is, and book two interviews.',
  'Request documents and hold interviews in a limited time on site.',
  `Rate each of the ${ALL_GOALS.length} Level 2 goals N, P, L or F, and justify two ratings in writing.`,
  'Decide what you can honestly say about Rotaşa’s maturity level.',
  'Present your findings to the CTO and answer his objections.',
  `Choose improvement actions within ${BUDGET.hours} person-hours and TRY ${BUDGET.money.toLocaleString('en-US')}.`,
  'See Rotaşa six months later, and compare your path with the expert’s.',
];

const LEVELS = ['Initial', 'Managed', 'Defined', 'Measured', 'Optimization'];

export function render(state, ctx) {
  return h('div', { class: 'intro' },
    hero(state, ctx),
    h('div', { class: 'intro-body' },
      h('div', { class: 'step-main intro-main' },
        companySection(),
        incidentSection(),
        assignmentSection(),
        stepsSection()),
      h('div', { class: 'step-rail intro-aside' },
        tmmiPrimer(),
        requirementsNote()),
      launch(state, ctx)));
}

function actions(state, ctx, { onDark = false } = {}) {
  const started = state.maxStep > 0;
  const row = h('div', { class: `btn-row intro-actions${onDark ? ' on-dark' : ''}` },
    started
      ? button(`Continue where you left off · Step ${state.maxStep}: ${STEP_TITLES[state.maxStep]}`, () => ctx.go(state.maxStep))
      : null,
    button(started ? 'Go to Step 1: Plan' : 'Start the assessment', () => ctx.go(1), { variant: started ? 'secondary' : 'primary' }),
    started ? resetControl(ctx) : null);
  return row;
}

// "Start over" erases progress, so it asks once. The confirmation lives in the
// DOM on purpose: if anything re-renders, it falls back to the safe state.
function resetControl(ctx) {
  const slot = h('span', { class: 'intro-reset' });
  const ask = () => {
    const yes = button('Yes, erase and start over', () => ctx.reset(), { variant: 'secondary' });
    slot.replaceChildren(
      h('span', { class: 'intro-reset-q', role: 'status' }, 'Erase all your decisions?'),
      yes,
      button('Cancel', () => { slot.replaceChildren(trigger()); slot.querySelector('button')?.focus(); }, { variant: 'secondary' }));
    yes.focus();
  };
  const trigger = () => button('Start over', ask, { variant: 'secondary' });
  slot.append(trigger());
  return slot;
}

function hero(state, ctx) {
  return h('section', { class: 'intro-hero', 'aria-labelledby': 'intro-title' },
    sceneHost(),
    h('div', { class: 'intro-hero-copy' },
      h('p', { class: 'eyebrow intro-kicker' }, 'Briefing · Sprint 38 · RotaPlan 4.2 in test'),
      h('h1', { id: 'intro-title', class: 'intro-title' }, 'Rotaşa Assessment ', h('span', { class: 'intro-title-accent' }, 'Desk')),
      h('p', { class: 'intro-role' },
        'You are the external assessor. Rotaşa’s CTO wants TMMi Level 2 in 12 months. Find out where the test process really stands, and what to fix first.'),
      windowStrip(),
      actions(state, ctx, { onDark: true })));
}

function windowStrip() {
  return h('div', { class: 'intro-window', role: 'img', 'aria-label': 'A delivery window from 22:00 to 02:00. Release 4.1 did not move the 02:00 end time to the next day, so the part after midnight broke.' },
    h('div', { class: 'intro-window-bar' },
      h('span', { class: 'seg seg-ok' }),
      h('span', { class: 'seg-gap' }),
      h('span', { class: 'seg seg-broken' })),
    h('div', { class: 'intro-window-labels' },
      h('span', {}, '22:00'),
      h('span', { class: 'is-midnight' }, '00:00'),
      h('span', { class: 'is-broken' }, '02:00')),
    h('p', { class: 'intro-window-caption' }, 'Release 4.1 · the end time never moved to the next day.'));
}

function stats(items, tone) {
  return h('dl', { class: `intro-stats tone-${tone}` },
    items.map(([value, label]) => h('div', { class: 'intro-stat' },
      h('dt', {}, label),
      h('dd', { class: 'tabular' }, value))));
}

function companySection() {
  return h('section', { class: 'intro-section', 'aria-labelledby': 'intro-company' },
    h('p', { class: 'eyebrow' }, 'The company'),
    h('h2', { id: 'intro-company', class: 'section-title' }, 'Rotaşa Technology'),
    h('p', { class: 'intro-prose' },
      'Rotaşa sells RotaPlan, route planning and delivery tracking software for logistics firms. The routing engine assigns orders to vehicles and calculates routes within each customer’s delivery time windows.'),
    stats(COMPANY, 'neutral'));
}

function incidentSection() {
  return h('section', { class: 'intro-section', 'aria-labelledby': 'intro-incident' },
    h('p', { class: 'eyebrow' }, 'The incident'),
    h('h2', { id: 'intro-incident', class: 'section-title' }, 'What went wrong in 4.1'),
    stats(INCIDENT, 'alert'),
    h('ol', { class: 'intro-timeline' },
      TIMELINE.map(([when, what]) => h('li', {},
        h('span', { class: 'intro-when mono' }, when),
        h('p', {}, what)))));
}

function assignmentSection() {
  return h('section', { class: 'intro-section intro-assignment', 'aria-labelledby': 'intro-job' },
    h('div', { class: 'intro-goal' },
      h('p', { class: 'eyebrow' }, 'The CTO’s goal · Murat Kaya'),
      h('p', { class: 'intro-goal-quote' }, '“TMMi Level 2 within 12 months.”'),
      h('p', { class: 'muted' },
        'After the incident the general manager asked him to “make the test process safe”. He also remembers that one customer’s supplier questionnaire asks whether the test process has been assessed against a maturity model.')),
    h('div', { class: 'intro-job' },
      h('p', { class: 'eyebrow' }, 'Your assignment'),
      h('h2', { id: 'intro-job', class: 'section-title' }, 'Assess, then plan'),
      h('ul', { class: 'intro-job-list' },
        h('li', {}, h('strong', {}, 'An informal assessment '), 'of Rotaşa’s test process against TMMi Level 2.'),
        h('li', {}, h('strong', {}, 'A prioritized improvement plan '), 'that the CTO can fund and staff.'),
        h('li', {}, 'The test process for RotaPlan 4.2 (Sprints 37–42) is running while you assess. 4.1 is your history.'))));
}

function stepsSection() {
  return h('section', { class: 'intro-section', 'aria-labelledby': 'intro-how' },
    h('p', { class: 'eyebrow' }, 'How it works'),
    h('h2', { id: 'intro-how', class: 'section-title' }, 'Seven steps, one route'),
    h('p', { class: 'intro-prose' },
      'Your decisions carry forward. Whom you book in Step 1 decides whom you can interview in Step 2. What you collect in Step 2 decides what you can see when you rate in Step 3.'),
    h('ol', { class: 'intro-steps' },
      STEP_LINES.map((line, i) => h('li', { class: 'intro-step' },
        h('span', { class: 'intro-step-num', 'aria-hidden': 'true' }, String(i + 1)),
        h('span', {},
          h('span', { class: 'intro-step-name' }, STEP_TITLES[i + 1]),
          h('span', { class: 'intro-step-line' }, line))))),
    h('p', { class: 'intro-legend' },
      chip('Your path', 'player'), chip('Expert’s path', 'expert'),
      h('span', { class: 'muted' }, 'Step 7 sets the two side by side and explains every difference.')));
}

function tmmiPrimer() {
  const scale = RATINGS.filter((r) => r.id !== '?');
  return conceptBox('TMMi in one minute',
    h('p', {}, 'TMMi is a staged model with five maturity levels. Every organization is at least at Level 1.'),
    h('ol', { class: 'intro-ladder', 'aria-label': 'TMMi maturity levels' },
      LEVELS.map((name, i) => h('li', { class: i === 1 ? 'is-target' : null },
        h('span', { class: 'intro-ladder-num' }, String(i + 1)),
        h('span', { class: 'intro-ladder-name' }, name)))),
    h('p', {}, h('strong', {}, 'Level 2 Managed '), `has ${PROCESS_AREAS.length} process areas:`),
    h('ul', { class: 'intro-pa-list' },
      PROCESS_AREAS.map((pa) => h('li', {},
        h('span', { class: 'mono' }, pa.id),
        h('span', {}, pa.name),
        pa.id === 'IH' ? chip('New in v2.0', 'expert') : null))),
    h('p', {}, 'Practices are scored by percentage achieved (TAMAR p.14: percentages apply to practices only). Goals, process areas and levels use the same letters N, P, L, F.'),
    h('dl', { class: 'intro-scale' },
      scale.map((r) => h('div', {},
        h('dt', {}, h('b', {}, r.id), ` ${r.label}`),
        h('dd', { class: 'mono' }, r.range)))),
    h('p', {}, h('strong', {}, 'Weakest link. '), 'A process area is only as strong as its weakest goal.'),
    h('p', {}, h('strong', {}, 'All or nothing. '), 'A level is achieved only when all its process areas are rated L or F.'));
}

function requirementsNote() {
  const note = designerNote('Requirements · Course brief, covered overall',
    'Where each requirement of the project brief is met:');
  note.append(h('ul', { class: 'intro-req' },
    h('li', {}, 'All seven steps in order, with a process map: the route bar at the top shows every step and where you are.'),
    h('li', {}, 'At least 8 decisions: scope, assessment type, interviews (Step 1); evidence and the staging outage (Step 2); goal ratings (Step 3); maturity conclusion (Step 4); the CTO’s objections and the test data finding (Step 5); actions and the first action (Step 6).'),
    h('li', {}, 'At least 3 change later steps: scope sets the Step 2 time and can make Step 4 Not Rated; booked interviews decide who appears in Step 2; collected evidence decides what Step 3 shows; Step 5–6 choices drive the Step 7 outcomes.'),
    h('li', {}, 'Limited time: Step 2 runs against an on-site time window (the clock in the top bar).'),
    h('li', {}, 'Written reasoning twice: Step 3 asks for written justifications for TMC G3 and TDE G1, then shows the expert’s answer.'),
    h('li', {}, 'Final screen: Step 7 sets the player’s path next to the expert’s and explains each difference.'),
    h('li', {}, 'Real decisions, not only multiple choice: evidence under a time budget, written reasoning and an action plan under an hours and money budget.')));
  return note;
}

function launch(state, ctx) {
  return h('section', { class: 'intro-launch', 'aria-labelledby': 'intro-launch-title' },
    h('div', {},
      h('p', { class: 'eyebrow' }, 'Step 1 · Plan'),
      h('h2', { id: 'intro-launch-title', class: 'section-title' }, 'The CTO is on the line'),
      h('p', { class: 'muted' }, 'Your first job is the assessment plan: what you will look at, what kind of result you will deliver, and whom you will talk to.')),
    actions(state, ctx));
}
