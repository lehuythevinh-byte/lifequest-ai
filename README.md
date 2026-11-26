# LifeQuest AI V107 — Meaning Guardian
Claude deployment adapter. **Incomplete until the eight original HTML parts are uploaded.** Do not deploy before adding parts/p01.txt through p08.txt from the V107 deployment package. The build verifies the original SHA-256.
## Render
Use a Node web service or Blueprint (render.yaml). Build: sh build.sh. Start: node server.cjs. Health: /health. Set ANTHROPIC_API_KEY privately in Render, never in GitHub. CLAUDE_MODEL defaults to claude-haiku-4-5. Existing /api/gemini calls are adapted to Claude server-side. The request limit is per running instance and not a hard billing cap. No live Claude API test has been performed.
