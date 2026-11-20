# Deployment Guide — LIFEQUEST AI V77

The V77 web release runs on the existing Render service `lifequest-ai-v77`.
Its branch is `deploy/lifequest-v77`. The Gemini key lives in the service environment.

> Important: the repository **root** `netlify.toml`, `render.yaml`, `server.ts`, and
> `netlify/functions/gemini.ts` belong to an older/other project (they contain merge
> conflict markers or an insecure relay). **Use the files under `v77/`** described here.

---

## 0. Put the source on GitHub

```bash
# from the project root
git add v77
git commit -m "Update LifeQuest V77 web release"
git push origin HEAD:refs/heads/deploy/lifequest-v77
```

Never commit a real key. `.env.example` is a template only; real secrets go in the
host's environment settings. Add a `.gitignore` entry for `.env` if you create one locally.

---

## 1. Render (recommended: one service serves game + relay)

The Node build assembles the HTML. The relay serves that file and the `/api/gemini`
endpoint from the same origin. Both use Node built-ins.

### Existing service settings
- **Root Directory:** repository root (empty)
- **Runtime:** Node
- **Build Command:** `sh v77/build.sh`
- **Start Command:** `node v77/backend/server.cjs`
- **Health Check Path:** `/health`
- Environment:
  - `NODE_VERSION = 22.22.1`
  - `GEMINI_API_KEY = <your key>` (secret)
  - `GEMINI_MODEL = gemini-2.5-flash`
  - `AI_DAILY_REQUEST_LIMIT = 50`, `AI_PER_IP_HOURLY_LIMIT = 12`
  - `ALLOWED_ORIGIN` — leave unset for same-origin (game + relay on this service). Set
    it only if the frontend is hosted elsewhere.
  - `LQ77_SHA256` — optional explicit override of the final hash in `v77/game.sha256`.

Play at `https://<your-service>.onrender.com/`. The game probes `/api/gemini`; with a
key set, chat uses live AI; without it, chat honestly shows `Offline (rules)`.

---

## 2. Netlify (historical packaging)

The earlier Netlify package includes the configuration and function described below.
This deployment branch publishes the Render relay.

### Configure
1. In Netlify: **Add new site → Import from Git**, connect the repo.
2. **Base directory:** `v77`  ← so `v77/netlify.toml` is used.
3. Build settings (from `v77/netlify.toml`):
   - **Build command:** `mkdir -p dist && cp game.html dist/index.html`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. **Site settings → Environment variables:** add `GEMINI_API_KEY = <your key>` (secret).
   Optional: `GEMINI_MODEL`, `AI_DAILY_REQUEST_LIMIT`, `AI_PER_IP_HOURLY_LIMIT`,
   `ALLOWED_ORIGIN` (defaults to the site URL).
5. Deploy.

`netlify.toml` routes `/api/gemini` → `/.netlify/functions/gemini` (200, force) and
falls back every other path to `/index.html`. The Function mirrors the Render relay's
security (origin allowlist, whitelist sanitizer, header key, 25 s timeout, model
fallback, safe errors).

> Note: Netlify Function rate counters are in-memory and reset on cold starts. For
> strict persistent limits, prefer the Render backend.

---

## 3. Local development

```bash
sh v77/build.sh
# Full experience (game + relay), Node built-ins only:
GEMINI_API_KEY=your_key node v77/backend/server.cjs   # http://localhost:10000

# Offline-only (any static server):
cd v77 && python -m http.server 8080                   # http://localhost:8080/game.html
```

Localhost origins are allowed by the relay when `NODE_ENV !== 'production'`.

---

## 4. Rebuilding game.html after editing the module

```bash
node v77/living/build.cjs
(cd v77 && sha256sum game.html)
```

After reviewing a change to the generated HTML, record its new digest in
`v77/game.sha256`. Run `sh v77/build.sh` to check the committed digest. The relay
compares the served bytes with that digest at startup.

---

## 5. Post-deploy smoke checklist

- `GET /health` (Render) → `200`, `configured:true` when the key is set, correct `sha256`.
- Open the site → title → Start → device → Play as guest → town loads.
- `☰ Menu (G)` → 📔 Passport / 📰 Herald / 🕮 Replay talks all open.
- Talk to a resident: with a key, AI replies (mood chip may appear); without a key, the
  header shows `Offline (rules)` and wishes still complete.
- Confirm the browser bundle contains **no** Gemini key (view source / network: the key
  never appears; only `{ model, body }` is posted to `/api/gemini`).
