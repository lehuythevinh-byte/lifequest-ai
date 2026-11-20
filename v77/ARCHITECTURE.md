# Architecture — LIFEQUEST AI V77

## 1. Single-file game

`v77/game.html` (~4.57 MB) is a self-contained HTML5 game built on **Phaser 4.2.1**
(embedded, minified). It is the V76 base with V77 layered on top.

Execution model:
- The Phaser library is embedded inline.
- The game logic lives in `<script type="text/plain" id="lq-game-src">` (~1.59 MB of
  source). A loader (`boot()`) fetches/assembles the source and runs it with
  `new AsyncFunction('Phaser', source)(Phaser)`, so all game modules share one scope.
- The loader gates boot on interactive overlays: `LQTitle.show()` (Start) →
  `LQDevice.ask()` (device picker) → `LQAuth.start()` (sign in / **Play as guest**) →
  then `startGame()` creates the Phaser game (`parent: 'game'`, scene `Qr`) and
  `LQ11.init()` wires the one-nav shell.
- Because the loader fetches source slices, the game must be served over **http://**
  (localhost or a host), not opened as `file://`.

### Boot/loop note for automated testing
In a **hidden** browser viewport (`document.visibilityState === 'hidden'`),
`requestAnimationFrame` is paused, so the Phaser loop stays at frame 0 and loop-driven
systems (movement, NPC walking, world time) do not advance on their own. DOM/event-
driven features (chat, panels, menus, saves) work normally. Loop-driven behavior can be
exercised by manually calling `game.loop.step(t)`. This is a harness limitation, not a
game regression. See TEST_REPORT.md.

## 2. V11 "one-nav" shell (the active UI hub)

- The legacy menus (`#group-menu`, `#group-btn`, `#rpg-open`, `#v10-open`, `#v8-dock`, …)
  are hidden by CSS (`display:none!important`).
- The active hub is `#l11-shell` (a dialog), opened by `#l11-menu-btn` (`☰ Menu (G)`).
- Nav buttons carry `data-l11-page` (`maps/world/quests/learn/economy/character/
  achievements/settings`); a delegated click handler routes them via `page(name)`.
- The shell exposes `window.LQ11_UI = { open, close, page, action }`.
- `open()` bails if another major panel is already visible (`existingIsOpen()`).

**V77 integration:** the module appends three buttons to `#l11-nav` tagged
`data-lq77-nav` (NOT `data-l11-page`, so the shell router ignores them). Each button's
own handler closes the shell (`#l11-close.click()` + `shell.hidden=true` +
`aria-expanded=false`) and opens the corresponding V77 panel. This keeps V77
discoverable by mouse without touching the shell's routing.

## 3. V77 module

- Canonical source: `v77/lq77-module.js` (an IIFE, `VERSION = '77.0-beyond-conversation'`).
- Injected into `game.html` between `<!-- LQ77-MODULE-BEGIN -->` / `<!-- LQ77-MODULE-END -->`
  (before the last `</body>`) by `node v77/inject-module.mjs`. Re-run the injector after
  any module edit, then recompute the SHA and update `backend/server.cjs`.
- The module is **additive and defensive**: every accessor guards on a valid scene
  (`sc.store.game && sc.area`). If the town isn't entered yet, panels show an honest
  "Enter the town first" toast instead of crashing.
- Panels (`#lq77-replay`, `#lq77-passport`, `#lq77-news`) are `position:fixed` dialogs
  (z-index 9300) toggled via `style.display` (`none`/`block`), not the `hidden` attr.
- All AI/user text is HTML-escaped (`esc()`); no `innerHTML` of untrusted strings.
- Public API: `window.LQBeyondV77 = { version, openReplay, openPassport, openNews,
  data(), diagnostics() }` (frozen).

### Scene/services bridges (read-only)
- `window.__lifequestGetScene()` → the live Phaser town scene.
- `window.__lifequestServices = { speech, cefr }` → text-to-speech + CEFR level.
- `window.LQWorldV60` → `{ MAPS, TRAILS, ECHO, subscribe, publish, record }` world state.
- `window.LQWorldMaps.list()` → the live region list.
- `window.LQGemini` → the frontend AI client (posts to the relay).

