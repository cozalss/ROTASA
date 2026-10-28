// Chapter 5 · The findings meeting. Murat (and Kerem, if he was interviewed)
// sit in the meeting room. Murat opens according to the Step 1 assessment
// type, then raises three objections. Answers are chosen in the dialogue and
// written into the same state keys report.js uses; the automation reply is
// written and locked in the dossier. State is the source of truth: a lock
// made in the dossier gets the same stamp, reaction and expert comparison.
import { patchSlice, setKey } from '../../store.js';
import { opener } from '../../ui/screens/report-parts.js';
import { worldOn, withWorld, clearWorld, stamp, tipOnce, newlyTrue } from './kit.js';
import { KEYS, OBJECTIONS, REACTIONS, NO_DATA_LINE, KEREM_LINE, REPLY_TOAST,
  requiredKeys, nextObjection, choicesFor, comparison } from './ch05-lines.js';

const FOCUS_TRIES = 12;
const FOCUS_GAP_MS = 80;
const WALK_CAP_MS = 4500;
const HOME = { murat: ['cto-office', 'typing'], kerem: ['po-desk', 'idle'] };

const st = { ctx: null, prev: {}, open: null, started: false, finished: false };

export const meta = {
  step: 5,
  title: 'The findings meeting',
  subtitle: 'Murat reads your findings. He will push back three times.',
  objective(state) {
    const keys = requiredKeys(state);
    const done = keys.filter((k) => state.report.revealed[k]).length;
    const { automation, revealed } = state.report;
    let text = `Answer Murat’s objections · ${done} of ${keys.length}`;
    if (automation && !revealed.automation) text = 'Write your reply to Murat in the dossier, then lock it.';
    if (done >= keys.length) text = 'Meeting over. Continue to the plan.';
    return { text, done, total: keys.length };
  },
};

const keremAttends = (state) => state.plan.interviews.includes('kerem');
const getState = () => st.ctx.store.get();

// Murat's opening line and the verdict under it, from the dossier's own opener.
function openerParts(type) {
  const node = opener(type);
  if (!node) return null;
  const line = node.querySelector('blockquote p')?.textContent.replace(/^[“"]|[”"]$/g, '') ?? '';
  const verdict = node.querySelector('.verdict');
  const tone = ['bad', 'warn', 'good'].find((t) => verdict?.classList.contains(t)) ?? 'info';
  return { line, head: verdict?.querySelector('strong')?.textContent ?? '', tone };
}

function murat(lines, extra = {}) {
  withWorld(st.ctx, (w) => w.setPerson('murat', { state: 'talking' }));
  const close = st.ctx.dialogue({
    speaker: 'murat', lines, ...extra,
    onClose: () => { idle(); extra.onClose?.(); },
    onChoose: (id) => { idle(); extra.onChoose?.(id); },
  });
  st.open = close;
  return close;
}

function idle() {
  withWorld(st.ctx, (w) => w.setPerson('murat', { state: 'idle' }));
}

// ---------- staging ----------

// Resolves when you reach the meeting room (or after WALK_CAP_MS). setPerson
// walks the assessor without the camera following, so the view stays put.
function seatPeople(state) {
  const walk = withWorld(st.ctx, (w) => {
    w.setMode('explore');
    w.setMood('evening');
    w.setView('meeting-room');
    w.setPerson('murat', { anchor: 'meeting-room', state: 'idle', facing: 'assessor' });
    if (keremAttends(state)) w.setPerson('kerem', { anchor: 'meeting-room', state: 'idle', facing: 'assessor' });
    return w.setPerson('assessor', { anchor: 'meeting-room', state: 'idle' });
  });
  setSpot();
  const capped = Promise.race([Promise.resolve(walk), new Promise((r) => { window.setTimeout(r, WALK_CAP_MS); })]);
  return capped;
}

function setSpot() {
  withWorld(st.ctx, (w) => w.setHotspots([{
    id: 'murat-meeting', anchor: 'meeting-room', kind: 'person', label: 'Murat Kaya',
    sublabel: st.finished ? 'Meeting over' : 'Continue the meeting', state: st.finished ? 'done' : 'available',
  }], () => { if (!st.finished) resume(); }));
}

