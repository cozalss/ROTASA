// Chapter 2 hotspots as a pure function of the state: one per evidence item at
// its anchor, unbooked people, the outage event and the exit. No DOM, no THREE.
import { findEvidence } from '../../data/evidence.js';
import { INTERVIEWEES, EXPERT } from '../../data/decisions.js';
import { availableEvidence, minutesLeft } from '../../logic/assessment.js';

export const OUTAGE_TRIGGER = 3;
export const OUTAGE_ANCHOR = 'server-room';
export const EXIT_ANCHOR = 'entrance';

// Evidence → anchor map (docs/CHAPTER-CONTRACT.md).
export const EVIDENCE_ANCHORS = Object.freeze({
  A: 'wiki-terminal', B: 'plan-folder', C: 'test-tool', D: 'jira-board', E: 'metrics-board',
  F: 'pipeline-screen', G: 'mail-terminal', J: 'hr-cabinet',
  T1: 'code-desk', T2: 'staging-console', T3: 'cto-office',
  H2: 'qa-desk', H3: 'routing-desk', H4: 'po-desk', H5: 'devops-corner', H6: 'field-desk',
  OBS: 'server-room',
});

export const PERSON_ANCHORS = Object.freeze({
  deniz: 'qa-desk', kerem: 'po-desk', ece: 'routing-desk', burak: 'devops-corner', onur: 'field-desk',
});

export const isOutageTriggered = (state) => state.collect.collected.length >= OUTAGE_TRIGGER;
export const isOutagePending = (state) => isOutageTriggered(state) && !state.collect.outage;

/** Why an item cannot be requested now, or null. */
export function blockReason(state, item) {
  if (state.collect.collected.includes(item.id)) return null;
  if (isOutagePending(state)) return 'Answer the outage first';
  if (item.cost > minutesLeft(state)) return 'Not enough time left';
  return null;
}

function kindOf(item) {
  if (item.kind === 'document') return 'document';
  if (item.kind === 'interview' || item.id === 'T3') return 'person';
  return 'trap';
}

function evidenceSpot(state, item) {
  const done = state.collect.collected.includes(item.id);
  const reason = blockReason(state, item);
  let sublabel = `${item.id} · ${item.cost} min`;
  if (done) sublabel = `${item.id} · in your bag · click to read`;
  else if (reason) sublabel = `${reason} · ${item.cost} min`;
  return {
    id: `ev-${item.id}`,
    anchor: EVIDENCE_ANCHORS[item.id],
    label: item.title,
    sublabel,
    kind: kindOf(item),
    state: done ? 'done' : reason ? 'locked' : 'available',
  };
}

function unbookedSpot(person) {
  return {
    id: `nb-${person.id}`,
    anchor: PERSON_ANCHORS[person.id],
    label: person.name,
    sublabel: `${person.role} · not booked this week`,
    kind: 'person',
    state: 'locked',
  };
}

const OUTAGE_SPOT = Object.freeze({
  id: 'outage', anchor: OUTAGE_ANCHOR, label: 'Staging is down', sublabel: 'Talk to Burak · decide now', kind: 'event', state: 'available',
});
const EXIT_SPOT = Object.freeze({
  id: 'exit', anchor: EXIT_ANCHOR, label: 'End the day', sublabel: 'Go to Chapter 3: rate the goals', kind: 'exit', state: 'available',
});

/** Hotspot list for the world (world.setHotspots). */
export function collectHotspots(state) {
  const items = availableEvidence(state.plan.interviews).map((item) => evidenceSpot(state, item));
  const unbooked = INTERVIEWEES.filter((p) => !state.plan.interviews.includes(p.id)).map(unbookedSpot);
  const extra = [];
  if (isOutagePending(state)) extra.push(OUTAGE_SPOT);
  if (state.collect.outage) extra.push(EXIT_SPOT);
  return [...items, ...unbooked, ...extra];
}

/** Parses a hotspot id: { type: 'evidence'|'unbooked'|'outage'|'exit', id }. */
export function parseSpot(spotId) {
  if (spotId === 'outage' || spotId === 'exit') return { type: spotId, id: spotId };
  if (spotId.startsWith('ev-')) return { type: 'evidence', id: spotId.slice(3) };
  if (spotId.startsWith('nb-')) return { type: 'unbooked', id: spotId.slice(3) };
  return { type: 'unknown', id: spotId };
}

/** The anchor the idle arrow should point at next, or null. */
export function suggestedAnchor(state) {
  if (isOutagePending(state)) return OUTAGE_ANCHOR;
  const left = minutesLeft(state);
  const open = availableEvidence(state.plan.interviews).map((e) => e.id);
  const next = EXPERT.collected.find((id) => open.includes(id) && !state.collect.collected.includes(id)
    && (findEvidence(id)?.cost ?? Infinity) <= left);
  if (next) return EVIDENCE_ANCHORS[next];
  return state.collect.outage ? EXIT_ANCHOR : null;
}

/** Evidence items the player can still afford (and has not collected). */
export function affordableCount(state) {
  const left = minutesLeft(state);
  return availableEvidence(state.plan.interviews)
    .filter((e) => !state.collect.collected.includes(e.id) && e.cost <= left).length;
}

/** Objective counts: collected non-trap items of everything worth collecting on offer. */
export function evidenceProgress(state) {
  const worth = availableEvidence(state.plan.interviews).filter((e) => e.kind !== 'trap').map((e) => e.id);
  const done = state.collect.collected.filter((id) => worth.includes(id)).length;
  return { done, total: worth.length };
}
