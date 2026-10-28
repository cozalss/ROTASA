// Decision points outside the evidence and rating screens. Each option has an
// id; `EXPERT` (bottom) records the expert's choice at every decision point.

export const SCOPE_OPTIONS = [
  { id: 'automation', title: 'Test automation only',
    body: 'The CTO’s view from the opening meeting: "I think if we increase automation, Level 2 will follow."',
    feedback: 'TMMi has no automation process area. Level 2 is staged: every Level 2 process area must be rated. A process area left out is Not Rated (NR), and one NR process area makes the maturity level NR.' },
  { id: 'level2', title: 'All six Level 2 process areas, across all three teams',
    body: 'Test Policy and Strategy, Test Planning, Monitoring and Control, Design and Execution, Test Environment, Implementation and Habit. RotaPlan 4.2 as the current release, 4.1 as history.',
    feedback: 'Level 2 counts as achieved only when all six of its process areas are rated Largely or Fully, so all six must be examined. Routing, Field and Integration share one QA lead, one staging environment and one release, and Document D holds defects from all three, so each team is sampled.' },
  { id: 'level23', title: 'Level 2 and Level 3, to show the full road ahead',
    body: 'Adds the five Level 3 process areas: Test Organization, Test Training Program, Test Process and Integration, Non-Functional Testing, Peer Reviews.',
    feedback: 'Level 3 cannot be achieved while Level 2 is not (TAMAR §3.4.3.5), and TMMi calls skipping a level "usually counter-productive" (p.16). The extra evidence costs time you need for Level 2.' },
];

export const TYPE_OPTIONS = [
  { id: 'certificate', title: 'Promise a Level rating the CTO can show customers',
    body: 'He needs an answer for the supplier questionnaire.',
    feedback: 'An informal assessment "will not result in a formal maturity rating" (TAMAR §1.3.1.1.2). A formal rating needs an accredited lead assessor and a team of at least two.' },
  { id: 'informal', title: 'Agree an informal assessment: findings and a prioritized plan',
    body: 'Explain that the result is strengths and weaknesses, with an indicative view of the gap to Level 2, not a rating.',
    feedback: 'This matches what the CTO asked for: an informal assessment as a first step, followed by an improvement plan. A formal assessment can come later, once gaps are closed.' },
  { id: 'formal', title: 'Insist on a formal assessment now',
    body: '"If you want something for customers, it has to be formal."',
    feedback: 'A formal assessment of a company this far from Level 2 spends money to confirm what an informal one shows faster. It also needs an accredited team you are not.' },
];

export const INTERVIEWEES = [
  { id: 'deniz', evidence: 'H2', name: 'Deniz Arslan', role: 'QA lead', note: 'Owns the test plan and metrics.' },
  { id: 'kerem', evidence: 'H4', name: 'Kerem Demir', role: 'Product owner, Routing and Integration', note: 'Takes part in release decisions; the 4.1 status email (G) went to him.' },
  { id: 'ece', evidence: 'H3', name: 'Ece Yılmaz', role: 'Developer, Routing team', note: 'Her team builds the routing engine and the web panel.' },
  { id: 'burak', evidence: 'H5', name: 'Burak Şahin', role: 'DevOps engineer', note: 'Also sends written pipeline notes (Document F).' },
  { id: 'onur', evidence: 'H6', name: 'Onur Kılıç', role: 'Test engineer, Field team', note: 'Tests the driver app.' },
];

export const INTERVIEW_SLOTS = 2;

export const OUTAGE_OPTIONS = [
  { id: 'observe', title: 'Sit with the teams and watch the recovery', cost: 20,
    body: 'Costs 20 minutes. You see first-hand how the environment is controlled.',
    feedback: 'Watching the practice happen is evidence nobody can prepare for you. It shows how environments are coordinated and changed, which documents only describe.' },
  { id: 'wait', title: 'Pause until staging is back', cost: 50,
    body: 'Costs 50 minutes. Some people you need are busy with the outage anyway.',
    feedback: 'Waiting spends time without producing evidence.' },
  { id: 'ignore', title: 'Keep reading documents', cost: 0,
    body: 'The outage is a product problem, not yours.',
    feedback: 'An outage during the assessment is the test environment process happening in front of you. Ignoring it loses direct evidence for TEV G3.' },
];

