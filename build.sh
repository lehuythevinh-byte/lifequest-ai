#!/bin/sh
set -eu
cd "$(dirname "$0")"
test "$(find parts -type f -name 'p*.txt' | wc -l)" -eq 8
cat parts/p*.txt > game.html
sha256sum -c game.sha256
node --check server.cjs
node --check patch-claude.cjs
node patch-claude.cjs game.html
node --check remove-forgotten-valley.cjs
node remove-forgotten-valley.cjs game.html
node --check reply-first.cjs
node reply-first.cjs game.html
node --check dialogue-guard.cjs
node dialogue-guard.cjs game.html
node --check grammar-guard.cjs
node grammar-guard.cjs game.html
node --check rate-guard.cjs
node rate-guard.cjs game.html
