# TMMi v2.0 — Level 2 "Managed" Reference

Source: *Test Maturity Model integration (TMMi®) — Guidelines for Test Process Improvement, Version 2.0*,
TMMi Foundation, author Erik van Veenendaal, released June 2026 (file `TMMi-Framework-model-V2.0 (1).pdf`).
Page numbers ("p.") are the printed page numbers in the PDF footer (they equal the PDF page index).
Quoted text is verbatim or near-verbatim; anything marked **[Note — not from source]** is our own
interpretation/context and must not be cited as TMMi text.

---

## 0. Key terminology changes in v2.0 (read first)

- Practices are numbered **`P<goal>.<n>`** (e.g., `P5.1`), goals **`G<n>`** (e.g., `TPL G5`). There are
  **no "SP"/"GP" prefixes and no specific/generic goal distinction** in v2.0. Throughout chapter 3 and the PA
  sections the terms are simply "goal" and "practice" (pp. 21–23, 27–71).
- v2.0 explicitly follows the newer CMMI direction: "Examples are more focused on business value and **the
  removal of generic goals and generic practices from process areas**." Agile and DevOps were taken into
  account, "which resulted among others in adding and removing (sub)practices, and adding specific examples."
  Lean as mindset was also a driver (§1.3.2, p. 11).
- Level 2 now has **six** process areas; the sixth, **2.6 Implementation and Habit (IH)**, is new (p. 16 fig 2.1,
  p. 18, p. 26).
- **[Note — not from source]** In TMMi v1.x, level 2 had five PAs, practices were "SP x.y", and each PA carried
  generic goals (GG2 "Institutionalize a Managed Process", GG3) with generic practices such as "establish an
  organizational policy", "provide resources", "train people", "manage configurations", "monitor and control",
  "review status with higher level management". In v2.0 those institutionalization concerns appear to be
  consolidated into the stand-alone IH process area (governance, infrastructure incl. process descriptions,
  resources and training, monitoring implementation, configuration management). The v2.0 text itself only says
  generic goals/practices were removed (p. 11) and that the major changes are listed in a separate document
  [TMMiReleaseV2] (p. 2, p. 11).

---

## 1. Framework context (chapters 1–3)

### 1.1 Assessments (§1.5, p. 14)
- TMMi is "an excellent reference model to be used during such assessments. Assessment teams use TMMi to guide
  their identification and prioritization of findings."
- "The assessment framework itself is not part of the TMMi." Requirements are in the *TMMi Assessment Method
  Application Requirements* [TAMAR], based on **ISO/IEC 33002**.
- "The achievement of a specific maturity level shall imply the same thing for different assessed
  organizations." TAMAR covers informal and formal assessment classes.

### 1.2 Improvement approach — IDEAL (§1.6.1, pp. 14–15)
- TMMi is a reference model; "it does not provide an approach on how to perform test process improvement such
  as the IDEAL model." IDEAL is based on PDCA:
  - **Initiating (I)** — objectives and scope agreed with stakeholders; "the most powerful initial step ... is
    to build strong organizational sponsorship before investing in test process improvements and assessments."
  - **Diagnosing (D)** — current test process assessed to identify possible improvements.
  - **Establishing (E)** — test improvement plan listing detailed actions; "can be highly informal and very
    lightweight."
  - **Acting (A)** — implement the plan; typically training, piloting, full deployment in project/team.
  - **Learning (L)** — verify which benefits were achieved; only then start the next cycle.
- Further reading: Annex C, and "The Little TMMi" [Veenendaal and Cannegieter].

### 1.3 "TMMi is **not** a Checklist" (§1.6.2, p. 15)
- Using TMMi as a checklist where all (sub)practices are ticked off "is of course totally against the idea of
  using TMMi where interpretation of the intent of a goal and practice in context is key."
- "Not every part of the TMMi model needs to be implemented 100% to be considered Fully Achieved."
  - **F (Fully Achieved)**: "consistent convincing evidence found of compliance"; practice achievement
    **>85% to 100%**.
  - **L (Largely Achieved)**: **>50% to ≤85%**. "To achieve certification a score of 'L' (Largely Achieved) is
    sufficient." [TAMAR]
- "Only goals are a required component! ... Practices are a so-called expected component ... Subpractices are
  no more than informative components."
- Implementation "should be driven by business needs and added value"; focusing simply on certification "is not
  the approach to take". TMMi "should be applied as a business-driven and objective-driven test process
  improvement model."

### 1.4 Maturity levels overview (§2.1, p. 16)
- Staged architecture; five levels. "Each TMMi level, except TMMi level 1, has a set of process areas that an
  organization must implement to achieve maturity at that level."
- "Because each maturity level forms a necessary foundation for the next level, trying to skip a maturity level
  is usually counter-productive." But improvement should focus on organizational needs; higher-level PAs may
  sometimes address current needs (e.g., establishing a test group, which belongs to Test Organization at L3,
  is "not a necessary characteristic of a TMMi level 2 organization").
- Fig 2.1 (p. 16): L1 Initial (no PAs); L2 Managed (TPS, TPL, TMC, TDE, TEV, IH); L3 Defined (Test
  Organization, Test Training Program, Test Process and Integration, Non-Functional Testing, Peer Reviews);
  L4 Measured (Test Measurement, Product Quality Evaluation); L5 Optimization (Defect Prevention, Quality
  Control, Test Process Optimization).

### 1.5 Level 1 Initial (§2.2, p. 17)
- "At this level there are no process areas and maturity goals with which to comply. This means that every
  organization is at least at TMMi level 1. TMMi level 1 is basically a 'free' level."
- Testing typically "without adequate process descriptions and process management"; success "depends on the
  competence and heroics of the people"; test cases developed ad hoc, no test design techniques, late in
  lifecycle; component testing without a definition/objective.
