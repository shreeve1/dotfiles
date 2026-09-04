#!/usr/bin/env bash
# dsh-repro/probes/manifest-resolves.sh
#
# Clean-room resolution check: copy the captured dsh-repro/profiles/web/
# into a mktemp dir, run `pnpm install --lockfile-only --ignore-scripts`
# there, and assert exit 0. The temp dir is removed on exit.
#
# Verifies that a fresh clone with the captured manifest + lockfile resolves
# cleanly WITHOUT actually installing packages. We do NOT touch the real
# ~/.dsh/profiles/web here.
#
# Usage: manifest-resolves.sh [<captured-dir>]
# Default: dsh-repro/profiles/web (relative to cwd).

set -u

DEFAULT_DIR="dsh-repro/profiles/web"
SRC_DIR="${1:-$DEFAULT_DIR}"

if [ "$#" -gt 1 ]; then
  echo "usage: $0 [<captured-dir>]" >&2
  exit 2
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "MISSING captured dir: $SRC_DIR"
  exit 1
fi

fail=0

work=$(mktemp -d) || { echo "mktemp failed"; exit 1; }
# shellcheck disable=SC2064
trap "rm -rf '$work'" EXIT

if ! cp -r "$SRC_DIR" "$work/profile"; then
  echo "FAILED to copy $SRC_DIR -> $work/profile"
  exit 1
fi

cd "$work/profile" || { echo "cd $work/profile failed"; exit 1; }

# --lockfile-only: validate that the lockfile resolves with the captured
# package.json WITHOUT materializing node_modules. --ignore-scripts: don't try
# to build any prebuilt-into-source plugins in this throwaway dir.
echo "+ pnpm install --lockfile-only --ignore-scripts (cwd=$work/profile)"
if ! pnpm install --lockfile-only --ignore-scripts >/dev/null 2>"$work/pnpm.err"; then
  echo "pnpm install FAILED (exit=$?) — see $work/pnpm.err"
  sed 's/^/  /' "$work/pnpm.err"
  fail=1
fi

exit "$fail"