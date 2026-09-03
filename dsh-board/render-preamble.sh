#!/usr/bin/env bash
# Render the shared tick preamble for one stage. ONE source, six renders —
# the six cron prompts must never be hand-copied or they drift into six
# subtly different contracts.
#
#   ./render-preamble.sh Build          > /tmp/tick-build.txt
#   for s in Spec Decompose Build Verify Review Merge; do ./render-preamble.sh "$s"; done

set -euo pipefail

stage="${1:?usage: render-preamble.sh <Spec|Decompose|Build|Verify|Review|Merge>}"

case "$stage" in
Spec | Decompose | Build | Verify | Review | Merge) ;;
*)
  printf 'not a pipeline stage: %s\n' "$stage" >&2
  exit 1
  ;;
esac

src="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/preamble.md"

sed -e "s/{{STAGE_LC}}/${stage,,}/g" -e "s/{{STAGE}}/${stage}/g" "$src"
