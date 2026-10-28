# Rotaşa Assessment Desk — Decision Map and Expert Path (D1)

SENG440 course project · TMMi Framework v2.0 · TAMAR R1.3 · Case: Rotaşa Technology Inc.

The player is the external assessor. They run an **informal** TMMi assessment of the RotaPlan test process and then write a prioritized improvement plan. All seven required steps are played in order. A process map (a delivery route with seven stops) shows where the player is.

## Requirement checklist

| Course requirement | Where it is met |
|---|---|
| All seven steps with a process map | Route-style process map in the top bar, steps 1–7 |
| At least 8 decisions | 14 decision points (D1–D14 below) |
| At least 3 decisions change later steps | D1, D2, D3, D4, D5, D12, D13 (see "Effect on later steps") |
| Limited time for evidence | Step 2: 5 h 40 min (340 min) on site; with two interviews booked, everything on offer costs 8 h 5 min (485 min: eight documents 245, two 30-minute interviews 60, three time sinks 180), before the outage choice |
| Written reasoning at least twice, then the expert's answer | D7 (TMC G3), D8 (TDE G1), D10 (automation reply); optional note at D9 |
| Final screen with player path vs expert path | Step 7: consequences, path table with "why it matters", 21-goal rating matrix |
| Real decisions, not only multiple choice | Time-budgeted evidence requests, 21 goal ratings, written justifications, budgeted action portfolio, live CTO objections |
| Digital, opens from a link | Static web page (no install); Three.js/GSAP visuals degrade gracefully |

## Decision map

| # | Step | Decision | Options | Expert choice | Effect on later steps |
|---|---|---|---|---|---|
| D1 | 1 Plan | Assessment scope | Automation only · all six Level 2 PAs · Level 2 + Level 3 | All six Level 2 PAs, three teams | Automation only → every PA is NR in Step 4 (TAMAR: excluded PA = NR, NR propagates to ML). Level 2+3 → 60 min less on site in Step 2. |
| D2 | 1 Plan | What the assessment will produce | Promise a level/certificate · informal findings + plan · formal assessment now | Informal findings + plan | Certificate → the CTO demands it in Step 5 and the claim backfires in Step 7. |
| D3 | 1 Plan | Interview plan (2 slots out of 5 people) | Deniz, Kerem, Ece, Burak, Onur | Deniz (QA lead) + Kerem (PO) | Only booked people can be interviewed in Step 2. No PO → no commitment evidence, worse Step 7 outcome. |
| D4 | 2 Collect | Which evidence to request within the time budget | 8 documents, booked interviews, 3 time sinks | A, B, C, D, E, F, G, J + H2, H4 (325 of 340 min with the observation) | Only collected evidence appears in Step 3. E unlocks the data argument in Step 5. F/H5 decides whether the test-data finding exists. |
| D5 | 2 Collect | Staging outage during the visit | Observe (20 min) · wait (50 min) · ignore | Observe | Observation becomes evidence for TEV G3 and IH G3. |
| D6 | 3 Assess | Rate all 21 Level 2 goals (N/P/L/F/?) | Rating per goal | See expert ratings below | PA and ML ratings in Step 4 are computed from these. |
| D7 | 3 Assess | TMC G3 rating + written justification | Rating + text | N | Compared with the expert's written answer. |
| D8 | 3 Assess | TDE G1 rating + written justification | Rating + text | P | Compared with the expert's written answer. |
| D9 | 4 Conclude | What the report says about the level | "Close to L2" · "Level 1" · "Indicative Level 1, not a formal rating" · "No conclusion" | Indicative Level 1 | Flagged if it contradicts the player's own ratings. |
| D10 | 5 Report | CTO: "Put 300 of 400 hours into automation" | Agree · show Rotaşa's own metrics (Document E) · argue the principle (+ written reply) | Show the metrics (needs E) | Drives the automation consequence in Step 7. |
| D11 | 5 Report | CTO: "Who said it? I want names." | Give names · decline (non-attribution) · hint | Decline | Names → staff stop talking openly in the six-month check. |
| D12 | 5 Report | CTO: "Take the production-data copy out of the report" | Keep under TEV · tell DevOps verbally · drop | Keep | Step 7: funding masked data (D13) closes the KVKK exposure; without it the unmasked copy stays. Keeping the finding in writing is what explains the spend. |
| D13 | 6 Improve | Action portfolio (400 h, TRY 150,000) | 15 actions from Document I | 11 actions, 362 h, TRY 50,000 | Each chosen/omitted action produces a six-month consequence. |
| D14 | 6 Improve | Which action starts first | Any chosen action | Appoint a test process owner | Without an early owner the plan stalls. |

## Expert ratings (21 goals) and the evidence behind them

