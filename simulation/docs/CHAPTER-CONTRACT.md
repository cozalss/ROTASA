# Chapter controller contract (integration wave)

The game is driven by `js/game/director.js` (agent I1). Each chapter (= step 0–7) has a
controller module `js/game/chapters/chNN.js` that stages the 3D world and the game UI for that step.
The **state model does not change**: chapter controllers write the same state keys the dossier
screens write (for example `state.plan.scopeLocked`), so the dossier screens (`js/ui/screens/*`)
remain the source of truth and show the same decisions.

## Chapter module

```js
export const meta = { step, title, subtitle, objective(state) -> { text, done, total } }
export function enter(ctx)          // called once when the chapter becomes active
export function update(state, ctx)  // called after every state change while active (cheap and idempotent)
export function exit(ctx)           // called when leaving: close dialogues, clear hotspots, stop timers
```

## ctx (built by the director)

```js
{
  store,                          // { get, update(fn, opts), subscribe }
  world,                          // getWorld() — may be unavailable: check world.isAvailable()
  go(step),                       // goes to a step (the director plays the chapter card and summary)
  dossier: { open(), close(), isOpen() },   // shows #stage (the step screen) as a sheet over the world
  dialogue: openDialogue,         // js/game/dialogue.js
  toast, audio,                   // js/game/toast.js, js/game/audio.js
  mentor(chapterStep, { force }), // js/game/mentor.js (agent I2): Selin's 1–3 line brief for the chapter
  tip(id, text),                  // one-time tip (shown once per save; js/game/mentor.js)
  openDoc(id),                    // existing document viewer
  pointTo(anchor | null),         // idle pointer arrow over a world anchor (director)
}
```

## World usage per chapter

| Ch | Mode | Mood | View | Hotspots | Owner |
|---|---|---|---|---|---|
| 0 | backdrop → explore | evening | street → overview | — | I1 |
| 1 | explore | evening | cto-office | Murat (talk), dossier | I1 |
| 2 | explore | evening → outage at the 3rd item | overview | documents at anchors, booked people, time sinks, Burak at the outage | I1 |
| 3 | backdrop | evening | war-room | — | I2 |
| 4 | backdrop | evening | war-room | — | I2 |
| 5 | explore | evening | meeting-room | Murat (objections), Kerem present if interviewed | I2 |
| 6 | backdrop | evening | war-room | — | I2 |
| 7 | explore | after-good / after-bad | overview | one hotspot per consequence (speech bubble), then the dossier | I2 |

Evidence → anchor map (from GAME-CONTRACT.md): A wiki-terminal, B plan-folder, C test-tool,
D jira-board, E metrics-board, F pipeline-screen, G mail-terminal, J hr-cabinet,
T1 code-desk, T2 staging-console, T3 cto-office, H2 qa-desk (Deniz), H4 po-desk (Kerem),
H3 routing-desk (Ece), H5 devops-corner (Burak), H6 field-desk (Onur), OBS server-room.

## Rules

- Clarity rules in GAME-DESIGN.md "Clarity" are mandatory.
- Everything a chapter offers in the world is also reachable in the dossier (keyboard and no-WebGL users).
- Dialogue lines for case people use their case-pack words (evidence.js `body.qa`). Selin (the mentor) never supplies evidence.
- No `innerHTML`, no `console.log`; small functions; files < 400 lines.
