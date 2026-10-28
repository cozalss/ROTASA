// Chapter 1 · The opening call. Walk to Murat, hold the opening meeting (H1),
// then lock three decisions as dialogue choices: scope, assessment type and
// the two interviews (booked on a board over the office). Writes the same
// state as the Plan screen, so the dossier shows the same decisions.
import { formatMinutes } from '../../ui/dom.js';
import { patchSlice, toggleInList } from '../../store.js';
import { SCOPE_OPTIONS, TYPE_OPTIONS, INTERVIEWEES, INTERVIEW_SLOTS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { OPENING_MEETING } from '../../data/evidence.js';
import { timeBudget } from '../../logic/assessment.js';
import { talk, converse } from '../talk.js';
import { showVerdict } from '../cues.js';
import { createBoard, bookingHotspots, BOOK_PREFIX } from './ch01-board.js';

const MURAT = 'cto-office';
const DOSSIER = 'dossier';

const st = { token: 0, met: false, busy: false, board: null };

const nameOf = (id) => INTERVIEWEES.find((p) => p.id === id)?.name ?? id;
const names = (ids) => ids.map(nameOf).join(' and ');
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const lockCount = (plan) => ['scopeLocked', 'typeLocked', 'interviewsLocked'].filter((k) => plan[k]).length;
const allLocked = (plan) => lockCount(plan) === 3;

export const meta = Object.freeze({
  step: 1,
  title: 'The opening call',
  subtitle: 'Agree the plan with the CTO: scope, kind of assessment, two interviews.',
  objective,
});

function objective(state) {
  const { plan } = state;
  const done = lockCount(plan);
  let text = 'Plan locked. Press Continue to start your day on site.';
  if (!st.met && done === 0) text = 'Click Murat Kaya, the CTO, in his office to start the opening meeting.';
  else if (!plan.scopeLocked) text = 'Decision 1 of 3: agree the scope with Murat. Click Murat to talk.';
  else if (!plan.typeLocked) text = 'Decision 2 of 3: agree what kind of assessment this is. Click Murat to talk.';
  else if (!plan.interviewsLocked) text = `Decision 3 of 3: book ${INTERVIEW_SLOTS} interviews (${plan.interviews.length} of ${INTERVIEW_SLOTS} booked), then Confirm.`;
  return { text, done, total: 3 };
}

// ---------- world staging ----------

function muratSpot(plan) {
  const locked = allLocked(plan);
  return { id: 'murat', anchor: MURAT, label: 'Murat Kaya', sublabel: locked ? 'CTO · plan agreed' : 'CTO · click to talk', kind: 'person', state: locked ? 'done' : 'available' };
}

function stage(ctx, state) {
  const booking = Boolean(st.board);
  ctx.world.setHotspots(booking ? bookingHotspots(state.plan) : [muratSpot(state.plan)], (id) => onPick(ctx, id));
  document.body.classList.toggle('gd-show-labels', booking);
  if (allLocked(state.plan)) ctx.pointTo(null);
  else ctx.pointTo(booking ? null : MURAT);
  showContinue(ctx, state);
}

function showContinue(ctx, state) {
  if (!allLocked(state.plan)) { ctx.cta(null); return; }
  ctx.cta({ label: 'Continue to Chapter 2', hint: 'Your plan is agreed. Next: one day on site.', onClick: () => ctx.go(2) });
}

function onPick(ctx, id) {
  if (id.startsWith(BOOK_PREFIX)) { toggleBooking(ctx, id.slice(BOOK_PREFIX.length)); return; }
  if (id === 'murat') meeting(ctx);
}

// ---------- decisions ----------

function setPlan(ctx, patch, lockKey) {
  ctx.store.update((s) => (lockKey && s.plan[lockKey] ? s : patchSlice(s, 'plan', patch)));
}

async function lockFlow(ctx, alive, { key, lock, label, letter, options, prompt }) {
  const choices = [
    ...options.map((o) => ({ id: o.id, label: o.title })),
    { id: DOSSIER, label: 'Let me check my notes first', meta: 'Dossier' },
  ];
  const pick = await talk({ speaker: 'murat', lines: prompt, choices });
  if (!alive() || pick === null) return false;
  if (pick === DOSSIER) { ctx.dossier.open(); return false; }
  setPlan(ctx, { [key]: pick }, lock);
  const option = options.find((o) => o.id === pick);
  const confirm = await talk({
    speaker: 'narrator', name: `Decision ${letter} · ${label}`,
    lines: [`You chose: ${option.title}.`, 'Locked decisions cannot be changed. Lock it?'],
    choices: [{ id: 'lock', label: `Lock the ${label.toLowerCase()}`, meta: 'Final' }, { id: 'again', label: 'Choose again' }],
  }, { quick: true });
  if (!alive() || confirm === null) return false;
  if (confirm === 'again') return lockFlow(ctx, alive, { key, lock, label, letter, options, prompt });
  setPlan(ctx, { [lock]: true }, lock);
  ctx.tip('first-lock', 'Locked decisions are final. The expert’s call appears right after you lock, so you learn as you go.');
  return true;
}

async function scopeDecision(ctx, alive) {
  const ok = await lockFlow(ctx, alive, {
    key: 'scope', lock: 'scopeLocked', label: 'Scope', letter: 1, options: SCOPE_OPTIONS,
    prompt: ['The goal is TMMi Level 2 in 12 months. So, what will your assessment cover?'],
  });
  if (!ok || !alive()) return false;
  const plan = ctx.store.get().plan;
  const option = SCOPE_OPTIONS.find((o) => o.id === plan.scope);
  const time = formatMinutes(timeBudget(plan.scope));
  await showVerdict({
    decision: 'Decision 1 · Scope', match: plan.scope === EXPERT.scope, yours: option.title,
    expertTitle: SCOPE_OPTIONS.find((o) => o.id === EXPERT.scope).title,
    feedback: option.feedback, why: EXPERT_WHY.scope, consequence: `Carried to Chapter 2: ${time} on site for evidence.`,
  });
  ctx.toast(`Scope locked · ${time} on site tomorrow`, 'player');
  return alive();
}

async function typeDecision(ctx, alive) {
  const ok = await lockFlow(ctx, alive, {
    key: 'type', lock: 'typeLocked', label: 'Assessment type', letter: 2, options: TYPE_OPTIONS,
    prompt: ['We need a certificate we can show customers.', 'One customer’s supplier questionnaire asks if our test process was assessed against a maturity model.'],
  });
  if (!ok || !alive()) return false;
  const plan = ctx.store.get().plan;
  const option = TYPE_OPTIONS.find((o) => o.id === plan.type);
  await showVerdict({
    decision: 'Decision 2 · Assessment type', match: plan.type === EXPERT.type, yours: option.title,
    expertTitle: TYPE_OPTIONS.find((o) => o.id === EXPERT.type).title, feedback: option.feedback, why: EXPERT_WHY.type,
  });
  ctx.toast('Assessment type locked', 'player');
  return alive();
}

async function interviewPrompt(ctx, alive) {
  const r = await talk({ speaker: 'murat', lines: [
    'Sprint 38 is busy. I can release two people for a 30-minute interview this week.',
    'Pick them on the board. You already had this meeting with me.',
  ] });
  if (!alive() || r === null) return;
  openBoard(ctx);
}

// ---------- the opening meeting ----------

async function opening(ctx, alive) {
  const pairs = OPENING_MEETING.body.filter((b) => b.qa).flatMap((b) => [['assessor', b.qa[0]], ['murat', b.qa[1]]]);
  const ok = await converse(pairs, alive);
  if (!ok) return false;
  st.met = true;
  ctx.toast('H1 · Opening meeting notes added to your bag', 'player');
  ctx.audio.ui('pick');
  ctx.tip('h1-bag', 'Your notes from this meeting are evidence H1. Reread them any time from the bag (top right).');
  ctx.refresh();
  return alive();
}

async function meeting(ctx) {
  if (st.busy) return;
  st.busy = true;
  const my = st.token;
  const alive = () => my === st.token;
  try {
    await ctx.world.walkTo(MURAT);
    if (!alive()) return;
    ctx.world.setPerson('murat', { state: 'talking', facing: 'assessor' });
    await runDecisions(ctx, alive);
  } finally {
    st.busy = false;
    if (alive()) ctx.world.setPerson('murat', { state: 'typing' });
  }
}

async function runDecisions(ctx, alive) {
  const plan = () => ctx.store.get().plan;
  if (!st.met && !(await opening(ctx, alive))) return;
  if (!plan().scopeLocked && !(await scopeDecision(ctx, alive))) return;
  if (!plan().typeLocked && !(await typeDecision(ctx, alive))) return;
  if (!plan().interviewsLocked) { await interviewPrompt(ctx, alive); return; }
  ctx.world.say('murat', 'Good. See you tomorrow on site.');
}

// ---------- booking ----------

function openBoard(ctx) {
  if (st.board) return;
  st.board = createBoard({
    onToggle: (id) => toggleBooking(ctx, id),
    onConfirm: () => confirmBookings(ctx),
    onDossier: () => ctx.dossier.open(),
  });
  // Focus leaves the Murat marker first, or the world would pan back to it.
  document.activeElement?.blur?.();
  st.board.render(ctx.store.get().plan);
  stage(ctx, ctx.store.get());
  document.querySelector('.gd-board-person')?.focus({ preventScroll: true });
  window.requestAnimationFrame(() => ctx.world.setView('overview'));
}

function closeBoard() {
  st.board?.remove();
  st.board = null;
  document.body.classList.remove('gd-show-labels');
}

function toggleBooking(ctx, id) {
  const plan = ctx.store.get().plan;
  if (plan.interviewsLocked) return;
  if (!plan.interviews.includes(id) && plan.interviews.length >= INTERVIEW_SLOTS) {
    ctx.toast('Both slots are booked. Click a booked person to free a slot.', 'warn');
    return;
  }
  ctx.audio.ui('click');
  setPlan(ctx, { interviews: toggleInList(plan.interviews, id, INTERVIEW_SLOTS) }, 'interviewsLocked');
}

async function confirmBookings(ctx) {
  const my = st.token;
  const plan = ctx.store.get().plan;
  if (plan.interviews.length !== INTERVIEW_SLOTS || plan.interviewsLocked) return;
  closeBoard();
  setPlan(ctx, { interviewsLocked: true }, 'interviewsLocked');
  const match = sameSet(plan.interviews, EXPERT.interviews);
  await showVerdict({
    decision: 'Decision 3 · Interviews', match, yours: names(plan.interviews), expertTitle: names(EXPERT.interviews),
    feedback: match ? EXPERT_WHY.interviews : `Tomorrow you can interview ${names(plan.interviews)}. Everyone else reaches you through documents.`,
    why: EXPERT_WHY.interviews,
  });
  if (my !== st.token) return;
  ctx.world.setView(MURAT);
  await talk({ speaker: 'narrator', name: 'Plan agreed', lines: ['Your plan is locked. Tomorrow you spend one day on site at Rotaşa.', 'Press Continue when you are ready.'] });
}

// ---------- chapter interface ----------

export function enter(ctx) {
  st.token += 1;
  const my = st.token;
  const state = ctx.store.get();
  ctx.world.setMood('evening');
  ctx.world.setMode('explore');
  ctx.world.setView(MURAT);
  stage(ctx, state);
  if (!ctx.world.isAvailable()) { ctx.mentor(1); return; }
  const plan = state.plan;
  const booking = plan.scopeLocked && plan.typeLocked && !plan.interviewsLocked;
  // The assessor walks in to Murat while Selin talks (the camera follows, then settles on the office).
  if (!booking && !allLocked(plan)) {
    ctx.world.walkTo(MURAT).then(() => { if (my === st.token && !st.board) ctx.world.setView(MURAT); });
  }
  ctx.mentor(1).then(() => {
    if (my === st.token && booking) openBoard(ctx);
  });
}

export function update(state, ctx) {
  if (state.plan.interviewsLocked && st.board) closeBoard();
  st.board?.render(state.plan);
  stage(ctx, state);
}

export function exit(ctx) {
  st.token += 1;
  st.busy = false;
  closeBoard();
  ctx.cta(null);
  ctx.pointTo(null);
}
