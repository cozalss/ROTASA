// Chapter 2 · A day at Rotaşa. Explore the office against the clock: glowing
// desks are documents, booked people are interviews. The third item sets off
// the staging outage. Everything here is mirrored by the Collect screen.
import { formatMinutes } from '../../ui/dom.js';
import { findEvidence } from '../../data/evidence.js';
import { minutesLeft, minutesSpent } from '../../logic/assessment.js';
import {
  collectHotspots, parseSpot, suggestedAnchor, evidenceProgress, affordableCount, blockReason,
  isOutagePending,
} from './ch02-spots.js';
import {
  documentScene, trapScene, interviewScene, unbookedScene, outageScene, stageOutage, endOutage,
} from './ch02-scenes.js';
import { createEvidenceList } from './ch02-list.js';
import { worldOn } from './kit.js';

const DAY_START_MIN = 9 * 60;
const LOW_TIME_MIN = 45;

const st = { token: 0, busy: false, outageOpen: false, alarmOn: false, list: null };

export const meta = Object.freeze({
  step: 2,
  title: 'A day at Rotaşa',
  subtitle: 'One day on site. Collect evidence before the time runs out.',
  objective,
});

function objective(state) {
  const left = minutesLeft(state);
  const { done, total } = evidenceProgress(state);
  const head = `Collect evidence · ${done} of ${total} · ${formatMinutes(Math.max(0, left))} left.`;
  if (isOutagePending(state) && st.alarmOn) return { text: 'Staging is down! Click the red marker in the server room and decide what to do.', done, total };
  if (!state.collect.outage) return { text: `${head} Click glowing desks and booked people.`, done, total };
  if (!affordableCount(state)) return { text: 'Your day on site is over. Press Continue to rate what you found.', done, total };
  return { text: `${head} Collect more, or press Continue to rate the goals.`, done, total };
}

// ---------- staging ----------

function stage(ctx, state) {
  ctx.world.setHotspots(collectHotspots(state), (id) => onPick(ctx, id));
  ctx.world.setClock(DAY_START_MIN + minutesSpent(state.collect.collected, state.collect.outage));
  ctx.pointTo(st.busy ? null : suggestedAnchor(state));
  st.list?.setHidden(st.busy);
  st.list?.render(state);
  if (state.collect.outage) {
    const left = minutesLeft(state);
    ctx.cta({
      label: 'Continue to Chapter 3',
      hint: affordableCount(state) ? `${formatMinutes(left)} left. Collect more, or end the day.` : 'No time left for more requests.',
      onClick: () => ctx.go(3),
    });
  } else ctx.cta(null);
}

function nudge(ctx, state) {
  const left = minutesLeft(state);
  if (left > 0 && left < LOW_TIME_MIN && !isOutagePending(state)) {
    ctx.tip('time-low', `Only ${left} minutes left. Spend them on what tells you most about Level 2.`);
  }
}

// ---------- picking ----------

async function run(ctx, scene) {
  if (st.busy) return;
  st.busy = true;
  const my = st.token;
  const alive = () => my === st.token;
  ctx.pointTo(null);
  st.list?.setHidden(true);
  try {
    await scene(alive);
  } finally {
    if (alive()) {
      st.busy = false;
      afterScene(ctx);
    }
  }
}

function afterScene(ctx) {
  const state = ctx.store.get();
  stage(ctx, state);
  if (isOutagePending(state)) startAlarm(ctx);
}

// The alarm waits until the current scene is over, then Burak asks for a decision.
function startAlarm(ctx, { sound = true } = {}) {
  if (!st.alarmOn) {
    st.alarmOn = true;
    stageOutage(ctx, { alarm: sound });
    ctx.refresh();
  }
  if (!ctx.dossier.isOpen()) openOutage(ctx);
}

function pickEvidence(ctx, id) {
  const state = ctx.store.get();
  const item = findEvidence(id);
  if (!item) return;
  if (state.collect.collected.includes(id)) { ctx.openDoc(id); return; }
  const reason = blockReason(state, item);
  if (reason) {
    ctx.audio.ui('click');
    ctx.toast(`${item.title}: ${reason.toLowerCase()}.`, 'warn');
    return;
  }
  const scene = item.kind === 'interview' ? interviewScene : item.kind === 'trap' ? trapScene : documentScene;
  run(ctx, (alive) => scene(ctx, alive, item));
}

function onPick(ctx, spotId) {
  const spot = parseSpot(spotId);
  if (spot.type === 'evidence') pickEvidence(ctx, spot.id);
  else if (spot.type === 'unbooked') unbookedScene(ctx, spot.id);
  else if (spot.type === 'outage') openOutage(ctx);
  else if (spot.type === 'exit') ctx.go(3);
}

function openOutage(ctx) {
  if (st.outageOpen || !isOutagePending(ctx.store.get())) return;
  st.outageOpen = true;
  run(ctx, async (alive) => {
    try {
      await outageScene(ctx, alive);
    } finally {
      st.outageOpen = false;
      if (alive() && st.alarmOn && !isOutagePending(ctx.store.get())) {
        st.alarmOn = false;
        endOutage(ctx);
      }
    }
  });
}

// ---------- chapter interface ----------

export function enter(ctx) {
  st.token += 1;
  st.busy = false;
  st.outageOpen = false;
  st.alarmOn = false;
  const my = st.token;
  const state = ctx.store.get();
  ctx.world.setMode('explore');
  ctx.world.setView('overview');
  ctx.world.setMood('evening');
  // Without the world the dossier's Collect screen already lists everything.
  if (worldOn(ctx)) st.list = createEvidenceList({ onPick: (id) => onPick(ctx, id) });
  stage(ctx, state);
  ctx.mentor(2).then(() => {
    if (my === st.token && !st.busy && isOutagePending(ctx.store.get())) startAlarm(ctx);
  });
}

export function update(state, ctx) {
  const pending = isOutagePending(state);
  if (pending && !st.busy) startAlarm(ctx);
  if (!pending && st.alarmOn && !st.outageOpen) {
    st.alarmOn = false;
    endOutage(ctx);
  }
  if (!st.busy) stage(ctx, state);
  else ctx.world.setHotspots(collectHotspots(state), (id) => onPick(ctx, id));
  nudge(ctx, state);
}

export function exit(ctx) {
  st.token += 1;
  st.list?.remove();
  st.list = null;
  st.busy = false;
  st.outageOpen = false;
  st.alarmOn = false;
  ctx.world.setMood('evening');
  ctx.cta(null);
  ctx.pointTo(null);
}
