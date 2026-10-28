// Chapter 5 script: Murat's three objections (his words from the report
// screen), the options from decisions.js, and his short reactions. The
// reactions are staging only: they follow the expert feedback for each option
// and add no case facts.
import { AUTOMATION_OPTIONS, ATTRIBUTION_OPTIONS, KVKK_OPTIONS, EXPERT, EXPERT_WHY } from '../../data/decisions.js';
import { knewTestData } from '../../ui/screens/report.js';

export const KEYS = Object.freeze(['automation', 'attribution', 'kvkk']);

export const OBJECTIONS = Object.freeze({
  automation: { title: 'More automation', options: AUTOMATION_OPTIONS,
    line: 'If we increase automation, Level 2 will follow. I want to put 300 of the 400 hours into automation.' },
  attribution: { title: 'Who said it?', options: ATTRIBUTION_OPTIONS,
    line: 'Who told you our test plans are not really approved? I want names next to each finding.' },
  kvkk: { title: 'Test data', options: KVKK_OPTIONS,
    line: 'The production data copy in staging is a DevOps and legal matter. Take it out of a test report.' },
});

export const REACTIONS = Object.freeze({
  automation: {
    agree: 'Good. Then we agree: 300 hours into automation, and Level 2 follows.',
    data: 'Hm. More tests every sprint, and the escapes did not fall. Send me that spreadsheet after the meeting.',
    principle: 'That is your view against mine. I still think automation is the fastest way.',
  },
  attribution: {
    names: 'Thank you. I will have a word with them.',
    refuse: 'Fine. Roles and process areas, then. I can work with that.',
    hint: 'Routing. That narrows it down nicely.',
  },
  kvkk: {
    keep: 'Keep it under Test Environment, then. And tell me what fixing it would cost.',
    verbal: 'Good. Tell Burak in person and keep the report clean.',
    drop: 'Thank you. A test report should be about testing.',
  },
});

export const NO_DATA_LINE = 'Murat has no third objection. You never learned how staging data is made: no pipeline notes (F), no DevOps interview (H5).';
export const KEREM_LINE = 'If I knew which areas were barely tested, my decisions might change.';
export const MISSING_E_NOTE = 'You did not collect the metrics spreadsheet (Document E).';
export const REPLY_TOAST = 'Write your reply to Murat in the dossier (at least 40 characters), then lock it.';

/** Objections this player must answer: the test data one only if F or H5 was collected. */
export function requiredKeys(state) {
  return knewTestData(state) ? KEYS : KEYS.filter((k) => k !== 'kvkk');
}

/** The next objection still open, or null when the meeting is over. */
export function nextObjection(state) {
  return requiredKeys(state).find((k) => !state.report.revealed[k]) ?? null;
}

/** Dialogue choices for one objection, with the same "needs" rule as report.js. */
export function choicesFor(key, state) {
  const collected = state.collect.collected;
  return OBJECTIONS[key].options.map((o) => {
    const missing = Boolean(o.needs) && !collected.includes(o.needs);
    return {
      id: o.id,
      label: o.title,
      disabled: missing,
      note: missing ? MISSING_E_NOTE : null,
      meta: key === 'automation' ? 'Then write it' : 'Final',
    };
  });
}

/** The expert comparison toast for a locked answer: { text, tone }. */
export function comparison(key, id) {
  const options = OBJECTIONS[key].options;
  const chosen = options.find((o) => o.id === id);
  const expert = options.find((o) => o.id === EXPERT[key]);
  if (id === EXPERT[key]) return { text: `Same as the expert. ${EXPERT_WHY[key]}`, tone: 'good' };
  return { text: `The expert chose “${expert.title}”. ${chosen ? chosen.feedback : EXPERT_WHY[key]}`, tone: 'expert' };
}
