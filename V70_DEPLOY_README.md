# LifeQuest AI V70 — Independent Render deployment

The full standalone HTML game from `LifeQuest_AI_V70_FULL_COMPLETE_PACKAGE(1).zip` is preserved byte-for-byte as **44 consecutive text segments** under `v70/parts`. GitHub upload was split to avoid the GitHub connector's maximum request size; this is one HTML game, not 44 web pages.

## Render Static Site settings

- Repository: https://github.com/lehuythevinh-byte/lifequest-ai.git
- Branch: `deploy/lifequest-v70-20261116`
- Runtime/type: **Static Site** (not Node.js)
- Build command:

```sh
mkdir -p public && test "$(find v70/parts -type f -name 'p*.txt' | wc -l)" -eq 44 && cat v70/parts/p*.txt > public/index.html && echo "8476d3b98ef3c133df6bc785956c19def9d036cccebbdb2acf52a31564f6ce21  public/index.html" | sha256sum -c -
```

- Publish path: `public`
- Auto-deploy: Yes

## Build integrity

The build checks that there are exactly 44 fragments, combines them in lexicographic order, then checks SHA-256 against the original V70 `index.html`:

```
8476d3b98ef3c133df6bc785956c19def9d036cccebbdb2acf52a31564f6ce21
```

If any fragment is missing or corrupted, the build fails instead of deploying an incomplete game. **Do not use the root Vite/React build on this branch**. The original `main` branch is unchanged.

The static site does not provision a backend or secret storage. Third-party API key integrations in the HTML must be configured separately.
