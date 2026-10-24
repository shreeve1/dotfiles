#!/usr/bin/env bash
# The OpenCode V2 port of verify-final (.config/opencode/plugins/verify-final.ts),
# driven by a fake plugin ctx. The scenarios live in the .mjs so they also run on
# native Windows: node tests/opencode-verify-final.test.mjs
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v node >/dev/null || {
  echo "SKIP: node not installed"
  exit 0
}

exec node "$ROOT/tests/opencode-verify-final.test.mjs"
