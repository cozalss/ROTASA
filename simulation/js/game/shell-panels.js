// Read-only shell panels: How to play and Credits.
import { h } from '../ui/dom.js';
import { openPanel } from './panel.js';
import { showGlossary } from './glossary.js';
import { RATINGS } from '../data/tmmi.js';
import { BUDGET } from '../data/decisions.js';
import { BASE_MINUTES, LEVEL3_SCOPE_PENALTY } from '../logic/assessment.js';

const MIN_PER_HOUR = 60;

const CONTROLS = [
  [['Click', 'Tap'], 'Walk to a spot, talk to a person, pick up a document.'],
  [['Tab', 'Enter'], 'Every hotspot and button is reachable from the keyboard.'],
  [['Enter', 'Space'], 'Dialogue: finish the line, then go to the next one.'],
  [['1–9', '↑ ↓'], 'Dialogue: pick a reply.'],
  [['Esc'], 'Close a dialogue or panel; otherwise pause the game.'],
];

const CHAPTERS = [
  ['Plan', 'Agree scope and assessment type with the CTO; book two interviews.'],
  ['Collect evidence', 'One day on site. Documents and interviews cost time.'],
  ['Assess', 'Rate the 21 Level 2 goals from what you collected.'],
  ['Conclude', 'Decide the indicative maturity level and say why.'],
  ['Report', 'Present findings and answer the CTO’s three objections.'],
  ['Improve', 'Build an improvement plan inside the budget.'],
  ['Reflect', 'Six months later: see what your choices caused.'],
];

const hours = (min) => `${Math.floor(min / MIN_PER_HOUR)} h ${String(min % MIN_PER_HOUR).padStart(2, '0')} min`;

function keycaps(keys) {
  return h('span', { class: 'sh-keys' }, keys.map((k, i) => [i ? h('span', { class: 'sh-keys-or' }, '/') : null, h('kbd', { class: 'sh-kbd' }, k)]));
}

function section(title, ...body) {
  return h('section', { class: 'sh-how-sec' }, h('h3', { class: 'sh-how-title' }, title), body);
}

function controlsSection() {
  return section('Controls',
    h('dl', { class: 'sh-controls' }, CONTROLS.map(([keys, text]) => [h('dt', {}, keycaps(keys)), h('dd', {}, text)])));
}

function chaptersSection() {
  return section('Seven chapters',
    h('ol', { class: 'sh-chapters' }, CHAPTERS.map(([name, text], i) => h('li', {},
      h('span', { class: 'sh-chap-num', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
      h('span', {}, h('b', {}, name), ' ', text)))));
}

function budgetSection() {
  return section('Time and money',
    h('p', {}, `Your day on site lasts ${hours(BASE_MINUTES)}. Adding Level 3 to the scope costs ${LEVEL3_SCOPE_PENALTY} minutes of it. `,
      'Every document and interview has a time cost shown before you take it; the clock in the corner counts down.'),
    h('p', {}, `The improvement plan has ${BUDGET.hours} person-hours and TRY ${BUDGET.money.toLocaleString('en-US')} for the next quarter.`));
}

function ratingsSection() {
  return section('Ratings',
    h('ul', { class: 'sh-ratings' }, RATINGS.map((r) => h('li', { class: `sh-rating sh-rating-${r.id === '?' ? 'q' : r.id}` },
      h('span', { class: 'sh-rating-id', 'aria-hidden': 'true' }, r.id),
      h('span', {}, h('b', {}, r.label), h('small', {}, r.range === 'NR' ? 'goal stays Not Rated' : r.range))))),
    h('p', { class: 'sh-muted' }, 'A process area takes its weakest goal’s rating. Level 2 needs all six process areas at Largely or Fully.'));
}

function dossierSection() {
  return section('The dossier',
    h('p', {}, 'Your notebook. It holds every document you collected, the rating sheets, the conclusion, the report and the plan. ',
      'Open it from the top-right corner or the pause menu. After each decision you lock, the expert’s call appears next to yours.'));
}

/** Opens the How to play panel. Returns close(). */
export function showHowToPlay(onClose) {
  return openPanel({
    kicker: 'Field guide',
    title: 'How to play',
    wide: true,
    className: 'sh-panel-how',
    onClose,
    body: h('div', { class: 'sh-how' },
      h('p', { class: 'sh-lede' }, 'You are the external assessor. Rotaşa’s CTO wants to know how far the company is from TMMi Level 2. ',
        'You have one day on site, then the findings meeting.'),
      h('div', { class: 'sh-how-grid' },
        h('div', {}, controlsSection(), budgetSection(), dossierSection()),
        h('div', {}, chaptersSection(), ratingsSection())),
      h('p', { class: 'sh-how-gloss' },
        h('button', { type: 'button', class: 'gd-btn gd-btn-ghost', onClick: () => showGlossary() }, 'Open the glossary'),
        ' Every TMMi word in the game, in plain language.')),
  });
}

const CREDITS = [
  ['Team', ['Cem Özal', 'Sertaç Ataç']],
  ['Case', ['Rotaşa Technology case pack, provided by the course. Rotaşa and every person in it are fictional.']],
  ['Built with', ['Three.js r128 (MIT)', 'GSAP 3.12.5 (GreenSock standard license)', 'Big Shoulders Display, Public Sans, JetBrains Mono (SIL Open Font License)']],
];

const SOURCES = [
  'TMMi Foundation. Test Maturity Model integration (TMMi), Framework Release 2.0. tmmi.org.',
  'TMMi Foundation. TMMi Assessment Method Application Requirements (TAMAR), Release 1.3. tmmi.org.',
];

/** Opens the Credits panel. Returns close(). */
export function showCredits(onClose) {
  return openPanel({
    kicker: 'Rotaşa Assessment Desk',
    title: 'Credits',
    className: 'sh-panel-credits',
    onClose,
    body: h('div', { class: 'sh-credits' },
      h('dl', { class: 'sh-credit-list' }, CREDITS.map(([role, lines]) => [
        h('dt', {}, role),
        h('dd', {}, lines.map((line) => h('span', {}, line)))])),
      h('section', { class: 'sh-sources' },
        h('h3', { class: 'sh-how-title' }, 'Sources'),
        h('ol', {}, SOURCES.map((s) => h('li', {}, s))),
        h('p', { class: 'sh-muted' }, 'TMMi® is a registered trademark of the TMMi Foundation. Framework and method text is quoted and paraphrased for teaching.'))),
  });
}