- Objective of testing: "to show that the software runs without major failures." Products released "without
  adequate visibility regarding product quality and risks"; lack of resources, tools, well-trained staff;
  "tendency to overcommit, abandonment of processes in times of crisis, and an inability to repeat their
  successes."
- Planning, monitoring and managing dependencies like test environments done ad hoc. Annex D lists typical L1
  practices of organizations "on their way" (p. 156; see §9 below).

### 1.6 Level 2 Managed (§2.3, pp. 17–18; repeated on p. 26)
- "At TMMi level 2, testing becomes a managed process. The process discipline ... helps to ensure that proven
  practices are retained during times of stress. An infrastructure is put in place to implement and perform the
  set of processes and for them to become habitual. The infrastructure includes process descriptions, resource
  availability and training. As part of governance, management commitment is established ..."
- "An organizational test policy and a company-wide or program-wide test strategy are established." Multiple
  test levels (component, integration, system, UAT) are identified, defined and performed, each with specific
  objectives in the test strategy.
- Basic practices at **project or team level**: test planning (up-front thinking, risk-based test approach from
  a product risk assessment on documented requirements such as user stories), commitments to approach, exit
  criteria and resources; monitoring and control with corrective action; visibility of status of test work
  products, execution and test-object quality; test conditions implemented as automated scripts, manual
  procedures or test charters; test logs; incidents reported and managed to closure.
- Testing "may start relatively late in the development lifecycle" and may still be perceived as a phase after
  coding. "The main objective of testing in a TMMi level 2 organization is to verify that the product satisfies
  the specified requirements." Early involvement encouraged but "may not be consistently achieved". "Post
  coding, execution-based testing is considered the primary testing activity."
- Distinction from L3 (p. 19): at L2, standards, process descriptions and assets "may still be different per
  project and team"; at L3 they are aligned across projects and teams (with tailoring guidelines).
- Glossary (p. 160): **managed process** — "A performed process that is recorded, followed, updated, and made
  persistent and habitual in use. A managed process is required at TMMi level 2."

### 1.7 Structure: required / expected / informative components (chapter 3, pp. 21–23)
| Category | Components | Meaning (source) |
|---|---|---|
| **Required** | **Goals** only | "describe what an organization shall achieve to satisfy a process area ... Goal satisfaction is used in assessments as the basis for deciding if a process area has been achieved and satisfied." (p. 21) |
| **Expected** | **Practices** | "what an organization will typically need to implement to achieve a required component ... Goals can only be considered achieved when the organization's processes include either the practices as described, or acceptable alternatives" (e.g., in TMMi-Agile / TMMi-DevOps guides). (p. 21) |
| **Informative** | Subpractices, example work products, notes, examples, references (also purpose, introductory notes) | "provide details that help organizations start considering how to approach the required and expected components." (p. 21) |

- **Maturity level achievement (p. 22):** "To reach a maturity level, an organization must satisfy all goals of
  the process areas at the specific level and also those at lower maturity levels." "All process areas of the
  maturity level and the lower maturity levels must be satisfied to consider a maturity level to be achieved."
  Every organization has at least L1 (no goals).
- Fig 3.1 (p. 22): Maturity Levels → Process Areas → Goals → Practices.
- PA components (pp. 22–23): **Purpose** (informative), **Value** (business benefits), **Introductory Notes**
  (informative), **Scope**, **Goal** ("required characteristic that must be present to satisfy the process area";
  each goal also describes its added value), **Practice** (expected), **Example Work Products** (informative —
  "there are often alternative work products that are just as effective but are not listed"), **Subpractice**
  (informative — "Although sometimes worded prescriptively ... only intended to provide ideas"), plus Notes,
  Examples, References.
- Glossary: **maturity level** — "A rating which describes the degree to which processes in an organization unit
  meet the intent and goals of a predefined set of process areas" (p. 160); **test process area** — "A cluster of
  related test practices in an area that, when implemented collectively, satisfy a set of goals considered
  important for making test improvements in that area" (p. 166); **institutionalization** — "The ingrained way
  of doing business that an organization follows routinely as part of its corporate culture" (p. 160).

### 1.8 Related CMMI practice areas for Level 2 (Table 3.1, p. 24)
- TPS: Governance (supports G1 Establish a Test Policy); Managing Performance and Measurement (supports G3).
- TPL: Estimation; Planning; Risk and Opportunity Management.
- TMC: Monitor and Control; Risk and Opportunity Management.
- TDE: Requirements Development and Management (horizontal traceability; high-quality requirements).
- TEV: Requirements Development and Management (G1 Develop Test Environment Requirements).
- IH: Configuration Management (G3 Manage Configurations); Governance (G1 Establish Governance);
  Implementation Infrastructure (G2 Implement Infrastructure).
- CMMI "Verification and Validation" is not listed: TMMi PAs instead support/complement it (p. 25).

---

## 2. Level 2 process area & goal summary (quick reference)

| PA | Abbrev. | Goals | Pages |
|---|---|---|---|
| 2.1 Test Policy and Strategy | TPS | G1 Establish a Test Policy · G2 Establish a Test Strategy · G3 Establish Test Performance Indicators | 27–32 |
| 2.2 Test Planning | TPL | G1 Perform a Product Risk Assessment · G2 Establish a Test Approach · G3 Establish Test Estimates · G4 Develop a Test Plan · G5 Obtain Commitment to the Test Plan | 33–43 |
| 2.3 Test Monitoring and Control | TMC | G1 Monitor Test Progress · G2 Monitor Product Quality · G3 Manage Corrective Actions to Closure | 44–51 |
| 2.4 Test Design and Execution | TDE | G1 Perform Test Analysis and Design · G2 Perform Test Implementation · G3 Perform Test Execution · G4 Manage Test Incidents to Closure | 52–59 |
| 2.5 Test Environment | TEV | G1 Develop Test Environment Requirements · G2 Perform Test Environment Implementation · G3 Manage and Control Test Environments | 60–65 |
| 2.6 Implementation and Habit | IH | G1 Establish Governance · G2 Implement Infrastructure · G3 Manage Configurations | 66–71 |

