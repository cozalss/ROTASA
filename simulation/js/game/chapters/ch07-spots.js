// Step 7: where in the office each six-month consequence is pinned.
// Pure (no DOM, no THREE): consequences in, hotspot descriptions out.
// Each rule lists anchors in order of preference; an anchor is used once, so
// two consequences never share a marker.

const has = (c, ...words) => words.some((w) => c.text.includes(w));
const from = (c, ...prefixes) => prefixes.some((p) => c.from.startsWith(p));

const RULES = [
  { test: (c) => from(c, 'Overall'), anchors: ['war-room', 'entrance'] },
  { test: (c) => from(c, 'Step 1 · Assessment type'), anchors: ['cto-office', 'mail-terminal'] },
  { test: (c) => from(c, 'Step 1 · Scope'), anchors: ['meeting-room', 'hr-cabinet', 'cto-office'] },
  { test: (c) => from(c, 'Step 1 · Interviews'), anchors: ['po-desk', 'plan-folder'] },
  { test: (c) => from(c, 'Step 5 · Automation'), anchors: ['pipeline-screen', 'code-desk'] },
  { test: (c) => from(c, 'Step 5 · Attribution'), anchors: ['routing-desk', 'field-desk'] },
  { test: (c) => from(c, 'Step 5–6 · Test data', 'Step 2 · Evidence') || has(c, 'masked data'), anchors: ['devops-corner', 'staging-console'] },
  { test: (c) => from(c, 'Step 6 · First action') || has(c, 'Nobody owned'), anchors: ['qa-desk', 'war-room'] },
  { test: (c) => has(c, 'risk workshop', 'product risk'), anchors: ['po-desk', 'plan-folder'] },
  { test: (c) => has(c, 'plan template', 'approval table'), anchors: ['plan-folder', 'wiki-terminal'] },
  { test: (c) => has(c, 'acceptance criteria', 'boundary', '00:00'), anchors: ['test-tool', 'field-desk'] },
  { test: (c) => has(c, 'Flaky', 'flaky'), anchors: ['code-desk', 'pipeline-screen'] },
  { test: (c) => has(c, 'severity', 'defect review'), anchors: ['jira-board', 'metrics-board'] },
  { test: (c) => has(c, 'pull-request'), anchors: ['staging-console', 'server-room'] },
  { test: (c) => has(c, 'performance'), anchors: ['integration-desk', 'server-room'] },
  { test: (c) => has(c, 'post-incident'), anchors: ['mail-terminal', 'metrics-board'] },
];

export const SPARE_ANCHORS = Object.freeze([
  'wiki-terminal', 'metrics-board', 'field-desk', 'integration-desk', 'entrance', 'server-room', 'hr-cabinet', 'staging-console',
]);

const TONE_WORDS = { good: 'Went well', warn: 'Mixed', bad: 'Went badly', neutral: 'Overall' };

/** Anchors in order of preference for one consequence. */
export function preferredAnchors(c) {
  const rule = RULES.find((r) => r.test(c));
  return [...(rule ? rule.anchors : []), ...SPARE_ANCHORS];
}

/**
 * One hotspot per consequence: [{ id, anchor, label, sublabel, tone, text }].
 * `label` is the decision it came from.
 */
export function consequenceSpots(items) {
  const used = new Set();
  return items.map((c, i) => {
    const anchor = preferredAnchors(c).find((a) => !used.has(a)) ?? 'entrance';
    used.add(anchor);
    return { id: `after-${i}`, anchor, label: c.from, sublabel: TONE_WORDS[c.tone] ?? 'Six months later', tone: c.tone, text: c.text };
  });
}
