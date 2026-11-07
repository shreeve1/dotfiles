#!/usr/bin/env bash
set -euo pipefail
# Hooks export repository-local variables; fixture Git commands must use their own repos.
while IFS= read -r name; do unset "$name"; done < <(git rev-parse --local-env-vars)
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/home/.pi/agent"
export HOME="$TMP/home" PATH="$TMP/bin:$PATH" HERDR_ENV=1 HERDR_WORKSPACE_ID=w1
unset DSH_SESSION_ID # only the dsh case below sets it
export MOCK_LOG="$TMP/calls" MOCK_STARTED="$TMP/started" MOCK_STATUS=working MOCK_STALLED=0 MOCK_UNREADABLE=0 MOCK_WT_FAIL=0
mkdir -p "$TMP/plain" "$TMP/Dotfiles"
git -C "$TMP/Dotfiles" init -q
git -C "$TMP/Dotfiles" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
REAL_CAT=$(command -v cat)
export REAL_CAT
printf 'A bounded task\n' >"$TMP/brief with spaces.md"
cat >"$TMP/bin/herdr" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$MOCK_LOG"
case "$1 $2" in
"tab create") printf '%s\n' '{"result":{"root_pane":{"pane_id":"w1:p2"}}}' ;;
"tab rename") ;;
"worktree create")
  [ "$MOCK_WT_FAIL" != 1 ] || { echo '{"error":{"code":"worktree_create_failed"}}'; exit 1; }
  printf '%s\n' '{"result":{"root_pane":{"pane_id":"wQ:p1","tab_id":"wQ:t1","workspace_id":"wQ"},"workspace":{"workspace_id":"wQ"},"worktree":{"path":"/wt/task-probe"}}}' ;;
"agent prompt")
  if [ "$MOCK_STALLED" = 1 ]; then echo agent_prompt_stalled; exit 1; fi
  ;;
"agent get")
  # Not found until started, unless MOCK_EXISTING names a live agent (as in herdr).
  [ -e "$MOCK_STARTED" ] || [ "${MOCK_EXISTING:-}" = "$3" ] || { echo '{"error":{"code":"agent_not_found"}}'; exit 1; }
  printf '{"result":{"agent":{"agent_status":"%s"}}}\n' "$MOCK_STATUS" ;;
"workspace list") printf '%s\n' '{"result":{"workspaces":[{"workspace_id":"w1","number":1,"label":"test","focused":true},{"workspace_id":"w5","number":2,"label":"bot","focused":false}]}}' ;;
"pane list") printf '{"result":{"panes":[{"workspace_id":"w5","cwd":"%s"}]}}\n' "${MOCK_PANE_CWD:-/nowhere}" ;;
"workspace create") printf '%s\n' '{"result":{"root_pane":{"pane_id":"w9:p1","workspace_id":"w9"}}}' ;;
"agent start") : >"$MOCK_STARTED" ;;
"agent send-keys" | "agent wait") ;;
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
  rm -f "$MOCK_STARTED"
  RC=0
  local mode=${1:-task} model=${2:-glm-5.3}
  [ "$#" -eq 0 ] || shift
  [ "$#" -eq 0 ] || shift
  OUT=$(cd "$TMP/plain" && bash "$ROOT/.agents/skills/herdr-handoff/scripts/spawn.sh" "$mode" "$TMP/brief with spaces.md" probe "$model" "$@" 2>&1) || RC=$?
}
no_tab() { ! grep -q '^tab create ' "$MOCK_LOG"; }
no_wt() { ! grep -q '^worktree create ' "$MOCK_LOG"; }
no_agent_start() { ! grep -q '^agent start ' "$MOCK_LOG"; }
error_case() {
  local name=$1 message=$2
  run_spawn task glm-5.3
  check "$name exits" test "$RC" -ne 0
  check "$name no tab" no_tab
  check "$name diagnostic" grep -Fq "$message" <<<"$OUT"
  check "$name safe diagnostic" test "${OUT#*SENSITIVE_FIXTURE}" = "$OUT"
}
# Model policy applies before any herdr calls, even to configured Claude IDs.
models
for mode in task handoff; do
  for model in claude-sonnet-5-5 claude-opus-5-5; do
    printf '%s\n' "{\"providers\":{\"cliproxy\":{\"models\":[{\"id\":\"$model\"}]}}}" >"$HOME/.pi/agent/models.json"
    run_spawn "$mode" "$model"
    check "$mode-$model-refused" test "$RC" -ne 0
    check "$mode-$model-no-herdr" test ! -s "$MOCK_LOG"
    check "$mode-$model-diagnostic" grep -Fq 'Claude models are disabled' <<<"$OUT"
  done