Totals: 6 PAs, 21 goals, 74 practices (TPS 7, TPL 15, TMC 14, TDE 16, TEV 11, IH 11).

---

## 3. PA 2.1 Test Policy and Strategy (TPS) — pp. 27–32

**Purpose (p. 27):** "to develop and establish a test policy, and an organization-wide or program-wide test
strategy in which the test activities, e.g., test types and test levels, are defined. To measure test
performance, the value of test activities and expose areas for improvement, test performance indicators are
introduced."

**Value (p. 27):** Test policy creates a common view of testing and management commitment; performance
indicators show management the results of improvement, "ensuring continuation of management commitment";
the organizational test strategy guides projects and teams and improves alignment.

**Notes/Scope (pp. 27–28):** Test policy aligned with business (quality) policy; objectives for test process
improvement stated in the policy and translated into test performance indicators. Strategy addresses generic
product risks; Agile: testing quadrants often a starting framework; DevOps: strategy built around the CI/CD
pipeline. Policy may be incorporated in a quality policy. For each test level/type: objectives,
responsibilities, main tasks, entry/exit criteria. Policy/strategy usually need updating when moving up levels.

### TPS G1 Establish a Test Policy (p. 28)
"A test policy, aligned with the business (quality) policy, is established and agreed upon by the stakeholders
to create a common view of testing within the organization."
- **P1.1 Define test goals** — based on test directives defined by management, business needs and objectives.
  EWP: *Test goals*. Subpractices: study directives/business needs; define goals traceable to them (e.g.,
  validate fit-for-use, prevent defects in operation, verify compliance, provide visibility of quality and
  risks); review with stakeholders; revisit e.g. yearly. Refers to IH for management directives. (pp. 28–29)
- **P1.2 Define test policy** — aligned with business (quality) policy, based on test goals, agreed by
  stakeholders. EWP: *Test policy*. Typical topics [after ISO 29119-3]: definition of testing, objectives and
  added value, quality levels, views on testing profession, independence, training/certifications, key
  responsibilities, tester ethics, high-level test process, applicable standards. Review with senior
  management; revise e.g. yearly. (p. 29)
- **P1.3 Distribute the test policy to stakeholders** — to stakeholders within and outside testing (e.g., Agile
  or DevOps teams), presented and discussed. EWP: *Test policy presentation* (mechanisms: meetings, posters,
  onboarding program, central web portal). (pp. 29–30)

### TPS G2 Establish a Test Strategy (p. 30)
"An organization-wide or program-wide test strategy that identifies and defines the test levels and test types
to be performed is established and deployed to guide projects and teams ... and prevent projects and teams
from re-inventing the wheel." Projects/teams may tailor; "Any area of non-compliance with the test strategy
shall be clearly documented, e.g., in their test plan."
- **P2.1 Define test strategy** — test levels and types identified; per level/type objectives,
  responsibilities, main tasks, entry/exit criteria. EWPs: *Test strategy*; *Generic product risk list, with
  priority assigned to each risk*. Topics [after ISO 29119-3]: generic risks, overall test model (V-model,
  Agile, DevOps), test levels, test types, design techniques per level/type, entry/exit criteria (DevOps:
  quality gates in CI/CD test jobs), standards, organization/roles, independence, environment, confirmation &
  regression approach, automation approach, configuration and incident management. (pp. 30–31)
- **P2.2 Distribute the test strategy to stakeholders** (section heading on p. 31 reads "to the stakeholder") —
  EWP: *Test strategy presentation*. (p. 31)

### TPS G3 Establish Test Performance Indicators (p. 31)
"A set of goal-oriented test process performance indicators measuring the quality of the test process is
established and deployed to be able to show to stakeholders the results being achieved through the test
process improvement activities."
- **P3.1 Define test performance indicators** — based on test policy, test goals and management information
  needs, including a procedure for data collection, storage and analysis. EWPs: *Test performance indicators*;
  *Data collection, storage, analysis and reporting procedure*. Examples: test effort and cost, defect
  detection percentage, escaped defects, customer satisfaction, change failure rate, test coverage, test
  maturity level. Should relate to business value; DevOps: value-stream metrics such as test execution lead
  time. Agile/DevOps may broaden indicators to team/system. (pp. 31–32)
- **P3.2 Deploy test performance indicators** — provide measurement results to stakeholders, e.g., senior
  management. EWPs: *Test performance indicator data*; *Measurement reports regarding the test performance
  indicators*. Obtain (DevOps: integral to CI/CD, near real-time), analyze, store, report periodically, assist
  stakeholders in understanding. (p. 32)

---

## 4. PA 2.2 Test Planning (TPL) — pp. 33–43

**Purpose (p. 33):** "to define a test approach based on the identified risks and the defined test strategy, and
to establish and maintain well-founded plans for performing and managing the testing activities."

**Value (p. 33):** "Test planning balances test effort with functionality and quality delivered, and increases
the likelihood of meeting the test objectives."

**Notes/Scope (p. 33):** Test approach complies with (or explains non-compliance with) the test strategy;
decides which requirements (e.g., user stories) are tested, to what degree, how and when. Product risks,
approach and estimates defined with all stakeholders and the team, "rather than just by testing". "Beware that
the key to successful test planning is in upfront thinking (the activity), and much less in defining the
associated test plan (the document)." Plans may be per test level/type or a master test plan. Agile/DevOps:
release and iteration planning; in DevOps release planning becomes continuous. Non-functional test plans come
at L3 (NFT).

