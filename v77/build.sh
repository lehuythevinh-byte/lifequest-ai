#!/bin/sh
set -eu
cd "$(dirname "$0")"
node build-listening.cjs
sha256sum -c game.sha256
node --check backend/server.cjs
