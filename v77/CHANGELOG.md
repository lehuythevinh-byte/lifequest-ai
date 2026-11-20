# Changelog — LIFEQUEST AI

## V77 — Living World Interface · 2026-11-20

- Added regional conversation panels, resident portraits, and Dialogue, Language and Memory tabs to the Beyond Conversation web release.
- Moved Replay into Memory. Archived words open the Language lookup during a conversation. The notebook, passport and Herald still read the existing save.
- Hid the interior shortcut and Vocalt preview during conversations. AI-reported moods appear next to replies and update the speaker’s portrait.

## V77 — Beyond Conversation (Phase 1) · 2026-11-19

Base: V76 (V75 patches applied to the SHA-verified v70 "dream-gate" source). V77 is
additive: it reads existing saves and never alters quests, economy, unlocks, lore,
NPC names/memory, or sprite style.

### Added
- **NPC mood chips (AI-reported).** The Gemini response schema gains a whitelisted
  `mood` enum (`happy, sad, confused, amused, curious, disagreeing, worried, formal,
  calm, neutral`). The system prompt asks the model to report mood; the chat renders a
  small chip next to AI replies and stores `mood` on the transcript entry. Offline
  (rules) replies show **no** mood chip — mood is never faked.
- **Conversation Replay + phrase notebook** (`#lq77-replay`, shortcut `L`).
  Per-resident archive of past talks; click any word to look it up / hear it; save
  phrases to a favorites notebook; 🔊 speak and 🗑 remove per phrase. A **🕮 Replay**
  button is added to the chat hint row.
- **Cultural Passport** (`#lq77-passport`, shortcut `P`). 8 region stamps earned from
  **real world state** (mission completion, helping a resident, festivals, Time Echo
  restoration, artifacts). Each stamp shows its evidence and day; unearned stamps show
  how to earn them. Stamps persist across leaving/reloading.
- **The LifeQuest Herald** (`#lq77-news`, shortcut `T`). A newspaper compiled from
  recorded `game.v60.events` — honest stats, CEFR level, and a disclaimer that it is
  compiled from recorded events (not live AI news). Unread badge on the menu entry.
- **Hub discoverability.** V77 entries (📔 Passport / 📰 Herald / 🕮 Replay talks) are
  added to the **active** V11 one-nav shell (`#l11-nav`), with `P`/`T`/`L` kbd hints.
- **Secure Gemini relays.**
  - `backend/server.cjs` — Node built-ins-only server: serves the SHA-verified game and
    a `/api/gemini` relay (header-based key, origin allowlist, daily + per-IP hourly
    limits, concurrency cap, 64 KB body cap, whitelist sanitizer, 27 s timeout, model
    fallback, safe errors).
  - `netlify/functions/gemini.mjs` + `netlify.toml` — equivalent Netlify Function.
- **Deployment blueprints:** `render.yaml`, `netlify.toml`, `.env.example`.
- **Documentation:** README, CHANGELOG, ARCHITECTURE, WORLD_LORE, AI_SYSTEM,
  TEST_REPORT, DEPLOY.
- Public API `window.LQBeyondV77` (`version`, `openReplay/openPassport/openNews`,
  `data()`, `diagnostics()`).

### Changed
- Frontend `PROXY_URL` comment clarifies the secure relay + honest offline fallback.
- Brand/title updated to "LIFEQUEST AI V77 — Beyond Conversation".
- `backend/server.cjs` expected SHA updated to the V77 build hash.

### Fixed (during V77 development)
- **Passport stamp not earned after helping a resident.** The base game marks
  `store.mem[id].goalDone` but does not tie it to a region in the V60 world log (only
  debug gossip populated `v60.people`). Added `game.v77.helped[regionId]`, refreshed
  from real `goalDone` while in a region, so the "helped a resident" stamp is earned
  and persists. Verified earned + persisted in-browser.
- **Shortcut collisions.** Initial `N`/`R` shortcuts conflicted with existing
  capture-phase handlers (`lq52`). Switched to empirically-free `P`/`T`/`L`; verified.
- **Menu discoverability bug.** V77 buttons were first inserted into the legacy
  `#group-menu`, which the V11 one-nav shell hides (`display:none!important`), and the
  click handler set inline `display:none` (fighting the shell's `.open` class). Moved
  the entries to the active `#l11-nav` using a `data-lq77-nav` attribute (ignored by the
  shell's `data-l11-page` router), with handlers that close the shell and open the
  panel. Verified end-to-end with a booted scene: buttons visible, panels render, shell
  closes, normal nav routing intact.
- **Chat open crash in tests.** `chat.open()` requires the NPC `.def` object (id is
  `def.id`, e.g. `barista`, not the array index). Test harness corrected; no game code
  change needed.

### Security
- Gemini key is **server-side only**; sent to Google in the `x-goog-api-key` header,
  never in a URL, never in the browser bundle.
- Request sanitizer strips `tools`, `safetySettings`, `cachedContent`, and any
  non-whitelisted field — **no arbitrary AI code execution**.
- AI JSON is validated; mood is whitelisted; all rendered AI text is HTML-escaped.
- Rate limits + timeouts + honest fallback labelled `Offline (rules)`.

### Known limitations / deferred
- Live Gemini round-trip **untested** (no API key available); relay + validation +
  fallback tested.
- Deferred master-prompt features: group conversation, Dream Architect, Story Studio,
  Language Council, six new regions, debate arena, and other Phase 2+ items.
- Netlify Function rate-limit counters are in-memory (ephemeral per instance); the
  Render relay's counters are likewise per-process. Documented in AI_SYSTEM.md.

---

## Earlier releases (base, unchanged by V77)
- **V76** — patch on V75; living-world moments, art upgrades.
- **V75** — patches on the SHA-verified v70 "dream-gate" base (53 source parts).
- **V70** — "apikey" build: API-key UI addon over the dream-gate base.