### TPL G1 Perform a Product Risk Assessment (p. 34)
"A product risk assessment is performed to identify the critical areas for testing."
- **P1.1 Identify product risks** — identified and documented. EWP: *Identified product risks*. Select
  contributing stakeholders; techniques: risk workshops, risk poker, brainstorming, expert interviews,
  checklists, lessons learned, ROAM; document background/consequences; identify stakeholders per risk. (p. 34)
- **P1.2 Analyze product risks** — evaluated, categorized and prioritized. EWP: *Product risk list, with a
  category and priority assigned to each risk*. Likelihood × impact; categories (functional, architectural,
  non-functional, change-related/regression); prioritize; **horizontal traceability between product risks and
  requirements**; agree with stakeholders; revise on new/changed user stories, approach changes, lessons
  learned. (p. 35)

### TPL G2 Establish a Test Approach (p. 35)
"A test approach, based on identified product risks, is established and agreed upon to provide all
stakeholders with a clear understanding of the approach, their specific tasks and objectives."
- **P2.1 Identify items and features to be tested** — and not to be tested, based on product risks. EWP: *List
  of items and features to be tested and not to be tested* (with risk level and source, e.g., epic or user
  story). (p. 35)
- **P2.2 Define the test approach** — to mitigate the identified and prioritized product risks. EWP: the
  approach (e.g., selected test design techniques) "in sufficient detail to support identification of major
  test tasks and estimation". Subpractices: select multiple design techniques by risk (DevOps: BDD/ATDD);
  automation approach; review approach for test work products; confirmation testing approach; regression
  approach (e.g., test pyramid); suspension/resumption criteria; supporting tools; constraints; align with
  strategy; identify non-compliance and rationale; review; revise. (pp. 35–37)
- **P2.3 Define entry criteria** — "also called definition-of-ready". EWP: *Entry criteria (definition-of-ready)
  per identified test level*. Process-related (previous test summary report, environment, documentation) and
  product-quality-related (INVEST user stories, Given/When/Then acceptance criteria, successful intake test,
  no outstanding defects of priority X). Review with those responsible for meeting them. (p. 37)
- **P2.4 Define exit criteria** — "also called definition-of-done". EWP: *Exit criteria (definition-of-done)
  per identified test level*. Process (% tests executed, coverage, approved test summary report) and product
  quality (high-priority risks mitigated, defect detection rate below threshold, all tests passed, outstanding
  defects by priority, customer satisfaction). Exit criteria of a level aligned with entry criteria of the
  next. (pp. 37–38)

### TPL G3 Establish Test Estimates (p. 38)
"Well-founded test estimates are established and maintained for use in discussing the test approach with
stakeholders to reduce uncertainty, and to provide a basis for making test commitments and planning of testing
activities."
- **P3.1 Identify test work products to be developed and test tasks to be performed** — defines estimate scope.
  EWPs: *Test work products list*; *Test tasks to be performed* (incl. externally acquired/re-used products,
  indirect tasks such as reporting, meetings, CM; test environment tasks). (p. 38)
- **P3.2 Determine estimates for test effort and cost** — based on estimation rationale. EWPs: *Attribute
  estimates of test work products and test tasks*; *Test size estimates*; *Test effort estimates*; *Test cost
  estimates*. Techniques: three-point, Wide Band Delphi, planning poker, T-shirt sizing, swim lane sizing;
  include infrastructure needs; document assumptions; record estimation data to allow reconstruction. (p. 39)

### TPL G4 Develop a Test Plan (p. 40)
"A test plan is established and maintained to provide a basis for managing testing and to ensure effective and
efficient communication with stakeholders."
- **P4.1 Establish the test schedule** — based on estimate and test lifecycle; Agile/DevOps: often an ordering
  of user stories and tasks. EWP: *Test schedule*. (p. 40)
- **P4.2 Plan for test staffing** — staff with required knowledge and skills; Agile/DevOps: typically once at
  team set-up. EWPs: *Staffing requirements*; *Inventory of skill needs*; *Staffing and new hire plan*; *Test
  training plan*. (p. 40)
- **P4.3 Plan stakeholder involvement** — stakeholders from all test lifecycle phases; Agile/DevOps: product
  owner represents business stakeholders. EWP: *List of stakeholders and their involvement*. (pp. 40–41)
- **P4.4 Identify test project risks** — identified, analyzed, documented. EWPs: *Identified test project
  risks*; *Prioritized test project risk list (impediment log)*; *Test project risk mitigation plans*. (p. 41)
- **P4.5 Establish the test plan** — results of previous practices documented in an overall test plan. EWP:
  *Test Plan*. Elements [after ISO 29119-3]: introduction/context, non-compliances with strategy, product risks,
  items/features to be tested and not, assumptions/constraints, test approach, re-test/regression approach,
  entry/exit and suspension/resumption criteria, milestones/work products, lifecycle/tasks,
  environment/test data needs, staffing/training, stakeholder involvement, reporting, estimate and schedule,
  test project risks. Agile/DevOps: product risks, epics/user stories (priority), approach, DoD — "could be
  displayed or reflected on the task board". (pp. 41–42)

### TPL G5 Obtain Commitment to the Test Plan (p. 42)
"Commitments to the test plan are established and maintained to achieve a consistent understanding by all
stakeholders thereby reducing the likelihood of changes to the approach and plan at a later stage."
- **P5.1 Review test plan and obtain commitments** — EWPs: *Test plan review log*; *Documented commitments*.
  Organize reviews with stakeholders; review (external) commitments with senior management as necessary.
  (p. 42)
- **P5.2 Reconcile work and resource levels** — adjust plan to reconcile available and estimated resources.
  EWPs: *Revised test approach and corresponding estimation parameters*; *Renegotiated test budget*; *Revised
  test schedule*. Reconciliation by lowering/deferring technical performance, more resources, productivity,
  scope change, outsourcing, skill mix, schedule revision. (pp. 42–43)

---

