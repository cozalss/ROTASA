// Terms explained where they appear (GAME-DESIGN "Clarity" 5).
// enhanceGlossary(root) turns [data-term="id"] elements, and the first mention
// of each known term inside [data-glossary] containers, into focusable
// underlined buttons. Hover, focus or tap shows a two-line tooltip; Escape
// closes it. Screen readers get the definition through aria-describedby.
// showGlossary() opens the full list as a panel (for How to play).
import { h } from '../ui/dom.js';
import { gameLayer } from './toast.js';
import { openPanel } from './panel.js';
import { GLOSSARY, findTerm, splitByTerms } from './mentor-data.js';
import { translate as t, getLang } from '../i18n/i18n.js';

const DEFS_ID = 'mt-glossary-defs';
const SKIP_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SCRIPT', 'STYLE', 'SVG', 'CODE']);
const GAP = 8;
const EDGE = 12;

let tipEl = null;
let current = null;
let pinned = false;
let wired = false;

const defId = (id) => `mt-def-${id}`;

// Hidden definitions, one per term, referenced by every trigger.
function ensureDefs() {
  if (document.getElementById(DEFS_ID)) return;
  document.body.append(h('div', { id: DEFS_ID, class: 'mt-sr' },
    GLOSSARY.map((g) => h('span', { id: defId(g.id) }, `${t(g.term)}: ${t(g.text)}`))));
}

function ensureTip() {
  if (tipEl?.isConnected) return tipEl;
  tipEl = h('div', { class: 'mt-gloss-tip', 'aria-hidden': 'true', hidden: true },
    h('p', { class: 'mt-gloss-term' }), h('p', { class: 'mt-gloss-text' }));
  gameLayer().append(tipEl);
  return tipEl;
}

function place(tip, trigger) {
  const r = trigger.getBoundingClientRect();
  const w = tip.offsetWidth;
  const ht = tip.offsetHeight;
  const left = Math.max(EDGE, Math.min(window.innerWidth - w - EDGE, r.left + r.width / 2 - w / 2));
  const below = r.bottom + GAP + ht < window.innerHeight - EDGE;
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(below ? r.bottom + GAP : r.top - GAP - ht)}px`;
  tip.dataset.side = below ? 'below' : 'above';
}

function show(trigger) {
  const entry = findTerm(trigger.dataset.termId);
  if (!entry) return;
  const tip = ensureTip();
  tip.querySelector('.mt-gloss-term').textContent = t(entry.term);
  tip.querySelector('.mt-gloss-text').textContent = t(entry.text);
  tip.hidden = false;
  current?.setAttribute('aria-expanded', 'false');
  current = trigger;
  trigger.setAttribute('aria-expanded', 'true');
  place(tip, trigger);
}

function hide() {
  if (tipEl) tipEl.hidden = true;
  current?.setAttribute('aria-expanded', 'false');
  current = null;
  pinned = false;
}

const triggerOf = (target) => (target instanceof Element ? target.closest('.mt-term') : null);

function wire() {
  if (wired) return;
  wired = true;
  document.addEventListener('pointerover', (e) => { const t = triggerOf(e.target); if (t && !pinned) show(t); });
  document.addEventListener('pointerout', (e) => { if (triggerOf(e.target) && !pinned) hide(); });
  document.addEventListener('focusin', (e) => { const t = triggerOf(e.target); if (t) show(t); else if (current) hide(); });
  document.addEventListener('focusout', (e) => { if (triggerOf(e.target)) hide(); });
  document.addEventListener('click', (e) => {
    const t = triggerOf(e.target);
    if (!t) { if (pinned) hide(); return; }
    e.preventDefault();
    if (pinned && current === t) return hide();
    show(t);
    pinned = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !current) return;
    e.stopPropagation();
    hide();
  }, true);
  window.addEventListener('scroll', () => { if (current) hide(); }, { passive: true, capture: true });
}

function trigger(text, id) {
  return h('button', {
    type: 'button', class: 'mt-term', 'data-term-id': id,
    'aria-describedby': defId(id), 'aria-expanded': 'false',
  }, text);
}

// <span data-term="nr">NR</span> -> <span data-term="nr"><button class="mt-term">NR</button></span>
function upgradeTermElement(el) {
  const id = el.dataset.term;
  el.dataset.termReady = '1';
  if (!findTerm(id)) return;
  if (el.tagName === 'BUTTON') {
    el.classList.add('mt-term');
    el.dataset.termId = id;
    el.setAttribute('aria-describedby', defId(id));
    return;
  }
  const btn = trigger('', id);
  btn.append(...el.childNodes);
  if (!btn.textContent.trim()) btn.textContent = t(findTerm(id).term);
  el.append(btn);
}

function skippable(node, container) {
  for (let el = node.parentElement; el && el !== container; el = el.parentElement) {
    if (SKIP_TAGS.has(el.tagName.toUpperCase()) || el.classList.contains('mt-term') || el.isContentEditable) return true;
  }
  return false;
}

function textNodes(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const out = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeValue.trim() && !skippable(n, container)) out.push(n);
  }
  return out;
}

function scanContainer(container) {
  container.dataset.glossaryReady = '1';
  let used = new Set([...container.querySelectorAll('.mt-term')].map((b) => b.dataset.termId));
  textNodes(container).forEach((node) => {
    const result = splitByTerms(node.nodeValue, GLOSSARY, used);
    used = result.used;
    if (!result.segments.some((s) => s.id)) return;
    node.replaceWith(...result.segments.map((s) => (s.id ? trigger(s.text, s.id) : document.createTextNode(s.text))));
  });
}

/**
 * Upgrades glossary terms under root. Idempotent: call it after every render.
 * options.selector picks the containers scanned for known terms
 * (default '[data-glossary]'; root itself counts when it matches).
 */
export function enhanceGlossary(root, { selector = '[data-glossary]' } = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  ensureDefs();
  wire();
  root.querySelectorAll('[data-term]:not([data-term-ready])').forEach(upgradeTermElement);
  const containers = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) containers.unshift(root);
  containers.filter((c) => !c.dataset.glossaryReady).forEach(scanContainer);
}

/** Opens the full glossary as a panel. Returns close(). */
export function showGlossary() {
  const sorted = GLOSSARY.map((g) => ({ term: t(g.term), text: t(g.text) }))
    .sort((a, b) => a.term.localeCompare(b.term, getLang()));
  return openPanel({
    kicker: 'How to play',
    title: 'Glossary',
    className: 'mt-glossary-panel',
    body: [
      h('p', { class: 'mt-glossary-lede' }, 'Words you will meet on the way, in plain language. Underlined words in the game open the same notes.'),
      h('dl', { class: 'mt-glossary-list' },
        sorted.map((g) => h('div', { class: 'mt-glossary-item' }, h('dt', {}, g.term), h('dd', {}, g.text)))),
    ],
  });
}
