# Deployment Guide — LIFEQUEST AI V77

V77 ships two supported hosting paths. Both keep `GEMINI_API_KEY` **server-side only**.

> Important: the repository **root** `netlify.toml`, `render.yaml`, `server.ts`, and
> `netlify/functions/gemini.ts` belong to an older/other project (they contain merge
> conflict markers or an insecure relay). **Use the files under `v77/`** described here.

---

## 0. Put the source on GitHub

```bash
# from the project root
git add v77
git commit -m "LifeQuest V77 — Beyond Conversation (game, secure relay, docs)"
git push origin main
```

Never commit a real key. `.env.example` is a template only; real secrets go in the
host's environment settings. Add a `.gitignore` entry for `.env` if you create one locally.

---

## 1. Render (recommended: one service serves game + relay)

The Node relay uses **built-ins only** — no packages, no build step. It serves the
SHA-verified game and the `/api/gemini` proxy from the same origin (so CORS is simple).

### Option A — Blueprint
1. Copy `v77/render.yaml` to the **repository root** as `render.yaml` (Render reads
   blueprints from root), or point Render at it.
2. In Render: **New → Blueprint**, connect the repo.
3. Set the secret env var `GEMINI_API_KEY` in the dashboard (it is `sync: false` in the
   blueprint, so it is never stored in git).
4. Deploy. Health check: `/health`.

### Option B — Manual service
- **New → Web Service**, connect the repo.
- **Root Directory:** `v77`
- **Runtime:** Node
- **Build Command:** `echo "No build required"`
- **Start Command:** `node backend/server.cjs`
- **Health Check Path:** `/health`
- Environment:
  - `NODE_VERSION = 22.22.1`
  - `GEMINI_API_KEY = <your key>` (secret)
  - `GEMINI_MODEL = gemini-2.5-flash`
  - `AI_DAILY_REQUEST_LIMIT = 50`, `AI_PER_IP_HOURLY_LIMIT = 12`
  - `ALLOWED_ORIGIN` — leave unset for same-origin (game + relay on this service). Set
    it only if the frontend is hosted elsewhere.
  - `LQ77_SHA256` — leave unset to use the baked-in hash; set only if you rebuild.

Play at `https://<your-service>.onrender.com/`. The game probes `/api/gemini`; with a
key set, chat uses live AI; without it, chat honestly shows `Offline (rules)`.

---

## 2. Netlify (static game + secure Function)

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
# Full experience (game + relay), Node built-ins only:
GEMINI_API_KEY=your_key node v77/backend/server.cjs   # http://localhost:10000

# Offline-only (any static server):
cd v77 && python -m http.server 8080                   # http://localhost:8080/game.html
```

Localhost origins are allowed by the relay when `NODE_ENV !== 'production'`.

---

## 4. Rebuilding game.html after editing the module

```bash
node v77/inject-module.mjs                 # re-injects lq77-module.js into game.html
# compute the new SHA-256:
node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha256').update(f.readFileSync('v77/game.html')).digest('hex'))"
# update EXPECTED_SHA default in v77/backend/server.cjs (or set LQ77_SHA256 env), then restart.
```

The Render relay refuses to serve a file whose SHA does not match — this guards against
shipping a tampered or stale build.

---

## 5. Post-deploy smoke checklist

- `GET /health` (Render) → `200`, `configured:true` when the key is set, correct `sha256`.
- Open the site → title → Start → device → Play as guest → town loads.
- `☰ Menu (G)` → 📔 Passport / 📰 Herald / 🕮 Replay talks all open.
- Talk to a resident: with a key, AI replies (mood chip may appear); without a key, the
  header shows `Offline (rules)` and wishes still complete.
- Confirm the browser bundle contains **no** Gemini key (view source / network: the key
  never appears; only `{ model, body }` is posted to `/api/gemini`).