## 5. PA 2.3 Test Monitoring and Control (TMC) — pp. 44–51

**Purpose (p. 44):** "to provide an understanding of test progress and product quality so that appropriate
corrective actions can be taken when test progress or product quality deviate significantly from plan or
expectations."

**Value (p. 44):** "increases the probability of meeting test and project objectives by taking early action to
adjust for significant performance deviations."

**Notes/Scope (p. 44):** Progress monitored vs schedule/test plan (status of work products, tasks, effort,
cost); product quality via product risks mitigated, defects found/open, status vs exit criteria (DoD).
Agile/DevOps: less plan-driven, continuous review. Test reports and dashboards. Test project risk management is
an essential part. Scope includes reporting, milestone reviews, corrective actions managed to closure.

### TMC G1 Monitor Test Progress (p. 45)
"The actual progress and performance of testing is monitored and compared against the values in the test plan
to identify significant deviations at an early stage so more effective corrective action can be taken."
- **P1.1 Monitor test planning parameters** — actual values vs test plan. EWPs: *Records of test performance*;
  *Updated task boards*; *Burndown charts*; *Records of significant deviations from plan*. Monitor progress vs
  schedule, cost and effort vs estimates; document significant deviations. (p. 45)
- **P1.2 Monitor test environment resources provided and used** — vs plan. EWPs: *Records of test environment
  resources provided and used*; *Burndown charts*; *Records of significant deviations from plan*. DevOps:
  continuous monitoring with on-line dashboards. (pp. 45–46)
- **P1.3 Monitor test project risks** — vs those in the test plan. EWPs: *Updated test project risk register*;
  *Records of project risk monitoring*. Periodic review (e.g., daily stand-up), update register, communicate
  status. (p. 46)
- **P1.4 Report and discuss test progress** — periodically (daily in Agile/DevOps, weekly, bi-weekly). EWPs:
  *Test progress report*; *Progress dashboard*; *Documented test progress review results, e.g., minutes*.
  (pp. 46–47)
- **P1.5 Conduct test progress milestone reviews** — at selected milestones (end of lifecycle phase or
  iteration); "typically formal reviews". EWPs: *Test milestone report*; *End of iteration progress
  dashboard*; *Documented milestone review results*. Review commitments, plan, status, project risks,
  environment resources; document actions/decisions/lessons learned; update the test plan. (p. 47)

### TMC G2 Monitor Product Quality (p. 47)
"Actual product quality is monitored against the quality measurements defined in the plan and the quality
expectations, e.g., of the customer/user, to identify significant product quality issues at an early stage ...
In a DevOps context, this is a continuous process in which product quality is also monitored in production."
- **P2.1 Check against entry criteria** — at start of test execution vs definition-of-ready in the test plan.
  EWP: *Records of entry check (definition-of-ready)*; document deviations, initiate corrective action.
  (pp. 47–48)
- **P2.2 Monitor defects** — measures of defects found vs expectations. EWP: *Records of defect monitoring*
  (e.g., outstanding defects per priority, resolved/unresolved, by type, defects/KLOC, pass/fail rate, discovery
  rate, actual vs estimated). (pp. 48–49)
- **P2.3 Monitor product risks** — vs those identified in test planning. EWPs: *Updated test product risk
  register*; *Records of product risk monitoring*. Monitor requirement changes for new/changed risks; revise
  (e.g., after exploratory testing); monitor number of risks mitigated; communicate. (p. 48)
- **P2.4 Monitor exit criteria** — status vs definition-of-done in test plan. EWP: *Records of exit criteria
  (definition-of-done) monitoring*; may include customer satisfaction surveys. (pp. 48–49)
- **P2.5 Report and discuss product quality** — periodically. EWPs: *Product quality report*; *Product quality
  dashboard*; *Documented product quality review results*. (p. 49)
- **P2.6 Conduct product quality milestone reviews** — e.g., sprint reviews; "typically formal reviews". EWPs:
  *Test milestone report*; *End of iteration product quality dashboard*; *Documented milestone review results*.
  Product quality report elements [after ISO 29119-3]: management summary, comprehensive assessment, summary of
  results, testing completed vs plan, test measures vs exit criteria, new/changed/residual product risks;
  update test plan. (pp. 49–50)

### TMC G3 Manage Corrective Actions to Closure (p. 50)
"Corrective actions are managed to closure when test progress or product quality deviate significantly from
plan and/or expectations, to increase the probability that corrective actions are successfully executed and
objectives will be met."
- **P3.1 Analyze issues** — collect and analyze issues, determine corrective actions. EWP: *List of issues
  needing corrective actions*. "corrective action is required when the issue, if left unresolved, may prevent
  testing, or even the project or team, from meeting its objectives." (p. 50)
- **P3.2 Take corrective action** — EWP: *Corrective action plan*. Actions: re-negotiate commitments, add
  resources, change test approach, revisit exit criteria, defer release, reduce scope, remove user stories;
  agree with team/stakeholders. (pp. 50–51)
- **P3.3 Manage corrective action** — to closure. EWP: *Corrective action results*. Monitor completion (e.g., as
  backlog items), analyze effectiveness, report status. (p. 51)

---

## 6. PA 2.4 Test Design and Execution (TDE) — pp. 52–59

**Purpose (p. 52):** "to improve test capability during test design and execution by identifying test
conditions as a basis for developing test procedures, test charters and automated test scripts, performing a
structured test execution process and managing test incidents to closure."

**Value (p. 52):** "aims to ensure adequate verification and validation of the quality of the software product,
based on the identified product risks."

**Notes/Scope (p. 52):** Based on product risks and the test approach in the test plan; covers test analysis,
design, implementation and execution per the fundamental test process [Veenendaal24]. Sequential in
sequential lifecycles; parallel, overlapping, iterative in Agile. Incident reports logged in an incident
management system; incident lifecycle process to manage each incident to closure.

