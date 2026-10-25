#!/usr/bin/env bash
# Runs the drawio skill's node:test suite (server API, pages, controller).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node --test "$ROOT/.agents/skills/drawio/scripts/drawio.test.mjs"