done
for model in gpt-6.1-sol gpt-6.1-terra gpt-6-luna glm-5.3; do
  printf '%s\n' "{\"providers\":{\"cliproxy\":{\"models\":[{\"id\":\"$model\"}]}}}" >"$HOME/.pi/agent/models.json"
  run_spawn task "$model"
  check "$model-allowed" test "$RC" -eq 0
  check "$model-exact" grep -Fq -- "--model cliproxy/$model" "$MOCK_LOG"
done
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
# Outside herdr: never the focused workspace; pane cwd match, explicit override, else a new workspace.
outside_spawn() {
  : >"$MOCK_LOG"
  rm -f "$MOCK_STARTED"
  RC=0
  OUT=$(cd "$TMP/plain" && env -u HERDR_ENV -u HERDR_WORKSPACE_ID "$@" bash "$ROOT/.agents/skills/herdr-handoff/scripts/spawn.sh" task "$TMP/brief with spaces.md" probe glm-5.3 2>&1) || RC=$?
}
outside_spawn
check outside-new-workspace test "$RC" -eq 0
check outside-new-workspace-created grep -q '^workspace create .*--no-focus' "$MOCK_LOG"
check outside-not-focused no_tab
outside_spawn MOCK_PANE_CWD="$TMP/plain"
check outside-pane-cwd grep -q '^tab create --workspace w5 ' "$MOCK_LOG"
outside_spawn HERDR_HANDOFF_WORKSPACE=w5
check outside-override grep -q '^tab create --workspace w5 ' "$MOCK_LOG"
outside_spawn HERDR_HANDOFF_WORKSPACE=w404
check outside-override-missing test "$RC" -ne 0
check outside-override-missing-no-tab no_tab
# A dsh session inherits HERDR_ENV from the pane that started dsh; it still counts as outside herdr.
run_spawn_dsh() {
  : >"$MOCK_LOG"
  rm -f "$MOCK_STARTED"
  RC=0
  OUT=$(cd "$TMP/plain" && DSH_SESSION_ID=session-x HERDR_PANE_ID=w1:p9 bash "$ROOT/.agents/skills/herdr-handoff/scripts/spawn.sh" handoff "$TMP/brief with spaces.md" probe glm-5.3 2>&1) || RC=$?
}
run_spawn_dsh
check dsh-ok test "$RC" -eq 0
check dsh-new-workspace grep -q '^workspace create .*--no-focus' "$MOCK_LOG"
check dsh-not-current-workspace no_tab
# Git tasks share the current checkout unless isolation was explicitly requested.
repo_spawn() {
  local mode=$1
  shift
  local args=()
  if [ "${1:-}" = --worktree ]; then
    args=(--worktree)
    shift
  fi
  : >"$MOCK_LOG"
  rm -f "$MOCK_STARTED"
  RC=0
  OUT=$(cd "${MOCK_REPO_DIR:-$TMP/Dotfiles}" && env "$@" bash "$ROOT/.agents/skills/herdr-handoff/scripts/spawn.sh" "$mode" "$TMP/brief with spaces.md" fix-sync-timeout glm-5.3 "${args[@]}" 2>&1) || RC=$?
}
git_spawn() { repo_spawn task "$@"; }
git_spawn
check git-default-ok test "$RC" -eq 0
check git-default-no-worktree no_wt
check git-default-cwd grep -Fq -- "--cwd $TMP/Dotfiles" "$MOCK_LOG"
check git-default-output grep -Fq 'worktree=- branch=-' <<<"$OUT"
check git-default-prompt grep -Fq 'Do not create a worktree or switch branches' "$MOCK_LOG"
printf 'parent work\n' >"$TMP/Dotfiles/uncommitted.txt"
git_spawn HERDR_HANDOFF_WORKSPACE=w5
check git-shared-workspace test "$RC" -eq 0
check git-shared-workspace-placement grep -Fq 'tab create --workspace w5 ' "$MOCK_LOG"
check git-shared-preserves-files grep -Fxq 'parent work' "$TMP/Dotfiles/uncommitted.txt"
repo_spawn handoff
check git-handoff-ok test "$RC" -eq 0
check git-handoff-no-worktree no_wt
check git-handoff-cwd grep -Fq -- "--cwd $TMP/Dotfiles" "$MOCK_LOG"
check git-handoff-focus grep -Fq -- '--focus' "$MOCK_LOG"
git -C "$TMP/Dotfiles" worktree add -q -b existing-task "$TMP/existing-task"
MOCK_REPO_DIR="$TMP/existing-task" git_spawn
check linked-checkout-ok test "$RC" -eq 0
check linked-checkout-no-new-worktree no_wt
check linked-checkout-cwd grep -Fq -- "--cwd $TMP/existing-task" "$MOCK_LOG"
for option in --worktree --unknown; do
  run_spawn task glm-5.3 "$option"
  check "invalid-option-$option" test "$RC" -ne 0
  check "invalid-option-no-tab-$option" no_tab
  check "invalid-option-no-worktree-$option" no_wt
