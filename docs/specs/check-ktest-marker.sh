#!/usr/bin/env bash
# Guard: docs/specs/ktest-marker.txt must exist and contain the exact line
# 'review-protocol-probe'. Exits 0 on match, non-zero otherwise.
set -euo pipefail

marker=docs/specs/ktest-marker.txt
needle='review-protocol-probe'

test -f "$marker"
grep -Fxq "$needle" "$marker"
