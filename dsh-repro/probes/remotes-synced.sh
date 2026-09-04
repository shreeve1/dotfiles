#!/usr/bin/env bash
# dsh-repro/probes/remotes-synced.sh
#
# Exit 0 iff every plugin source dir passed as argv:
#   1. has a shreeve1/<name> remote (delegates to remotes-exist.sh logic),
#   2. is on master with HEAD == origin/master (no unpushed commits),
#   3. has a clean working tree (no dirty/untracked files).
#
# Usage: remotes-synced.sh <plugin-src-dir> [<plugin-src-dir> ...]
# With no args, checks the 3 known plugins under ~/.dsh/plugins-src.

set -u

DEFAULT_PLUGINS=(
  "$HOME/.dsh/plugins-src/dsh-fusion"
  "$HOME/.dsh/plugins-src/dsh-council"
  "$HOME/.dsh/plugins-src/dsh-learn-panel"
)

if [ "$#" -gt 0 ]; then
  PLUGINS=("$@")
else
  PLUGINS=("${DEFAULT_PLUGINS[@]}")
fi

fail=0
for path in "${PLUGINS[@]}"; do
  name=$(basename "$path")
  if ! gh repo view "shreeve1/$name" >/dev/null 2>&1; then
    echo "MISSING remote shreeve1/$name (path: $path)"
    fail=1
    continue
  fi
  origin_url=$(git -C "$path" remote get-url origin 2>/dev/null || true)
  case "$origin_url" in
    *shreeve1/$name*) ;;
    *)
      echo "REMOTE MISMATCH for $name: origin=$origin_url (expected shreeve1/$name)"
      fail=1
      continue
      ;;
  esac

  branch=$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo NONE)
  if [ "$branch" != "master" ] && [ "$branch" != "main" ]; then
    echo "BRANCH MISMATCH for $name: on '$branch', expected master or main"
    fail=1
    continue
  fi

  head=$(git -C "$path" rev-parse "$branch" 2>/dev/null || echo NONE)
  remote_head=$(git -C "$path" rev-parse "origin/$branch" 2>/dev/null || echo NONE)
  if [ "$head" != "$remote_head" ]; then
    echo "UNPUSHED for $name: local $head vs origin $remote_head"
    fail=1
    continue
  fi

  # --porcelain v1: 2 = untracked, 1 = staged, etc. Empty output = clean.
  if ! status_out=$(git -C "$path" status --porcelain 2>/dev/null); then
    echo "STATUS ERROR for $name (path: $path)"
    fail=1
    continue
  fi
  if [ -n "$status_out" ]; then
    echo "DIRTY for $name:"
    printf '  %s\n' $status_out
    fail=1
  fi
done

exit "$fail"