## 4. Save data (no data loss)

- localStorage key `english-town-save-v1` = `{ game, mem }`.
- `load()` uses `Object.assign`, so extra blocks (`game.v60`, `game.v66`, `game.v58`,
  `game.v77`) coexist and persist; V77 never deletes or rewrites other blocks.
- Per-NPC memory `mem[id]` (id = `def.id`, e.g. `barista`): `{ affinity, transcript
  (cap 80), facts, events, goalDone, summary }`. V77 **reads** `goalDone`/`transcript`
  but does not modify them.
- V77 block `game.v77`:
  ```jsonc
  {
    "schema": 1,
    "passport": { "<regionId>": { "reason": "...", "day": 3 } },
    "favorites": [ { "npc": "barista", "text": "...", "at": 1234 } ],
    "names": { "barista": "Lily (Barista)" },   // learned from the live scene
    "helped": { "<regionId>": { "npc": 2, "day": 3, "at": 1234 } },
    "news": { "lastReadAt": 0 }
  }
  ```
- `data()` lazily initializes missing sub-fields, so old saves upgrade safely.

### Passport evidence sources
A stamp is earned from real state, checked in `stampEvidence()`:
1. `v77.helped[region]` (resident wish fulfilled — refreshed from `mem[id].goalDone`),
2. `v60.people[area::npc].helped`,
3. completed local mission / region progress,
4. restored Time Echo (`v60.echoes`),
5. joined festival (`v60.regions[id].festival`),
6. discovered artifact (`v60.artifacts`).

## 5. World state (V60, read by V77)

`game.v60 = { events[120], regions, people (keyed area::npcId), echoes, artifacts,
learning }`. `record(kind, title, meta, sc)` auto-binds `area:areaId(sc)`. The Herald
compiles news from `v60.events`; the Passport reads `regions/echoes/artifacts/people`.
V77 does not write to `v60` (it only adds its own `helped` evidence under `v77`).

## 6. AI relay (server-side key)

Two interchangeable implementations of the same contract:

| | Render | Netlify |
|---|---|---|
| File | `backend/server.cjs` | `netlify/functions/gemini.mjs` |
| Runtime | Node built-ins only (`node:http`) | Netlify Function (esbuild) |
| Serves game | yes (SHA-verified) | static `dist/index.html` |
| Endpoint | `POST /api/gemini` | `/api/gemini` → Function redirect |
| Key location | `process.env.GEMINI_API_KEY` | same |
| Key to Google | `x-goog-api-key` header | `x-goog-api-key` header |
| Limits | daily + per-IP hourly + concurrency 2 | daily + per-IP hourly (in-memory) |
| Timeout | 27 s | 25 s |
| Body cap | 64 KB | 64 KB |
| Sanitizer | whitelist (`contents`, `systemInstruction`, `generationConfig`) | same |

Contract: frontend posts `{ model, body }`; relay sanitizes `body`, forwards to
`https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`,
returns the upstream JSON. On any failure it returns a safe error; the frontend then
falls back to offline rules labelled `Offline (rules)`.

See AI_SYSTEM.md for the security model and DEPLOY.md for hosting.

## 7. Release pipeline (provenance)

```
v70/dream-gate/parts (53 txt)  →  SHA-verified base
        → V75 patches  →  V76 patch  →  V76 HTML
        → V77 internal edits (title, services export, mood schema/prompt/chip, brand)
        → Beyond Conversation source in v77/parts (SHA a406c737…)
        → v77/living/build.cjs incorporates lq77-module.js, interface and artwork
        → v77/game.html (SHA-256 in v77/game.sha256)
```

The root-level `index.html`, `server.ts`, `netlify.toml`, `render.yaml`, and
`netlify/functions/gemini.ts` belong to a **different/older project** (Deepfake Scanner
mix / v70-apikey static) and contain merge-conflict markers or an insecure relay
(wildcard CORS, key-in-URL). They are intentionally **not** used by V77 and were left
untouched. All V77 deliverables live under `v77/`.
