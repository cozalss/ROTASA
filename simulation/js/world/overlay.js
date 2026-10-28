// DOM layer over the canvas: one focusable button per hotspot (Tab/Enter work
// without a mouse), name tags and speech bubbles. Elements are positioned by
// the world each frame from projected 3D points. All text uses textContent.
import { translate as t } from '../i18n/i18n.js';

const STATE_TEXT = { done: 'done', locked: 'locked' };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = t(text);
  return node;
}

function place(node, x, y) {
  node.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

export function createOverlay(host, handlers) {
  const root = el('div', 'world-overlay');
  const tags = el('div', 'world-tags');
  tags.setAttribute('aria-hidden', 'true');
  const spots = el('div', 'world-hotspots');
  spots.setAttribute('role', 'group');
  spots.setAttribute('aria-label', t('Places and people in the office'));
  const live = el('div', 'world-live');
  live.setAttribute('aria-live', 'polite');
  root.append(tags, spots, live);
  host.append(root);

  const buttons = new Map();
  const nameTags = new Map();
  const bubbles = new Map();

  function makeButton(h) {
    const b = el('button', 'world-hotspot');
    b.type = 'button';
    const label = el('span', 'world-hotspot-label');
    label.append(el('span', 'world-hotspot-title'), el('span', 'world-hotspot-sub'));
    b.append(el('span', 'world-hotspot-dot'), label);
    b.addEventListener('click', (e) => { e.stopPropagation(); handlers.onActivate(b.dataset.id); });
    b.addEventListener('focus', () => handlers.onFocus(b.dataset.id));
    b.addEventListener('blur', () => handlers.onBlur(b.dataset.id));
    b.addEventListener('pointerenter', () => handlers.onEnter(b.dataset.id));
    b.addEventListener('pointerleave', () => handlers.onLeave(b.dataset.id));
    return b;
  }

  function fill(b, h) {
    b.dataset.id = h.id;
    b.dataset.kind = h.kind || 'document';
    b.dataset.state = h.state || 'available';
    const extra = STATE_TEXT[h.state] ? ` (${t(STATE_TEXT[h.state])})` : '';
    b.setAttribute('aria-label', `${t(h.label)}${h.sublabel ? `, ${t(h.sublabel)}` : ''}${t(extra)}`);
    b.querySelector('.world-hotspot-title').textContent = t(h.label);
    const sub = b.querySelector('.world-hotspot-sub');
    sub.textContent = t(h.sublabel || '');
    sub.hidden = !h.sublabel;
  }

  return {
    root,
    setHotspots(list) {
      const keep = new Set();
      list.forEach((h) => {
        keep.add(h.id);
        let b = buttons.get(h.id);
        if (!b) {
          b = makeButton(h);
          buttons.set(h.id, b);
        }
        fill(b, h);
        spots.append(b);
      });
      buttons.forEach((b, id) => { if (!keep.has(id)) { b.remove(); buttons.delete(id); } });
    },
    placeHotspot(id, x, y, onscreen) {
      const b = buttons.get(id);
      if (!b) return;
      place(b, x, y);
      b.classList.toggle('is-offscreen', !onscreen);
      b.classList.toggle('is-below', y < 90);
    },
    setHover(id) {
      buttons.forEach((b, k) => b.classList.toggle('is-hover', k === id));
    },
    setInteractive(on) {
      spots.inert = !on;
      if (on) spots.removeAttribute('aria-hidden'); else spots.setAttribute('aria-hidden', 'true');
    },
    ensureTag(id, name, role) {
      if (nameTags.has(id)) return;
      const t = el('div', 'world-nametag');
      t.append(el('span', 'world-nametag-name', name), el('span', 'world-nametag-role', role));
      t.dataset.person = id;
      tags.append(t);
      nameTags.set(id, t);
    },
    placeTag(id, x, y, show) {
      const t = nameTags.get(id);
      if (!t) return;
      if (show) place(t, x, y);
      t.classList.toggle('is-shown', show);
    },
    bubble(id, name, text, ms) {
      const old = bubbles.get(id);
      if (old) { clearTimeout(old.timer); old.node.remove(); }
      const node = el('div', 'world-bubble');
      node.append(el('span', 'world-bubble-text', text));
      node.dataset.person = id;
      tags.append(node);
      live.textContent = `${t(name)}: ${t(text)}`;
      const entry = { node, timer: 0 };
      entry.timer = setTimeout(() => {
        node.classList.add('is-leaving');
        entry.timer = setTimeout(() => { node.remove(); if (bubbles.get(id) === entry) bubbles.delete(id); }, 220);
      }, ms);
      bubbles.set(id, entry);
    },
    bubbleIds() { return [...bubbles.keys()]; },
    placeBubble(id, x, y, show) {
      const b = bubbles.get(id);
      if (!b) return;
      place(b.node, x, y);
      b.node.classList.toggle('is-hidden', !show);
    },
    dispose() {
      bubbles.forEach((b) => clearTimeout(b.timer));
      bubbles.clear();
      buttons.clear();
      nameTags.clear();
      root.remove();
    },
  };
}
