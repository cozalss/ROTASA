// Adaptive quality: watches frame times and, on 'high', steps the post tier
// down (SSAO first, then tilt-shift, then bloom resolution) when the average
// frame takes longer than BUDGET_MS. Measures for ~3 s shortly after mount,
// then again every REPEAT_MS. Only ever steps down; setQuality resets it.

const BUDGET_MS = 22;
const WARMUP_MS = 700;      // ignore shader compilation right after mount / a change
const WINDOW_MS = 3000;
const REPEAT_MS = 12000;
// The engine reports 0 ms for the first frame after a pause (hidden tab, idle
// reduced-motion loop), so only absurd stalls need ignoring here.
const MAX_GAP_MS = 1500;
const MIN_SAMPLES = 3;

export function createAdaptive({ onSlow }) {
  const s = { enabled: true, phase: 'warmup', since: 0, sum: 0, n: 0, lastAvg: null, checks: 0 };

  function restart(now) {
    s.phase = 'warmup';
    s.since = now;
    s.sum = 0;
    s.n = 0;
  }

  return {
    reset(now = performance.now()) {
      restart(now);
    },
    setEnabled(on) {
      s.enabled = Boolean(on);
      restart(performance.now());
    },
    get enabled() { return s.enabled; },
    // Call once per rendered frame with the time since the previous frame.
    sample(ms, now) {
      if (!s.enabled) return;
      if (!s.since) s.since = now;
      const age = now - s.since;
      if (s.phase === 'warmup') {
        if (age >= WARMUP_MS) { s.phase = 'measure'; s.since = now; s.sum = 0; s.n = 0; }
        return;
      }
      if (s.phase === 'idle') {
        if (age >= REPEAT_MS) restart(now);
        return;
      }
      if (ms > 0 && ms < MAX_GAP_MS) { s.sum += ms; s.n += 1; }
      if (age < WINDOW_MS) return;
      s.lastAvg = s.n ? s.sum / s.n : null;
      s.checks += 1;
      const slow = s.lastAvg != null && s.n >= MIN_SAMPLES && s.lastAvg > BUDGET_MS;
      if (slow && onSlow()) restart(now);
      else { s.phase = 'idle'; s.since = now; }
    },
    stats() {
      return { adaptive: s.enabled, avgFrameMs: s.lastAvg == null ? null : Math.round(s.lastAvg * 10) / 10, checks: s.checks, budgetMs: BUDGET_MS };
    },
  };
}
