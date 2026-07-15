#!/usr/bin/env bash
# block-path-access — block writes to secret material (exit 2). Writes-only:
# guards .env family, *.pem, id_rsa, *.key/*.keystore (catches symphony-host.env
# via *.env). Outside-root/symlink-escape block intentionally removed (operator
# choice): out-of-tree writes (/tmp, other repos) are allowed. Fires in Claude
# (PreToolUse Edit|Write|MultiEdit) and Pi, reading { tool_name, tool_input:{
# file_path } } on stdin. Deterministic.
set -u
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[ -z "$path" ] && exit 0

base=$(basename "$path")

write_block=( ".env" ".env.*" "*.env" "*.pem" "id_rsa" "*.key" "*.keystore" )
write_allow=( ".env.example" ".env.sample" ".env.template" )

matches() { local cand="$1"; shift; local p; for p in "$@"; do case "$cand" in $p) return 0;; esac; done; return 1; }

case "$tool" in
  Edit|Write|MultiEdit)
    if matches "$base" "${write_allow[@]}"; then exit 0; fi
    if matches "$base" "${write_block[@]}"; then
      echo "Blocked by harness-gate: writes to protected path '$base' are blocked." >&2
      exit 2
    fi ;;
esac
exit 0
