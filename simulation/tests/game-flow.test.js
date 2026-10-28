// Pure game-flow helpers: chapter recaps and the Chapter 2 hotspot list.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chapterSummary, joinNames } from '../js/logic/summary.js';
import {
  collectHotspots, parseSpot, suggestedAnchor, evidenceProgress, affordableCount, blockReason,
  isOutagePending, EVIDENCE_ANCHORS,
} from '../js/game/chapters/ch02-spots.js';
import { findEvidence, EVIDENCE } from '../js/data/evidence.js';
import { ANCHORS } from '../js/world/anchors.js';
import { expertState, planState } from './helpers.js';
import { createInitialState, patchSlice } from '../js/store.js';

describe('joinNames', () => {
  it('joins one, two and many names', () => {
    assert.equal(joinNames([]), '');
    assert.equal(joinNames(['a']), 'a');
    assert.equal(joinNames(['a', 'b']), 'a and b');
    assert.equal(joinNames(['a', 'b', 'c', 'd']), 'a, b and 2 more');
  });
});

describe('chapterSummary', () => {
  it('counts items and names skipped key documents in Chapter 2', () => {
    const s = planState({ collected: ['A', 'B', 'C', 'D', 'E', 'F', 'J', 'H2', 'T1'], outage: 'observe' });
    assert.equal(chapterSummary(s, 2), 'You collected 9 items. You skipped the release email. You watched the staging outage.');
  });

  it('praises a full document set', () => {
    const s = expertState();
    assert.match(chapterSummary(s, 2), /You read every key document\./);
  });

  it('uses the singular for one item', () => {
    assert.match(chapterSummary(planState({ collected: ['A'] }), 2), /^You collected 1 item\./);
  });

  it('summarises the plan and its match with the expert', () => {
    const line = chapterSummary(expertState(), 1);
    assert.match(line, /all six Level 2 process areas/);
    assert.match(line, /Deniz Arslan and Kerem Demir/);
    assert.match(line, /3 of 3 match the expert/);
  });

  it('reports nobody booked on an empty plan', () => {
    assert.match(chapterSummary(createInitialState(), 1), /You booked nobody\. 0 of 3/);
  });

  it('covers the later chapters', () => {
    const s = expertState();
    assert.match(chapterSummary(s, 3), /^You rated 21 of 21 goals\. 21 match/);
    assert.match(chapterSummary(s, 4), /matches the expert/);
    assert.match(chapterSummary(s, 5), /3 of 3 objections\. 3 match/);
    assert.match(chapterSummary(s, 6), /^You chose 11 actions \(362 h, TRY 50,000\)\. First: appoint/);
    assert.equal(chapterSummary(s, 7), '');
    assert.ok(chapterSummary(s, 0).length > 0);
  });

  it('handles an open conclusion and a different one', () => {
    const open = createInitialState();
    assert.match(chapterSummary(open, 4), /open/);
    const other = patchSlice(open, 'conclude', { level: 'level2' });
    assert.match(chapterSummary(other, 4), /The expert said/);
  });
});

describe('Chapter 2 hotspots', () => {
  it('maps every evidence item to a real anchor', () => {
    for (const e of EVIDENCE) assert.ok(ANCHORS[EVIDENCE_ANCHORS[e.id]], `${e.id} has an anchor`);
  });

  it('lists documents, traps, booked interviews and unbooked people', () => {
    const spots = collectHotspots(planState({ interviews: ['deniz', 'kerem'] }));
    const ids = spots.map((s) => s.id);
    assert.ok(ids.includes('ev-A') && ids.includes('ev-T2'));
    assert.ok(ids.includes('ev-H2') && ids.includes('ev-H4'));
    assert.ok(!ids.includes('ev-H3'));
    assert.ok(ids.includes('nb-ece') && ids.includes('nb-burak') && ids.includes('nb-onur'));
    assert.equal(spots.find((s) => s.id === 'nb-ece').state, 'locked');
    assert.equal(spots.find((s) => s.id === 'ev-H2').kind, 'person');
    assert.equal(spots.find((s) => s.id === 'ev-T3').kind, 'person');
    assert.equal(spots.find((s) => s.id === 'ev-T1').kind, 'trap');
    assert.ok(!ids.includes('outage') && !ids.includes('exit'));
  });

  it('labels cost and marks collected items done', () => {
    const spots = collectHotspots(planState({ collected: ['B'] }));
    const b = spots.find((s) => s.id === 'ev-B');
    const d = spots.find((s) => s.id === 'ev-D');
    assert.equal(b.state, 'done');
    assert.equal(d.sublabel, 'D · 35 min');
    assert.equal(d.state, 'available');
  });

  it('locks everything while the outage is pending and adds the event', () => {
    const s = planState({ collected: ['A', 'B', 'G'] });
    assert.ok(isOutagePending(s));
    const spots = collectHotspots(s);
    assert.equal(spots.find((x) => x.id === 'ev-C').state, 'locked');
    assert.equal(blockReason(s, findEvidence('C')), 'Answer the outage first');
    assert.ok(spots.some((x) => x.id === 'outage'));
    assert.equal(suggestedAnchor(s), 'server-room');
  });

  it('locks items that cost more than the time left', () => {
    const s = planState({ collected: ['T2', 'T1', 'C', 'F', 'D', 'E', 'J'], outage: 'ignore' });
    assert.equal(blockReason(s, findEvidence('C')), null);
    assert.equal(blockReason(s, findEvidence('T3')), 'Not enough time left');
    assert.equal(affordableCount(s), 0);
    assert.ok(collectHotspots(s).some((x) => x.id === 'exit'));
  });

  it('parses hotspot ids', () => {
    assert.deepEqual(parseSpot('ev-H2'), { type: 'evidence', id: 'H2' });
    assert.deepEqual(parseSpot('nb-ece'), { type: 'unbooked', id: 'ece' });
    assert.deepEqual(parseSpot('outage'), { type: 'outage', id: 'outage' });
    assert.equal(parseSpot('zzz').type, 'unknown');
  });

  it('suggests the next key document, then the exit', () => {
    assert.equal(suggestedAnchor(planState()), 'wiki-terminal');
    assert.equal(suggestedAnchor(expertState()), 'entrance');
    assert.equal(suggestedAnchor(planState({ collected: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J'], outage: null })), 'server-room');
  });

  it('counts progress over worthwhile items only', () => {
    const s = planState({ interviews: ['deniz', 'kerem'], collected: ['A', 'T1', 'H2'] });
    assert.deepEqual(evidenceProgress(s), { done: 2, total: 10 });
    assert.ok(affordableCount(s) > 0);
  });
});
