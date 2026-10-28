import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expertState } from './helpers.js';
import { createInitialState } from '../js/store.js';
import { pathRows, ratingSummary, consequences } from '../js/logic/outcome.js';
import { recapScores, recapFor, routeStops, routeGeometry, afterMood, GOOD_MOOD_MAX_BAD } from '../js/logic/recap.js';
import { consequenceSpots, preferredAnchors, SPARE_ANCHORS } from '../js/game/chapters/ch07-spots.js';
import { ANCHORS } from '../js/world/anchors.js';

const rookie = () => expertState({
  plan: { scope: 'automation', type: 'certificate', interviews: ['ece', 'onur'] },
  collect: { collected: ['T1', 'T2', 'A'], outage: 'ignore' },
  report: { automation: 'agree', attribution: 'names', kvkk: null },
  improve: { actions: ['envs', 'perf', 'dashboard'], first: 'envs' },
});

test('recapScores matches the reflect screen tiles for the expert path', () => {
  const s = expertState();
  const scores = recapScores(pathRows(s), ratingSummary(s));
  assert.deepEqual(scores.decisions, { n: pathRows(s).length, of: pathRows(s).length });
  assert.deepEqual(scores.accepted, { n: 21, of: 21 });
  assert.deepEqual(scores.off, { n: 0, of: 21 });
});

test('recapScores counts off-route decisions and unsupported ratings', () => {
  const s = rookie();
  const { scores, rows, stops } = recapFor(s);
  assert.ok(scores.decisions.n < scores.decisions.of);
  assert.ok(scores.off.n > 0, 'ratings without key evidence are off');
  assert.equal(stops.length, rows.length);
});

test('routeStops splits chapter and label and marks the route', () => {
  const stops = routeStops([
    { step: '1 · Scope', status: { tone: 'good' } },
    { step: '3 · TMC G3 Manage', status: { tone: 'warn' } },
    { step: 'Loose', status: { tone: 'bad' } },
  ]);
  assert.deepEqual(stops[0], { chapter: '1', label: 'Scope', onRoute: true, tone: 'good' });
  assert.equal(stops[1].onRoute, false);
  assert.equal(stops[2].label, 'Loose');
});

test('routeGeometry keeps on-route stops on the expert line and dips the rest', () => {
  const stops = [{ onRoute: true }, { onRoute: false }, { onRoute: true }];
  const geo = routeGeometry(stops, { width: 200, height: 100, pad: 20, dip: 30 });
  assert.equal(geo.baseline, 38);
  assert.equal(geo.expert, 'M20 38H180');
  assert.deepEqual(geo.nodes.map((n) => [n.x, n.y]), [[20, 38], [100, 68], [180, 38]]);
  assert.match(geo.player, /^M20 38C/);
  assert.ok(geo.player.includes('100 68'));
});

test('routeGeometry handles a dip at the first stop, one stop and no stops', () => {
  const first = routeGeometry([{ onRoute: false }, { onRoute: true }], { width: 100, height: 100, pad: 10 });
  assert.ok(first.player.startsWith('M10 84C50 84 50 38 90 38'));
  const one = routeGeometry([{ onRoute: true }]);
  assert.equal(one.nodes[0].x, 320);
  const none = routeGeometry([]);
  assert.deepEqual(none.nodes, []);
  assert.match(none.player, /^M24 \S+C/);
});

test('afterMood is good with at most two bad consequences', () => {
  const bad = { tone: 'bad' };
  const good = { tone: 'good' };
  assert.equal(afterMood(Array(GOOD_MOOD_MAX_BAD).fill(bad)), 'after-good');
  assert.equal(afterMood([...Array(GOOD_MOOD_MAX_BAD + 1).fill(bad), good]), 'after-bad');
  assert.equal(afterMood(consequences(expertState())), 'after-good');
  assert.equal(afterMood(consequences(rookie())), 'after-bad');
});

test('every consequence gets its own real anchor', () => {
  [expertState(), rookie(), createInitialStateWithChoices()].forEach((s) => {
    const spots = consequenceSpots(consequences(s));
    const anchors = spots.map((p) => p.anchor);
    assert.equal(new Set(anchors).size, anchors.length, 'no shared markers');
    anchors.forEach((a) => assert.ok(ANCHORS[a], `unknown anchor ${a}`));
    spots.forEach((p, i) => assert.equal(p.id, `after-${i}`));
  });
});

test('consequences land where they happened', () => {
  const at = (s, from) => consequenceSpots(consequences(s)).find((p) => p.label === from)?.anchor;
  const r = rookie();
  assert.equal(at(r, 'Step 1 · Assessment type'), 'cto-office');
  assert.equal(at(r, 'Step 1 · Scope'), 'meeting-room');
  assert.equal(at(r, 'Step 5 · Automation objection'), 'pipeline-screen');
  assert.equal(at(r, 'Step 5 · Attribution'), 'routing-desk');
  assert.equal(at(r, 'Step 2 · Evidence'), 'devops-corner');
  assert.equal(at(expertState(), 'Step 6 · First action'), 'qa-desk');
  assert.equal(at(expertState(), 'Overall'), 'war-room');
});

test('unknown consequences fall back to spare anchors, then the entrance', () => {
  assert.deepEqual(preferredAnchors({ from: 'Elsewhere', text: 'x' }), [...SPARE_ANCHORS]);
  const many = Array.from({ length: SPARE_ANCHORS.length + 1 }, () => ({ from: 'Elsewhere', tone: 'odd', text: 'x' }));
  const spots = consequenceSpots(many);
  assert.equal(spots.at(-1).anchor, 'entrance');
  assert.equal(spots[0].sublabel, 'Six months later');
});

function createInitialStateWithChoices() {
  const s = createInitialState();
  return { ...s, plan: { ...s.plan, scope: 'level23', type: 'formal', interviews: ['kerem'] },
    collect: { ...s.collect, collected: ['F'] },
    report: { ...s.report, automation: 'principle', attribution: 'hint', kvkk: 'drop' },
    improve: { ...s.improve, actions: ['risk', 'template', 'flaky', 'defects', 'envs', 'perf', 'pir', 'owner'], first: 'risk' } };
}
