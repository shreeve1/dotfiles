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

# The board's workspace id is MACHINE-LOCAL: dsh assigns a fresh UUID per
# registered workspace, so this repo cannot carry a literal one across the
# Linux/Mac sync. Resolve it here, at render time, from the live registry.
# Passing it explicitly is what makes a wrong-board write fail CLOSED --
# cwd resolution silently invents ~/.dsh-boards/<name>/board.json and then
# reports success. Override with WORKSPACE_ID=... to render for another board.
repo="${REPO_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
workspace_id="${WORKSPACE_ID:-$(
  python3 - "$repo" <<'PY'
import json, os, sys
path = os.path.realpath(sys.argv[1])
reg = os.path.expanduser('~/.dsh/storages/workspace.json')
try:
    ws = json.load(open(reg))['tables']['workspaces']
except Exception:
    sys.exit(0)
for wid, w in ws.items():
    if os.path.realpath(w.get('path', '')) == path:
        print(wid)
        break
PY
)}"

if [ -z "$workspace_id" ]; then
  printf 'no registered dsh workspace for %s -- open it in dsh once, or set WORKSPACE_ID=\n' "$repo" >&2
  exit 1
fi

sed -e "s/{{STAGE_LC}}/${stage,,}/g" \
  -e "s/{{STAGE}}/${stage}/g" \
  -e "s|{{WORKSPACE_ID}}|${workspace_id}|g" "$src"