export const LEVEL_OPTIONS = [
  { id: 'level2', title: '"Rotaşa is close to Level 2; more automation will close the gap."',
    feedback: 'Level 2 needs every process area at Largely or Fully; four of six are Not Achieved.' },
  { id: 'level1-formal', title: '"Rotaşa is TMMi Level 1."',
    feedback: 'Correct in substance, but an informal assessment does not give a formal maturity rating. Stated like this, it will be quoted as one.' },
  { id: 'level1-indicative', title: '"Indicative: no Level 2 process area would reach Largely. Rotaşa is at Level 1 and this is not a formal rating."',
    feedback: 'Every organization is at least Level 1. The finding names the gap and states plainly what kind of result it is.' },
  { id: 'none', title: '"No conclusion: there is not enough evidence to say anything."',
    feedback: 'An informal assessment does not need corroborated evidence for every practice. You have enough to show that Level 2 is not reached.' },
];

export const AUTOMATION_OPTIONS = [
  { id: 'agree', title: 'Agree: automation is a reasonable path to Level 2',
    feedback: 'TMMi Level 2 is about managed processes: policy, planning, monitoring, design, environment and governance. Automation is not a process area.' },
  { id: 'data', title: 'Show him Rotaşa’s own numbers', needs: 'E',
    feedback: 'Automated API tests grew from 210 to 262 (Sprints 32–37), yet production defects never fell (3–4 a sprint, then 8 in Sprint 37), flaky failures rose from 6 to 15 and the pipeline from 22 to 33 minutes. More automation alone did not reduce escapes.' },
  { id: 'principle', title: 'Explain that TMMi is not about automation',
    feedback: 'Correct, but without data it is your opinion against his. Rotaşa’s own metrics would have convinced him.' },
];

export const ATTRIBUTION_OPTIONS = [
  { id: 'names', title: 'Give him the names; he is the sponsor',
    feedback: 'TAMAR: data sources are confidential and the data is non-attributable to any individual (§3.3.1.1.1–2). The sponsor owns the data but cannot demand its sources (§3.2.6.2.7).' },
  { id: 'refuse', title: 'Decline and explain non-attribution',
    feedback: 'Findings are reported by role group and process area, never by person. Interviewees speak openly only if they are protected.' },
  { id: 'hint', title: 'Do not name anyone, but say "it was someone in Routing"',
    feedback: 'Routing has eight developers and one tester; this hint points to a handful of people. It breaks non-attribution in practice.' },
];

export const KVKK_OPTIONS = [
  { id: 'keep', title: 'Keep it as a finding under Test Environment',
    feedback: 'Generic test data is part of TEV (P2.2, P3.2). Real customer addresses and driver phone numbers in staging is a test data finding with legal exposure under KVKK.' },
  { id: 'verbal', title: 'Remove it from the report and mention it to Burak in person',
    feedback: 'A finding that is not written down does not reach the people who can fund the fix.' },
  { id: 'drop', title: 'Drop it; it is a DevOps and legal topic',
    feedback: 'Test data is explicitly in the scope of the Test Environment process area.' },
];

export const BUDGET = { hours: 400, money: 150000 };

