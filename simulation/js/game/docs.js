// Document viewer (#doc-viewer) and the evidence bag panel.
import { h } from '../ui/dom.js';
import { renderDocument } from '../ui/components.js';
import { findEvidence } from '../data/evidence.js';
import { knownEvidenceIds } from '../logic/assessment.js';
import { openPanel } from './panel.js';
import { ui as sound } from './audio.js';

let closeViewer = null;

/** Opens a case document in the slide-over viewer. Returns close(). */
export function openDoc(id) {
  const evidence = findEvidence(id);
  const viewer = document.getElementById('doc-viewer');
  if (!evidence || !viewer) return () => {};
  closeViewer?.();
  const restoreTo = document.activeElement;
  const close = () => {
    if (closeViewer !== close) return;
    closeViewer = null;
    viewer.hidden = true;
    viewer.replaceChildren();
    viewer.onclick = null;
    document.removeEventListener('keydown', onKey);
    if (restoreTo?.isConnected && typeof restoreTo.focus === 'function') restoreTo.focus({ preventScroll: true });
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  viewer.replaceChildren(renderDocument(evidence, close));
  viewer.hidden = false;
  viewer.onclick = (e) => { if (e.target === viewer) close(); };
  document.addEventListener('keydown', onKey);
  closeViewer = close;
  sound('pick');
  document.getElementById('doc-close')?.focus();
  return close;
}

/** The evidence bag as a panel: every item you know, one click to read it. */
export function showBag(state, { onOpenDossier } = {}) {
  const ids = knownEvidenceIds(state);
  let closePanel = () => {};
  const read = (id) => { closePanel(); openDoc(id); };
  const items = ids.map((id) => {
    const e = findEvidence(id);
    return h('li', {},
      h('button', { type: 'button', class: 'gd-bag-item', onClick: () => read(id) },
        h('span', { class: 'gd-bag-id' }, e.id),
        h('span', { class: 'gd-bag-title' }, e.title),
        h('span', { class: 'gd-bag-read', 'aria-hidden': 'true' }, 'Read ▸')));
  });
  const foot = onOpenDossier
    ? h('button', { type: 'button', class: 'gd-btn gd-btn-ghost', onClick: () => { closePanel(); onOpenDossier(); } }, 'Open the dossier')
    : null;
  closePanel = openPanel({
    kicker: 'Evidence bag',
    title: `${ids.length} ${ids.length === 1 ? 'item' : 'items'}`,
    className: 'gd-bag-panel',
    body: [
      h('p', { class: 'sh-muted' }, 'Everything you have collected so far. Click an item to read it.'),
      h('ul', { class: 'gd-bag-list' }, items),
      foot,
    ],
  });
  return closePanel;
}