### TDE G1 Perform Test Analysis and Design (p. 53)
"the test approach is translated into test conditions and test cases, using test design techniques, to ensure
adequate coverage, in line with the identified product risks."
- **P1.1 Study and analyze the test basis** — e.g., during backlog refinement, to identify issues and determine
  testability. EWP: *Test basis issue log*. (p. 53)
- **P1.2 Identify and prioritize test conditions** — using principles of test design techniques (EP, BVA,
  decision tables, statement, branch). Agile/DevOps: acceptance criteria take over the role of test conditions.
  EWPs: *Test conditions*; *Test design specification*. (pp. 53–54)
- **P1.3 Identify and prioritize test cases** — using test design techniques or ATDD/BDD; prioritized by risk
  and business value; documented e.g. in Given/When/Then (Gherkin). EWP: *Test cases*. (p. 54)
- **P1.4 Identify specific test data** — EWP: *Test data specification*. (pp. 54–55)
- **P1.5 Maintain horizontal traceability with requirements** — between requirements (e.g., user stories) and
  test conditions/test cases, set up to facilitate monitoring requirements coverage. EWP: *Requirements vs. test
  conditions / test cases traceability*. (p. 55)

### TDE G2 Perform Test Implementation (p. 55)
"the test procedures, test charters and/or automated test scripts, including the smoke test, are developed ...
Test data is created and a test execution schedule defined."
- **P2.1 Implement test cases** — incl. regression tests, as test procedures, charters and/or automated
  scripts. EWPs: *Test procedure specifications*; *Test charters*; *Automated test scripts*. Prioritize by risk;
  review; revise. (p. 55)
- **P2.2 Create specific test data** — EWP: *Specific test data*; archive to allow restoring initial situation;
  refers to TEV P3.2 for management. (pp. 55–56)
- **P2.3 Specify smoke test** — decides at start of execution whether the test object is ready; also common in
  CI after each build. EWPs: *Smoke test checklist*; *Smoke test procedure or script*; uses entry criteria as
  input. (p. 56)
- **P2.4 Develop test execution schedule** — sequence of (especially manual) tests. EWP: *Test execution
  schedule, possibly using a task board*. (p. 56)

### TDE G3 Perform Test Execution (p. 57)
"Automated test scripts and manual tests are executed according to the test execution schedule to verify and
validate the quality of the software product. Test incidents are reported and test logs are created."
- **P3.1 Perform smoke test** — (intake test). EWPs: *Test log*; *Incident reports*. May be combined with TEV
  P2.4 environment smoke test. (p. 57)
- **P3.2 Execute test cases** — manual procedures, exploratory testing, or automation, per schedule, incl.
  confirmation and regression testing. EWP: *Test results*. (p. 57)
- **P3.3 Report test incidents** — discrepancies between actual and expected. EWPs: *Test incident reports*;
  *Criteria for logging test incidents* (if not all incidents are logged, e.g., Agile/DevOps, criteria must be
  developed). Report elements [after ISO 29119-3]: identifier, summary, date/time, originator, description,
  suspected cause, priority, severity; store centrally. (pp. 57–58)
- **P3.4 Establish test log** — written or generated. EWP: *Test logs* (identifier, date/time, items tested,
  environment, execution description, impact). (p. 58)

### TDE G4 Manage Test Incidents to Closure (p. 58)
"Test incidents are managed and resolved as appropriate to minimize the impact of disruptions and meet product
quality objectives and customer commitments more effectively."
- **P4.1 Decide on disposition of test incidents** — EWPs: *Decision log regarding test incidents*; *Updated
  test incident report*. Decisions: rejected / deferred / fix; record rationale; assign to group. (pp. 58–59)
- **P4.2 Perform appropriate action to close test incidents** — fix, confirmation test, close, or defer to
  future iteration/release. EWPs: *Test log (including test results)*; *Updated test incident report*. Formally
  close only after successful confirmation testing. (p. 59)
- **P4.3 Monitor and communicate the status of test incidents** — EWPs: *Status report test incidents*;
  *Updated test incident report*. Escalate e.g. when status unchanged longer than agreed. (p. 59)

---

## 7. PA 2.5 Test Environment (TEV) — pp. 60–65

**Purpose (p. 60):** "to establish and maintain an adequate environment, including test data, in which it is
possible to execute the tests in a manageable and repeatable way."

**Value (p. 60):** "aims to facilitate and support an effective and efficient execution of tests, by providing
an adequate test environment and supporting generic test data."

**Notes/Scope (p. 60):** Environment as close as possible to 'real-life'; reproducibility not endangered by
unknown changes. Requirements specified early (Agile: iteration-0). Implementation often includes service
virtualization and set-up/configure/tear-down scripts; environment smoke test. Management: access, technical
support, resource usage, decommissioning. **Generic test data** (re-used by many; background data) is covered
here; **specific test data** is defined during test design (TDE).

### TEV G1 Develop Test Environment Requirements (p. 61)
"Test environment and test data needs, expectations and constraints are collected and translated into test
environment and test data requirements to ensure a mutual understanding ..."
- **P1.1 Elicit test environment and generic test data needs** — EWPs: *Test environment needs, expectations
  and constraints*; *Test data needs, expectations and constraints*. (p. 61)
- **P1.2 Develop test environment and generic test data requirements** — into prioritized requirements, incl.
  when each item is needed. EWPs: *Prioritized test environment requirements*; *Prioritized generic test data
  requirements*. (p. 61)
- **P1.3 Analyze test environment and generic test data requirements** — necessary, sufficient, feasible;
  map to test levels, test types, CI/CD pipeline; sufficiently represent operational environment. EWPs: *Test
  environment requirements review log*; *Generic test data requirements review log*. (p. 62)