done
repo_spawn handoff --worktree
check handoff-worktree-refused test "$RC" -ne 0
check handoff-worktree-no-tab no_tab
check handoff-worktree-no-worktree no_wt
run_spawn task glm-5.3 --worktree --extra
check extra-option-refused test "$RC" -ne 0
check extra-option-no-tab no_tab
# Explicit task isolation keeps the existing worktree launch and recovery contract.
git_worktree_spawn() { git_spawn --worktree "$@"; }
git_worktree_spawn
check wt-ok test "$RC" -eq 0
check wt-create-args grep -Fxq "worktree create --label dotfiles-fix-sync-timeout --branch task/fix-sync-timeout --cwd $TMP/Dotfiles --base $(git -C "$TMP/Dotfiles" rev-parse HEAD) --no-focus" "$MOCK_LOG"
check wt-pi-in-root-pane grep -Fq 'agent start dotfiles-fix-sync-timeout --kind pi --pane wQ:p1 -- --model cliproxy/glm-5.3' "$MOCK_LOG"
check wt-no-extra-tab no_tab
check wt-no-extra-workspace test "$(grep -c '^workspace create ' "$MOCK_LOG")" -eq 0
check wt-tab-renamed grep -Fxq 'tab rename wQ:t1 dotfiles-fix-sync-timeout' "$MOCK_LOG"
check wt-prompt-says-in-worktree grep -Fq 'already in a dedicated git worktree at /wt/task-probe on branch task/fix-sync-timeout' "$MOCK_LOG"
check wt-prompt-forbids-new grep -Fq 'Do not create another worktree' "$MOCK_LOG"
check wt-output-ids grep -Fq 'workspace_id=wQ tab_id=wQ:t1 worktree=/wt/task-probe branch=task/fix-sync-timeout' <<<"$OUT"
git_worktree_spawn HERDR_HANDOFF_BOT=Dotfiles-Bot
check wt-bot-override grep -Fq -- '--label dotfiles-bot-fix-sync-timeout ' "$MOCK_LOG"
git_worktree_spawn HERDR_HANDOFF_BOT=averyveryveryverylongbotnameX
check wt-bot-too-long test "$RC" -ne 0
check wt-bot-too-long-no-worktree no_wt
git_worktree_spawn HERDR_HANDOFF_WORKSPACE=w5
check wt-workspace-env-refused test "$RC" -ne 0
check wt-workspace-env-no-worktree no_wt
git_worktree_spawn MOCK_EXISTING=dotfiles-fix-sync-timeout
check wt-existing-agent-reused test "$RC" -ne 0
check wt-existing-agent-no-worktree no_wt
git_worktree_spawn MOCK_WT_FAIL=1
check wt-create-failure test "$RC" -ne 0
check wt-create-failure-no-agent no_agent_start
# A bot whose name leaves only a 32-character label still gets one that keeps the "<bot>-" prefix tab-watch greps.
git_worktree_spawn HERDR_HANDOFF_BOT=itastack-dev
check wt-prefix-kept grep -Fq -- '--label itastack-dev-fix-sync-timeout ' "$MOCK_LOG"
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
handoff="$ROOT/.agents/skills/herdr-handoff/SKILL.md"
review="$ROOT/.agents/skills/independent-review/SKILL.md"
for model in gpt-6.1-sol gpt-6.1-terra gpt-6-luna glm-5.3; do
  check "handoff-doc-$model" grep -Fq "$model" "$handoff"
done
check handoff-flexible-selection grep -Fq 'There is no default model' "$handoff"
check handoff-glm-priority grep -Fq 'Consider GLM-5.3 first' "$handoff"
check fanout-flexible-selection grep -Fq 'no fixed default' "$ROOT/.agents/skills/herdr-fanout/SKILL.md"
check review-no-claude-selection bash -c '! grep -Eq "cliproxy/(claude|anthropic)" "$1"' _ "$review"
check review-family-filter grep -Fq 'against the author families before launch' "$review"
check review-quick-family-filter grep -Fq 'Quick mode must also exclude the author family' "$review"
check fanout-no-claude grep -Fq 'No Claude models' "$ROOT/.agents/skills/herdr-fanout/SKILL.md"
printf 'herdr-fanout: %s passed, %s failed\n' "$PASS" "$FAIL"
test "$FAIL" -eq 0
