#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
node --experimental-strip-types --test "$ROOT/tests/fabric-auto-start.test.mjs"
