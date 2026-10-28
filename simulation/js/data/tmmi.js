// TMMi Framework v2.0, Level 2 "Managed": six process areas, 21 goals.
// Goal names follow the framework (pp. 26–71). `expert` is the expert's
// rating, `accept` the ratings an expert panel would still call defensible,
// `key` the evidence ids the expert relied on.

export const RATINGS = [
  { id: 'N', label: 'Not achieved', range: '0–15%' },
  { id: 'P', label: 'Partially', range: '>15–50%' },
  { id: 'L', label: 'Largely', range: '>50–85%' },
  { id: 'F', label: 'Fully', range: '>85–100%' },
  { id: '?', label: 'Not enough evidence', range: 'NR' },
];

export const RATING_ORDER = { N: 0, P: 1, L: 2, F: 3 };

export const PROCESS_AREAS = [
  {
    id: 'TPS', code: 'PA 2.1', name: 'Test Policy and Strategy',
    purpose: 'Develop and establish a test policy, and an organization-wide or program-wide test strategy in which the test activities, e.g., test types and test levels, are defined. To measure test performance, the value of test activities and expose areas for improvement, test performance indicators are introduced.',
    goals: [
      { id: 'TPS-G1', name: 'Establish a Test Policy', expert: 'P', accept: ['N', 'P'], key: ['A', 'G'],
        why: 'A draft policy with goals and principles exists, so the practice has started. It was never agreed or approved, it is not distributed (3 views in 6 months) and its main rule was ignored for 4.1.' },
      { id: 'TPS-G2', name: 'Establish a Test Strategy', expert: 'P', accept: ['P'], key: ['A'],
        why: 'The test approach page names test levels and who performs each, but it has no entry/exit criteria and no risk basis, and it was never agreed or distributed as a strategy. The draft policy still says testing is "the responsibility of the QA team".' },
      { id: 'TPS-G3', name: 'Establish Test Performance Indicators', expert: 'N', accept: ['N', 'P'], key: ['A', 'E'],
        why: 'Measures are collected by hand, but none has a target, none is derived from a policy and none is regularly provided to management. A measure without a target is not an indicator.' },
    ],
  },
  {
    id: 'TPL', code: 'PA 2.2', name: 'Test Planning',
    purpose: 'Define a test approach based on the identified risks and the defined test strategy, and establish and maintain well-founded plans for performing and managing the testing activities.',
    goals: [
      { id: 'TPL-G1', name: 'Perform a Product Risk Assessment', expert: 'N', accept: ['N', 'P'], key: ['B', 'H2'],
        why: 'One line in the plan ("High-risk area: routing engine") is not a risk assessment. No risks were identified, analysed or prioritized with stakeholders; the QA lead cannot get the meeting.' },
      { id: 'TPL-G2', name: 'Establish a Test Approach', expert: 'P', accept: ['P'], key: ['B'],
        why: 'Items to test are listed and minimal entry/exit criteria exist, but the approach is generic and not linked to product risks.' },
      { id: 'TPL-G3', name: 'Establish Test Estimates', expert: 'N', accept: ['N'], key: ['B'],
        why: 'There is no estimate of test work products, tasks or effort. "The QA team is sufficient" is an assumption.' },
      { id: 'TPL-G4', name: 'Develop a Test Plan', expert: 'P', accept: ['P'], key: ['B'],
        why: 'A plan with schedule, resources and environment exists, but stakeholder involvement and test project risks are missing and the plan is not based on estimates.' },
      { id: 'TPL-G5', name: 'Obtain Commitment to the Test Plan', expert: 'N', accept: ['N'], key: ['B', 'H4'],
        why: 'Commitment needs reviewed, documented agreement (TPL P5.1). The approval table carries one name, the QA lead’s; the product owner and CTO rows are blank (B), and the product owner admits he does not read the plan (H4). Two thumbs-up on Slack are not a commitment, and no record backs the CTO’s "it counts as approved" (H1).' },
    ],
  },
  {
    id: 'TMC', code: 'PA 2.3', name: 'Test Monitoring and Control',
    purpose: 'Provide an understanding of test progress and product quality so that appropriate corrective actions can be taken when test progress or product quality deviate significantly from plan or expectations.',
    goals: [
      { id: 'TMC-G1', name: 'Monitor Test Progress', expert: 'P', accept: ['N', 'P'], key: ['E', 'G'],
        why: 'Progress data exists but is compiled by hand after the sprint and kept privately. The only report is a free-text email on release day.' },
      { id: 'TMC-G2', name: 'Monitor Product Quality', expert: 'P', accept: ['N', 'P'], key: ['D', 'E', 'G'],
        why: 'Defects are recorded, but quality is not monitored against exit criteria: 4.1 shipped with two critical defects open against the policy rule, and production defect counts are collected but never compared against any target.' },
      { id: 'TMC-G3', name: 'Manage Corrective Actions to Closure', expert: 'N', accept: ['N'], key: ['G'],
        why: 'The one corrective action ("finish the remaining tests after the release") was never tracked. No post-incident review, root cause empty, "nothing changed in the process".' },
    ],
  },
  {
    id: 'TDE', code: 'PA 2.4', name: 'Test Design and Execution',
    purpose: 'Improve test capability during test design and execution by identifying test conditions as a basis for developing test procedures, test charters and automated test scripts, performing a structured test execution process and managing test incidents to closure.',
    goals: [
      { id: 'TDE-G1', name: 'Perform Test Analysis and Design', expert: 'P', accept: ['P'], key: ['C'],
        why: 'Test cases come from the ROTA-412 acceptance criteria and two use boundary value analysis on the 30-minute minimum, but only the QA lead knows the technique. Windows crossing midnight were never identified as a test condition, the 12-hour maximum has a vague expected result and two cases have no story link.' },
      { id: 'TDE-G2', name: 'Perform Test Implementation', expert: 'P', accept: ['P', 'L'], key: ['C', 'J'],
        why: 'Manual test cases and automated tests exist and the pipeline runs unit and API tests on every pull request, but several cases have no testable expected result and the scripts that create test data sit on a developer’s laptop outside version control.' },
      { id: 'TDE-G3', name: 'Perform Test Execution', expert: 'P', accept: ['P'], key: ['C', 'F', 'G'],
        why: 'Tests run and results are logged, but 27% of the 4.1 regression was not run before release, reasons for unrun tests are not recorded and automatic reruns can hide intermittent failures.' },
      { id: 'TDE-G4', name: 'Manage Test Incidents to Closure', expert: 'P', accept: ['P'], key: ['D'],
        why: 'Incidents are logged in Jira, but there is no disposition process, no severity definition and 7 of 19 production defects were closed as "cannot reproduce".' },
    ],
  },
  {
    id: 'TEV', code: 'PA 2.5', name: 'Test Environment',
    purpose: 'Establish and maintain an adequate environment, including test data, in which it is possible to execute the tests in a manageable and repeatable way.',
    goals: [
      { id: 'TEV-G1', name: 'Develop Test Environment Requirements', expert: 'N', accept: ['N'], key: ['F'],
        why: 'No test environment requirements exist. Gaps (no iOS 18 device, no time zones) show up only as escaped defects.' },
      { id: 'TEV-G2', name: 'Perform Test Environment Implementation', expert: 'P', accept: ['P'], key: ['F'],
        why: 'Staging exists and builds deploy to it automatically, but it was built from one person’s knowledge with no requirements, and its generic test data is an unmasked production copy with real addresses and phone numbers (TEV P2.2 asks to anonymize or mask sensitive data).' },
      { id: 'TEV-G3', name: 'Manage and Control Test Environments', expert: 'N', accept: ['N', 'P'], key: ['F', 'OBS'],
        why: 'Availability is coordinated with "staging is mine" messages, outages are not managed as incidents and changes are made by hand without a record.' },
    ],
  },
  {
    id: 'IH', code: 'PA 2.6', name: 'Implementation and Habit',
    purpose: 'Establish and maintain an organizational environment in which performing the test processes and test process improvement are supported and can successfully be institutionalized at project, team or organizational unit level.',
    goals: [
      { id: 'IH-G1', name: 'Establish Governance', expert: 'P', accept: ['N', 'P'], key: ['J', 'H1'],
        why: 'Since 4.1 there is a directive (Level 2 in 12 months) and a 400-hour budget, so governance has started. Nobody has authority for improvement, and collected information is not used.' },
      { id: 'IH-G2', name: 'Implement Infrastructure', expert: 'P', accept: ['N', 'P'], key: ['J', 'A'],
        why: 'Tools are in place, but processes are undocumented drafts, there are no templates, no training and no monitoring of how teams follow the process.' },
      { id: 'IH-G3', name: 'Manage Configurations', expert: 'P', accept: ['P'], key: ['J'],
        why: 'Test cases and automated tests are versioned. The test plan, staging settings and test data scripts are not under configuration management.' },
    ],
  },
];

