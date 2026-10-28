# Rotaşa Assessment Desk: game design

## Pillars

1. **You are there.** The assessment happens inside Rotaşa's office, among the people from the case. Every document is an object on someone's desk; every interview is a conversation with a person who looks and talks like their notes.
2. **Every choice leaves a trace.** Decisions change what you can see, who will talk to you, what the CTO says, and what the office looks like six months later.
3. **Evidence over opinion.** The game never rewards guessing. Ratings are compared with what you actually collected; the CTO pushes back with statements, and you answer with documents.
4. **The case is the content.** Every fact in the game comes from the case pack, TMMi v2.0 or TAMAR R1.3. Invented material is limited to staging (the office, faces, the outage scene) and to the six-month consequences, and it never contradicts the case.
5. **Always playable.** Without WebGL, the same game runs through the dossier panels. Keyboard and screen-reader users get the same choices through the DOM.

## Clarity: nobody should get lost

A first-time player who has never heard of TMMi must always know three things: **where am I, what do I do now, and why does it matter.**

1. **Mentor voice.** A senior assessor mentor ("Selin", your firm's lead assessor, on the phone or as a narrator portrait; she is not part of the case and never supplies evidence) opens each chapter with at most three short sentences: the goal, how to do it, and one tip. She can be skipped, and recalled with the **?** button.
2. **One objective at a time.** The HUD always shows the current objective in plain words with a progress count, e.g. "Collect evidence · 4 of 10 · 2 h 10 min left". When the objective is done, the HUD says what to do next and the Continue control pulses.
3. **Show, don't hunt.** In the world, interactive things glow and bob, and an arrow points to the next suggested place when the player has been idle for a few seconds. Hover or focus shows a label with the cost ("Defect records · 35 min").
4. **Guided first minutes.** Chapter 1 is a short tutorial: walk to the CTO, make the first choice, lock it, see the stamp. Each first use of a mechanic (first document, first rating, first lock) shows a one-line tip once.
5. **Terms explained where they appear.** Words such as TMMi, process area, goal, N/P/L/F, informal assessment, and NR are underlined and open a two-line glossary tooltip. The glossary is also in How to play.
6. **No dead ends.** Every disabled button says why ("Not enough time left", "Lock all three decisions first"). Locked decisions show the expert comparison immediately, so the player learns as they go.
7. **Short text.** Dialogue lines stay under about 25 words. Long case documents open only on request, with the key line highlighted.
8. **Chapter summary.** The end of each chapter shows a one-line recap ("You collected 9 items. You skipped the release email.") before the next chapter card.

## Core loop

`Chapter card → world scene → interact (walk, talk, collect) → decision in dialogue or dossier → lock → expert comparison stamp → next chapter`

The **dossier** (the existing step panels) is the assessor's notebook. It slides over the world and holds the analytical work: rating, concluding, budgeting. The **world** carries the human work: talking, observing and presenting.

## Chapters

| # | Chapter | World | Interaction | Dossier |
|---|---|---|---|---|
| 0 | Night shift (briefing) | Street view: trucks, then the camera flies into the office window | Start, Continue | Case brief, TMMi in one minute |
| 1 | The opening call | CTO office; Murat at his desk, you in the visitor chair | Dialogue: Murat states the goal. Three decisions as dialogue choices (scope, assessment type), then a "whom to interview" board with people highlighted in the office | Full Plan panel (concepts, stakeholder matrix) one click away |
| 2 | A day at Rotaşa | Whole office, explore mode, clock on the wall ticking with your time budget | Click documents (glowing props) and booked people (others say "not booked"). Walk, collect, toast "added to bag". At the third item the alarm starts: red lights in the server room, people stressed, dialogue with Burak offering the three outage options | Compact evidence list (accessibility), Open dossier |
| 3 | The war room | Your desk in the war room, corkboard filling with collected evidence cards | — | Rating panel (21 goals, written reasoning) as before |
| 4 | Weakest link | War room, corkboard strings turning red at N goals | — | Conclude panel |
| 5 | The findings meeting | Meeting room; Murat at the head of the table, Kerem present if interviewed | Three objections as dialogue with Murat. Your reply is chosen in the dialogue; the written reply opens in the dossier | Report panel with the evidence charts |
| 6 | The plan | War room whiteboard with sticky notes per action | — | Improve panel (budget meters) |
| 7 | Six months later | Office again, mood `after-good` or `after-bad` depending on the decisions (approved policy framed on the wall, green build screen, masked-data badge, or red KVKK screen and sticky notes). People in new states | Walk-through: each consequence is pinned to a place in the office (a hotspot with a speech bubble), then the debrief | Reflect panel: route recap, path table, ratings matrix |

## How decisions show up in the world

| Decision | Visible effect |
|---|---|
| Scope = automation only | Step 2: the CI screen and code desk glow brighter, but in Step 7 the office looks as before |
| Assessment type = certificate | Step 5: Murat holds up a printed "certificate" request. Step 7: a customer email on his screen withdraws the claim |
| Interviews | Only booked people respond in Step 2. Kerem attends the Step 5 meeting only if you interviewed him |
| Evidence collected | Corkboard cards in Steps 3–4; documents you skipped stay dim in Step 7 |
| Outage response | Observing: you stand in the server room during the alarm; the observation card is pinned on the corkboard |
| Attribution | Step 7: named people sit apart with headphones on (bad), or the team chats openly (good) |
| Test data finding plus masked-data action | Step 7: DevOps screen shows "masked data" (good) or a red "KVKK incident" (bad) |
| First action = owner | Step 7: Deniz has a "Test process owner" desk plate and a plan board |

## Feel

- Evening light, warm lamps, cool city glow. The palette follows the tokens: player orange, expert teal, night navy.
- Motion is calm and purposeful: camera glides between views, people breathe, blink and type. One big moment per chapter: the chapter card, the alarm, the stamp, the Step 7 reveal.
- Sound is off by default. When turned on: a soft office hum, keyboard ticks, paper for evidence, a stamp thud for locked decisions and a two-tone alarm for the outage.
- Copy is plain and short. People talk like their interview notes.

## Accessibility and fallback

- Every hotspot has a focusable DOM button with a label; the dossier lists the same actions.
- Dialogue is keyboard-driven (Enter, 1–9, arrows, Esc) and screen-reader friendly.
- `prefers-reduced-motion`: no camera tweens, no walking, no idle loops; chapter cards fade.
- No WebGL: `world.isAvailable()` is false, `body[data-world="off"]`, and the dossier panels carry the whole game, as today.