// ---------- the meeting ----------

function start() {
  if (st.started) return;
  st.started = true;
  const state = getState();
  const parts = KEYS.some((k) => state.report.revealed[k]) ? null : openerParts(state.plan.type);
  if (!parts) return resume();
  if (parts.head) st.ctx.toast(parts.head, parts.tone);
  if (keremAttends(state)) withWorld(st.ctx, (w) => w.say('kerem', KEREM_LINE));
  ask(nextObjection(state), [parts.line]);
}

function ask(key, before = []) {
  const state = getState();
  if (!key) return finish();
  if (key === 'automation' && state.report.automation) return askForReply();
  murat([...before, OBJECTIONS[key].line], {
    choices: choicesFor(key, state),
    onChoose: (id) => answer(key, id),
    onClose: paused,
  });
}

function paused() {
  if (!st.ctx) return;
  const how = worldOn(st.ctx) ? 'Click Murat to go on, or answer in the dossier.' : 'Answer in the dossier when you are ready.';
  st.ctx.toast(`Meeting paused. ${how}`, 'info');
}

function answer(key, id) {
  if (key === 'automation') {
    st.ctx.store.update((s) => patchSlice(s, 'report', { automation: id }));
    return askForReply();
  }
  st.ctx.store.update((s) => patchSlice(s, 'report', { [key]: id, revealed: setKey(s.report.revealed, key, true) }));
}

function askForReply() {
  st.ctx.toast(REPLY_TOAST, 'player');
  st.ctx.dossier.open();
  focusReply(FOCUS_TRIES);
}

// The director re-renders the dossier after each update; retry until the field is there.
function focusReply(tries) {
  const field = document.getElementById('automation-text');
  if (field && field.offsetParent !== null) {
    field.scrollIntoView({ block: 'center' });
    field.focus({ preventScroll: true });
    return;
  }
  if (tries > 0) window.setTimeout(() => focusReply(tries - 1), FOCUS_GAP_MS);
}

function react(key, state) {
  stamp(st.ctx);
  if (key === 'automation') st.ctx.dossier.close();
  const id = state.report[key];
  const cmp = comparison(key, id);
  st.ctx.toast(cmp.text, cmp.tone);
  murat([REACTIONS[key][id] ?? '…'], { onClose: resume });
}

function resume() {
  if (!st.ctx) return undefined;
  const state = getState();
  const key = nextObjection(state);
  if (key) return ask(key);
  if (!requiredKeys(state).includes('kvkk') && !st.finished) {
    st.open = st.ctx.dialogue({ speaker: 'narrator', lines: [NO_DATA_LINE], onClose: finish });
    return st.open;
  }
  return finish();
}

function finish() {
  if (!st.ctx || st.finished) return;
  st.finished = true;
  setSpot();
  st.ctx.toast('Meeting over: every objection answered. Continue to the plan.', 'good');
  tipOnce(st.ctx, 'report-done', 'Locked answers come back in Chapter 7, six months later.');
}

// ---------- contract ----------

export function enter(ctx) {
  st.ctx = ctx;
  const state = ctx.store.get();
  st.prev = { ...state.report.revealed };
  st.started = false;
  st.finished = nextObjection(state) === null;
  ctx.dossier?.close?.();
  const seated = seatPeople(state);
  Promise.all([Promise.resolve(ctx.mentor?.(meta.step)), seated]).then(() => { if (st.ctx === ctx) start(); });
}

export function update(state, ctx) {
  if (st.ctx !== ctx) return;
  const fresh = newlyTrue(st.prev, state.report.revealed, KEYS);
  st.prev = { ...state.report.revealed };
  if (fresh.length) react(fresh[fresh.length - 1], state);
}

export function exit(ctx) {
  const close = st.open;
  st.ctx = null;
  st.open = null;
  close?.();
  clearWorld(ctx);
  withWorld(ctx, (w) => Object.entries(HOME).forEach(([id, [anchor, state]]) => w.setPerson(id, { anchor, state })));
}

