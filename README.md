# LIFEQUEST AI V77.5 — Faces of Life

*Explore a world. Find your voice. Make English part of your story.*

LifeQuest AI is an educational 2D pixel-art RPG for English conversation, contextual learning and regional quests. This release extends V77.4 Atelier Portraits without replacing world sprites or modifying mission or map logic.

[Play on Render](https://lifequest-ai-v77.onrender.com) · [Release source](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v77/v77) · [Server health](https://lifequest-ai-v77.onrender.com/health)

## Faces of Life

- 59 explicitly designed individual face profiles: seven contour types, eye spacing, lid shape, brow depth, nose proportions, mouth dimensions and individual marks. Additional identities use a deterministic profile derived from their stable ID/name.
- 40 supported emotional tones (plus unknown), with distinct rasterized expression geometry. Unknown deliberately uses the neutral face. Five character profiles produced 40 distinct images in the expression test.
- Individual reaction styles (warm, bright, reserved, wry and gentle). NPC occupation informs context, not a compulsory facial structure or temperament.
- Original skin/hair/clothing palette and existing accessories retained wherever available. Unsupported custom sprites use a labelled palette interpretation or unavailable state. Lord Vocalt has his distinctive curled moustache, dark-red coat and white rose.
- 128 × 128 logical pixel canvas; no smoothing. World movement sprites remain intact.
- Extended the AI prompt, enum, response validator and replay mood markers. Missing or invalid moods remain unassessed. Regional scripted dialogs do not imply online AI assessment.
- Added the shared portrait renderer to regional career, Vocalt citizen and Wish Valley civilian panels; these integrations have not been exercised in a full gameplay session.

## Local development

Node.js 20+ recommended. Clone the release branch and reconstruct the exact HTML. Open it offline for a preview, or serve it via the backend:

```sh
git clone -b deploy/lifequest-v77 https://github.com/lehuythevinh-byte/lifequest-ai.git
cd lifequest-ai
sh v77/build.sh
node v77/backend/server.cjs
```

Open http://localhost:10000. `/health` provides the current release and game SHA-256. Real online AI requires `GEMINI_API_KEY` configured on the server, never committed to Git.

## Render deployment

The existing LifeQuest service tracks `deploy/lifequest-v77`. The build reconstructs V77.5 from 26 verified V77.3 HTML fragments and two exact release patches, checking the base, intermediate and final SHA-256 hashes.

| Setting | Value |
|---|---|
| Root Directory | repository root |
| Build Command | `sh v77/build.sh` |
| Start Command | `node v77/backend/server.cjs` |
| Health Check | `/health` |
| GEMINI_API_KEY | secret environment variable |
| GEMINI_MODEL | gemini-2.5-flash (default) |

## Source structure

- `v77/game.html` — generated self-contained integrated game.
- `v77/ember-ink/` — verified base HTML fragments.
- `v77/atelier-portraits.patch.json` — V77.4 renderer and layout changes.
- `v77/faces-of-life.patch.json` — V77.5 renderer, individual profiles, expressions and regional integration changes.
- `v77/build-faces.cjs` — deterministic reconstruction and integrity checks.
- `v77/backend/server.cjs` — Gemini relay and game hosting.
- `v77/TEST_REPORT.md` — verified test results and limitations.

## Scope

Portraits are procedurally drawn rather than 59 individually hand-painted portraits. Test images are actual renderer output, not full-game screenshots. The main dialogue fixture and shared regional rendering function passed tests; full-world movement, custom regional dialogue paths and real Gemini requests have not been end-to-end tested. See the server health endpoint for the version currently deployed.

Release SHA-256: `f8655eeef410b5a71e9bf23169bde6c62ef1a9ce9a3f9312fb31c829f5457306`
