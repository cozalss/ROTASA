# SENG440 Lecture Notes: Research Extract (Weeks 1-2)

Source files:
- `week1.pdf`: "Test Management, Topic 1: Managing the Test Activities" (44 slides), Software Engineering Dept., Çankaya University
- `week2.pdf`: "Test Management, Topic 2: Risk-Based Testing" (40 slides), mapped to ISTQB CTAL-TM 1.3

References are `W1 p.N` / `W2 p.N`. PDF page numbers match the slide numbers.

> **Coverage warning (important for the TMMi game design).** Neither deck covers **TMMi, IDEAL,
> model-based vs analytical improvement, maturity levels, process areas or assessment methods**.
> Process improvement shows up only as one bullet in the course roadmap ("Improve the test process and
> pick effective tools", W1 p.2) and as the "evaluate the process ... suggest improvements" and
> "lessons learned" parts of Test Completion (W1 p.5, p.21-23). Any TMMi or IDEAL content in the game
> has to come from other sources, such as the TMMi Foundation material or later lectures, not from these two decks.
> What these decks do give is the **test-management vocabulary that TMMi process areas are built on**:
> test policy and strategy, test planning, monitoring and control, stakeholders, risk, and lessons learned.

---

## 1. Course framing

- **Three pillars of test management** (W1 p.2):
  1. *Managing the Test Activities* (Topic 1): plan, monitor, control and complete test activities; choose the test approach that fits the project; tailor testing to the project and product context; focus effort with risk-based testing; **improve the test process and pick effective tools**.
  2. *Managing the Product*: monitor progress and quality with test metrics; estimate test effort; manage defects in sequential, Agile and hybrid projects.
  3. *Managing the Team*: identify the skills the team needs; keep the team motivated with a whole-team approach; **build the business case for testing**.
- Week 2 is tied to ISTQB CTAL-TM learning objectives TM-1.3.1 to 1.3.6 (W2 p.2). Exam weighting is stated explicitly: **K4 (analyse) questions are scenario-based and usually worth 3 points; K2 (understand) questions are worth 1 point** (W2 p.2). TM-1.3.4 ("Select test activities that mitigate risks according to their risk level") is the K4 objective.
- The next syllabus item after Week 2 is "1.4 Project Test Strategy" (W2 p.40).

---

## 2. The test process (Week 1)

### 2.1 Seven activity groups (W1 p.3; based on ISTQB CTFL v4.0 §1.4.1)
Six activities move the work forward, and **monitoring and control runs alongside all of them**:

| # | Activity | Definition on slide |
|---|---|---|
| 1 | Planning | Define the test objectives and the approach to meet them |
| 2 | Analysis | Study the test basis and decide what to test |
| 3 | Design | Turn test conditions into test cases |
| 4 | Implementation | Prepare testware, test data and environment |
| 5 | Execution | Run tests, log results and report defects |
| 6 | Completion | Archive testware, report and capture lessons learned |
| - | Monitoring & Control | Continuously compare actual progress with the plan and take corrective action when they diverge |

- **"Logically sequential, practically iterative"** (W1 p.4): sequential models (Waterfall, V-model) do planning mostly up front. In Agile models (Scrum, Kanban), activities may overlap, combine, run concurrently or be omitted. **Takeaway: "whatever the lifecycle, the test plan is a living document that monitoring feedback keeps updating."**

### 2.2 Three test management activities (W1 p.5; ISO/IEC/IEEE 29119-2)
Of the seven groups, three are about *managing* testing rather than doing it:
- **Test Planning**: a test plan defines **Objectives** (what testing must achieve), **Approach** (techniques and test levels), **Scope** (what is in and what is out), **Resources** (people, tools, environments), **Schedule** (milestones and timelines), **Deliverables** (reports and testware) and **Stakeholders** (who needs what).
- **Test Monitoring & Control**: track progress and deviations against the plan; report status to stakeholders; correct course and re-plan when needed.
- **Test Completion**: archive the test artifacts; **evaluate the process and the product**; **suggest improvements**; close out.

---

## 3. Context and tailoring (W1 p.7-9)

- "Testing is context dependent, which is why tailoring is essential" (W1 p.7). "There is no one-size-fits-all test process" (W1 p.8).
- **Context factors** (W1 p.8): type of product (e.g. a mobile game vs. a medical device); industry (the regulations and standards that apply); SDLC method (sequential, iterative or hybrid); project constraints (time, budget, people, tools).
- **The test manager's role** (W1 p.8): apply established strategies and choose the right testing methods; keep the test plan aligned with the project's context. Why it matters: plans that hit the mark, and testing that meets its objectives "without wasting time or resources on unnecessary tasks".
- **Scope of management** (W1 p.9): **Project** (one application release), **Program** (multiple related applications), **Portfolio** (testing strategy for the organization's entire software ecosystem). "Each level supports the next. A project's test plan aligns with the program and portfolio plans above it."

---

## 4. Test documentation hierarchy (W1 p.10-11)

"Each document narrows the one above it: organization-wide intent becomes a project-specific plan." (W1 p.10)

| Document | Scope | Definition | Owner / detail | Key question |
|---|---|---|---|---|
| **Test Policy** | Entire organization | The organization's overarching vision and philosophy about testing | Senior management / QA leadership; high-level, strategic | "What's our testing philosophy?" |
| **Test Strategy** | Organization or program | How testing is performed across the organization or program to reach the policy's goals | QA leadership / program mgmt; high-level, actionable | "How do we make testing align with organizational goals?" |
| **Test Approach** | One project | The specific methods, test levels and techniques used to test one project | Test manager or test lead; mid-level | "How will we test this project to meet its objectives?" |
| **Test Plan** | One project | A detailed document stating exactly how testing for a single project will be executed | Test manager or lead; **stakeholders approve**; very detailed | "What exactly will we do, when, and with what resources?" |

**Running example: Smart Lock** (W1 p.11), from general and organization-wide to specific and one project:
- Policy: "We will prioritize user safety, data security and performance in all products."
- Strategy: "Unit testing will be automated using tool X for all projects." / "Risk-based testing will guide the prioritization of test cases."
- Approach: "Perform penetration testing to ensure the lock's encryption is secure." / "Conduct usability testing so users can easily set up the lock through the mobile app."
- Plan: Schedule (functional testing week 1, security week 2); Resources (4 testers, 2 automation tools); **Exit criteria** (all critical security issues resolved; 95% test case coverage).

---

## 5. Test planning (W1 p.12-14)

Section tagline: "Turning intent into an agreed, realistic plan." (W1 p.12)

**Test planning process** (W1 p.13; adapted from ISO/IEC/IEEE 29119-2). A plan answers three questions: which tools, how much time per activity, and who will be involved.
1. **Understand the context and organize test planning**: understand the organization, the scope of testing and the test item; organize the work needed to develop the plan, and get the schedule approved by stakeholders.
2. **Identify and analyze product risks**: assess their potential impact and likelihood.
3. **Identify risk treatment approaches**: select and document preventive, corrective or mitigating actions.
4. **Define the test approach and estimate resources**: derive the approach from regulations, project constraints and risk treatments; estimate and allocate staff, tools, environments and test data.
5. **Establish the test plan**: get the plan accepted by all stakeholders, and settle any disagreements between them.
- *Steps 2 and 3 are what make test planning risk-based.*

**Plans change, and scale matters** (W1 p.14):
- Quoted on the slide: **"You will change your plan."** Typical triggers: requirements evolve, new risks appear, monitoring reveals deviations.
- Detail: on small projects, test activities connect directly to the plan. On large projects, the plan must define exactly how many test cases, or which features, are required to meet strategic goals.

---

## 6. Monitoring and control (W1 p.15-19)

- Tagline: "Know where you are, and steer when you drift." (W1 p.15)
- **Test monitoring**: continuously compare actual progress, results and risks against the plan. **Test control**: take corrective action, fix deviations and guide testing so it stays aligned with the strategy (W1 p.16). Together they give clear measures and targets aligned with project goals, confidence in quality, and **an early signal** of whether you are on track (W1 p.16).
- **Four things to watch** (W1 p.17). "Monitoring is driven by questions. Ask them continuously, not only at milestones."
  - Collecting test results (passed, failed, blockers?)
  - Identifying deviations (behind schedule? coverage lower than planned?)
  - Analyzing risks (has a new risk appeared that needs testing?)
  - Tracking changes (have risks or priorities shifted? if so, update the plan)
- **Test control actions** (W1 p.18): implementing the test plan; managing changes (handling deviations); adjusting to new risks (re-prioritizing); checking test readiness (environment, data, tools); **deciding when testing is complete (confirm the agreed exit criteria have been met)**. "If completion criteria shift, or something isn't working, control adjusts the plan."
- **Report in your audience's language** (W1 p.19). Each question is paired with the *evidence to show*:
  - "Are we on track?": progress against plan and schedule; planned vs. executed tests.
  - "Are critical risks addressed?": test status of high-risk areas; open critical defects.
  - "Will the product meet their expectations?": requirement coverage; results against exit criteria.

---

## 7. Test completion (W1 p.20-23)

- Tagline: "Close testing so nothing valuable is lost." (W1 p.20)
- **Triggers**: a release is ready to ship, a sprint or iteration wraps up, or a specific test level is done. **Three goals**: take stock of what happened; save anything valuable for next time; reset everything for the next occasion (W1 p.21).
- **Five completion activities** (W1 p.22-23):
  1. **Create and approve the test completion report**: gather (plans, results, defects, progress reports), summarize (what went well, what didn't, whether goals were met), approve and share (stakeholders review and approve).
  2. **Perform and document lessons learned**: what went well, what could be improved next time, and key insights that could help the whole development process. **"Documented lessons make future testing better."**
  3. **Archive testware.** *If skipped:* wasted effort, because reusable assets weren't archived.
  4. **Hand over testware** (unresolved defects and known issues to the customer or support team; instructions for future testers). *If skipped:* miscommunication about unresolved issues.
  5. **Clean and reset the environment.** *If skipped:* delays, because leftover data or settings interfere with future tests.

---

## 8. Test stakeholders (W1 p.24-27)

- **Definition** (W1 p.24-25): "Everyone affected by testing, or by its outcome." / "Anyone affected by the project in any way, or interested in its outcome: the product."
- Groups (W1 p.25): developers and their teams; testers and test managers; PMs, product owners and business users (who specify requirements, set quality levels and recommend focus areas); the operations team; customers and users ("essential stakeholders").
- Test manager's job: "understand each stakeholder's direct or indirect interest in testing, then manage their needs and satisfy them all." (W1 p.25)
- **Stakeholder analysis, 3 steps** (W1 p.26): (1) list all stakeholders (interviews, asking questions, referrals); (2) understand their connection to testing (direct or indirect interest? what do they need from the test team?); (3) engage with the matrix (decide who to involve and how; reflect their interests in the test strategy and plan). Why it pays off: **expertise**, **early warning** (stakeholders help spot risks before they become problems), and **diverse perspectives** (each stakeholder brings a unique view of quality).
- **Stakeholder Matrix (Influence × Interest)** (W1 p.27):

| Quadrant | Name | Strategy | Description |
|---|---|---|---|
| High influence, high interest | **Promoters** | Manage closely | Key stakeholders who shape the test strategy and plan, e.g. QA leads, product owners, senior managers |
| High influence, low interest | **Latents** | Keep satisfied | Don't care about every detail, but their approval is crucial (like road closures or permits) |
| Low influence, high interest | **Defenders** | Keep informed | May not make big decisions, but are highly invested and give useful feedback |
| Low influence, low interest | **Apathetics** | Monitor | Communicate only when necessary, e.g. updates at key milestones |

  Exercise (W1 p.27): place the security certification body, the mobile app team, end users and the customer support team for the smart lock, then decide how to keep each one engaged.

---

## 9. Lifecycle models (W1 p.28-34)

- **Sequential vs. iterative** (W1 p.29-30):

| Aspect | Sequential (e.g. V-model) | Iterative (e.g. Scrum) |
|---|---|---|
| Estimation | Per phase | Sprint by sprint |
| Testware | Exhaustive documentation | Less emphasis on detailed documentation |
| Roles | Test manager oversees planning, execution, reporting | Planning, daily discussions, retrospectives |
| Tools | A tool for every planned task | CI/CD pipelines and automation |
| Testing approach | Unit testing follows coding, then integration | Concurrent with development |
| Test automation | Strategic, at various stages | Baked into the sprint plan |
| Monitoring and reporting | Milestone-based | Continuous: dashboards, daily status |
| Metrics | Test execution, defect rates | Adds velocity and burndown |
| Collaboration | Testers may not touch the product until developers finish | Daily dev-tester collaboration |
| Adaptability | Change is hard and costly | Follows evolving priorities |

- **Hybrid model** (W1 p.31-32): combines structured planning (predictability, documentation) with Agile execution (speed, iterative delivery). It is "fit for purpose" and can serve as **a transition to Agile** ("Agile brings a different culture, workflow and team dynamics; a hybrid keeps some traditional structure while gradually adopting Agile practices"). Benefits listed: satisfy stakeholder needs; better risk management ("structure where risk is high, speed where it is low"); handle complex projects (Scrum for development, Kanban for maintenance); support legacy systems; scalability. Discussion prompt: which benefit matters most for **a bank modernizing its legacy core-banking system**?
- **Managing testing in hybrid models** (W1 p.33): **assess readiness** (how well the team can move between traditional and Agile methods); adjust roles; blend processes; strengthen collaboration; coordinate across teams; track and review.
- **Scrum of Scrums** (W1 p.34): each team sends a representative, and representatives coordinate dependencies, integration and shared risks. For testers, it aligns test environments, test data and cross-team test activities.

---

## 10. Test levels and test types (W1 p.35-42)

- **Test levels** (W1 p.36-38): Component (define scope and objectives; support code reviews and unit testing); Component integration (choose what to integrate and test together); System (end-to-end; juggle resources, tools and schedules); System integration (risk-based scope; keep external interfaces aligned); Acceptance (plan with stakeholders; coordinate at the customer's site). "Each level can have its own test plan, aligned with the higher-level test plan."
- **Four test types** (W1 p.40): *what is tested* (functional, non-functional) and *how it is tested* (black-box, white-box). Non-functional work includes deciding performance benchmarks ("what counts as good enough") and compliance (security, usability, reliability).
- **Risk reshapes the plan** (W1 p.41): risk assessment, then test monitoring (change priorities), then test control (change the process on the fly). Analogy: "Like checking the weather forecast before and during a road trip."
- **Worked example: a release under pressure** (W1 p.42). Planning sets risk-based priorities. Monitoring finds a critical issue and fixes it immediately, even if that delays low-priority tests. Control approves the release: verify critical features, then **hold a meeting with stakeholders to review test results and get their sign-off**.
- **Week 1 key takeaways** (W1 p.43): (1) seven activity groups, one process; (2) context drives the approach; (3) plans are living documents; (4) completion preserves value; (5) stakeholders need targeted engagement; (6) risk guides priorities.
- **Discussion questions** (W1 p.44): which test activity group did you skip or merge in your last project, and what did it cost? Who would be the promoters and latents in your semester project? Where would a hybrid model help or hurt?

---

## 11. Risk-based testing (Week 2)

### 11.1 The dilemma (W2 p.3)
"Exhaustive testing is impossible": a practically infinite set of test conditions against a limited number of tests, people and days. Three decisions follow: **Selection** (which conditions to cover), **Allocation** (how much effort each deserves) and **Prioritization** (in which order). **Takeaway: "Risk management turns 'which tests?' into a deliberate, defensible decision."**

### 11.2 Definitions (W2 p.5-6)
- **Risk**: "the possibility of a negative or undesirable outcome or event" (ISTQB). Unlike PMI, ISTQB does not count positive risks (opportunities).
- **Risk vs. Issue**: a risk has not happened yet; it can be anticipated and planned for, and is "handled calmly, before the pressure". An issue has already happened; it must be dealt with and is "handled under pressure: **fire-fighting**".
- **Product (quality) risk** affects product quality (function, performance, security, UX) and lives as long as users use the product. **Project (planning) risk** affects schedule, budget and resources and ends when the project delivers. **Takeaway: "Risk-based testing targets product risks; testing cannot mitigate project risks."**

### 11.3 Proactive mindset (W2 p.7)
Scenario: a key team member (Scott) might resign. *Reactive*: do nothing, then fire-fight. *Proactive*: **Eliminate** (don't put him on the team), **Mitigate** (talk to him, or pair a reviewer), **Contingency plan** (budget a two-week handover). Quoted on the slide: **"Communication skills make a good manager; risk management makes a super one."**

### 11.4 Risk management process (W2 p.8)
- **Risk analysis**: (1) risk identification (collect risks from stakeholders and other sources), (2) risk assessment (rate likelihood and impact; categorize; prioritize).
- **Risk control**: (3) risk mitigation (reduce likelihood or impact; "testing is the key tool"), (4) risk monitoring (are risks getting worse? are new ones emerging?).
- **"Risk management is iterative: monitoring feeds new risks back into analysis."**
- "The captain steers by the risk map" (W2 p.9). Risk informs planning (where the storms are), analysis (choose important conditions), and execution ("fix the broken rudder before painting the hull"). **"The captain does not sail alone: the test team and other stakeholders all help mitigate risk."**

### 11.5 Identifying quality risks (W2 p.10-14)
- **Seven techniques** (W2 p.11): expert interviews (prepare questions in advance), independent assessments ("a second pair of eyes challenges assumptions"), retrospectives, risk workshops (planned agenda, all roles in one room), brainstorming (no judgement; facilitator), **checklists ("questions built up over years; a 'no' is a risk")**, past experience. "Mix and match techniques to fit the project's circumstances."
- **Workshop vs. brainstorming vs. checklist** (W2 p.12):

| | Risk workshop | Brainstorming | Checklist |
|---|---|---|---|
| Structure | Planned agenda, specific goals | Free-flowing, no judgement | Fixed list of questions |
| Output | Risk list by likelihood and impact | As many ideas as possible | Yes/No; every "no" is a risk |
| Best when | Many roles must agree | You want creative ideas | **Quick coverage of common risks** |

  Exam practice: a shared spreadsheet of components and failure modes that architects and operations fill in is a **risk workshop**.
- **"The more diverse the room, the more risks you find"** (W2 p.13). Involve developers, testers, business stakeholders, end users, and domain experts or external consultants. Use the kick-off meeting to confirm the stakeholder list is complete, check whether key stakeholders are missing, and have anyone who cannot attend **delegate a qualified person**. **Takeaway: "Ignore a key stakeholder and their knowledge is never captured; critical risks go unnoticed."**
- **Risks cluster, and identification pays twice** (W2 p.14): risk is unevenly distributed (like defect clustering). Identification also produces by-products: questions, issues in reference documents, and project risks. Identification never stops ("Clear skies at the start of a hike do not rule out a storm later"). **"The test manager brings by-products to the right people: quality is everyone's responsibility."**

### 11.6 Assessing quality risks (W2 p.16-20)
- **Risk level = Likelihood × Impact** (W2 p.1, p.16). Worked examples on a 1-5 scale: payment fails in a well-tested checkout (L=2 × I=5 = 10, HIGH); wrong colour on a poorly tested button (L=3 × I=1 = 3, LOW). Assessment also records each risk's type and the quality characteristic it affects.
- **Risk matrix** (W2 p.17): 5×5 Likelihood × Impact grid. A = checkout fails under heavy traffic (top priority); B = security hole in a rarely used feature (still addressed, after the critical issues); C = typos (lower priority). The matrix simplifies analysis, gives fast initial prioritization, and **aligns stakeholders on what matters**.
- **Qualitative vs. quantitative** (W2 p.18). Qualitative: very high to very low, or 1-5; quick. Quantitative: likelihood as a precise %, impact in money; "evidence-based, mathematically precise", but needs statistically valid data and much effort. *In practice*: start qualitatively, then quantify only where needed (e.g. the top 10 risks). **Watch out: "misused numbers mislead stakeholders about how well the risk is really understood and managed."**
- **What drives the ratings** (W2 p.19):
  - *Likelihood rises with*: complex technology; **low organizational maturity**; personnel issues; supplier contract problems; distributed teams; weak managerial or technical leadership; time, budget and management pressure; **lack of early quality assurance**; high change rates.
  - *Impact rises with*: frequency of use; criticality of the feature or business goal; reputation or revenue loss; financial, ecological or social losses and liability; legal sanctions; interface and integration issues; no reasonable workarounds; safety needs.
- **Pitfalls** (W2 p.20):
  - **Diverging views**: PMs, programmers, users, analysts, architects and testers perceive risk differently. Reach **consensus**, or at worst agree a level by management decision or by the mean, median or mode of the ratings.
  - **Under-rating**: "Don't worry, that will never happen." Subjective opinions understate likelihood or impact, and the rating distribution becomes skewed and less useful.
  - **Lens to add, categorize to see trends**: many performance risks suggests investing in a performance consultant; many functional risks suggests investing in test design.

### 11.7 Mitigating risk through testing (W2 p.21-27)
- **Response options** (W2 p.22): **mitigate via testing** (reduces likelihood or impact; "no defects found? the product's risk is lower than expected"), **contingency plan**, **risk transfer** (e.g. a third-party payment vendor), **risk acceptance** (e.g. a rare typo), **risk avoidance*** (defer the feature; *not in the syllabus*). **Takeaway: "Mitigation starts early: requirements reviews lower risk before any test runs."**
- **Proportionality** (W2 p.23). High risk means: earlier testing; rigorous techniques (boundary value analysis, stress testing); more effort and the most skilled testers; multiple work-product reviews; an independent test team; extensive regression. Low risk means: deferred testing, exploratory testing, less effort, lighter reviews, lower independence, lighter regression. Quoted on the slide: "You would not spend the effort testing a small UI tweak that you spend on payment processing."
- **Six tailoring factors** (W2 p.24): test items; quality characteristics; test levels and types; SDLC; team skills; regulations (e.g. **IEC 61508** prescribes techniques and coverage by integrity level). **"Balance is key: over-test and you waste resources; under-test and you risk missing critical defects."**
- **Depth-first vs. breadth-first** (W2 p.25): depth-first when the highest risks must go first; breadth-first when stakeholders want progress everywhere. "In practice: start depth-first; switch to breadth-first as the deadline nears."
- **Residual risk** (W2 p.26) is what remains after testing and other mitigation; stakeholders accept it or mitigate further. **Report progress as residual risk.** *Not this:* "50 test cases passed and 5 failed." *But this:* "High-priority payment risks are mitigated. Remaining risks are minor UI glitches that do not affect functionality." Adjust at milestones: a component with far more defects than expected gets a higher likelihood rating and more testing.
- **Exam practice, K4** (W2 p.27):
  - Case 1: the highest-exposure business risk gets a prototype test with business stakeholders; a documentation-understandability risk gets reviews; **project risks (late environment, test manager short of time) cannot be mitigated by any test**. The trap is choosing reviews or white-box tests for them.
  - Case 2: Agile banking. Correct: more rigour and the most qualified testers on the riskiest features. Wrong: random tester assignment, or skipping low-risk features entirely.

### 11.8 RBT techniques and formality (W2 p.28-34)
- **Formality spectrum** (W2 p.29):
  - *Informal*: no documentation; one tester; subjective; over-focus on likelihood; "rarely achieves the full benefit".
  - *Lightweight*: formal but quick; a small group; ordinal L/M/H scale; fits Agile and time-pressed work.
  - *Heavyweight*: defined procedures; broad stakeholder groups; detailed factors and formulas; fits safety-critical work (aviation, healthcare).
- **Heavyweight techniques** (W2 p.30-33): hazard analysis (looks upstream at the conditions behind risks; "one hazard, many risks", "like tracing a river's pollution upstream"); **cost of exposure** (worked example on W2 p.32: exposure = likelihood × cost of loss + cost of testing = 0.5 × $10,000 + $1,500 = $6,500; "expected loss without testing ($5,000) exceeds the $1,500 test cost, so testing pays off"); FMEA (bottom-up; severity, likelihood and detection ratings); QFD (weights risks by their effect on customer goals); FTA (top-down, from failure back to root causes). "Structured and expert-driven: time-consuming, but worth it when stakes are high."
- **Lightweight techniques** (W2 p.34): **SST** (Systematic Software Testing; needs clear written requirements), **PRAM** (Pragmatic Risk Analysis and Management; stakeholder input, fits unclear requirements and Agile), **PRISMA** (Product Risk Management; structured identification and prioritization). **Combine by risk and timing**: e.g. FMEA for payments and PRAM for low-risk displays; lightweight techniques early, heavyweight near release.

### 11.9 Measuring success and challenges (W2 p.35-39)
- **Five success questions from the syllabus** (W2 p.36):
  1. Stakeholder involvement: were the right people involved, and did their input really help?
  2. Critical escapes handled: did critical defects escape, and were they addressed in time?
  3. Defects found early: were high-risk defects caught early, when fixing them is cheaper?
  4. Results explained as risk: can the team say "high risk for transaction processing" instead of "test case X failed"?
  5. Skipped tests = lower risk: were the skipped tests the lower-risk ones?
- **RBT metrics "cockpit"** (W2 p.37; derived in the lecture, not in the syllabus): risk coverage; defects in high-risk areas; residual risk; defect detection rate (testing vs. production; validates the analysis); test case efficiency; time to critical issue; cost vs. risk reduction; stakeholder satisfaction; risk reduction over time; likelihood accuracy (predicted vs. actual). **Takeaway: "'If you can't measure it, you can't improve it', but mind what each metric drives."**
- **Five roadblocks and remedies** (W2 p.38):

| Challenge | Remedy |
|---|---|
| Difficulty assessing risk level ("like forecasting the weather a month ahead") | Historical project data; consult key stakeholders with domain knowledge; probability-impact matrices |
| **Initial enthusiasm vs. long-term focus** (deadlines push risk analysis aside) | Monitor and report risks regularly; keep stakeholders updated |
| **Déjà vu** ("We've seen this before, it's not a big deal") | Fresh perspectives and new team members; re-review whether old risks still apply |
| Overlooked key risks (wrong people, missing expertise) | Involve developers, user-behaviour experts, external consultants; train the team |
| Stakeholder loss (people leave, get promoted or join late) | Keep risk analysis continuous and iterative; maintain a **living risk list** |

- **Exam practice, K2** (W2 p.39):
  - *Cloud migration outage*: the vendor called an outage "very unlikely", so reliability testing was skipped and the site went down. Correct improvement: **involve additional stakeholders, especially independent cloud architects, to assess likelihood realistically**. Rationale given: "Vendors tend to overstate reliability"; "run intensive tests anyway" breaks proportionality; "only experienced testers" is too narrow.
  - *Most problematic RBT situation*: **starting with risk-based planning but neglecting risk control under project pressure** ("initial enthusiasm vs long-term focus"). Many contributors help; reuse is not required; "accepting known residual risk is the point of the method."
- **Week 2 key takeaways** (W2 p.40): (1) testing mitigates product risks, not project risks; (2) identify with many techniques and diverse stakeholders; (3) risk level = likelihood × impact; (4) effort, techniques, reviews and regression scale with risk; (5) choose light or heavy techniques by risk, and report residual risk.

---

## 12. What the lecturer appears to value (signals for an assessment simulation)

These are inferences from recurring slide emphasis. They are not explicit grading rubrics.

1. **Evidence over assertion.** Reporting pairs every question with "evidence to show" (W1 p.19). Quantitative assessment is described as "evidence-based" (W2 p.18). The defect detection rate "validates the analysis" (W2 p.37). Likelihood accuracy compares predicted against actual (W2 p.37).
2. **Don't be fooled by numbers or by authority.** "Misused numbers mislead stakeholders" (W2 p.18). "Mind what each metric drives" (W2 p.37). "Vendors tend to overstate reliability" (W2 p.39). Under-rating ("that will never happen") is a named pitfall (W2 p.20). The independent assessment's role is that "a second pair of eyes challenges assumptions" (W2 p.11).
3. **Checklists are useful but limited.** A checklist is the right choice for *quick coverage of common risks*, while workshops are needed when many roles must agree (W2 p.12). The lecturer stresses *mixing* techniques to fit the circumstances (W2 p.11) and warns against déjà-vu complacency (W2 p.38). The informal approach "rarely achieves the full benefit" (W2 p.29).
4. **Stakeholder commitment and diversity.** Plans are "accepted by all stakeholders" (W1 p.13); release needs stakeholder "sign-off" (W1 p.42); completion reports need stakeholder approval (W1 p.22). "The more diverse the room, the more risks you find" (W2 p.13). Missing stakeholders mean missed risks (W2 p.13). Stakeholder involvement is success question #1 (W2 p.36).
5. **Context and tailoring over one-size-fits-all** (W1 p.8; W2 p.24). Over-testing and under-testing are both failures, and proportionality matters (W2 p.23-24).
6. **Sustained discipline, not a one-off.** "You will change your plan" (W1 p.14); the plan is a living document (W1 p.4); risk management is iterative (W2 p.8); and the *most problematic* failure is neglecting risk control under pressure (W2 p.39).
7. **Proactive rather than reactive (fire-fighting)** (W2 p.5, p.7).
8. **Organizational learning and continuity.** Lessons learned "make future testing better" (W1 p.22). Skipping archive or hand-over has stated costs (W1 p.23). Low organizational maturity and lack of early QA raise likelihood (W2 p.19), the closest the decks come to a maturity concept.
9. **Communicate in the business's language.** Report as residual risk, not test counts (W2 p.26, p.36), and report in the audience's language (W1 p.19).
10. **Scenario-based judgement is what scores.** K4 scenario questions are worth 3 points against 1 for K2 (W2 p.2). Exam practice slides teach students to spot "traps" (W2 p.27) and to "spot the real problem" (W2 p.39).

---

## 13. Candidate glossary for in-game "concept" boxes (lecture-sourced only)

| Term | Lecture definition / gist | Ref |
|---|---|---|
| Test Policy | Organization's overarching vision and philosophy about testing; owned by senior management / QA leadership | W1 p.10 |
| Test Strategy | How testing is performed across organization or program to reach the policy's goals | W1 p.10 |
| Test Approach | Specific methods, levels and techniques for one project | W1 p.10 |
| Test Plan | Detailed document stating exactly how testing for one project will be executed; stakeholders approve | W1 p.10, p.13 |
| Exit criteria | Agreed conditions that decide when testing is complete | W1 p.11, p.18 |
| Monitoring vs. Control | Compare actual against plan, vs. take corrective action | W1 p.16 |
| Living document | The plan is updated by monitoring feedback | W1 p.4, p.14 |
| Test completion report | Gather, summarize, approve and share | W1 p.22 |
| Lessons learned | What went well, what to improve, insights for the whole process | W1 p.22 |
| Stakeholder matrix | Influence × Interest: Promoters, Latents, Defenders, Apathetics | W1 p.27 |
| Project / Program / Portfolio | Three scopes of test management; each level supports the next | W1 p.9 |
| Hybrid model / readiness | A transition to Agile; assess the team's readiness to move between methods | W1 p.31, p.33 |
| Risk / Issue | A possibility vs. something that has already happened (fire-fighting) | W2 p.5 |
| Product vs. project risk | Testing mitigates only product risk | W2 p.6 |
| Risk level | Likelihood × Impact | W2 p.16 |
| Residual risk | What remains after mitigation; accept or mitigate further | W2 p.26 |
| Proportionality | Effort, rigour, reviews, independence and regression scale with risk | W2 p.23 |
| Informal / lightweight / heavyweight | The formality spectrum of RBT | W2 p.29 |
| Independent assessment | A second pair of eyes challenges assumptions | W2 p.11 |
| Initial enthusiasm vs. long-term focus | Starting well, then neglecting control under pressure | W2 p.38-39 |
| Déjà vu | "We've seen this before": complacency | W2 p.38 |
| Organizational maturity | Low maturity raises failure likelihood | W2 p.19 |

**Not in these lectures (source elsewhere):** TMMi, TMMi maturity levels, process areas, specific and generic goals and practices, IDEAL (Initiating, Diagnosing, Establishing, Acting, Learning), model-based vs. analytical improvement, TMMi assessment and rating scales (e.g. N/P/L/F), and TPI NEXT.
