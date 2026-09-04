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

# Paths land in the prompt as absolute strings because the agent uses them
# literally. $HOME differs across this user's Linux box and Mac, so they are
# resolved at render time rather than baked into the tracked source.
boards="${BOARDS_DIR:-$HOME/.dsh-boards/$(basename "$repo")}"

# Substitution is done in python, not sed: a path containing `&` or the sed
# delimiter silently corrupts an s/// replacement (measured -- `/a & b/` came
# out with the placeholder re-inserted mid-path). str.replace has no such
# metacharacters, and an unsubstituted placeholder is a hard error rather than
# a prompt that looks fine and points somewhere that does not exist.
STAGE="$stage" STAGE_LC="${stage,,}" WORKSPACE_ID="$workspace_id" \
BOARDS="$boards" REPO="$repo" HOME_BASE="$(basename "$HOME")" HOME_DIR="$HOME" \
python3 - "$src" <<'PY'
import os, re, sys

text = open(sys.argv[1], encoding='utf-8').read()
for key, val in (
    ('STAGE_LC', os.environ['STAGE_LC']),
    ('STAGE', os.environ['STAGE']),
    ('WORKSPACE_ID', os.environ['WORKSPACE_ID']),
    ('BOARDS', os.environ['BOARDS']),
    ('REPO', os.environ['REPO']),
    ('HOME_BASE', os.environ['HOME_BASE']),
    ('HOME', os.environ['HOME_DIR']),
):
    text = text.replace('{{%s}}' % key, val)

left = re.findall(r'\{\{[A-Z_]+\}\}', text)
if left:
    sys.exit('render-preamble: unsubstituted placeholder(s): %s' % ', '.join(sorted(set(left))))

sys.stdout.write(text)
PY
