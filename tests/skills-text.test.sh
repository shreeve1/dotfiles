#!/usr/bin/env bash
# The shepherd and merge skills are prose that agents execute. Check the commands in
# them carry the scope the skill itself says they must (review finding 6), and that
# the slug rule is stated the same way everywhere (finding 10).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SK="$ROOT/.agents/skills"
PASS=0; FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() { FAILN=$((FAILN + 1)); echo "FAIL: $1" >&2; if [ -n "${2-}" ]; then echo "  $2" >&2; fi; }

SH="$SK/tralph-shepherd/SKILL.md"

# Every command that (re)launches the loop or tralph must carry $SPEC_ARGS.
while IFS= read -r line; do
  case "$line" in
    *'$SPEC_ARGS'*) ok ;;
    *) fail "shepherd launch command is unscoped" "$line" ;;
  esac
done < <(grep -nE 'ralph-loop\.sh [^$]*tmux|tralph --jobs' "$SH" | grep -E 'zsh -lic|proj=' )
n="$(grep -cE 'zsh -lic .*(ralph-loop\.sh|tralph)' "$SH")"
[ "$n" -ge 3 ] && ok || fail "expected >=3 shepherd launch commands, found $n"

# No board-wide blocked scan: scans must go through board.sh or a spec-aware helper.
if grep -nE "grep -l '\^status: blocked\\$' \.kanban/issues/\*\.md" "$SH" >/dev/null; then
  fail "shepherd still enumerates blocked tickets board-wide" "$(grep -nE "grep -l '\^status: blocked\\$' \.kanban/issues/\*\.md" "$SH" | head -3)"
else ok; fi
grep -q 'blocked_files()' "$SH" && ok || fail "shepherd defines a scoped blocked_files helper"

# The slug rule is stated the same everywhere: not all digits.
for f in "$SK/to-spec/SKILL.md" "$SK/setup-matt-pocock-skills/issue-tracker-local.md" "$SK/tralph-shepherd/SKILL.md"; do
  if grep -qiE 'not all digits|not purely numeric|never all digits|must contain a letter' "$f"; then ok; else fail "slug rule (not all digits) stated in $(basename "$(dirname "$f")")/$(basename "$f")"; fi
done

echo "skills-text: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
