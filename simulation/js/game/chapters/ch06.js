// Chapter 6 · The plan: choose improvement actions within the quarter's budget
// in the dossier, with the war-room whiteboard behind it.
import { BUDGET } from '../../data/decisions.js';
import { actionTotals } from '../../logic/assessment.js';
import { stageBackdrop, clearWorld, stamp, tipOnce, boardSpot, withWorld } from './kit.js';

const RESERVE_WARN = 0.9;
const FIRST_TIP_AFTER = 3;

export const meta = {
  step: 6,
  title: 'The plan',
  subtitle: '400 hours, TRY 150,000 and one quarter.',
  objective(state) {
    const { actions, first, revealed } = state.improve;
    const used = actionTotals(actions).hours;
    if (revealed) return { text: 'Plan locked. Continue to six months later.', done: used, total: BUDGET.hours };
    if (actions.length >= FIRST_TIP_AFTER && !first) return { text: `Pick the action that starts first · ${used} of ${BUDGET.hours} h planned`, done: used, total: BUDGET.hours };
    return { text: `Choose improvement actions · ${used} of ${BUDGET.hours} h planned`, done: used, total: BUDGET.hours };
  },
};

function boardFor(state) {
  const n = state.improve.actions.length;
  return boardSpot('plan-board', 'Plan board', n === 1 ? '1 sticky note' : `${n} sticky notes`);
}

let prev = { count: -1, revealed: false };

export function enter(ctx) {
  const state = ctx.store.get();
  prev = { count: state.improve.actions.length, revealed: Boolean(state.improve.revealed) };
  stageBackdrop(ctx, { view: 'war-room', hotspots: boardFor(state) });
  Promise.resolve(ctx.mentor?.(meta.step)).then(() => {
    tipOnce(ctx, 'ideal', 'IDEAL: Initiating, Diagnosing, Establishing, Acting, Learning. Your assessment was Diagnosing; this plan is Establishing.');
  });
}

export function update(state, ctx) {
  const { actions, first, revealed } = state.improve;
  const hours = actionTotals(actions).hours;
  if (actions.length) tipOnce(ctx, 'budget', 'Each action spends hours and money from the same quarter. The meters show what is left.');
  if (hours >= BUDGET.hours * RESERVE_WARN) tipOnce(ctx, 'reserve', 'Almost every hour is planned. A real quarter brings surprises; a small reserve is good planning.');
  if (actions.length >= FIRST_TIP_AFTER && !first) tipOnce(ctx, 'first-action', 'Now pick the action that starts first. Ask who will drive the plan.');
  if (revealed && !prev.revealed) stamp(ctx);
  if (actions.length !== prev.count) withWorld(ctx, (w) => w.setHotspots(boardFor(state), () => {}));
  prev = { count: actions.length, revealed: Boolean(revealed) };
}

export function exit(ctx) {
  clearWorld(ctx);
}
