# Rotaşa Assessment Desk

A browser game in which the player is an external assessor running an informal TMMi v2.0 assessment of Rotaşa Technology over one evening, then turning the findings into an improvement plan. It has seven steps, played as chapters in a 3D office: Plan, Collect evidence, Assess, Conclude, Report, Improve, Reflect. It is playable in English and Turkish.

The decision map and expert path (deliverable D1) are in [../docs/decision-map.md](../docs/decision-map.md).

## Play

Open the deployed link. Alternatively, run it locally. It is a static site with no build step, but ES modules need an HTTP server, so opening `index.html` from disk does not work.

```bash
cd simulation
python -m http.server 8080
# open http://localhost:8080
```

- **Language:** use the title menu (Türkçe / English) or Settings → Language. Official TMMi process-area and goal names stay in English.
- **No WebGL?** The game detects this and plays fully in the dossier. Add `?nothree` to the URL to test this path.
- **Progress** is saved in the browser (localStorage). Use *New game* on the title screen to start over.

## Deploy to Vercel

```bash
cd simulation
npx vercel login      # once, confirms in the browser
npx vercel --prod     # prints the public https://…vercel.app link
```

`vercel.json` turns the build off, serves the folder as it is, and sets security headers, including a CSP that allows only cdnjs and jsDelivr scripts. `.vercelignore` keeps tests, tools, docs and the demo pages out of the deployment. Alternatively, push the repository to GitHub and import it in the Vercel dashboard with **Root Directory = `simulation`**.

## Tests

```bash
cd simulation
npm test              # node:test, no dependencies
npm run coverage
```

- The data-integrity tests guard content accuracy:
  - every expert key evidence item exists and supports its goal;
  - the expert path fits the time and money budgets;
  - the action costs match Document I.
- The i18n tests check the translation runtime and that every Turkish template keeps its placeholders.

## Translations

The English text lives in the code. `js/i18n/i18n.js` translates each string at the point where it enters the page, by exact match or by `{0}` template. To refresh the Turkish dictionaries after a text change:

```bash
node tools/extract-strings.mjs > strings.json              # every player-facing string
# translate into <dir>/tr-<area>.json  { "strings": {en: tr}, "templates": [[en, tr]] }
node tools/build-i18n.mjs tr <dir> strings.json             # writes js/i18n/tr/*.js
```

## Structure

```
index.html            page shell: world layer, HUD slot, dossier stage, document viewer
css/                  tokens, layout, components, screens, world, game UI, shell, mentor, recap, director
js/main.js            boot: loads the language, starts the director
js/store.js           immutable state and saved progress
js/data/              case evidence (A–J, H1–H6, OBS), TMMi Level 2 goals with expert ratings, decisions and expert path
js/logic/             time budget, TAMAR rating rules, comparison, consequences, achievements, recap (pure, unit tested)
js/ui/                DOM helpers, shared components, dossier screen for each step
js/game/              director, chapters ch00–ch07, dialogue, HUD, title and pause menus, settings, mentor (Selin), glossary, trophies, recap
js/world/             Three.js office: people, props, lighting moods, post-processing, hotspots, adaptive quality
js/fx/                ambient backdrop, radar chart, 2D fallback, motion preferences
js/i18n/              translation runtime and Turkish dictionaries
tools/                string extraction and dictionary build scripts
tests/                node:test suites
```

## Course requirements

| Requirement | Where |
|---|---|
| Seven steps with a process map | Chapters 1–7 in the HUD; route-style process map with a truck in the dossier |
| ≥ 8 decisions, ≥ 3 change later steps | 14 decisions. Scope, assessment type, interviews, evidence, the outage, test data and actions all change later steps |
| Limited time for evidence | Chapter 2: 5 h 40 min on site against more than 9 h of evidence on offer; the clock runs in the office |
| Written reasoning ≥ 2, each followed by the expert's answer | TMC G3 and TDE G1 in Chapter 3, and the automation reply in Chapter 5 |
| Final screen: player path vs expert path | Chapter 7: route recap, six-month consequences, path table, radar and 21-goal matrix |
| Digital, opens from a link | Static site on Vercel |

Turn on **Settings → Designer notes** to see, on every dossier screen, which requirement it meets.

## Credits

- Team: Cem Özal, Sertaç Ataç.
- Three.js r128 (MIT).
- GSAP 3.12.5 (GreenSock standard license).
- Fonts: Big Shoulders Display, Public Sans and JetBrains Mono (SIL OFL).
- Sources:
  - TMMi Foundation, *TMMi Framework Release 2.0*;
  - *TAMAR Release 1.3*.
- The Rotaşa case and everyone in it are fictional.
