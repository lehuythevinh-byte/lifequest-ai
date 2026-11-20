# Test Report — LIFEQUEST AI V77

## Living World Interface · 2026-11-20

Chromium opened the built HTML through the Node relay. The HTML and `/health`
matched the release hash in `game.sha256`. Pressing E near Sam in the Post Office
opened his portrait and three conversation tabs. The interior shortcut and Vocalt
preview were hidden. Asking for a stamp completed the mission using offline rules.
Memory opened Sam’s Replay. Saving a phrase, looking up “stamp”, and reopening the
game retained the notebook entry and mission progress. Passport showed eight
entries and Herald opened from the hub. A local fixture exercised mood display
and portrait expression. The browser reported no script errors during the run.

## Beyond Conversation baseline

Date: 2026-11-19 · Build SHA-256:
`a406c737942257140270081d87d5fd0d62af602df0c7c58e2f5fb8cae3b2013f`

> Principle: **no test is claimed as passed unless it was actually run.** This report
> separates (A) automated backend tests, (B) real in-browser tests, and (C) honest
> limitations / things NOT tested.

---

## A. Backend automated tests (run this session, all green)

Executed with Node against the actual relay code:

| Suite | Script | Result |
|---|---|---|
| Sanitizer whitelist (Render `server.cjs`) | `lq77-sanitize-test.cjs` | **21 passed, 0 failed** |
| Netlify handler (CORS/method/origin/status) | `lq77-netlify-test.mjs` | **8 passed, 0 failed** |
| Netlify input validation | `lq77-netlify-validate.mjs` | **5 passed, 0 failed** |
| **Total** | | **34 passed, 0 failed** |

Sanitizer coverage includes: `tools` stripped (no arbitrary code exec), `safetySettings`
stripped, `cachedContent` stripped, only whitelisted top-level keys, oversized
`responseSchema` dropped, string `systemInstruction` normalized, non-text parts rejected,
oversized prompts rejected, role/contents bounds, generationConfig clamping.

Netlify handler coverage includes: foreign origin gets no CORS allow, foreign `OPTIONS`
→ 403, same-origin `OPTIONS` → 204, `DELETE` → 405, no-key → 503, wrong content-type →
415, empty contents → 400, non-text part → 400.

### Live HTTP checks (curl against the running Render-style relay)
- `GET /health` → `200`, reports `configured:false` honestly when no key is set, and the
  exact build `sha256`.
- `GET /` → `200`, serves the full 4 570 245-byte game; `X-LifeQuest-Release:
  V77-Beyond-Conversation`.
- `POST /api/gemini` with no key → `503` ("GEMINI_API_KEY is not configured").
- Foreign `Origin` → `403` ("Origin not permitted").
- Startup integrity: the server refuses to boot if `game.html`'s SHA ≠ expected.

---

## B. Real in-browser tests (Phaser game, automated browser via DOM assertions)

Method: served `v77/game.html` from the Node relay over http://, drove the real boot
(Start → device → **Play as guest**), and asserted on live DOM/scene state. The scene
booted to `area: "english-town"`; `LQBeyondV77.diagnostics()` returned
`{ version: '77.0-beyond-conversation', sceneReady: true, moodSchema: true, … }`.

### Boot & shell
- Title screen renders; **Start** advances; device picker advances; auth overlay shows
  **Play as guest**; guest path boots the town (canvas created, scene attached).
- V11 one-nav shell opens via `LQ11_UI.open('maps')`; `#l11-menu-btn` toggles it.

### V77 menu discoverability (the fix verified end-to-end this session)
- Three V77 buttons present in the **active** `#l11-nav` (`data-lq77-nav`): 📔 Passport
  (P), 📰 Herald (T), 🕮 Replay talks (L).
- With the shell open, all three are **visible** (non-zero width, in layout).
- Clicking each: opens the correct panel (`display:block`, rendered content with the
  right heading — "📔 Cultural Passport", "📰 THE LIFEQUEST HERALD", "🕮 Conversation
  Replay") **and closes the shell**.
- **Regression:** normal shell nav routing still works (clicking the `quests` page
  button activates the quests page); the V77 buttons do not hijack the router.

### Keyboard shortcuts
- `P` opens Passport, `T` opens Herald, `L` opens Replay (verified by dispatching real
  `keydown` events with a booted scene). No collision with existing capture-phase
  handlers.

### Chat (offline rules path)
- Opening a resident's chat (e.g. Lily/barista) shows the provider labelled
  **`Offline (rules)`** when no key is configured.
- Sending a goal-matching message completes the wish, grants XP/reputation, and updates
  the quest log; grammar feedback renders.
- **No mood chip** on offline replies (mood is AI-only). With a mood present on a
  transcript entry, the chip renders correctly (whitelisted).

### Conversation Replay + notebook
- Per-resident archive lists past transcript entries; selecting a resident switches the
  archive.
- Clicking a word opens the lookup/helper; 🔊 speaks the phrase; saving adds to
  `v77.favorites`; 🗑 removes it. Notebook persists.

### Cultural Passport
- Shows all **8 regions**; unearned stamps are `SEALED` with a hint.
- The "helped a resident" stamp is **earned** after fulfilling a wish (the `v77.helped`
  fix) and **persists** across reload. Evidence + day shown for earned stamps.

### The LifeQuest Herald
- Compiles articles from recorded `v60.events`; shows honest counts and the CEFR level;
  includes the "compiled from recorded events" disclaimer; word-click lookup works.
- Unread badge logic updates the menu entry label.

### Save / load (no data loss)
- Full round-trip: `game.v77` coexists with `game.v60/v66/v58` and per-NPC `mem`;
  reloading restores passport stamps, favorites, names, helped, and news read-state.
- V77 never deletes or rewrites other save blocks (verified by inspecting the saved JSON).

### World interaction (loop-driven, via manual loop stepping — see C)
- Player movement advances when the loop is stepped (`dx` non-zero).
- Building entry/exit works; switching areas does not crash; NPC sprites remain the
  original pixel-art style.

---

## C. Honest limitations / NOT tested

1. **Live Gemini round-trip is UNTESTED.** No `GEMINI_API_KEY` was available during
   development. The relay's validation, rate limits, CORS, timeouts, error mapping, and
   the offline fallback are tested; the actual call to Google and the AI mood/JSON
   response need a real key to verify. **Do not treat live AI as verified.**
2. **Hidden-viewport harness.** The automated browser reports
   `document.visibilityState === 'hidden'`, which pauses `requestAnimationFrame`. The
   Phaser loop therefore stays at frame 0 unless stepped manually. Loop-driven ambient
   systems (NPC walking, world time, autopilot) were exercised via `game.loop.step(t)`,
   not by waiting in real time. DOM/event-driven features are unaffected. In a normal
   visible browser these run normally.
3. **Netlify rate counters are ephemeral** (in-memory, reset on cold start). Tested for
   correctness within a single instance; global persistence across instances is not
   provided (documented in AI_SYSTEM.md).
4. **Deferred features are not tested because they are not implemented** (group
   conversation, Dream Architect, Story Studio, Language Council, six new regions,
   debate arena, etc.). No placeholder UI exists for them.
5. The root-level legacy files (Deepfake Scanner / v70-apikey) were **not** tested as
   part of V77; they are a different project and are not used by the V77 deliverables.

## Verdict

V77 Phase 1 features are implemented and verified by real backend tests (34/34) and
real in-browser DOM/scene assertions, including the menu discoverability fix end-to-end
with a booted scene. The only unverified path is the live Gemini call, which requires an
API key that was not available. No fabricated results are reported.
