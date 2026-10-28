// Tiny DOM builder. Children may be strings, nodes, arrays, null or false.
// Strings are always inserted as text, so case content is never parsed as HTML.
import { translate as t } from '../i18n/i18n.js';

const TRANSLATED_ATTRS = new Set(['aria-label', 'aria-valuetext', 'title', 'placeholder', 'alt']);

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style' && typeof value === 'object') setStyles(el, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, TRANSLATED_ATTRS.has(key) ? t(String(value)) : String(value));
  }
  appendChildren(el, children);
  return el;
}

// Custom properties (--name) need setProperty; plain assignment ignores them.
function setStyles(el, styles) {
  for (const [prop, val] of Object.entries(styles)) {
    if (prop.startsWith('--')) el.style.setProperty(prop, String(val));
    else el.style[prop] = val;
  }
}

function appendChildren(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(t(String(child))));
  }
}

export function formatMinutes(min) {
  const sign = min < 0 ? '−' : '';
  const abs = Math.abs(min);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  if (hours === 0) return `${sign}${mins} min`;
  if (mins === 0) return `${sign}${hours} h`;
  return `${sign}${hours} h ${mins} min`;
}

// Renders a "concept" box that teaches the player a term.
export function conceptBox(title, ...body) {
  return h('aside', { class: 'concept', 'aria-label': `Concept: ${title}` },
    h('p', { class: 'eyebrow' }, 'Concept'),
    h('h3', {}, title),
    ...body);
}

// Renders a designer note (visible only when designer notes are on).
export function designerNote(requirement, text) {
  return h('aside', { class: 'designer-note' },
    h('p', { class: 'eyebrow' }, requirement),
    h('p', {}, text));
}

export function button(label, onClick, { variant = 'primary', disabled = false, id } = {}) {
  return h('button', { type: 'button', class: `btn btn-${variant}`, onClick, disabled, id }, label);
}

export function chip(label, tone = 'neutral') {
  return h('span', { class: `chip chip-${tone}` }, label);
}
