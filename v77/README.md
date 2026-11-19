# LIFEQUEST AI V77 — Beyond Conversation

An AI-powered, open-world **educational English RPG**. You explore a living pixel-art
world, talk to residents in English, complete their wishes, and watch the world
remember what you did. V77 is **Phase 1 ("Beyond Conversation")** of the Living World
expansion: it makes the conversations you already have *leave a trace* — in a replay
archive, a cultural passport, and a town newspaper — without changing the world's
lore, quests, economy, unlocks, or NPC memory.

> Build on the latest source. Add, don't replace. Never lose player data. Never leak
> the API key. Never pretend offline rules are live AI.

---

## What V77 adds (all playable now)

| Feature | What it does | How to open |
|---|---|---|
| **NPC mood chips** | When live AI replies, it may report a mood (`happy`, `curious`, `worried`, …). The chat shows a small mood chip next to the reply. Moods are whitelisted; offline replies show **no** chip. | Automatic in chat |
| **Conversation Replay + phrase notebook** | Re-read past talks per resident, click any word to look it up / hear it, and save useful phrases to a notebook. | `L`, hub menu, or **🕮 Replay** in chat |
| **Cultural Passport** | 8 region stamps. A stamp is earned by *living* a region's story (complete a mission, help a resident, join a festival, restore a Time Echo) — not by walking in. Evidence is shown for every stamp. | `P` or hub menu |
| **The LifeQuest Herald** | A newspaper compiled from **recorded world events** (no invented news). Shows what changed, your CEFR level, and an honest disclaimer. | `T` or hub menu |

All three panels are reachable from the **active hub** (`☰ Menu (G)` → the V77 entries
at the bottom of the nav) and from keyboard shortcuts `P` / `T` / `L`.

## What V77 deliberately does NOT change

- Quests, money, prices, shop stock, unlocks, map locks, region positions.
- NPC names, personas, greetings, goals, affinity, or per-NPC memory (`store.mem`).
- The original pixel-art NPC sprite style and world generation.
- The save format — V77 only **adds** a `game.v77` block; existing saves load unchanged.

## Quick start (play locally)

The game is a single self-contained HTML file. It needs to be served over **http://**
(not `file://`, because the loader fetches its own source slices).

```bash
# Option A — the secure Node relay (serves the game AND the Gemini proxy, built-ins only)
node v77/backend/server.cjs
# open http://localhost:10000

# Option B — any static server (offline rules only, no AI key needed)
cd v77 && python -m http.server 8080
# open http://localhost:8080/game.html
```

Without a server-side `GEMINI_API_KEY`, the game probes the relay, sees no key, and
falls back to **offline rules**, clearly labelled `Offline (rules)` in the chat header.
Nothing is disguised as live AI.

## Live AI (optional, secure)

The Gemini key lives **only** in the server environment — never in the HTML/JS, never
sent to the browser. See [AI_SYSTEM.md](AI_SYSTEM.md) and [DEPLOY.md](DEPLOY.md).

```bash
# Render / local Node relay
GEMINI_API_KEY=your_key node v77/backend/server.cjs
```

The frontend posts `{ model, body }` to a relative `/api/gemini`; the relay validates,
rate-limits, and forwards to Gemini with the key in a request **header**.

## Controls (V77 additions)

- `P` — Cultural Passport
- `T` — The LifeQuest Herald
- `L` — Conversation Replay (current resident if you're chatting)
- `☰ Menu (G)` → 📔 Passport / 📰 Herald / 🕮 Replay talks
- In chat: **🕮 Replay** button re-opens the current resident's archive.

Existing controls are unchanged: `WASD`/arrows move, `E` talk, `G` hub, `B` economy,
`H/J/K/Q/F8` legacy panels, `Escape` close.

## Deliverables in this folder

- `game.html` — the playable single-file game (V76 base + V77).
- `lq77-module.js` — canonical V77 module source (injected into `game.html`).
- `inject-module.mjs` — re-injects the module after edits.
- `backend/server.cjs` — Node built-ins-only game server + secure Gemini relay (Render).
- `netlify/functions/gemini.mjs` + `netlify.toml` — Netlify static + Function deployment.
- `render.yaml` — Render blueprint.
- `.env.example` — environment template (no real secrets).
- Docs: [README](README.md) · [CHANGELOG](CHANGELOG.md) · [ARCHITECTURE](ARCHITECTURE.md) ·
  [WORLD_LORE](WORLD_LORE.md) · [AI_SYSTEM](AI_SYSTEM.md) · [TEST_REPORT](TEST_REPORT.md) ·
  [DEPLOY](DEPLOY.md).

## Integrity

`game.html` SHA-256:

```
a406c737942257140270081d87d5fd0d62af602df0c7c58e2f5fb8cae3b2013f
```

The Node relay verifies this hash at startup and refuses to serve a mismatched file
(override with `LQ77_SHA256` only if you intentionally rebuild).

## Honest limitations

- **Live AI path is untested in this build** — no API key was available during
  development. The relay, validation, rate limits, and offline fallback are tested;
  the actual Gemini round-trip needs a key. See [TEST_REPORT.md](TEST_REPORT.md).
- Several master-prompt features are **deferred** (group conversation, Dream Architect,
  Story Studio, Language Council, six new regions, debate arena, …). V77 is Phase 1.
- Ambient loop-driven systems were verified by manually stepping the game loop because
  the automated browser viewport is hidden (rAF paused). See [TEST_REPORT.md](TEST_REPORT.md).

No fake buttons, no placeholder features, no fabricated test results.