export const ALL_GOALS = PROCESS_AREAS.flatMap((pa) => pa.goals.map((g) => ({ ...g, pa: pa.id })));

export function findGoal(goalId) {
  return ALL_GOALS.find((g) => g.id === goalId) || null;
}

// Goals that ask the player for written reasoning in Step 3.
export const REASONED_GOALS = ['TMC-G3', 'TDE-G1'];

export const REASON_PROMPTS = {
  'TMC-G3': {
    question: 'Release 4.1 went out with 73% of the regression run and two critical defects open. How well does Rotaşa manage corrective actions to closure?',
    expert: 'N. The release email set one corrective action, "finish the remaining tests after the release", and nothing shows it was done (G3). There was no post-incident review, the root-cause field of ROTA-1179 is empty (D) and the QA lead says nothing changed in the process (H2). Issues were not analysed, actions were not planned and none was tracked to closure.',
    // Each cue is a word or a list of alternatives (English and Turkish).
    cues: ['73', ['after the release', 'sürümden sonra', 'yayından sonra', 'canlıya'], ['post-incident', 'olay sonrası'],
      ['root cause', 'kök neden'], ['track', 'takip', 'izle'], ['Document G', 'belge g', 'doküman g'], 'ROTA-1179',
      ['nothing changed', 'hiçbir şey değiş', 'değişmedi']],
  },
  'TDE-G1': {
    question: 'The 4.1 defect was a time window crossing midnight. What do the time-window test cases say about test analysis and design?',
    expert: 'P. Test cases are derived from the ROTA-412 acceptance criteria, six of eight are linked to it and two use boundary value analysis on the 30-minute minimum (C), so the practice is partly in place. But nobody analysed the test basis for windows crossing midnight, the exact 4.1 failure. The 12-hour maximum has a vague expected result ("should work correctly") and no above-maximum case. TC-1205 and TC-1207 break traceability with no story link, and only the QA lead knows the technique (H2). After the fix, the only new test is a developer unit test with no record in the test tool (C).',
    cues: [['midnight', 'gece yarı', 'geceyarı'], ['boundary', 'sınır'], 'TC-', 'ROTA-412', ['expected', 'beklenen'],
      ['traceab', 'izlenebil'], ['technique', 'teknik'], ['acceptance criteria', 'kabul kriter']],
  },
};