### TEV G2 Perform Test Environment Implementation (p. 62)
"The test environment and generic test data requirements are implemented to facilitate and support test
execution."
- **P2.1 Implement the test environment** — EWPs: *Operational test environment*; *Test results for test
  environment components*. Incl. correct versions, service virtualization, Infrastructure-as-Code /
  Configuration-as-Code, set-up/tear-down scripts, supporting documentation, coordinated maintenance. (p. 62)
- **P2.2 Create generic test data** — EWP: *Generic test data*. May use AI techniques; refresh regularly;
  anonymize/mask sensitive data per privacy policy; archive; ensure integrity; verify coverage of needs;
  develop management protocols. (p. 63)
- **P2.3 Specify test environment smoke test** — EWPs: *Test environment smoke test checklist*; *Test
  environment smoke test procedure or script*. Related to TDE P2.3. (p. 63)
- **P2.4 Perform test environment smoke test** — EWPs: *Test environment smoke test log*; *Incident reports*.
  Related to TDE P3.1 (may be combined). (pp. 63–64)

### TEV G3 Manage and Control Test Environments (p. 64)
"Test environments and test data are managed and controlled to allow for uninterrupted test execution."
- **P3.1 Perform test environment management** — systems management. EWPs: *System management log file*; *Test
  log*. Install components, manage access/permissions, environment-specific settings (API end-points, feature
  flags), technical support, logging, resource monitoring, security patching, CI/CD provisioning, backups,
  decommission/clean up. (p. 64)
- **P3.2 Perform generic test data management** — EWPs: *Archived generic test data*; *Generic test data
  management log file*. Secure repository, remove obsolete data, legal/privacy compliance, usage/coverage
  reports, access control, automatic provisioning via CI/CD, archive/restore. (pp. 64–65)
- **P3.3 Coordinate the availability and usage of the test environments** — by multiple groups. EWP: *Test
  environment reservation schedule*. (p. 65)
- **P3.4 Report and manage test environment incidents** — formally reported and managed to closure. EWPs: *Test
  environment / generic test data incident reports*; *Decision log regarding test environment / generic test
  data incidents*. Refers to TDE for incident practices. (p. 65)

---

## 8. PA 2.6 Implementation and Habit (IH) — pp. 66–71 — NEW in v2.0

**Purpose (p. 66):** "to establish and maintain an organizational environment in which performing the test
processes and test process improvement are supported and can successfully be institutionalized at project,
team or organizational unit level."

**Value (p. 66):** "aims to provide the practices that are essential for being able to execute the test
processes and for improvements to last, and, over time, to become habitual."

**Introductory Notes (p. 66):**
- "This process area describes the implementation of practices that address the various aspects of
  institutionalization." Institutionalization "implies that the test process is ingrained in the way the work
  is performed, is habitual and there is commitment to and consistency in performing the process. An
  institutionalized process is more likely to be sustained during times of stress."
- "This process area addresses the initial step for institutionalization, to be further enhanced at TMMi level
  3." An institutionalized process "is planned and executed in accordance with policy, employs skilled people
  and has adequate resources to produce controlled outputs. At TMMi level 2, a process may be instantiated by a
  project, team, or organizational unit."
