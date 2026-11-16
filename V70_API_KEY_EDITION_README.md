# LifeQuest AI V70 — Gemini API Key Edition

This is a separate branch based on the complete, deployed V70 game. All maps, NPCs, game progress, quests, and movement code are preserved. The change is additive.

## Player instructions

1. Open the new Render URL.
2. On the welcome screen, paste your **own** Google Gemini API key; optionally click **Kiểm tra**. Press **Start** to save the key to this browser and enter the game.
3. Inside the game, use the **🔑 API Key** button in the top menu, or AI Settings (K). There you can save/test/clear the API key and select a model.
4. Without an API key, offline gameplay remains available.

## Security notes

**No real API key is committed to GitHub or configured as a Render environment variable.** The original V70 game saves the user-entered key in the `english-town-ai` localStorage record on that browser and sends it directly to Google for Gemini requests. This design is not suitable for shared/public computers; same-origin scripts can access stored keys. Use your own restricted key and monitor its Google quota/billing. Do not share or paste your real API key into issues, chat, or GitHub files.

## GitHub + Render deployment

Render Static Site branch: `deploy/lifequest-v70-apikey-20261116`.

The build assembles the 44 fragments of `v70/parts/` into `public/index.html`, confirms the **original** SHA-256 `8476d3b98ef3c133df6bc785956c19def9d036cccebbdb2acf52a31564f6ce21`, then adds `v70/addons/api-key-ui.js` and `v70/addons/api-key-ui.css` as separate files and inserts local asset tags in the assembled page.

This preserves the original game logic; the API Key Edition's script reveals and improves the existing native Gemini settings rather than replacing Gemini or NPC game logic. No server-side secret proxy is provisioned.
