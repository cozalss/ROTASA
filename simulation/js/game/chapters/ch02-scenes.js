// Chapter 2 scenes: walking to an item and collecting it (documents, people,
// time sinks), and the staging outage with Burak. Each scene writes the same
// state as the Collect screen. `alive()` turns false when the chapter ends.
import { patchSlice, toggleInList } from '../../store.js';
import { OUTAGE_EVENT } from '../../data/evidence.js';
import { INTERVIEWEES, OUTAGE_OPTIONS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { canCollect, minutesLeft, outageCost } from '../../logic/assessment.js';
import { PEOPLE } from '../../world/people.js';
import { talk, converse } from '../talk.js';
import { showVerdict } from '../cues.js';
import { EVIDENCE_ANCHORS, OUTAGE_ANCHOR, isOutagePending, isOutageTriggered } from './ch02-spots.js';
import { translate as t } from '../../i18n/i18n.js';

const EXCERPT_MAX = 150;
const READ = 'read';

const sentences = (text) => text.match(/[^.!?]+[.!?]+["”’]?/g)?.map((s) => s.trim()) ?? [text];

// First readable line of an item, shortened at a word boundary.
function keyLine(item) {
  const first = item.body.find((b) => b.p || b.qa || b.list);
  if (!first) return '';
  // Translate before shortening, so the dictionary sees the whole sentence.
  const text = t(first.p ?? (first.qa ? first.qa[1] : first.list[0]));
  if (text.length <= EXCERPT_MAX) return text;
  return `${text.slice(0, text.lastIndexOf(' ', EXCERPT_MAX))} …`;
}

/** Same update as the Collect screen's request(). Returns true when collected. */
export function collect(ctx, id) {
  const before = ctx.store.get().collect.collected.length;
  ctx.store.update((s) => (canCollect(s, id) && !isOutagePending(s)
    ? patchSlice(s, 'collect', { collected: toggleInList(s.collect.collected, id) })
    : s));
  return ctx.store.get().collect.collected.length > before;
}

function added(ctx, item) {
  ctx.audio.ui('pick');
  ctx.toast(`${item.id} · ${item.title} added to your bag`, 'player');
}

// ---------- documents ----------

export async function documentScene(ctx, alive, item) {
  await ctx.world.walkTo(EVIDENCE_ANCHORS[item.id]);
  if (!alive() || !collect(ctx, item.id)) return;
  added(ctx, item);
  ctx.tip('first-document', 'Each item costs time from your day. Documents show what should happen; interviews show what really does.');
  const pick = await talk({
    speaker: 'narrator', name: `${item.id} · ${item.title}`, role: `${item.nature} · ${item.cost} min`,
    lines: [item.teaser, `Key line: “${keyLine(item)}”`].filter(Boolean),
    choices: [{ id: READ, label: 'Read it now', meta: 'Opens the document' }, { id: 'back', label: 'Back to the office' }],
  });
  if (alive() && pick === READ) ctx.openDoc(item.id);
}

// ---------- time sinks ----------

export async function trapScene(ctx, alive, item) {
  await ctx.world.walkTo(EVIDENCE_ANCHORS[item.id]);
  if (!alive() || !collect(ctx, item.id)) return;
  ctx.audio.ui('pick');
  ctx.toast(`${item.title} · ${item.cost} min spent`, 'warn');
  const lines = item.body.filter((b) => b.p).flatMap((b) => sentences(b.p));
  await talk({ speaker: 'narrator', name: item.title, role: `${item.cost} min`, lines });
}

// ---------- interviews ----------

export async function interviewScene(ctx, alive, item) {
  const person = item.person;
  await ctx.world.walkTo(EVIDENCE_ANCHORS[item.id]);
  if (!alive() || !collect(ctx, item.id)) return;
  added(ctx, item);
  ctx.tip('first-interview', 'Interviews are statements. Note what people say happens, then compare it with the documents.');
  ctx.world.setPerson(person, { state: 'talking', facing: 'assessor' });
  const pairs = item.body.filter((b) => b.qa).flatMap((b) => [['assessor', b.qa[0]], [person, b.qa[1]]]);
  await converse(pairs, alive);
  if (alive()) ctx.world.setPerson(person, { state: PEOPLE[person]?.state ?? 'idle' });
}

export function unbookedScene(ctx, personId) {
  const person = INTERVIEWEES.find((p) => p.id === personId);
  ctx.world.say(personId, 'Sorry, I’m not booked this week. Sprint 38 is busy.');
  ctx.toast(`${person?.name ?? 'This person'} was not booked in Chapter 1, so no interview today.`, 'info');
}

// ---------- the staging outage ----------

/** Sets the alarm scene: red lights, stressed people, Burak at the staging rack. */
export function stageOutage(ctx, { alarm = true } = {}) {
  ctx.world.setMood('outage');
  ctx.world.setPerson('burak', { anchor: OUTAGE_ANCHOR, state: 'stressed' });
  ctx.audio.ambience('outage');
  if (alarm) {
    ctx.audio.ui('alarm');
    ctx.toast('14:10 · Staging is down', 'bad');
  }
}

export function endOutage(ctx) {
  ctx.world.setMood('evening');
  ctx.world.setPerson('burak', { anchor: PEOPLE.burak.home, state: PEOPLE.burak.state });
  ctx.audio.ambience('office');
}

function outageChoices(state) {
  const left = minutesLeft(state);
  return OUTAGE_OPTIONS.map((o) => ({
    id: o.id,
    label: o.title,
    meta: `${o.cost} min`,
    disabled: o.cost > left,
    note: o.cost > left ? 'Not enough time left' : null,
  }));
}

function decideOutage(ctx, optionId) {
  ctx.store.update((s) => {
    if (s.collect.outage || !isOutageTriggered(s)) return s;
    if (outageCost(optionId) > minutesLeft(s)) return s;
    return patchSlice(s, 'collect', { outage: optionId });
  });
  return ctx.store.get().collect.outage === optionId;
}

async function observe(ctx, alive) {
  await ctx.world.walkTo(OUTAGE_ANCHOR);
  if (!alive()) return false;
  ctx.audio.ui('pick');
  ctx.toast(`${OUTAGE_EVENT.id} · ${OUTAGE_EVENT.title} added to your bag`, 'player');
  const lines = OUTAGE_EVENT.body.filter((b) => b.p).flatMap((b) => sentences(b.p));
  await talk({ speaker: 'narrator', name: 'You watch the recovery', role: 'Observation · 20 min', lines });
  return alive();
}

/** Burak presents the outage options. Resolves true once a choice is made. */
export async function outageScene(ctx, alive) {
  ctx.world.setView(OUTAGE_ANCHOR);
  const intro = await talk({ speaker: 'narrator', name: '14:10 · Server room', lines: [
    'Alarms in the server room. Staging is down.',
    'The Integration team’s data migration broke the Routing team’s API tests.',
  ] });
  if (!alive() || intro === null) return false;
  const pick = await talk({ speaker: 'burak', lines: [
    'Two teams are arguing in Slack about who may use staging.',
    'I’m bringing it back by hand. How will you use the next hour?',
  ], choices: outageChoices(ctx.store.get()) }, { quick: true });
  if (!alive() || pick === null || !decideOutage(ctx, pick)) return false;
  if (pick === 'observe' && !(await observe(ctx, alive))) return true;
  if (!alive()) return true;
  const option = OUTAGE_OPTIONS.find((o) => o.id === pick);
  await showVerdict({
    decision: 'Staging outage', match: pick === EXPERT.outage, yours: option.title,
    expertTitle: OUTAGE_OPTIONS.find((o) => o.id === EXPERT.outage).title, feedback: option.feedback, why: EXPERT_WHY.outage,
  });
  return true;
}
