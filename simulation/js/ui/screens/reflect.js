// Step 7 · Reflect: six months later, then the player's path next to the expert's.
import { h, conceptBox, designerNote, button } from '../dom.js';
import { stepHeader, stepLayout } from '../components.js';
import { consequences, pathRows, ratingSummary } from '../../logic/outcome.js';
import { section } from './conclude-kit.js';
import { radarChart } from '../../fx/radar.js';
import { processAreaRatings, expertRatings } from '../../logic/assessment.js';
import { EXPERT } from '../../data/decisions.js';
import { consequenceTimeline, pathTable, pathCards, ratingsMatrix, scoreTiles } from './reflect-parts.js';

export function render(state, ctx) {
  const items = consequences(state);
  const rows = pathRows(state);
  const summary = ratingSummary(state);

  const main = [
    section('Rotaşa · six months later', 'What happened next',
      h('p', {}, 'Each event names the decision that caused it.'),
      consequenceTimeline(items)),
    section('Debrief', 'Your path and the expert’s path',
      h('p', {}, 'Every decision you made, next to the expert’s, with the reason it matters.'),
      pathTable(rows),
      pathCards(rows),
      designerNote('Requirement · Final screen compares the player’s path with the expert’s path and explains each difference', 'Every decision point from Steps 1–6 is listed with the player’s choice, the expert’s choice, a status and the expert’s reason. The consequences above name the step that caused them.')),
    section('Ratings', 'Twenty-one goals, side by side',
      h('p', {}, 'A rating is judged against the evidence you had. A rating without its key evidence is unsupported, even if the letter matches.'),
      radarChart(processAreaRatings(state.assess.ratings, state.plan.scope), processAreaRatings(expertRatings(), EXPERT.scope)),
      ratingsMatrix(summary)),
    h('div', { class: 'nav-row' },
      button('Back to Step 6', () => ctx.go(6), { variant: 'secondary' }),
      button('Play again', () => ctx.reset(), { id: 'play-again' })),
  ];

  const rail = [
    scoreTiles(rows, summary),
    conceptBox('Debrief question',
      h('p', {}, h('b', {}, 'Which piece of evidence, if you had collected it, would have changed one of your ratings?')),
      h('ul', {},
        h('li', {}, 'Scope and assessment type (Step 1) shaped the CTO meeting in Step 5.'),
        h('li', {}, 'Evidence you skipped in Step 2 removed arguments in Step 5.'),
        h('li', {}, 'Your Step 3 ratings decided the level in Step 4 and the gaps you funded in Step 6.'))),
    conceptBox('IDEAL: Learning',
      h('p', {}, 'The last IDEAL phase checks which benefits were achieved before the next cycle starts (TMMi v2.0 §1.6.1). This screen is that check for you.')),
  ];

  return h('div', { class: 'screen screen-reflect' },
    stepHeader(7, 'Reflect', 'Six months on: what your decisions did, and where the expert went another way.'),
    stepLayout(main, rail));
}
