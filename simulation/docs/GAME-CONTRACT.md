# Game layer contract (v1)

The simulation becomes a game: a 3D isometric Rotaşa office ("the world") with
procedural people, plus a DOM game UI (dialogue, HUD, chapter cards, audio).
The existing step screens stay as the "dossier": the analytical panels.
Content (js/data, js/logic) does not change.

Everything here must degrade gracefully. Without THREE or WebGL, `world` calls
are no-ops and the game is fully playable through the DOM UI.
Respect `prefers-reduced-motion`: no camera tweens, no walking animation (teleport), no idle loops.

## Page structure

```html
<div id="world-layer" class="world-layer"></div>   <!-- fixed, full viewport, behind .app-shell -->
<div class="app-shell"> … topbar, #stage (dossier), footer … </div>
<div id="game-ui"></div>                             <!-- dialogue, chapter cards, toasts: above everything -->
```

`body[data-world="explore"]` means the world is interactive. `#stage` becomes
pointer-transparent except for its own panels. `body[data-world="backdrop"]`
means the world is a dimmed, non-interactive backdrop behind the dossier.
`body[data-world="off"]` hides it.

## js/world/world.js (agent A1)

```js
export function getWorld()            // singleton; creates it on first call
world.mount(container)                // idempotent; container = #world-layer
world.isAvailable()                   // false when no THREE/WebGL (all calls below are then no-ops/resolved promises)
world.setMode('explore' | 'backdrop' | 'off')
world.setView(viewId, { instant })    // camera presets: 'overview', 'cto-office', 'qa-area', 'dev-area',
                                      // 'devops-corner', 'server-room', 'meeting-room', 'war-room', 'street'
world.setMood('evening' | 'outage' | 'after-good' | 'after-bad')   // lighting and props
world.setHotspots(list, onPick)       // list: [{ id, anchor, label, sublabel, kind: 'document'|'person'|'trap'|'event'|'exit',
                                      //          state: 'available'|'done'|'locked'|'hidden' }]
                                      // onPick(id) when a hotspot is clicked or activated by keyboard
world.walkTo(anchor) -> Promise       // player avatar walks along the nav graph; resolves on arrival
world.focus(anchor)                   // pan the camera to an anchor without walking
world.screenPosition(anchor) -> { x, y, visible }   // viewport px, for DOM overlays
world.onReady(cb)
```

Anchors (named spots in the office):
`entrance, cto-office, meeting-room, qa-desk (Deniz), routing-desk (Ece), field-desk (Onur),
integration-desk, devops-corner (Burak), po-desk (Kerem, Aylin), server-room (staging rack),
wiki-terminal (Document A), plan-folder (B), test-tool (C), jira-board (D), metrics-board (E),
pipeline-screen (F), mail-terminal (G), hr-cabinet (J), code-desk (T1), staging-console (T2), war-room`.

## js/world/people.js (agent A1)

```js
export const PEOPLE = { murat, deniz, kerem, aylin, ece, burak, onur, assessor }  // look + home anchor
world.setPerson(id, { anchor, state: 'idle'|'typing'|'talking'|'stressed'|'away'|'walking', facing })
world.say(id, text, ms)               // speech bubble above the person (DOM overlay)
export function getPortrait(id) -> Promise<string>   // data URL, head-and-shoulders render, cached
```

## js/game/* (agent A2): DOM only, no THREE dependency

```js
// dialogue.js: visual-novel box at the bottom of the viewport
openDialogue({ speaker: 'murat', name, role, lines: [string],           // typewriter, click/Enter to advance
               choices?: [{ id, label, meta, disabled, note }], onChoose?(id), onClose?() }) -> close()
// hud.js: game HUD over the world
renderHud(state, { onOpenDossier, onOpenBag, onToggleSound }) -> Node   // chapter + objective, clock (Step 2), bag count, sound toggle
// chapter.js: full-screen chapter title card between steps
showChapter({ number, title, subtitle }) -> Promise                    // resolves when dismissed or after ~2.2 s
// toast.js
toast(text, tone)                                                       // "Document B added to your bag"
// audio.js: WebAudio synthesis only, no files; off until the player turns it on (button), state in localStorage
audio.enable(), audio.disable(), audio.isOn(), audio.ui('click'|'pick'|'stamp'|'alarm'|'chapter'), audio.ambience('office'|'outage'|'none')
```

Portraits: `game/dialogue.js` calls `getPortrait` from `world/people.js` if it is available
and falls back to a CSS avatar (initials on the character's colour) otherwise.

## Character look (both agents use the same data, from js/world/people.js)

| id | Name | Role | Look |
|---|---|---|---|
| murat | Murat Kaya | CTO | 40s, short grey-black hair, navy blazer, white shirt, glasses |
| deniz | Deniz Arslan | QA lead | dark hair in a bun, teal cardigan, lanyard, laptop |
| kerem | Kerem Demir | Product owner, Routing & Integration | curly brown hair, mustard sweater, notebook |
| aylin | Aylin Çelik | Product owner, Field | long auburn hair, olive jacket |
| ece | Ece Yılmaz | Developer, Routing | short black hair, headphones, dark hoodie |
| burak | Burak Şahin | DevOps | beard, beanie, flannel shirt, two monitors |
| onur | Onur Kılıç | Test engineer, Field | buzz cut, grey t-shirt, phone and test devices |
| assessor | You | External assessor | orange scarf (player colour), charcoal coat, clipboard |

Expert colour stays teal, player colour orange.
