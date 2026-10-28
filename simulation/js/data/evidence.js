// Evidence the player can collect in Step 2. Every text below comes from the
// Rotaşa case pack (documents A–J, interview notes H1–H6). `findings` maps a
// TMMi Level 2 goal id to what this item shows about that goal; Step 3 shows
// only findings from collected items.
//
// kind:   document | interview | observation | trap
// nature: document (a work product of the practice), record (a by-product the
//         practice leaves behind), interview (what a person says), account
//         (compiled for the assessor: F and J), observation (seen on site)

export const EVIDENCE = [
  {
    id: 'A', kind: 'document', nature: 'document', cost: 20,
    title: 'Draft test policy and test approach (wiki)',
    teaser: 'Two internal wiki pages on how Rotaşa tests.',
    body: [
      { h: 'A1 · "Rotaşa Test Policy" (Status: Draft)' },
      { p: 'Created by the QA lead 14 months ago, never updated. Viewed 3 times in the last 6 months.' },
      { list: ['Goal: Deliver defect-free software to our customers.', 'Testing is the responsibility of the QA team.', 'Every feature is tested before release.', 'Tests are automated wherever possible.', 'No release is made while a critical defect is open.', 'Approval: (empty)'] },
      { h: 'A2 · "Our Test Approach" (Burak Şahin, updated 5 months ago)' },
      { list: ['Unit tests: written by developers "for important business logic"; no coverage target.', 'API tests: automated by QA, run on every pull request.', 'UI tests: manual regression in the last sprint before a major release; ~30 nightly E2E tests for the web panel.', 'Performance testing: "done when needed".', 'Acceptance testing: the product owner checks features during the demo.'] },
      { p: 'The page defines no entry or exit criteria for test levels, no risk assessment and no test performance indicators.' },
    ],
    findings: {
      'TPS-G1': 'A test policy exists only as a draft: approval field empty, viewed 3 times in 6 months, not updated for 14 months.',
      'TPS-G2': 'The test approach page names test levels and who does each (developers: unit; QA: API; product owner: acceptance), but it has no entry/exit criteria and no risk basis, and it is a DevOps wiki page nobody approved.',
      'TPS-G3': 'Neither page defines any test performance indicator.',
      'IH-G2': 'The only documented test process is a wiki page written by DevOps; nobody owns or reviews it.',
    },
  },
  {
    id: 'B', kind: 'document', nature: 'document', cost: 30,
    title: 'RotaPlan 4.2 test plan v0.3',
    teaser: 'The current release plan, including its approval table.',
    body: [
      { p: 'Shared by the QA lead at the start of Sprint 37. Version history shows edits by the QA lead only.' },
      { list: ['1 Scope: new time-window engine, bulk order import (CSV and API), offline mode in the driver app.', '2 Approach: functional tests per feature, then full regression; automate where possible.', '3 Risks: "High-risk area: routing engine."', '4 Schedule: functional tests within the sprint; regression in Sprint 42; release end of Sprint 42.', '5 Resources: "The QA team (4 people) is sufficient."', '6 Environment: shared staging environment.', '7 Entry criteria: feature development must be complete.', '8 Exit criteria: no open critical defects.', '9 Deliverables: test cases, test results, defect records.'] },
      { h: '10 Approvals' },
      { table: { head: ['Role', 'Name', 'Date'], rows: [['QA lead', 'Deniz Arslan', 'Sprint 37, day 1'], ['Product owner', '', ''], ['CTO', '', '']] } },
      { p: 'Shared on Slack: two developers reacted with a thumbs-up. No other comments.' },
    ],
    findings: {
      'TPL-G1': 'The only risk content is one line: "High-risk area: routing engine." No risks identified or analysed with stakeholders.',
      'TPL-G2': 'Features to test are listed; the approach is generic. Entry criterion "development complete" and exit criterion "no open critical defects" exist but are thin.',
      'TPL-G3': 'No estimate of test effort; the plan only says "The QA team (4 people) is sufficient."',
      'TPL-G4': 'A plan exists with scope, schedule, resources, environment and deliverables, but no stakeholder involvement and no test project risks.',
      'TPL-G5': 'Only the QA lead signed. Product owner and CTO rows are empty; a Slack thumbs-up is the only reaction.',
      'IH-G3': 'Plan versions are tracked by file name ("v0.3_final") in a shared folder.',
    },
  },
  {
    id: 'C', kind: 'document', nature: 'document', cost: 40,
    title: 'Time-window test cases',
    teaser: 'All test cases in the "Time-window engine" folder (Sprint 38 export).',
    body: [
      { p: 'Acceptance criterion of ROTA-412: "The system must schedule the delivery within the time window chosen by the customer. The window must be at least 30 minutes and at most 12 hours."' },
      { table: { head: ['ID', 'Story', 'Title', 'Expected', 'Technique', 'Status'], rows: [
        ['TC-1201', 'ROTA-412', 'Standard window 09:00–12:00', 'Scheduled between 09:00 and 12:00', '', 'Passed'],
        ['TC-1202', 'ROTA-412', 'Minimum window (30 min)', 'Accepted', 'Boundary value', 'Passed'],
        ['TC-1203', 'ROTA-412', 'Below minimum (29 min)', 'Error message shown', 'Boundary value', 'Passed'],
        ['TC-1204', 'ROTA-412', 'Maximum window (12 h)', '"Should work correctly"', '', 'Passed'],
        ['TC-1205', '', 'Several windows on one route', '"Order should be logical"', '', 'Passed'],
        ['TC-1206', 'ROTA-412', 'Edit window', 'Route recalculated', '', 'Failed (ROTA-1188)'],
        ['TC-1207', '', 'Capacity + window', '', '', 'Not run'],
        ['TC-1208', 'ROTA-412', 'Time zone', 'Scheduled in local time', '', 'Blocked (environment)'],
      ] } },
      { p: 'There is no test case for windows that cross midnight. After 4.1 a developer added a single unit test; there is no matching record in the test management tool.' },
    ],
    findings: {
      'TDE-G1': 'No test condition for windows crossing midnight, the exact 4.1 failure. Boundary value analysis is used on the minimum only; expected results such as "should work correctly" are vague; TC-1205 and TC-1207 have no story link.',
      'TDE-G2': 'Test cases are implemented in the tool, but TC-1204 and TC-1205 have untestable expected results ("should work correctly", "order should be logical") and TC-1207 has none.',
      'TDE-G3': 'Results are logged per case (passed, failed, blocked, not run). TC-1207 was not run and no reason is recorded.',
      'TEV-G1': 'TC-1208 is blocked because the environment cannot simulate another time zone.',
    },
  },
  {
    id: 'D', kind: 'document', nature: 'record', cost: 35,
    title: 'Defect records (last two months)',
    teaser: 'Ten Jira defects plus production defect counts.',
    body: [
      { p: 'There is no written definition of severity or priority; whoever opens the defect fills them in.' },
      { table: { head: ['ID', 'Title', 'Sev', 'Prio', 'Found', 'Status', 'Note'], rows: [
        ['ROTA-1188', 'Route not updated when window edited', 'High', 'High', 'Sprint', 'Open', 'Steps + screenshot'],
        ['ROTA-1179', 'Overnight window scheduled incorrectly', 'Critical', 'Critical', 'Production', 'Closed', 'Fixed in 4.1.1; root cause empty'],
        ['ROTA-1171', 'Logo misaligned on route screen', 'Critical', 'Low', 'Sprint', 'Closed', 'Opened by PO'],
        ['SAHA-640', 'Delivery confirmation lost offline', 'Medium', 'High', 'Sprint', 'Reopened (2nd)', '"Works on my device"'],
        ['SAHA-652', 'App freezes returning from background', 'High', 'Medium', 'Production', 'Closed', 'Cannot reproduce; no device info'],
        ['ENT-311', 'Turkish characters corrupted in CSV', 'Medium', 'Medium', 'Staging', 'Open', ''],
        ['ENT-318', 'Timeout for files > 5,000 rows', 'Low', 'Low', 'Staging', 'Open', '"No performance testing"'],
        ['ENT-322', 'API date format differs from docs', 'High', 'High', 'Production', 'Being fixed', 'From support ticket'],
        ['ROTA-1194', 'Nightly E2E failing on staging', '', '', 'CI', 'Open', '"Might be the environment"'],
        ['SAHA-661', 'Map does not load on iOS 18', 'Critical', 'High', 'Production', 'Closed', 'No iOS 18 device'],
      ] } },
      { p: 'No review meeting for reopened or "cannot reproduce" defects. Of 19 production defects in two months, 7 were closed as "cannot reproduce".' },
    ],
    findings: {
      'TDE-G4': 'Incidents are logged, but there are no severity definitions (a misaligned logo is "Critical"), no disposition review, 7 of 19 production defects closed as "cannot reproduce", SAHA-640 reopened twice.',
      'TMC-G2': 'Defects are recorded but not monitored against any expectation; ROTA-1179 has no root cause.',
      'TMC-G3': 'The 4.1 production defect was fixed and closed with the root-cause field empty.',
      'TEV-G1': 'SAHA-661 escaped because no iOS 18 test device existed: device needs were never specified.',
    },
  },
  {
    id: 'E', kind: 'document', nature: 'record', cost: 35,
    title: 'Test metrics, last six sprints',
    teaser: 'The QA lead’s personal spreadsheet.',
    body: [
      { p: 'Compiled by hand at the end of each sprint from Jira, the test tool and GitHub Actions. Sometimes shown at sprint reviews; not distributed. Sprint 36 is the 4.1 regression and release sprint.' },
      { table: { head: ['Sprint', 'Planned', 'Run', 'Passed', 'Test defects', 'Prod defects', 'Unit cov %', 'API tests', 'Flaky', 'Pipeline min'], rows: [
        ['32', '120', '104', '92', '18', '3', '41', '210', '6', '22'],
        ['33', '130', '101', '88', '21', '4', '42', '225', '9', '24'],
        ['34', '140', '98', '85', '15', '4', '42', '240', '11', '26'],
        ['35', '150', '95', '81', '24', '4', '43', '248', '14', '29'],
        ['36', '210', '153', '131', '31', '3', '43', '255', '17', '31'],
        ['37', '100', '82', '70', '12', '8', '44', '262', '15', '33'],
      ] } },
      { p: 'Of the 8 production defects in Sprint 37, 3 relate to release 4.1. Reasons for unrun tests are not recorded. There are no targets or thresholds for any metric.' },
    ],
    numeric: true,
    findings: {
      'TPS-G3': 'Measures exist but none is a performance indicator: no targets, not derived from a policy, not regularly provided to management.',
      'TMC-G1': 'Progress data is compiled by hand at sprint end, kept privately and rarely discussed. In Sprint 36 only 153 of 210 planned tests ran.',
      'TMC-G2': 'Production defects stay at 3–4 per sprint (8 in Sprint 37, 3 of them from 4.1), but no target or threshold exists to judge them against, so nobody acts on them.',
      'IH-G1': 'Management does not use the collected information: "When I show it at the sprint review, nobody asks questions."',
    },
  },
  {
    id: 'F', kind: 'document', nature: 'account', cost: 40,
    title: 'CI pipeline and test environment notes',
    teaser: 'Prepared for you by DevOps (Burak Şahin).',
    body: [
      { h: 'Pipeline (every PR and merge to main)' },
      { list: ['Build and static analysis (warnings do not stop the pipeline)', 'Unit tests', 'Automated API tests against the shared staging database', 'Auto-deploy to staging (main only)', 'Nightly E2E web tests at 02:00 (main only)', 'Production deploy with the CTO’s manual approval'] },
      { h: 'Observations' },
      { list: ['Failing tests are rerun up to 3 times; passing once is enough.', '14 disabled tests; 9 say "temporary, will fix"; the oldest is 11 months old.', 'Nightly E2E results go to a Slack channel most people have muted.'] },
      { h: 'Environments' },
      { list: ['One staging environment shared by three teams; booked with a "staging is mine" Slack message.', 'Last quarter staging was unusable 9 times, about 3 hours each; 5 were caused by another team’s deployment or data change.', 'Staging is refreshed monthly with an unmasked copy of production: real customer addresses and driver phone numbers.', 'No document defines test environment requirements.', 'Mobile: 1 Android and 1 iOS device (iOS 17) plus emulators.', 'No performance environment and no way to simulate other time zones.'] },
    ],
    findings: {
      'TEV-G1': 'No test environment requirements exist; environments are set up from the DevOps engineer’s knowledge. No time-zone simulation, iOS 17 only.',
      'TEV-G2': 'Staging is implemented and deployed automatically, but its generic test data is an unmasked production copy with real addresses and phone numbers (a KVKK risk).',
      'TEV-G3': 'One shared staging booked over Slack; 9 outages in a quarter, 5 caused by another team.',
      'TDE-G3': 'Automatic reruns (up to 3 times; passing once is enough) can hide intermittent failures; 14 tests are disabled; nightly results go to a muted channel.',
    },
  },
  {
    id: 'G', kind: 'document', nature: 'document', cost: 15,
    title: 'Release 4.1 email thread',
    teaser: 'Progress report and release decision, last day of Sprint 36.',
    body: [
      { h: 'G1 · QA lead to CTO and product owners' },
      { p: '"We were able to complete 73% of the regression. Because staging was unavailable for two days, part of the mobile regression and some time-window scenarios could not be run. Two critical defects are currently open (one is a misaligned logo, ROTA-1171). We could not fully test the changes made to the routing engine in the last week. The release decision is yours."' },
      { h: 'G2 · CTO reply, 45 minutes later' },
      { p: '"We promised the customers this week, so we are releasing. The logo bug isn’t critical anyway. Finish the remaining tests after the release."' },
      { h: 'G3 · Afterwards' },
      { list: ['No record of whether the remaining regression tests were completed.', 'Nobody reviewed in writing why the policy rule "no release with an open critical defect" was not applied.', 'No progress report template; no regular status report during the sprint.'] },
    ],
    findings: {
      'TMC-G1': 'The only progress report is a free-text email sent on release day; there is no regular status reporting during the sprint.',
      'TMC-G2': 'The draft policy rule "no release while a critical defect is open" (also the 4.2 plan’s exit criterion) was not met: two critical defects were open and the release went out.',
      'TMC-G3': 'The corrective action "finish the remaining tests after the release" was never tracked; nobody knows if it happened. No post-incident review.',
      'TPS-G1': 'The draft policy rule "no release while a critical defect is open" was ignored without discussion.',
      'TDE-G3': 'Only 73% of the 4.1 regression was executed; part of the mobile regression and some time-window scenarios were never run.',
    },
  },
  {
    id: 'J', kind: 'document', nature: 'account', cost: 30,
    title: 'Process ownership, tools and configuration',
    teaser: 'Compiled from HR records, DevOps and the QA lead.',
    body: [
      { h: 'Ownership and resources' },
      { list: ['Nobody is formally the test process owner. The QA lead’s job description says only "carrying out test activities".', 'Before 4.1 there was no budget or time for the test process; tools are paid from team budgets.', 'Nobody is assigned to review the draft policy or the test approach page.', 'No onboarding guide for new test engineers.'] },
      { h: 'Tools and assets' },
      { list: ['Test cases in a Jira test plug-in; automated tests on GitHub; CI on GitHub Actions.', 'No templates for test plans, progress reports or defect records; each plan is a copy of the last one.'] },
      { h: 'Configuration management' },
      { list: ['Test case history is kept in the tool; automated tests are under version control.', 'Test plan versions are guessed from file names such as "RotaPlan_4.2_TestPlan_v0.3_final.docx".', 'Staging settings are changed by hand and not recorded. Test data scripts live on a developer’s laptop.', 'When acceptance criteria change, nobody records whether the test cases were updated.'] },
    ],
    findings: {
      'IH-G1': 'No process owner, no authority for improvement, no review cycle for policy or approach. Only now has the CTO set a goal and a 400-hour budget.',
      'IH-G2': 'Tools exist, but there are no process documents beyond drafts, no templates, no onboarding and no training.',
      'IH-G3': 'Test cases and automated tests are versioned; the test plan, staging settings and test data scripts are not under configuration management.',
      'TDE-G2': 'Test data scripts are on a developer’s laptop, outside version control.',
      'TEV-G3': 'Staging settings are changed by hand and the changes are not recorded.',
    },
  },
  // ---------- interviews (only if booked in Step 1) ----------
  {
    id: 'H2', kind: 'interview', nature: 'interview', cost: 30, person: 'deniz',
    title: 'Interview: Deniz Arslan, QA lead',
    teaser: 'The test engineers report to her; she also tests in the Routing team.',
    body: [
      { qa: ['How much of your daily work is management?', 'Almost none. I am the only tester in the Routing team; 80% of my time goes into testing.'] },
      { qa: ['Who reviews the test plan with you?', 'I send it to the product owners, but I get no comments. I would like to do the risk analysis together, but I can’t get a meeting scheduled.'] },
      { qa: ['How do you design test cases?', 'We look at the acceptance criteria and fill the gaps from experience. I use boundary value analysis; the others don’t really know it.'] },
      { qa: ['Who uses your metrics spreadsheet?', 'Me. When I show it at the sprint review, nobody asks questions.'] },
      { qa: ['What changed after 4.1?', 'A unit test was added for the overnight window. Nothing changed in the process.'] },
    ],
    findings: {
      'TPL-G1': '"I would like to do the risk analysis together, but I can’t get a meeting scheduled."',
      'TPL-G5': '"I send it to the product owners, but I get no comments."',
      'TDE-G1': '"I use boundary value analysis; the others don’t really know it."',
      'TMC-G3': '"A unit test was added for the overnight window. Nothing changed in the process."',
      'IH-G1': 'The QA lead spends 80% of her time testing; nobody has time or authority to manage the process.',
    },
  },
  {
    id: 'H4', kind: 'interview', nature: 'interview', cost: 30, person: 'kerem',
    title: 'Interview: Kerem Demir, product owner',
    teaser: 'Routing and Integration; decides releases with the CTO.',
    body: [
      { qa: ['Do you read the test plan?', 'To be honest, no; it feels like a technical document. I check the features myself during the demo.'] },
      { qa: ['How do you decide on a release?', 'Based on the date we promised the customer and whether any critical defects are open. If I knew which areas were barely tested, my decisions might change.'] },
      { qa: ['Would you join a risk analysis?', 'Gladly, if it takes no more than half a day.'] },
    ],
    findings: {
      'TPL-G5': '"To be honest, no [I do not read the test plan]; it feels like a technical document."',
      'TPL-G1': 'The product owner has never been part of a risk analysis but would join one: "Gladly, if it takes no more than half a day."',
      'TMC-G2': 'Release decisions rest on the promised date and open critical defects; test coverage is invisible to him: "If I knew which areas were barely tested, my decisions might change."',
    },
  },
  {
    id: 'H3', kind: 'interview', nature: 'interview', cost: 30, person: 'ece',
    title: 'Interview: Ece Yılmaz, developer (Routing)',
    teaser: 'Developer in the Routing team.',
    body: [
      { qa: ['Do you write unit tests?', 'If there is time. When there is pressure to finish the sprint, tests are the first thing to go.'] },
      { qa: ['Disabled tests?', 'We temporarily disable flaky tests so the pipeline isn’t blocked. Going back to them is nobody’s job.'] },
      { qa: ['The overnight window defect?', 'We discussed that case during design, but it wasn’t in the acceptance criteria and it didn’t come up in testing. We assumed QA would find it.'] },
    ],
    findings: {
      'TPS-G2': 'Responsibilities between developers and QA are unclear: "We assumed QA would find it."',
      'TDE-G1': 'The midnight case was known at design time but never became a test condition.',
      'TDE-G3': '"We temporarily disable flaky tests so the pipeline isn’t blocked. Going back to them is nobody’s job."',
    },
  },
  {
    id: 'H5', kind: 'interview', nature: 'interview', cost: 30, person: 'burak',
    title: 'Interview: Burak Şahin, DevOps',
    teaser: 'Runs CI/CD and the environments.',
    body: [
      { qa: ['Why does staging break so often?', 'Three teams deploy to the same environment; when one changes the database, the others’ tests break.'] },
      { qa: ['Why copy production data?', 'Creating realistic test data takes time; copying is the fastest. I know it’s risky under the data protection law (KVKK).'] },
      { qa: ['The ideal solution?', 'Temporary, automatically created environments for each pull request. But that’s a big job.'] },
    ],
    findings: {
      'TEV-G2': '"Copying is the fastest. I know it’s risky under the data protection law (KVKK)."',
      'TEV-G3': '"When one changes the database, the others’ tests break."',
    },
  },
  {
    id: 'H6', kind: 'interview', nature: 'interview', cost: 30, person: 'onur',
    title: 'Interview: Onur Kılıç, test engineer (Field)',
    teaser: 'Tests the driver mobile app.',
    body: [
      { qa: ['Your test approach?', 'Mostly exploratory testing; I write the scenarios I find as test cases afterwards. There is no written method.'] },
      { qa: ['Why was the offline defect reopened twice?', 'The developer can’t reproduce it on his device. I couldn’t clearly describe which network conditions cause it either.'] },
      { qa: ['Have you had any training?', 'No. Training on test design techniques would help me a lot.'] },
    ],
    findings: {
      'TDE-G1': 'Exploratory testing with no written method; test cases are written afterwards.',
      'TDE-G4': 'SAHA-640 reopened twice because the conditions were never described.',
      'IH-G2': '"Have you had any training?" "No."',
    },
  },
  // ---------- time sinks (redundant with other evidence) ----------
  {
    id: 'T1', kind: 'trap', nature: 'record', cost: 60,
    title: 'Read the routing engine source for the midnight fix',
    teaser: 'Go through the code change that fixed 4.1.1.',
    body: [{ p: 'You confirm that the fix moves the end time to the next day and that one unit test covers it. This tells you about the product, not about how the test process works.' }],
    findings: {},
  },
  {
    id: 'T2', kind: 'trap', nature: 'record', cost: 90,
    title: 'Re-run part of the 4.1 regression on staging',
    teaser: 'See for yourself what the regression covers.',
    body: [{ p: 'Staging is booked by the Field team for most of the slot. You run 11 cases; all pass. An assessor evaluates the process; re-testing the product is not the assessment’s job.' }],
    findings: {},
  },
  {
    id: 'T3', kind: 'trap', nature: 'interview', cost: 30,
    title: 'Second meeting with the CTO',
    teaser: 'Ask Murat Kaya to explain the test process again.',
    body: [{ p: 'The CTO repeats the opening meeting: the QA team is responsible for quality, plans "count as approved", and more automation will bring Level 2. Nothing new.' }],
    findings: {},
  },
];

