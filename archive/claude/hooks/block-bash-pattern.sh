#!/usr/bin/env bash
# block-bash-pattern — hard-block (exit 2) catastrophic filesystem/device wipes
# and tampering with the harness gate machinery. Fires in Claude (PreToolUse
# Bash) and Pi. Reads {tool_input:{command}} on stdin.
# Blocking is intentional here: these commands are never part of legitimate
# autonomous coding (unlike pre-git test hooks, which are advisory). Operator
# maintenance of the gates: create ~/.claude/.harness-unlock (or
# <project>/.claude/.harness-unlock) to lift the self-disarm arm.
# ponytail: literal absolute home paths at depth>=2 (e.g. /home/<user>) are not
# caught — agents use ~ / $HOME; whole system dirs and root ARE caught.
set -u
cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

unlocked() {
  [ -f "$HOME/.claude/.harness-unlock" ] && return 0
  [ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -f "$CLAUDE_PROJECT_DIR/.claude/.harness-unlock" ]
}
blk() { echo "Blocked by harness-gate: $1" >&2; exit 2; }

# --- Recursive-force delete of a catastrophic target (combined OR split flags) ---
if echo "$cmd" | grep -qE '(^|[;&|[:space:]])rm([[:space:]]|$)' \
   && echo "$cmd" | grep -qE '(^|[[:space:]])-[a-zA-Z]*r' \
   && echo "$cmd" | grep -qE '(^|[[:space:]])-[a-zA-Z]*f'; then
  if echo "$cmd" | grep -qE '[[:space:]](/|~|\$\{?HOME\}?|/(etc|usr|bin|sbin|lib|lib64|boot|var|opt|root|home|dev|sys|proc))(/?\*?)([[:space:]]|$)'; then
    blk "recursive-force delete of a catastrophic path"
  fi
fi

# --- Raw device / filesystem destroyers ---
device_patterns=(
  'dd[[:space:]].*of=/dev/(sd|nvme|vd|hd|mmcblk|disk)'
  'mkfs(\.[a-z0-9]+)?[[:space:]]+.*/dev/'
  'wipefs[[:space:]].*/dev/'
  '(>|>>)[[:space:]]*/dev/(sd|nvme|vd|hd)'
)
for pat in "${device_patterns[@]}"; do
  echo "$cmd" | grep -qE "$pat" && blk "raw device write matches /$pat/"
done

# --- Self-disarm: tampering with the gate machinery (redirects / mutating verbs) ---
if ! unlocked; then
  gm='\.claude/(hooks/|settings\.json|settings\.local\.json)'
  echo "$cmd" | grep -qE "(>>?|[[:space:]]tee[[:space:]])[^;|]*$gm" \
    && blk "redirect writes to harness gate files (create .claude/.harness-unlock to maintain)"
  echo "$cmd" | grep -qE "(sed[[:space:]]+-i|(^|[[:space:]])(rm|mv|cp|install|truncate|chmod|chattr|ln)[[:space:]])[^;|]*$gm" \
    && blk "in-place edit/move of harness gate files (create .claude/.harness-unlock to maintain)"
fi
exit 0
