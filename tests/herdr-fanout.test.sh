#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/home/.pi/agent"
export HOME="$TMP/home" PATH="$TMP/bin:$PATH" HERDR_ENV=1 HERDR_WORKSPACE_ID=w1
export MOCK_LOG="$TMP/calls" MOCK_STATUS=working MOCK_STALLED=0 MOCK_UNREADABLE=0
REAL_CAT=$(command -v cat)
export REAL_CAT
printf 'A bounded task\n' >"$TMP/brief with spaces.md"
cat >"$TMP/bin/herdr" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$MOCK_LOG"
case "$1 $2" in
"tab create") printf '%s\n' '{"result":{"root_pane":{"pane_id":"w1:p2"}}}' ;;
"agent prompt")
  if [ "$MOCK_STALLED" = 1 ]; then echo agent_prompt_stalled; exit 1; fi
  ;;
"agent get") printf '{"result":{"agent":{"agent_status":"%s"}}}\n' "$MOCK_STATUS" ;;
"workspace list") printf '%s\n' '{"result":{"workspaces":[{"workspace_id":"w1","number":1,"label":"test"}]}}' ;;
"agent start" | "agent send-keys" | "agent wait") ;;
*) echo "unexpected mock herdr call: $*" >&2; exit 1 ;;
esac
MOCK
cat >"$TMP/bin/cat" <<'MOCK'
#!/usr/bin/env bash
if [ "$MOCK_UNREADABLE" = 1 ]; then exit 1; fi
exec "$REAL_CAT" "$@"
MOCK
chmod +x "$TMP/bin/herdr" "$TMP/bin/cat"
PASS=0 FAIL=0
check() {
  local name=$1
  shift
  if "$@"; then PASS=$((PASS + 1)); else
    echo "FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}
models() { printf '%s\n' '{"providers":{"cliproxy":{"models":[{"id":"gpt-6-luna"},{"id":"glm-5.3"}]}}}' >"$HOME/.pi/agent/models.json"; }
run_spawn() {
  : >"$MOCK_LOG"
  RC=0
  OUT=$(bash "$ROOT/.agents/skills/herdr-handoff/scripts/spawn.sh" "${1:-task}" "$TMP/brief with spaces.md" probe "${2:-glm-5.3}" 2>&1) || RC=$?
}
no_tab() { ! grep -q '^tab create ' "$MOCK_LOG"; }
error_case() {
  local name=$1 message=$2
  run_spawn task glm-5.3
  check "$name exits" test "$RC" -ne 0
  check "$name no tab" no_tab
  check "$name diagnostic" grep -Fq "$message" <<<"$OUT"
  check "$name safe diagnostic" test "${OUT#*SENSITIVE_FIXTURE}" = "$OUT"
}
models
run_spawn task gpt-6-luna
check installed-reviewer-model test "$RC" -eq 0
check exact-reviewer-model grep -Fq -- '--model cliproxy/gpt-6-luna' "$MOCK_LOG"
models
run_spawn task absent
check unknown-model-no-tab test "$RC" -ne 0
check unknown-no-tab no_tab
check unknown-diagnostic grep -Fq 'cliproxy/absent is not in' <<<"$OUT"
rm "$HOME/.pi/agent/models.json"
error_case missing-model-file-no-tab 'model file missing:'
models
MOCK_UNREADABLE=1
error_case unreadable-model-file-no-tab 'model file unreadable:'
MOCK_UNREADABLE=0
printf 'SENSITIVE_FIXTURE{' >"$HOME/.pi/agent/models.json"
error_case malformed-model-json-no-tab 'model file has malformed JSON:'
for json in '{}' '{"providers":{"cliproxy":{"models":{}}}}' '{"providers":{"cliproxy":{"models":[{"id":3}]}}}' '{"providers":{"cliproxy":{"models":[{}]}}}'; do
  printf '%s\n' "$json" >"$HOME/.pi/agent/models.json"
  error_case invalid-model-list-no-tab 'model file has invalid cliproxy model list:'
done
models
run_spawn task
check task-background test "$RC" -eq 0
check task-no-focus grep -Fq -- '--no-focus' "$MOCK_LOG"
run_spawn handoff
check handoff-focus test "$RC" -eq 0
check handoff-focus-flag grep -Fq -- '--focus' "$MOCK_LOG"
run_spawn invalid
check invalid-mode-no-tab test "$RC" -ne 0
check invalid-mode-no-tab-created no_tab
MOCK_STATUS=blocked
run_spawn task
check blocked-exit-2 test "$RC" -eq 2
check blocked-output grep -Fq 'status=blocked' <<<"$OUT"
MOCK_STATUS=working MOCK_STALLED=1
run_spawn task
check stalled-prompt-reuses-pane test "$RC" -eq 0
check stalled-one-pane test "$(grep -c '^tab create ' "$MOCK_LOG")" -eq 1
check stalled-enter grep -q '^agent send-keys .* enter$' "$MOCK_LOG"
check stalled-wait grep -q '^agent wait ' "$MOCK_LOG"
review_skill="$ROOT/.agents/skills/independent-review/SKILL.md"
check herdr-mode-reference grep -Fq 'references/herdr.md' "$review_skill"
check explicit-default-subagent grep -Fq 'Default: subagents' "$review_skill"
check default-launch-preserved grep -Fq 'Make exactly one top-level' "$review_skill"
check herdr-reference-exists test -f "$ROOT/.agents/skills/independent-review/references/herdr.md"
if [ -f "$ROOT/.agents/skills/independent-review/references/herdr.md" ]; then
  for anchor in 'Fresh initial review' 'Warm fix checks' 'standalone' 'parent releases' 'instruction-enforced' 'author families'; do
    check "review-contract $anchor" grep -Fq "$anchor" "$ROOT/.agents/skills/independent-review/references/herdr.md"
  done
fi
fanout="$ROOT/.agents/skills/herdr-fanout/SKILL.md"
contracts="$ROOT/.agents/skills/herdr-fanout/references/contracts.md"
check fanout-skill-exists test -f "$fanout"
check fanout-contracts-exist test -f "$contracts"
if [ -f "$fanout" ] && [ -f "$contracts" ]; then
  for anchor in 'name: herdr-fanout' 'explicitly' 'references/contracts.md' 'independent-review' 'herdr-handoff' 'three' 'high/medium' 'integration'; do
    check "fanout-contract $anchor" grep -Fq "$anchor" "$fanout"
  done
  for anchor in 'planned' 'working' 'ready' 'reviewing' 'fixing' 'blocked' 'accepted' 'released' 'handled IDs' 'session identity' 'separate worktrees' 'parent alone' 'round' 'replacement' 'not a sandbox'; do
    check "ledger-contract $anchor" grep -Fq "$anchor" "$contracts"
  done
fi
check finding-id-never-reused grep -Fq 'IDs are never reused' "$ROOT/.agents/skills/independent-review/references/herdr.md"
check replacement-findings-continue grep -Fq 'highest reserved number' "$ROOT/.agents/skills/independent-review/references/herdr.md"
check final-merge-fast-forward-only grep -Fq 'Final destination integration uses only `git merge --ff-only <candidate-tip>`' "$contracts"
check destination-race-blocks grep -Fq 'A failed fast-forward returns to candidate reassembly' "$contracts"
check sender-global-sequence grep -Fq 'one increasing counter per sender session across all workstreams' "$contracts"
check report-write-template-override grep -Fq "Replace the template's blanket read-only sentence" "$ROOT/.agents/skills/independent-review/references/herdr.md"
printf 'herdr-fanout: %s passed, %s failed\n' "$PASS" "$FAIL"
test "$FAIL" -eq 0