// The opening meeting is free and always collected.
export const OPENING_MEETING = {
  id: 'H1', kind: 'interview', nature: 'interview', cost: 0, person: 'murat',
  title: 'Opening meeting: Murat Kaya, CTO',
  teaser: 'Held before Step 2 starts.',
  body: [
    { qa: ['Who is responsible for the test process?', 'The QA team. Developers write unit tests too, but quality is Deniz’s team’s responsibility.'] },
    { qa: ['How are test plans approved?', 'Deniz prepares a plan for every release and I see it. It counts as approved.'] },
    { qa: ['Why a 12-month TMMi target?', 'We need a certificate we can show customers. I think if we increase automation, Level 2 will follow.'] },
    { qa: ['Can you set aside a budget for testing?', 'I can give about 400 person-hours for one quarter. We cannot hire anyone new.'] },
  ],
  findings: {
    'TPS-G1': 'The CTO sees quality as "Deniz’s team’s responsibility"; the draft policy says the same.',
    'TPL-G5': '"Deniz prepares a plan for every release and I see it. It counts as approved." (statement only)',
    'IH-G1': 'The CTO’s directive is a certificate in 12 months; he expects automation to deliver it. 400 person-hours offered.',
  },
};

// Step 2 event: staging goes down while the player is on site.
export const OUTAGE_EVENT = {
  id: 'OBS', kind: 'observation', nature: 'observation', cost: 20,
  title: 'Observation: staging outage, Sprint 38',
  body: [
    { p: 'At 14:10 the Integration team runs a data migration on staging. The Routing team’s API tests start failing. In Slack, two people write "staging is mine" within four minutes. Burak restores a database snapshot by hand at 15:05. No ticket is opened and the change is not written down anywhere.' },
  ],
  findings: {
    'TEV-G3': 'You watched it happen: two teams claim staging at once, the restore is done by hand, no incident is recorded.',
    'IH-G3': 'The staging change and the restore were not recorded under any change control.',
  },
};

export const ALL_EVIDENCE = [OPENING_MEETING, ...EVIDENCE, OUTAGE_EVENT];

export function findEvidence(id) {
  return ALL_EVIDENCE.find((e) => e.id === id) || null;
}
