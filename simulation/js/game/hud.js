// Game HUD over the world. A pure function of state: the caller re-renders it.
// Top-left: chapter and current objective. Top-right: Step 2 clock, evidence
// bag, dossier and sound toggle.
import { h, formatMinutes } from '../ui/dom.js';
import { STEP_TITLES } from '../ui/components.js';
import { knownEvidenceIds, minutesLeft, timeBudget, actionTotals } from '../logic/assessment.js';
import { ALL_GOALS } from '../data/tmmi.js';
import { INTERVIEW_SLOTS, BUDGET } from '../data/decisions.js';
import { isOn as soundIsOn } from './audio.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;
const WARN_RATIO = 0.4;
const BAD_RATIO = 0.15;
const COLLECT_STEP = 2;

const ICONS = {
  bag: ['M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z', 'M9 8V6a3 3 0 0 1 6 0v2'],
  dossier: ['M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z', 'M7 12h10', 'M7 15h6'],
  soundOn: ['M4 9.5h3l4-3.5v12l-4-3.5H4z', 'M15 9a4 4 0 0 1 0 6', 'M17.5 6.5a7.5 7.5 0 0 1 0 11'],
  soundOff: ['M4 9.5h3l4-3.5v12l-4-3.5H4z', 'M15.5 9.5l5 5', 'M20.5 9.5l-5 5'],
  help: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8', 'M12 17h.01'],
};

function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  children.forEach((c) => el.append(c));
  return el;
}

function icon(name) {
  return svg('svg', { viewBox: '0 0 24 24', width: 20, height: 20, class: 'g-icon', 'aria-hidden': 'true', focusable: 'false' },
    ...ICONS[name].map((d) => svg('path', { d })));
}

// ---------- objectives ----------

function planObjective(plan) {
  const booked = plan.interviews.length;
  const done = [Boolean(plan.scope), Boolean(plan.type), booked >= INTERVIEW_SLOTS].filter(Boolean).length;
  let text = 'Plan ready. Open the dossier to confirm it and head out.';
  if (!plan.scope) text = 'Agree the assessment scope with Murat in his office.';
  else if (!plan.type) text = 'Agree what kind of assessment this is: informal or formal.';
  else if (booked < INTERVIEW_SLOTS) text = `Book ${INTERVIEW_SLOTS} interviews (${booked} of ${INTERVIEW_SLOTS} booked).`;
  return { text, done, total: 3 };
}

function collectObjective(state) {
  const left = minutesLeft(state);
  const done = state.collect.collected.length;
  if (left <= 0) return { text: 'The day is over. Open the dossier to review your evidence.', done, total: 0 };
  return { text: `Collect evidence before the day ends (${formatMinutes(left)}). Click people and documents in the office.`, done, total: 0 };
}

function assessObjective(assess) {
  const rated = ALL_GOALS.filter((g) => assess.ratings[g.id]).length;
  return { text: `Rate every Level 2 goal from your evidence (${rated} of ${ALL_GOALS.length} rated).`, done: rated, total: ALL_GOALS.length };
}

function reportObjective(report) {
  const done = [report.automation, report.attribution, report.kvkk].filter(Boolean).length;
  return { text: `Settle the three report questions: automation, attribution, test data (${done} of 3).`, done, total: 3 };
}

function improveObjective(improve) {
  const used = actionTotals(improve.actions).hours;
  return { text: `Choose improvement actions within the budget (${used} of ${BUDGET.hours} h used) and pick what starts first.`, done: used, total: BUDGET.hours };
}

/** Current objective for a state: { text, done, total } (total 0 = no progress bar). */
export function objectiveFor(state) {
  switch (state.step) {
    case 0: return { text: 'Meet Murat Kaya, the CTO, in his office.', done: 0, total: 0 };
    case 1: return planObjective(state.plan);
    case 2: return collectObjective(state);
    case 3: return assessObjective(state.assess);
    case 4: return { text: state.conclude.level ? 'Level filed. Compare your call with the expert in the dossier.' : 'Decide the indicative maturity level and say why.', done: state.conclude.level ? 1 : 0, total: 1 };
    case 5: return reportObjective(state.report);
    case 6: return improveObjective(state.improve);
    default: return { text: 'Look back at your choices next to the expert’s.', done: 0, total: 0 };
  }
}

// ---------- pieces ----------

