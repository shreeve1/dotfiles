#!/usr/bin/env bash
# block-bash-pattern — hard-block destructive filesystem wipes (exit 2).
# Restores the rm -rf /|~|$HOME carve-out lost to the unattended blanket
# modal auto-approve (symphony CLAUDE.md). Fires in Claude (PreToolUse Bash)
# and Pi (harness-gates adapter), reading {tool_input:{command}} on stdin.
# ponytail: matches the combined -rf/-fr flag form only; `rm -r -f /`
# (space-separated flags) is not caught — add a pattern here if that surfaces.
set -u
cmd=$(jq -r '.tool_input.command // empty')

flag='-[a-zA-Z]*(r[a-zA-Z]*f|f[a-zA-Z]*r)[a-zA-Z]*'
patterns=(
  "rm[[:space:]]+${flag}[[:space:]]+/([[:space:]*]|\$)"        # rm -rf /
  "rm[[:space:]]+${flag}[[:space:]]+~([[:space:]/]|\$)"        # rm -rf ~
  "rm[[:space:]]+${flag}[[:space:]]+\\\$(HOME|\{HOME\})"       # rm -rf $HOME / ${HOME}
)

for pat in "${patterns[@]}"; do
  if echo "$cmd" | grep -qE "$pat"; then
    echo "Blocked by harness-gate: destructive command matches /$pat/" >&2
    exit 2
  fi
done
exit 0
