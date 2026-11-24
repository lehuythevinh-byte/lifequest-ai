# LifeQuest AI V102.7 — High Definition Renaissance

Standalone deployment branch for the original uploaded game. The 13 ordered source parts are reconstructed byte-for-byte and verified against SHA-256 at build time.

## Run locally / Render

Build: `sh v1027/build.sh`

Start: `node v1027/backend/server.cjs`

The server exposes the game at `/`, health at `/health`, and an optional server-side Gemini relay at `/api/gemini`. Set `GEMINI_API_KEY` as a secret environment variable in Render; never commit credentials. Without a configured key, online AI is unavailable; the game's offline fallback remains available. Optional variables: `GEMINI_MODEL`, `AI_DAILY_REQUEST_LIMIT`, `AI_PER_IP_HOURLY_LIMIT`.

Original HTML SHA-256: `66dd424412712334ee19491682ef9dd4be9dc3a6c43796fcb253a43361b4fd99`.