function chapterBlock(state, override) {
  const obj = override || objectiveFor(state);
  const ratio = obj.total ? Math.min(1, obj.done / obj.total) : 0;
  const kicker = state.step === 0 ? 'Prologue' : `Chapter ${state.step} / 7`;
  return h('div', { class: 'g-hud-panel g-hud-chapter' },
    h('p', { class: 'g-hud-kicker' }, h('span', { class: 'g-hud-dot', 'aria-hidden': 'true' }), kicker),
    h('h2', { class: 'g-hud-title' }, STEP_TITLES[state.step] || ''),
    h('p', { class: 'g-hud-objective' }, h('span', { class: 'g-sr' }, 'Objective: '), obj.text),
    obj.total ? h('div', {
      class: 'g-hud-progress', role: 'progressbar', 'aria-label': 'Objective progress',
      'aria-valuemin': '0', 'aria-valuemax': String(obj.total), 'aria-valuenow': String(Math.min(obj.done, obj.total)),
      style: { '--p': ratio.toFixed(3) },
    }) : null);
}

function shortClock(min) {
  const abs = Math.max(0, min);
  return `${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
}

function clockBlock(state) {
  const left = minutesLeft(state);
  const total = timeBudget(state.plan.scope);
  const ratio = Math.max(0, Math.min(1, left / total));
  const tone = ratio < BAD_RATIO ? 'bad' : ratio < WARN_RATIO ? 'warn' : 'good';
  const ring = svg('svg', { viewBox: '0 0 36 36', width: 36, height: 36, class: 'g-clock-ring', 'aria-hidden': 'true' },
    svg('circle', { cx: 18, cy: 18, r: RING_R, class: 'g-clock-track' }),
    svg('circle', { cx: 18, cy: 18, r: RING_R, class: 'g-clock-fill', 'stroke-dasharray': RING_C.toFixed(2), 'stroke-dashoffset': (RING_C * (1 - ratio)).toFixed(2) }));
  return h('div', { class: `g-hud-panel g-clock g-clock-${tone}`, role: 'timer', 'aria-label': `Time left on site: ${formatMinutes(left)} of ${formatMinutes(total)}` },
    ring,
    h('span', { class: 'g-clock-text', 'aria-hidden': 'true' },
      h('span', { class: 'g-clock-label' }, 'Day ends in'),
      h('b', { class: 'g-clock-long' }, formatMinutes(Math.max(0, left))),
      h('b', { class: 'g-clock-short' }, shortClock(left))));
}

function toolButton({ cls, iconName, label, text, onClick, pressed, badge }) {
  return h('button', {
    type: 'button',
    class: `g-hud-panel g-hud-btn ${cls}`,
    'aria-label': label,
    'aria-pressed': pressed === undefined ? null : String(pressed),
    onClick: () => onClick?.(),
  },
  icon(iconName),
  text ? h('span', { class: 'g-hud-btn-text', 'aria-hidden': 'true' }, text) : null,
  badge === undefined ? null : h('span', { class: 'g-hud-badge', 'aria-hidden': 'true' }, String(badge)));
}

/**
 * Renders the HUD. handlers: { onOpenDossier, onOpenBag, onToggleSound, onHelp?, objective? }.
 * `objective` ({ text, done, total }) replaces the built-in objective (the active chapter's).
 * The sound button reflects audio.isOn(); re-render after toggling.
 */
export function renderHud(state, handlers = {}) {
  const bagCount = knownEvidenceIds(state).length;
  const soundOn = soundIsOn();
  const tools = h('div', { class: 'g-hud-tools' },
    state.step === COLLECT_STEP ? clockBlock(state) : null,
    state.step >= COLLECT_STEP ? toolButton({
      cls: 'g-hud-bag', iconName: 'bag', label: `Evidence bag, ${bagCount} items`, text: 'Bag', onClick: handlers.onOpenBag, badge: bagCount,
    }) : null,
    toolButton({ cls: 'g-hud-dossier', iconName: 'dossier', label: 'Open the dossier', text: 'Dossier', onClick: handlers.onOpenDossier }),
    handlers.onHelp ? toolButton({ cls: 'g-hud-help', iconName: 'help', label: 'Ask Selin, your mentor', onClick: handlers.onHelp }) : null,
    toolButton({ cls: 'g-hud-sound', iconName: soundOn ? 'soundOn' : 'soundOff', label: 'Sound', pressed: soundOn, onClick: handlers.onToggleSound }));
  return h('div', { class: 'g-hud', role: 'region', 'aria-label': 'Game status' }, chapterBlock(state, handlers.objective), tools);
}

export default renderHud;
