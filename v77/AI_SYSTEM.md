# AI System — LIFEQUEST AI V77

## Design goals (from the master prompt)

1. **Never leak the API key.** The key exists only in server environment variables.
2. **Validate AI output.** AI JSON is schema-checked; moods are whitelisted; text is escaped.
3. **Anti prompt-injection / no arbitrary code execution.** The relay strips tool/code fields.
4. **Rate limits, timeouts, and an honest fallback.** Offline rules are labelled, never disguised as AI.
5. **Student-safe content.** Short, classroom-appropriate prompts; capped output.

## Where the key lives

| Layer | Key present? |
|---|---|
| `game.html` / frontend JS | **No.** `GEMINI_API_KEY: ''` in the frontend config. |
| Browser network calls | **No.** The browser posts `{ model, body }` to `/api/gemini`. |
| Relay (`server.cjs` / `gemini.mjs`) | **Yes**, from `process.env.GEMINI_API_KEY`. |
| Relay → Google | Key sent in the **`x-goog-api-key` header**, never in the URL/query. |

The frontend `PROXY_URL` defaults to the relative `/api/gemini` (overridable via
`window.LIFEQUEST_AI_CONFIG.PROXY_URL`). The Supabase anon key in the base game is
public-by-design (row-level-security model) and was left intact; it is not the Gemini key.

## Request flow

```
chat (class ft) → window.LQGemini → POST /api/gemini { model, body }
   → relay: origin check → content-type → body cap → sanitize() → rate limit
   → fetch Google generateContent (header key, timeout, model fallback)
   → 200 upstream JSON  | safe error (4xx/5xx)
frontend: on success render AI reply (+ mood chip); on failure fall back to
   offline rules, header shows "Offline (rules)".
```

## The sanitizer (whitelist, both relays)

`sanitize()` rebuilds the request from **only** these fields:

- `contents`: 1–50 messages; each `role` must be `user` or `model`; each message has
  1–12 parts; **only `text` parts** are kept (any non-text part is rejected); each part
  ≤ 16 000 chars; total prompt ≤ 30 000 chars.
- `systemInstruction`: normalized to `{ parts: [{ text }] }` (string or object form).
- `generationConfig`: clamped —
  - `temperature` ∈ [0, 1.4], `topP` ∈ [0, 1], `topK` ∈ [1, 50],
  - `maxOutputTokens` ∈ [16, 768] (default 450),
  - `responseMimeType` only if `application/json`,
  - `responseSchema` only if an object < 10 000 chars.
- For `gemini-2.5-*` models, `thinkingConfig = { thinkingBudget: 0 }` (fast, cheap replies).

**Everything else is dropped**, including `tools`, `functionDeclarations`,
`safetySettings`, `cachedContent`, and any unknown top-level key. This is the
anti-injection / no-arbitrary-code-execution boundary: the model cannot be handed
tool/code execution instructions through the relay.

## Rate limits & resilience

| Control | Render (`server.cjs`) | Netlify (`gemini.mjs`) |
|---|---|---|
| Daily request cap | `AI_DAILY_REQUEST_LIMIT` (default 50, clamp 1–100) | same |
| Per-IP hourly cap | `AI_PER_IP_HOURLY_LIMIT` (default 12, clamp 1–30) | same |
| Concurrency cap | `MAX_ACTIVE = 2` | — (serverless) |
| Body cap | 64 KB | 64 KB |
| Google timeout | 27 s (`AbortController`) | 25 s (`AbortSignal.timeout`) |
| Model fallback | `GEMINI_MODEL` only | `GEMINI_MODEL` → `gemini-2.5-flash-lite` → `gemini-flash-latest` |
| Retry on | — | 503 / 429 / 404 → next model |
| Counter storage | in-memory (per process) | in-memory (ephemeral per instance) |

> Limitation: counters are in-memory. On Render they persist for the life of the
> process; on Netlify they reset on cold starts. For strict global limits, run the
> Render backend (or add a shared store later). This is documented, not hidden.

## Safe errors (no upstream leakage)

Upstream failures are mapped to generic messages so internal details never reach the
browser:
- 429 → "Gemini quota exceeded."
- 400 → "Gemini could not process this request."
- 401/403 → "Gemini credentials or permissions are invalid."
- other / timeout → "Gemini is temporarily unavailable." (502/504)

The relay never echoes the key, the raw upstream error body, or stack traces.

## CORS / origin allowlist

- Render: `ALLOWED_ORIGIN` (or the service's own `RENDER_EXTERNAL_URL`); localhost is
  allowed only when `NODE_ENV !== 'production'`. Foreign origins → **403**.
- Netlify: `ALLOWED_ORIGIN`, the site `URL`, and the request host. `OPTIONS` from a
  foreign origin → **403**; CORS headers are emitted **only** for allowed origins
  (no wildcard `*`).

## Honest fallback

When the relay has no key (503) or fails, the frontend switches to its built-in
**offline rules** provider (`lr`). The chat header explicitly shows **`Offline (rules)`**.
Offline replies:
- still complete resident wishes (keyword goals), grant XP/reputation, and update quests;
- show **no mood chip** (mood is AI-only and never fabricated);
- are never labelled as live AI.

## Mood chips (AI-reported, whitelisted)

- The Gemini `responseSchema` includes a `mood` enum:
  `happy, sad, confused, amused, curious, disagreeing, worried, formal, calm, neutral`.
- The system prompt asks the model to report the resident's mood.
- The frontend validates `mood` against the whitelist (`MOODS` set) before rendering a
  chip (`MOOD_ICON`). Unknown/missing moods render nothing.
- The transcript entry stores the validated `mood`; Replay shows it. Offline = no mood.

## Output handling (anti-XSS)

All AI- and user-derived strings rendered into panels/chat go through `esc()`
(HTML-entity escaping). No untrusted string is assigned via `innerHTML`. Word-click
lookups operate on text nodes, not injected markup.

## What is NOT implemented (deferred)

Group conversation, Dream Architect, Story Studio, Language Council, debate arena, and
other Phase 2+ AI systems from the master prompt are **not** in V77. The relay is ready
to support them, but no fake endpoints or placeholder UI were added.