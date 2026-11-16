# LifeQuest AI V70 — deployment branch

This branch is reserved for the standalone LifeQuest AI V70 static build, independent from the existing Vite/React application on `main`.

## Required upload
Upload the extracted **V70** `index.html` from the user-provided `LifeQuest_AI_V70_FULL_COMPLETE_PACKAGE(1).zip` to:

`v70/index.html`

**Do not upload the full 8 MB ZIP as the web root, and do not upload BACKUPS/PREVIEWS in place of the release.** The V70 `index.html` is approximately 4.3 MB. The build intentionally fails unless this file exists, to avoid publishing the old app by accident.

## Create a *new* Render Static Site
- Repository: `https://github.com/lehuythevinh-byte/lifequest-ai`
- Branch: `deploy/lifequest-v70-20261116`
- Type: **Static Site**
- Build command: `mkdir -p public && test -s v70/index.html && cp v70/index.html public/index.html`
- Publish directory: `public`
- Auto deploy: `yes`

A matching `render.yaml` is included as an optional Blueprint reference.

The static site serves the V70 HTML/CSS/JS game. External services (Supabase, AI APIs, and third-party CDNs) are separate integrations; deploying a static site does not provision those services or secure API keys.
