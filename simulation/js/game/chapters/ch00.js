// Prologue · Night shift. The street at night, the camera glides into the
// office, a short briefing, then Start. The full case brief is the intro
// screen in the dossier ("Case file").
import { talk } from '../talk.js';
import { showHowToPlay } from '../shell.js';

const STREET_HOLD_MS = 1100;

const BRIEFING = [
  'Rotaşa Technology plans about 12,000 deliveries a day for 140 business customers.',
  'Release 4.1 put overnight deliveries outside their time windows. It ran 41 hours in production before the fix.',
  'Murat Kaya, the CTO, wants TMMi Level 2 within 12 months. He has called you in as the external assessor.',
  'Your job: find out where testing really stands, then plan what to fix first.',
];

const CHOICES = [
  { id: 'start', label: 'Start the assessment', meta: 'Chapter 1' },
  { id: 'case', label: 'Read the case file first', meta: 'Dossier' },
  { id: 'how', label: 'How do I play?', meta: 'Guide' },
];

let token = 0;

export const meta = Object.freeze({
  step: 0,
  title: 'Night shift',
  subtitle: 'Rotaşa’s release 4.1 sent deliveries out at the wrong time. You are the external assessor.',
  objective: () => ({ text: 'Listen to the briefing, then press Start the assessment. The case file is in the dossier.', done: 0, total: 0 }),
});

const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));

function showStart(ctx) {
  ctx.cta({
    label: 'Start the assessment',
    hint: 'Want the full story first? Open the dossier (top right).',
    onClick: () => ctx.go(1),
  });
}

async function briefing(ctx, alive) {
  const pick = await talk({ speaker: 'narrator', name: 'Briefing', role: 'Sprint 38 · Rotaşa Technology', lines: BRIEFING, choices: CHOICES });
  if (!alive()) return;
  if (pick === 'start') { ctx.go(1); return; }
  showStart(ctx);
  if (pick === 'case') ctx.dossier.open();
  if (pick === 'how') showHowToPlay();
}

async function run(ctx, alive) {
  if (ctx.world.isAvailable()) {
    await wait(STREET_HOLD_MS);
    if (!alive()) return;
    await ctx.world.setView('overview');
  }
  if (!alive()) return;
  await ctx.mentor(0);
  if (!alive()) return;
  if (!ctx.world.isAvailable()) return;
  await briefing(ctx, alive);
}

export function enter(ctx) {
  const my = ++token;
  const alive = () => my === token;
  ctx.world.setHotspots([]);
  ctx.world.setMood('evening');
  ctx.world.setMode('explore');
  ctx.world.setView('street', { instant: true });
  ctx.pointTo(null);
  run(ctx, alive);
}

export function update() {}

export function exit(ctx) {
  token += 1;
  ctx.cta(null);
}
