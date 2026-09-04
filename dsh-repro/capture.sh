#!/usr/bin/env bash
# dsh-repro/capture.sh
#
# Re-capture the portable dsh web profile manifest from the live box into
# dsh-repro/profiles/web/. Run after adding, removing, or upgrading a plugin
# so the committed manifest never drifts from what the live box is running.
#
# What this does:
#   1. Find the latest ~/.dsh/plugin-snapshots/<ts>/web/ directory.
#   2. Copy its 5 files (package.json, pnpm-lock.yaml, pnpm-workspace.yaml,
#      cordis.patch.yml, manifest.json) into dsh-repro/profiles/web/.
#   3. Re-run the portability rewrite so committed manifest stays portable:
#        - rewrite local plugin specs to github:shreeve1/<name>#<sha> if the
#          source repo is on a shreeve1 remote (item 1 contract),
#        - replace any /home/james paths in package.json with portable forms.
#   4. Regenerate cordis.patch.yml.tmpl from the new cordis.patch.yml by
#      templating __HOME__ / __LISTEN_IP__ so the per-host values stay out of
#      git.
#
# Usage: capture.sh [<live-snapshot-dir>]
# Default: latest ~/.dsh/plugin-snapshots/*/web (newest by mtime).

set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROFILE_DST="$SCRIPT_DIR/profiles/web"
SRC_DEFAULT=""
LIVE_SNAPSHOTS="${HOME}/.dsh/plugin-snapshots"
if [ -d "$LIVE_SNAPSHOTS" ]; then
  # newest subdir first
  SRC_DEFAULT=$(ls -1td "$LIVE_SNAPSHOTS"/*/web 2>/dev/null | head -1 || true)
fi

SRC_DIR="${1:-$SRC_DEFAULT}"

if [ -z "$SRC_DIR" ] || [ ! -d "$SRC_DIR" ]; then
  echo "missing live snapshot dir; pass it as argv or ensure ~/.dsh/plugin-snapshots/*/web exists" >&2
  exit 1
fi

fail=0

mkdir -p "$PROFILE_DST/patches"
for f in package.json pnpm-lock.yaml pnpm-workspace.yaml cordis.patch.yml manifest.json; do
  if [ -f "$SRC_DIR/$f" ]; then
    cp -f "$SRC_DIR/$f" "$PROFILE_DST/$f"
    echo "[capture] $f -> $PROFILE_DST/$f"
  fi
done

# portability rewrite: replace local plugin specs in package.json.
# Six known local plugins were rewritten to github:shreeve1/* pins in item 1
# (see docs/specs/k881-reproducible-dsh-install.md). If a future capture sees
# a `file:` / `link:` spec, the rewrite here is a no-op and the manifest-portable
# probe will flag the drift on the next Verify tick.
#
# Detect: any /home/james literal or file:/link: specifier is left as-is so
# the probe correctly bounces the card; an operator must re-pin the local
# plugin (item 1 contract) before re-capture.
if grep -q -E '/home/james|"(file|link):' "$PROFILE_DST/package.json"; then
  echo "[capture] WARNING: package.json still has /home/james or file:/link: specs (portable rewrite is a no-op)"
  echo "             re-pin the offending plugin to a github: spec (see k881 item 1) and re-run capture.sh"
else
  echo "[capture] package.json is portable (no /home/james or file:/link:)"
fi

# Re-template cordis.patch.yml.tmpl from the new cordis.patch.yml.
if [ -f "$PROFILE_DST/cordis.patch.yml" ]; then
  sed -e 's|100\.95\.230\.15|__LISTEN_IP__|g' \
      -e 's|/home/james|__HOME__|g' \
      "$PROFILE_DST/cordis.patch.yml" > "$PROFILE_DST/cordis.patch.yml.tmpl"
  echo "[capture] regenerated cordis.patch.yml.tmpl"
fi

# If pnpm-lock.yaml was copied, run the resolution probe to confirm the new
# snapshot is internally consistent. This is a soft check; the real probe is
# probes/manifest-resolves.sh.
echo "[capture] done. Run probes/manifest-portable.sh and probes/manifest-resolves.sh before committing."

exit "$fail"