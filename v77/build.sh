#!/bin/sh
set -eu
cd "$(dirname "$0")"
cat parts/p*.txt > game.html
printf '%s  %s\n' a406c737942257140270081d87d5fd0d62af602df0c7c58e2f5fb8cae3b2013f game.html | sha256sum -c -
node --check backend/server.cjs
