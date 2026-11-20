#!/bin/sh
set -eu
cd "$(dirname "$0")"
cat ember-ink/part-*.txt > game.html
sha256sum -c game.sha256
node --check backend/server.cjs