Rating scale (TAMAR p.14): N 0–15 %, P >15–50 %, L >50–85 %, F >85–100 % practice achievement; the percentages apply to practices only. In an informal assessment these ratings stay in the assessor's working notes; the sponsor receives strengths and weaknesses (TAMAR §3.5.2.7). A PA is only as strong as its weakest goal (TAMAR §3.4.3.4). A maturity level is achieved when every PA in scope is L or F (TAMAR §3.4.3.5).

| PA | Goal | Expert | Also defensible | Key evidence |
|---|---|---|---|---|
| TPS | G1 Establish a Test Policy | P | N | A1 draft, approval empty, 3 views/6 months; G: rule ignored for 4.1 |
| TPS | G2 Establish a Test Strategy | P | — | A2 levels and who performs each named, no entry/exit, no risk basis, never approved; A1 "responsibility of the QA team" |
| TPS | G3 Establish Test Performance Indicators | N | P | A: none defined; E: measures without targets |
| TPL | G1 Perform a Product Risk Assessment | N | P | B: one line "High-risk area: routing engine"; H2 cannot schedule risk meeting |
| TPL | G2 Establish a Test Approach | P | — | B: generic approach, thin entry/exit criteria |
| TPL | G3 Establish Test Estimates | N | — | B: "The QA team (4 people) is sufficient" |
| TPL | G4 Develop a Test Plan | P | — (L would need no practice at N; P4.3 and P4.4 have no evidence, TAMAR §3.4.2.4) | B: plan exists, no stakeholder involvement or project risks |
| TPL | G5 Obtain Commitment to the Test Plan | N | — | B: only QA lead signed, PO and CTO rows blank; H4 PO does not read it; H1 "counts as approved" has no record |
| TMC | G1 Monitor Test Progress | P | N | E: private hand-made sheet; G: free-text email on release day |
| TMC | G2 Monitor Product Quality | P | N | G: policy rule "no release with an open critical defect" not met, released anyway; E: production defects (3, 4, 4, 4, 3, 8) collected but never compared with a target |
| TMC | G3 Manage Corrective Actions to Closure | N | — | G: "finish after release" never tracked; D: root cause empty; H2 nothing changed |
| TDE | G1 Perform Test Analysis and Design | P | — | C: no midnight case, vague expected results, 2 of 8 without story link, fix covered by one unit test only; H2 BVA only by Deniz |
| TDE | G2 Perform Test Implementation | P | L | C: cases implemented, several without a testable expected result; J: test data scripts on a laptop |
| TDE | G3 Perform Test Execution | P | — | G: 73 % regression; E: not-run reasons absent; F: reruns hide failures |
| TDE | G4 Manage Test Incidents to Closure | P | — | D: no severity definitions, 7/19 "cannot reproduce", reopened twice |
| TEV | G1 Develop Test Environment Requirements | N | — | F: no requirements; iOS 17 only; no time zones |
| TEV | G2 Perform Test Environment Implementation | P | — | F: staging auto-deployed, built without requirements; unmasked production data (TEV P2.2 asks to anonymize or mask) |
| TEV | G3 Manage and Control Test Environments | N | P | F: "staging is mine", 9 outages; observation during the visit |
| IH | G1 Establish Governance | P | N | J: no owner/authority; H1: directive + 400 h budget since 4.1 |
| IH | G2 Implement Infrastructure | P | N | J: tools exist, no templates/onboarding/training |
| IH | G3 Manage Configurations | P | — | J: tests versioned; plan, staging settings, data scripts not |

**Process area ratings (weakest goal):** TPS N · TPL N · TMC N · TDE P · TEV N · IH P → **Level 2 not achieved; indicative Level 1.** Because the assessment is informal, the report states findings and this indicative view, not a formal rating (TAMAR §1.3.1.1.2).

## Expert path in one paragraph

Scope all six Level 2 process areas across the three teams; agree an informal assessment that produces findings, not a certificate; book the QA lead and the product owner; collect all eight documents plus both interviews and watch the staging outage; rate 21 goals from evidence, never from the CTO's statements alone; conclude "indicative Level 1, not a formal rating"; answer the automation push with Rotaşa's own metrics (Document E); refuse to name interviewees; keep the test-data finding; spend 362 of 400 hours on governance and the weakest Level 2 goals, starting with a test process owner.

## Sources

- TMMi Framework v2.0 (June 2026): Level 2 process areas and goals pp. 26–71; skipping a level "usually counter-productive" p. 16; "every organization is at least at TMMi level 1" p. 17; entry criteria "also called definition-of-ready" TPL P2.3 p. 37; IDEAL §1.6.1.
- TAMAR R1.3: informal vs formal §1.3.1.1.2, §2.2.4; evidence types §2.1.2; confidentiality and non-attribution §3.3.1.1.1–2; rating thresholds p. 14; PA and ML rating §3.4.3.4–3.4.3.5; NR §3.4.2.7; informal output gives findings, not ratings §3.5.2.7.
- Rotaşa case pack: Documents A–J, interview notes H1–H6.
