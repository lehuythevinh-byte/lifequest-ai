# LifeQuest AI V70 — Gemini API through Render Environment Variables

This branch contains the original V70 game and **no in-game API key entry controls**. The earlier key-entry, save, check and clear buttons have been disabled. All original maps, interiors, NPC sprites, quests and keyboard controls are retained.

## Render services

| Role | Render service | URL |
| --- | --- | --- |
| Game (Static Site) | lifequest-ai-v70-apikey | https://lifequest-ai-v70-apikey.onrender.com |
| Gemini proxy (Web Service, Node) | lifequest-ai-v70-gemini | https://lifequest-ai-v70-gemini.onrender.com |

Both deploy automatically from `deploy/lifequest-v70-apikey-20261116`.

## How to configure Gemini (site owner only)

1. Open the **Gemini backend service** at https://dashboard.render.com/web/srv-dbti29tg1s2s73b64180.
2. Select **Environment** and find or add the variable **`GEMINI_API_KEY`**.
3. Put your real Google AI Studio Gemini API key **in Render**, never in the HTML, GitHub, chat or browser. Use a secret value if that option is available.
4. Keep `GEMINI_MODEL=gemini-2.5-flash` (or switch to an available Gemini text model).
5. Save the environment; Render will redeploy/restart the backend.
6. Load https://lifequest-ai-v70-apikey.onrender.com — the game uses the backend automatically. No key field is required.

Backend environment variables:

```env
GEMINI_API_KEY=<SET THIS SECRET IN RENDER ENVIRONMENT>
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGIN=https://lifequest-ai-v70-apikey.onrender.com
AI_DAILY_REQUEST_LIMIT=50
AI_PER_IP_HOURLY_LIMIT=12
```

These are backend-service variables. **Setting GEMINI_API_KEY on a Static Site alone does NOT make it safely available to browser JavaScript.** Never embed a secret into the static site's build output.

## How it works

- Game source remains validated against its original SHA-256 at build.
- `v70/addons/api-key-ui.js` removes previously stored `geminiKey` from localStorage, switches Gemini's proxy URL to the new Render Web Service, and lets availability probes retry after cold starts.
- `v70/addons/api-key-ui.css` hides the obsolete API key fields and buttons without removing storage/import/export controls or affecting gameplay.
- `v70/backend/server.cjs` calls Google Gemini directly using the Render-side `GEMINI_API_KEY`. API responses are relayed back to the game.
- Render CORS origin allow-list, body size, concurrency, and hourly/daily request limits reduce abuse risks. **This is a public, anonymous game, so request limits are best-effort and not persistent across backend restarts.** For wide public usage, require authenticated requests plus durable quotas/budgets to protect a paid API key.
- The backend `/health` endpoint reports whether a key is configured without revealing the key.

If `GEMINI_API_KEY` is empty, the game remains playable with its offline fallback, and Gemini functions are not available.

## Implementation note

The client has a single main Gemini endpoint controlled by `window.LIFEQUEST_AI_CONFIG.PROXY_URL`; it must point to the Render Web Service. The browser must not send an `x-goog-api-key` header or receive the real secret from Render.
