// Trophy room panel and "achievement unlocked" notices.
// The rules live in js/logic/achievements.js; this file only presents them.
import { h } from '../ui/dom.js';
import { openPanel } from './panel.js';
import { toast } from './toast.js';
import { ui as sound } from './audio.js';
import { ACHIEVEMENTS, evaluateAchievements, findAchievement } from '../logic/achievements.js';

// Each achievement is announced once per visit, even if a choice flips back and forth.
const announced = new Set();
const MAX_SINGLE_TOASTS = 2;

function trophyCard(a, isUnlocked, index) {
  return h('li', {
    class: `sh-trophy${isUnlocked ? ' is-unlocked' : ' is-locked'}`,
    style: { '--i': index },
  },
  h('span', { class: 'sh-trophy-icon', 'aria-hidden': 'true' }, a.icon),
  h('div', { class: 'sh-trophy-text' },
    h('h3', { class: 'sh-trophy-title' },
      a.title,
      h('span', { class: 'g-sr' }, isUnlocked ? ' (unlocked)' : ' (locked)')),
    h('p', { class: 'sh-trophy-desc' }, isUnlocked ? a.description : a.hint)),
  h('span', { class: 'sh-trophy-tag', 'aria-hidden': 'true' }, isUnlocked ? 'Unlocked' : 'Locked'));
}

function summary(count) {
  const total = ACHIEVEMENTS.length;
  return h('div', { class: 'sh-trophy-sum' },
    h('p', { class: 'sh-trophy-count' }, h('b', {}, String(count)), h('span', {}, ` / ${total} unlocked`)),
    h('div', {
      class: 'sh-trophy-bar', role: 'progressbar', 'aria-label': 'Achievements unlocked',
      'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(count),
      style: { '--p': (count / total).toFixed(3) },
    }));
}

/** Opens the trophy room for a game state. Returns close(). */
export function showTrophies(state, onClose) {
  const unlocked = new Set(state ? evaluateAchievements(state) : []);
  const ordered = [...ACHIEVEMENTS].sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)));
  return openPanel({
    kicker: 'Trophy room',
    title: 'Achievements',
    wide: true,
    className: 'sh-panel-trophies',
    onClose,
    body: [
      summary(unlocked.size),
      h('ul', { class: 'sh-trophies' }, ordered.map((a, i) => trophyCard(a, unlocked.has(a.id), i))),
      h('p', { class: 'sh-panel-foot' }, 'Achievements follow your current assessment. They reward good practice, not speed.'),
    ],
  });
}

/**
 * Compares two states and announces achievements unlocked by the change:
 * a toast per achievement and one chapter swell. Returns the new ids.
 */
export function notifyNewAchievements(prevState, nextState) {
  if (!nextState) return [];
  const before = new Set(prevState ? evaluateAchievements(prevState) : []);
  const fresh = evaluateAchievements(nextState).filter((id) => !before.has(id) && !announced.has(id));
  if (!fresh.length) return [];
  fresh.forEach((id) => announced.add(id));
  const titles = fresh.map((id) => findAchievement(id).title);
  if (titles.length <= MAX_SINGLE_TOASTS) titles.forEach((t) => toast(`Achievement unlocked: ${t}`, 'player'));
  else toast(`${titles.length} achievements unlocked: ${titles.join(', ')}`, 'player');
  sound('chapter');
  return fresh;
}

/** Marks achievements as already announced (e.g. those a loaded save already holds). */
export function markAnnounced(state) {
  if (state) evaluateAchievements(state).forEach((id) => announced.add(id));
}
