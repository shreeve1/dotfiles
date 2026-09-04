#!/usr/bin/env bash
# dsh-repro/probes/docs-complete.sh
#
# Exit 0 iff:
#   1. dsh-repro/capture.sh parses with `bash -n`, AND
#   2. dsh-repro/README.md mentions `install-dsh.sh` (the one-command fresh
#      install is documented).
#
# Usage: docs-complete.sh [<readme> [<capture>]]
# Defaults: dsh-repro/README.md, dsh-repro/capture.sh (relative to cwd).

set -u

DEFAULT_README="dsh-repro/README.md"
DEFAULT_CAPTURE="dsh-repro/capture.sh"

README="${1:-$DEFAULT_README}"
CAPTURE="${2:-$DEFAULT_CAPTURE}"

if [ "$#" -gt 2 ]; then
  echo "usage: $0 [<readme> [<capture>]]" >&2
  exit 2
fi

fail=0

if [ ! -f "$CAPTURE" ]; then
  echo "MISSING capture script: $CAPTURE"
  fail=1
else
  if ! err=$(bash -n "$CAPTURE" 2>&1); then
    echo "bash -n FAILED for $CAPTURE: $err"
    fail=1
  fi
fi

if [ ! -f "$README" ]; then
  echo "MISSING README: $README"
  fail=1
else
  if ! grep -q -F 'install-dsh.sh' "$README"; then
    echo "README does not mention install-dsh.sh: $README"
    fail=1
  fi
fi

exit "$fail"