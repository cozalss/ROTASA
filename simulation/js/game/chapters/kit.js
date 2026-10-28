// Small helpers shared by the chapter controllers ch03–ch07.
// Every world call goes through here so a missing world (no WebGL) or a
// failing call never breaks the DOM game.

/** True when the 3D world is there and working. */
export function worldOn(ctx) {
  try {
    return Boolean(ctx?.world?.isAvailable?.());
  } catch {
    return false;
  }
}

/** Calls fn(world) when the world is available; returns its result or undefined. */
export function withWorld(ctx, fn) {
  if (!worldOn(ctx)) return undefined;
  try {
    return fn(ctx.world);
  } catch {
    return undefined;
  }
}

/** A dossier chapter: dimmed world behind the panel, camera on one view. */
export function stageBackdrop(ctx, { view = 'war-room', mood = 'evening', hotspots = [] } = {}) {
  withWorld(ctx, (w) => {
    w.setMode('backdrop');
    w.setMood(mood);
    w.setHotspots(hotspots, () => {});
    w.setView(view);
  });
  ctx.dossier?.open?.();
}

/** Clears what a chapter put in the world. */
export function clearWorld(ctx) {
  withWorld(ctx, (w) => w.setHotspots([], () => {}));
}

/** The stamp thud for a locked decision (silent when sound is off). */
export function stamp(ctx) {
  try {
    ctx.audio?.ui?.('stamp');
  } catch {
    // Audio is optional.
  }
}

/** One-time tip through ctx (no-op when the director gave none). */
export function tipOnce(ctx, id, text) {
  if (typeof ctx?.tip === 'function') ctx.tip(id, text);
}

/** Keys whose flag went from falsy to truthy between two records. */
export function newlyTrue(prev = {}, next = {}, keys = Object.keys(next)) {
  return keys.filter((k) => Boolean(next[k]) && !prev[k]);
}

/** One evidence-board hotspot for the war-room chapters (an inert label in backdrop mode). */
export function boardSpot(id, label, sublabel) {
  return [{ id, anchor: 'war-room', label, sublabel, kind: 'event', state: 'done' }];
}
