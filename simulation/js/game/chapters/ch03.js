// Chapter 3 · The war room: rate the 21 Level 2 goals in the dossier, with the
// evidence board behind it. The dossier assess screen does the rating; this
// controller stages the world, briefs the player and gives one-time tips.
import { ALL_GOALS, REASONED_GOALS } from '../../data/tmmi.js';
import { knownEvidenceIds } from '../../logic/assessment.js';
import { stageBackdrop, clearWorld, tipOnce, boardSpot, withWorld } from './kit.js';

const TOTAL = ALL_GOALS.length;
const REASONED_PAS = REASONED_GOALS.map((id) => id.split('-')[0]);

const ratedCount = (state) => ALL_GOALS.filter((g) => state.assess.ratings[g.id]).length;

export const meta = {
  step: 3,
  title: 'The war room',
  subtitle: 'Rate every goal from the evidence on your board.',
  objective(state) {
    const done = ratedCount(state);
    const text = done >= TOTAL
      ? `All ${TOTAL} goals rated. Continue to Conclude.`
      : `Rate ${TOTAL} goals · ${done} of ${TOTAL}`;
    return { text, done, total: TOTAL };
  },
};

function boardFor(state) {
  const n = knownEvidenceIds(state).length;
  return boardSpot('evidence-board', 'Evidence board', n === 1 ? '1 item pinned' : `${n} items pinned`);
}

let lastBoard = -1;

export function enter(ctx) {
  const state = ctx.store.get();
  lastBoard = knownEvidenceIds(state).length;
  stageBackdrop(ctx, { view: 'war-room', hotspots: boardFor(state) });
  Promise.resolve(ctx.mentor?.(meta.step)).then(() => update(ctx.store.get(), ctx));
}

export function update(state, ctx) {
  const { ratings, openPa } = state.assess;
  const values = Object.values(ratings);
  if (values.length) tipOnce(ctx, 'first-rating', 'A rating is about the process, from the evidence under the goal. Use “?” when the key evidence is missing.');
  if (values.includes('?')) tipOnce(ctx, 'honest-gap', '“?” means Not Rated. One NR goal makes its whole process area NR, so use it honestly, not to dodge.');
  if (REASONED_PAS.includes(openPa)) tipOnce(ctx, 'written-reasoning', 'This area has a goal with a written reason. Write at least 40 characters naming your evidence, then lock it to see the expert’s answer.');
  if (ratedCount(state) >= TOTAL) tipOnce(ctx, 'all-rated', 'All 21 goals rated. Continue to Conclude to see what they add up to.');
  const n = knownEvidenceIds(state).length;
  if (n !== lastBoard) {
    lastBoard = n;
    withWorld(ctx, (w) => w.setHotspots(boardFor(state), () => {}));
  }
}

export function exit(ctx) {
  clearWorld(ctx);
}