- Three aspects: **governance** ("practices (senior) management perform to promote the way testing work is
  accomplished"; "Visible and active management involvement is critical"), **implementation of the
  infrastructure** ("everything that is needed to implement and perform the set of processes and for them to
  become habitual ... process descriptions, resource availability and training"; descriptions "clear and
  concise, and typically not require a significant amount of administration"; "Without an infrastructure,
  processes may not be followed and will not become habitual"), and **configuration management** of test work
  products "such as test plans, test scripts, test results, test logs, and test reports as configuration
  items".

**Scope (p. 66):** governance (role and responsibilities for senior management), institutionalization (things
needed to be able to perform the processes), configuration management (integrity of test work products).

### IH G1 Establish Governance (p. 67)
"Provides explicit guidance to senior management on their role in sponsorship and governance of test
performance, test processes and related activities to increase the likelihood that implemented test processes
support and contribute to the success of the business."
- **P1.1 Define organizational test directives** — senior management defines, updates and communicates
  directives for test process implementation and test performance improvement. EWPs: *Organizational test
  directives*; *Test performance improvement directives*; *Records of communication*. Directives drive the test
  policy (e.g., which test process areas to prioritize); reviewed periodically or event-driven. Refers to TPS.
  (p. 67)
- **P1.2 Identify information needs and use collected information** — senior management uses collected
  information for governance and oversight. EWPs: *Management information needs*; *Review results*. Information
  needs drive the test performance indicators; review accomplishments using indicator measurements. Refers to
  TPS G3. (pp. 67–68)
- **P1.3 Assign authority for test process improvement** — assigns authority and holds people accountable for
  adhering to directives in the test policy. EWPs: *Assignment of responsibility*; *Rewards, recognition and
  incentives*. (p. 68)
- **P1.4 Provide resources for test process improvement** — for developing, improving and evaluating adherence
  to the expected test processes. EWPs: *Record of allocation of funding and resources*; *Records of reviews
  and communication*. (p. 68)

### IH G2 Implement Infrastructure (p. 68; heading printed "Implement infrastructure")
"The implementation of the infrastructure covers what is needed to implement, perform and sustain the set of
test processes to increase the ability to achieve goals and objectives efficiently and effectively."
- **P2.1 Develop and maintain test processes** — EWP: *Documented test processes*. Note: "test processes at
  TMMi level 2 are not necessarily organizational test processes. They can be defined at project, team or
  organizational unit level and as such may vary across the organization." Document purpose, inputs, steps,
  outputs, roles; review; communicate and make available. (pp. 68–69)
- **P2.2 Train people** — EWPs: *Process training materials*; *Training records*. Train performers; overview
  training for interacting stakeholders; keep records. (p. 69)
- **P2.3 Provide resources to perform the test processes** — EWPs: *Budget for resources*; *Tools*. Assign
  responsibility, sufficient time, skilled people, available stakeholders, tools. (p. 69)
- **P2.4 Monitor implementation** — of the test processes on projects and teams. EWP: *Status report and
  results of monitoring test processes in projects and teams*. Monitor use; "Review test process artifacts
  created by a project or team to ensure compliance"; track issues to closure. (pp. 69–70)

### IH G3 Manage Configurations (p. 70)
"Manage the integrity of test work products using configuration identification, version control and change
control to reduce the loss of work and increase the ability to deliver and use the correct version of test work
products."
- **P3.1 Develop a configuration and change management process** (heading on p. 70 reads "... system") —
  develop or re-use (e.g., from software development). EWP: *Configuration and change management process*.
  Levels of control, naming conventions, access control, store/retrieve, back-up/restore/archive. (p. 70)
- **P3.2 Identify test items to be placed under configuration management** — based on criteria in the process.
  EWP: *Identified test configuration items* (unique identifiers; characteristics such as owner, type, purpose,
  relationships). (p. 70)
- **P3.3 Develop and use versions of test items under configuration management** — EWPs: *Test configuration
  items (test work products) and their versions*; *Revision history or change log of test configuration items*;
  *Change request records*. (p. 71)

### How IH relates to the other Level 2 PAs
- **From the source:** IH is a regular level 2 PA with its own required goals (G1–G3); satisfying it is needed
  for level 2 like any other PA (p. 22). Explicit cross-references: TPS P1.1 → IH for organizational test
  directives and test performance improvement directives (p. 29); TPS P3.1 → IH for management information needs
  (p. 32); IH P1.1 and P1.2 refer back to TPS for the test policy and test performance indicators (pp. 67–68).
  IH G3 covers test work products produced by the other PAs ("test plans, test scripts, test results, test logs,
  and test reports", p. 66). IH G2 P2.4 monitors "the implementation of the test processes on projects and
  teams" (p. 69). The L3 PA Test Process and Integration "builds strongly on the practices of the TMMi level 2
  process area Implementation and Habit" (p. 87).
- **[Note — not from source]** The text does **not** say that IH goals are applied separately *per* other PA
  (as v1.x generic goals were). Practically, the IH practices are cross-cutting: P2.1 documented processes,
  P2.2 training, P2.3 resources and P2.4 monitoring of implementation apply to the test processes defined by
  TPS/TPL/TMC/TDE/TEV, and G3 CM applies to their work products. Evidence of IH in an assessment would
  therefore typically be gathered across all those processes.

---

## 9. Annex C — The Improvement Process (pp. 151–155) and Annex D (p. 156)

- **C.1 (p. 151):** "TMMi does not provide an approach to a change management and improvement process."
  IDEAL (SEI) "has also been proven to be very useful when implementing TMMi". Organizations "are free to choose
  any improvement approach"; all are based on Deming's PDCA. Communication with stakeholders "of utmost
  importance".
- **Table C.1 IDEAL phases (p. 151):** Initiating — "Establishing the initial improvement infrastructure for a
  successful improvement process"; Diagnosing — "Determining the organization's current state as opposed to what
  it wants to achieve"; Establishing — "Planning and specifying how the chosen situation will be established";
  Acting — "Executing the plan"; Learning — "Learning by experience and improving the abilities to implement
  changes."
- **I – Initiating (pp. 152–153):** Identify Stimulus for Change; Set Context; Build Sponsorship; Charter
  Infrastructure (project board with sponsor, improvement program manager, possibly external TMMi expert;
  improvement teams). Goals must align with business/quality goals; may not yet be SMART.
- **D – Diagnosing (p. 153):** Characterize Current and Desired States (formal or informal assessment; "uses the
  goals and practices as a checklist to determine the level of compliance with the process areas"); Develop
  Recommendations (which PA first, which part, how).
- **E – Establishing (p. 154):** Set Priorities; Develop Approach (training, coaching, process descriptions,
  tools; culture, resistance, urgency); Plan Actions (activities, schedule, milestones, decision points,
  resources, responsibilities, measurements, monitoring, risks, implementation strategy).
- **A – Acting (pp. 154–155):** Create Solution; Pilot/Test Solution ("If you don't know what you are doing,
  don't do it on a large scale" — Gilb); Refine Solution ("good enough"); Implement Solution (big bang / one
  project-team at a time / just in time). Developing the solution ≈30% of effort, implementing ≈70%.
- **L – Learning (p. 155):** Analyze and Validate (lessons learned); Propose Future Actions (to IT and business
  management).
- **Annex D (p. 156) — typical L1 practices of organizations "on their way", organized by L2 PA**, e.g., TPS:
  senior management defines test objectives, test levels identified but not thoroughly defined/aligned; TPL:
  project management sets approach, top-down estimates, project risks recorded, (Agile) DoD high-level and not
  measurable; TMC: progress by tests executed, quality by incidents; TDE: test cases without clear objectives and
  not traceable; TEV: representative production-like test data typically missing; IH: "Senior management decides
  that test improvement is important" and "Version control is performed on the test work products."

---

## 10. Inconsistencies noticed in the source (for accurate citation)
- TPS P2.2: summary "Distribute the test strategy to stakeholders" (p. 28) vs heading "Distribute the test
  strategy to the stakeholder" (p. 31).
- TDE P4.1: summary "Decide on disposition of test incidents" (p. 53) vs heading "Decide on disposition of
  incidents" (p. 58); P4.2 summary "action" vs heading "actions" (p. 59).
- IH P3.1: summary "Develop a configuration and change management process" (p. 67) vs heading "... system"
  (p. 70); IH G2 "Implement Infrastructure" (TOC/summary) vs "Implement infrastructure" (p. 68).
- Annex C/D page footers read "©2025" while the rest reads "©2026".
