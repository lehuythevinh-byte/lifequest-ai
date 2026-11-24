#!/bin/sh
set -eu
cd "$(dirname "$0")"
test "$(find parts -type f -name 'p*.txt' | wc -l)" -eq 13
cat parts/p*.txt > game.html
sha256sum -c game.sha256
node --check backend/server.cjs
