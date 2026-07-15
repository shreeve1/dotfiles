#!/usr/bin/env bash
# block-path-access — block writes to secret material and tampering with the
# harness gate machinery (exit 2). Writes-only. Fires in Claude (PreToolUse
# Edit|Write|MultiEdit) and Pi. Reads {tool_name, tool_input:{file_path}}.
# Outside-root/symlink-escape block removed (operator choice): out-of-tree
# writes allowed. Secret protection always applies; self-disarm protection of
# .claude/hooks/*.sh + .claude/settings*.json can be lifted for operator
# maintenance via ~/.claude/.harness-unlock or <project>/.claude/.harness-unlock.
set -u
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[ -z "$path" ] && exit 0
base=$(basename "$path")

write_block=( ".env" ".env.*" "*.env" "*.pem" "id_rsa" "*.key" "*.keystore" )
write_allow=( ".env.example" ".env.sample" ".env.template" )
matches() { local cand="$1"; shift; local p; for p in "$@"; do case "$cand" in $p) return 0;; esac; done; return 1; }
unlocked() {
  [ -f "$HOME/.claude/.harness-unlock" ] && return 0
  [ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -f "$CLAUDE_PROJECT_DIR/.claude/.harness-unlock" ]
}

case "$tool" in
  Edit|Write|MultiEdit)
    if ! matches "$base" "${write_allow[@]}"; then
      if matches "$base" "${write_block[@]}"; then
        echo "Blocked by harness-gate: writes to protected path '$base' are blocked." >&2
        exit 2
      fi
    fi
    if ! unlocked; then
      case "$path" in
        *.claude/hooks/*.sh|*/.claude/settings.json|*/.claude/settings.local.json|.claude/settings.json|.claude/settings.local.json)
          echo "Blocked by harness-gate: editing gate machinery '$path' is blocked (create .claude/.harness-unlock to maintain)." >&2
          exit 2 ;;
      esac
    fi ;;
esac
exit 0