// Document I. `pa` links each action to the Level 2 process area it helps.
export const ACTIONS = [
  { id: 'owner', title: 'Appoint a test process owner and define responsibility for improvement', hours: 12, money: 0, by: 'QA lead', pa: 'IH' },
  { id: 'policy', title: 'Complete the test policy, get management approval and announce it', hours: 24, money: 0, by: 'QA lead', pa: 'TPS' },
  { id: 'strategy', title: 'Write a risk-based test strategy (levels, entry/exit criteria, responsibilities)', hours: 60, money: 0, by: 'QA lead', pa: 'TPS' },
  { id: 'risk', title: 'Product risk workshop with the product owners for each release', hours: 16, money: 0, by: 'QA lead', pa: 'TPL' },
  { id: 'template', title: 'Test plan template and an approval step', hours: 20, money: 0, by: 'QA lead', pa: 'TPL' },
  { id: 'training', title: 'Test design technique training for test engineers and developers', hours: 40, money: 30000, by: 'Test engineer, Field', pa: 'TDE' },
  { id: 'flaky', title: 'Quarantine and fix flaky and disabled tests', hours: 80, money: 0, by: 'Developer, Routing', pa: 'TDE' },
  { id: 'data', title: 'Masked or synthetic test data', hours: 70, money: 20000, by: 'DevOps', pa: 'TEV' },
  { id: 'envs', title: 'Temporary test environments per pull request (annual cloud cost)', hours: 120, money: 90000, by: 'DevOps', pa: 'TEV' },
  { id: 'dashboard', title: 'Automate the metrics dashboard and set target values', hours: 50, money: 10000, by: 'QA lead', pa: 'TPS' },
  { id: 'defects', title: 'Severity and priority definitions and a weekly defect review', hours: 16, money: 0, by: 'QA lead', pa: 'TDE' },
  { id: 'dor', title: 'Definition of Ready: acceptance criteria in every user story', hours: 12, money: 0, by: 'Product owner', pa: 'TPL' },
  { id: 'perf', title: 'Performance testing infrastructure and first routing engine tests', hours: 100, money: 25000, by: 'Integration team', pa: 'L3' },
  { id: 'devices', title: 'Cloud device farm subscription for mobile testing (annual cost)', hours: 20, money: 40000, by: 'Field team', pa: 'TEV' },
  { id: 'pir', title: 'Post-incident review of 4.1 and a template for future reviews', hours: 12, money: 0, by: 'CTO', pa: 'TMC' },
];

export const EXPERT = {
  scope: 'level2',
  type: 'informal',
  interviews: ['deniz', 'kerem'],
  collected: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'H2', 'H4'],
  outage: 'observe',
  level: 'level1-indicative',
  automation: 'data',
  attribution: 'refuse',
  kvkk: 'keep',
  actions: ['owner', 'policy', 'strategy', 'risk', 'template', 'training', 'defects', 'dor', 'pir', 'flaky', 'data'],
  first: 'owner',
};

export const EXPERT_WHY = {
  scope: 'The CTO’s target is Level 2, and TMMi is staged: Level 2 needs all six of its process areas, so all six are in scope. The three teams share one QA lead, one staging environment and one release, so each team is sampled.',
  type: 'The CTO asked for an informal assessment. It gives findings, not a rating, and saying so on day one prevents a false certificate later.',
  interviews: 'The QA lead explains how plans, metrics and test design really work. The product owner is the stakeholder whose commitment and release decisions are missing. DevOps practice is documented in F and J, and C and F show the developer side (one unit test for the fix, 14 disabled tests).',
  collected: 'All eight documents and both interviews fit the time window. The expert skips the time sinks: re-testing the product or re-reading the code is not assessing the process.',
  outage: 'An outage during the visit is the environment process in action, so the expert watches it.',
  level: 'No Level 2 process area reaches Largely, so Level 2 is not achieved. Every organization is at least Level 1, and an informal result must be labelled as indicative.',
  automation: 'The QA lead’s metrics spreadsheet (E) shows six sprints of growing automation while production defects did not fall and flaky failures more than doubled.',
  attribution: 'Non-attribution protects interviewees and keeps future interviews honest.',
  kvkk: 'Test data belongs to the Test Environment process area, and the legal risk makes it urgent.',
  actions: 'Governance first, then the Not-achieved goals that block release 4.2: an owner (IH G1); policy and strategy (TPS G1–G2, the strategy also states environment needs for TEV G1); a risk workshop and a plan template with an approval step (TPL G1, G4–G5); a Definition of Ready as entry criteria (TPL G2); and a post-incident review (TMC G3). Test design training, defect definitions and the flaky-test clean-up lift TDE G1, G3 and G4. Masked data removes the KVKK exposure (TEV G2–G3). 362 h and TRY 50,000, with 38 h in reserve. Left for the next quarter: the metrics dashboard, because indicators must be derived from the approved policy (TMMi TPS P3.1, p.31); per-PR environments (120 h and 60% of the cash, recurring yearly); and performance testing (Non-Functional Testing is Level 3).',
  first: 'Without an owner with authority, every other action competes with sprint work and stalls.',
};
