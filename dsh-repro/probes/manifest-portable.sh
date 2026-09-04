#!/usr/bin/env bash
# dsh-repro/probes/manifest-portable.sh
#
# Exit 0 iff the captured dsh-repro/profiles/web/package.json exists and
# contains NO `/home/james` paths and NO `file:` / `link:` specifiers.
#
# Grep-based; no writes outside this script's own temp dirs.
#
# Usage: manifest-portable.sh [<manifest-path>]
# Default path: dsh-repro/profiles/web/package.json (relative to cwd).

set -u

DEFAULT_MANIFEST="dsh-repro/profiles/web/package.json"
MANIFEST="${1:-$DEFAULT_MANIFEST}"

if [ "$#" -gt 1 ]; then
  echo "usage: $0 [<manifest-path>]" >&2
  exit 2
fi

fail=0

if [ ! -f "$MANIFEST" ]; then
  echo "MISSING manifest: $MANIFEST"
  fail=1
  exit "$fail"
fi

# /home/james absolute paths must NOT appear anywhere in the manifest.
if grep -q '/home/james' "$MANIFEST"; then
  echo "FOUND /home/james in $MANIFEST (manifest is not portable):"
  grep -n '/home/james' "$MANIFEST" | sed 's/^/  /'
  fail=1
fi

# `file:` and `link:` specs only resolve on the machine that wrote them; the
# portable manifest must use `github:` / npm versions instead.
if grep -E -q '"(file|link):' "$MANIFEST"; then
  echo "FOUND file:/link: spec in $MANIFEST:"
  grep -nE '"(file|link):' "$MANIFEST" | sed 's/^/  /'
  fail=1
fi

exit "$fail"