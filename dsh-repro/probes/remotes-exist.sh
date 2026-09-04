#!/usr/bin/env bash
# dsh-repro/probes/remotes-exist.sh
#
# Exit 0 iff every plugin source dir passed as argv has a GitHub remote
# at shreeve1/<basename> that resolves and is reachable.
#
# Usage: remotes-exist.sh <plugin-src-dir> [<plugin-src-dir> ...]
# With no args, checks the 3 known plugins under ~/.dsh/plugins-src.
#
# "Remote exists" = `gh repo view shreeve1/<name>` exits 0 AND
# `git -C <path> remote get-url origin` matches that remote.

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
      ;;
  esac
done

exit "$fail"
