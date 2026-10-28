// Chapter 4 · Weakest link: decide the indicative maturity level in the
// dossier. When the player locks it, Selin puts the result in context:
// what the player's own ratings say, and what the chosen wording will do.
import { processAreaRatings, rateMaturityLevel } from '../../logic/assessment.js';
import { mentorSay } from '../mentor.js';
import { stageBackdrop, clearWorld, stamp, tipOnce, boardSpot } from './kit.js';

export const meta = {
  step: 4,
  title: 'Weakest link',
  subtitle: 'From 21 goal ratings to one honest sentence.',
  objective(state) {
    const { level, revealed } = state.conclude;
    if (revealed) return { text: 'Level filed. Continue to the findings meeting.', done: 1, total: 1 };
    if (level) return { text: 'Write why, then lock your statement about the level.', done: 0, total: 1 };
    return { text: 'Decide what your report says about the maturity level.', done: 0, total: 1 };
  },
};

// What the player's own ratings say (≤ 25 words).
export function ratingsLine(ml) {
  if (ml.rating === 'NR') return 'Some goals or process areas are not rated, so the level is Not Rated: NR spreads upward.';
  if (ml.achieved) return 'Your own ratings put every process area at Largely or Fully achieved.';
  return `Your weakest process area is rated ${ml.rating}, so on your own ratings Level 2 is not achieved.`;
}

// What the chosen statement will do in the meeting (≤ 25 words).
export const LEVEL_LINES = Object.freeze({
  'level1-indicative': 'And you labelled it indicative. That is exactly what an informal assessment can say.',
  'level1-formal': 'Right level, risky label: an informal assessment gives no formal rating, and Murat may quote yours as one.',
  level2: '“Close to Level 2” will be heard as a promise. Expect Murat to hold you to it.',
  none: 'You do have enough to say Level 2 is not reached. Informal findings need no corroboration.',
});

export function concludeLines(state) {
  const ml = rateMaturityLevel(processAreaRatings(state.assess.ratings, state.plan.scope));
  return [ratingsLine(ml), LEVEL_LINES[state.conclude.level]].filter(Boolean);
}

let wasRevealed = false;

export function enter(ctx) {
  const state = ctx.store.get();
  wasRevealed = Boolean(state.conclude.revealed);
  stageBackdrop(ctx, { view: 'war-room', hotspots: boardSpot('weakest-link', 'Weakest link', 'Goals → process areas → level') });
  Promise.resolve(ctx.mentor?.(meta.step)).then(() => {
    tipOnce(ctx, 'weakest-link-board', 'The board in the dossier shows each process area at the rating of its weakest goal.');
  });
}

export function update(state, ctx) {
  const now = Boolean(state.conclude.revealed);
  if (now && !wasRevealed) {
    stamp(ctx);
    mentorSay(concludeLines(state));
  }
  wasRevealed = now;
}

export function exit(ctx) {
  clearWorld(ctx);
}
