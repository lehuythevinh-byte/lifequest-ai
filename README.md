# LIFEQUEST AI V77.4 — Atelier Portraits

*Explore a world. Find your voice. Make English part of your story.*

LifeQuest AI is an educational pixel-art RPG for practising English through regional exploration, NPC conversations and quests. V77.4 focuses on character portrait quality, without replacing the world sprites or changing the quest mechanics of V77.3.

[Play on Render](https://lifequest-ai-v77.onrender.com) · [Source](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v77/v77) · [Server health](https://lifequest-ai-v77.onrender.com/health)

## New in V77.4

- Native 128 × 128 pixel busts: separate integer-grid rendering rather than enlarging 24 × 38 world sprites.
- Character appearance derived from the original `Nr` data (skin, hair, clothes, caps, helmets, glasses, aprons, collars and beards). Face contours and fabric detail are artistic interpretations; they are not claims about an NPC's undocumented features.
- For other NPCs that have an accessible live sprite, a palette-derived interpretation is explicitly labelled. If no reliable color data is available, the UI displays an initial instead of inventing a portrait.
- Ten visually distinct expression frames across eleven mood labels; unassessed and neutral share a neutral face. Mood source remains visible; no AI emotion is claimed when one is unavailable.
- Enlarged portrait stage, responsive layout, bounded portrait cache and original V77.3 authoritative price/mission logic.
- No change to the map movement sprites, mission conditions, progress, or region unlocks.

## Play locally

Clone the release branch and build with Node 20+. The generated `v77/game.html` may also be opened as a standalone preview.

```sh
git clone -b deploy/lifequest-v77 https://github.com/lehuythevinh-byte/lifequest-ai.git
cd lifequest-ai
sh v77/build.sh
node v77/backend/server.cjs
```

Open http://localhost:10000 and check http://localhost:10000/health. `GEMINI_API_KEY` must be set in the server environment for online dialogue; never commit it to Git.

## Render (existing service, repository root)

| Setting | Value |
|---|---|
| Root Directory | empty |
| Build Command | `sh v77/build.sh` |
| Start Command | `node v77/backend/server.cjs` |
| Health Check Path | `/health` |
| GEMINI_API_KEY | secret, configure in Render Environment |
| GEMINI_MODEL | `gemini-2.5-flash` (default) |

The repository reconstructs the exact V77.4 HTML from verified V77.3 source fragments and eight source edits, verifies both SHA-256 hashes and checks backend syntax. No API keys are included.

## Source layout

- `v77/game.html` — generated self-contained game.
- `v77/ember-ink/` — verified base HTML fragments.
- `v77/atelier-portraits.patch.json` — eight exact source edits, including the new renderer and CSS.
- `v77/build-atelier.cjs` — deterministic reconstruction and integrity checks.
- `v77/backend/server.cjs` — backend and Gemini relay.
- `v77/game.sha256` — pinned integrity hash.
- `v77/TEST_REPORT.md` — test scope and limitations.

## Testing and limitations

The isolated dialogue fixture uses original core NPC appearance data and simulated dialogue. The 12 tested NPCs have different visual outputs; 10 visually distinct mood frames were verified; viewport layouts were checked at 1280×800, 390×844 and 844×390. The Node server started locally and its health response was checked. Full world traversal, separate custom-map dialogue overlays and real Gemini responses have not been verified. Portraits are procedurally illustrated, not hand-painted assets for every NPC.

Release SHA-256: `6b6aa915fc7152137e78783c6aa7aee8975dc69e3b56701fae79e4e88b2a27a5`
