#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
GUARD="$ROOT/lib/gralph-worker-guard.js"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

FAKE_BIN="$TMPDIR/bin"
GH_LOG="$TMPDIR/gh.log"
PI_LOG="$TMPDIR/pi.log"
PROMPT_LOG="$TMPDIR/prompt.log"
RALPH_SKILL="$TMPDIR/ralph/SKILL.md"
mkdir -p "$FAKE_BIN" "$(dirname "$RALPH_SKILL")"
printf '%s\n' 'fixture Ralph instructions' >"$RALPH_SKILL"

cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
if [ "${1-} ${2-}" = "repo view" ]; then
  printf '%s\n' owner/repo
elif [ "${1-} ${2-}" = "api graphql" ]; then
  cat <<'JSON'
{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Implement fixture","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}}]}}}}}
JSON
elif [ "${1-} ${2-}" = "issue view" ]; then
  jq -n --arg verify "${FAKE_CHILD_VERIFY:-test -f worker-output.txt}" '{
    number:101,title:"Implement fixture",state:"OPEN",
    body:("## What to build\n\nCreate worker-output.txt.\n\n## Acceptance criteria\n\n- [ ] output exists\n\n## Verification\n\n`" + $verify + "`"),
    labels:[{name:"ready-for-agent"}]
  }'
elif [ "${1-} ${2-}" = "label create" ] || [ "${1-} ${2-}" = "issue edit" ]; then
  :
else
  echo "unexpected gh call: $*" >&2
  exit 90
fi
EOF
chmod +x "$FAKE_BIN/gh"

cat >"$FAKE_BIN/pi" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "HOME=$HOME" "PI_CODING_AGENT_DIR=${PI_CODING_AGENT_DIR-}" >>"$PI_LOG"
printf '%s\n' "$@" >>"$PI_LOG"
printf '%s' "${!#}" >"$PROMPT_LOG"
case "${FAKE_PI_SCENARIO:-success}" in
  success)
    printf '%s\n' implemented >worker-output.txt
    printf '%s\n' 'RALPH_RESULT: DONE #101'
    ;;
  no-status)
    printf '%s\n' implemented >worker-output.txt
    printf '%s\n' 'still working'
    ;;
  no-diff)
    printf '%s\n' 'RALPH_RESULT: DONE #101'
    ;;
  *) exit 91 ;;
esac
EOF
chmod +x "$FAKE_BIN/pi"

new_repo() {
  local dir="$1"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  cat >"$dir/verify-integration.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
test -f worker-output.txt
EOF
  chmod +x "$dir/verify-integration.sh"
  git -C "$dir" add verify-integration.sh
  git -C "$dir" commit -qm init
}

run_gralph() {
  local repo="$1"
  shift
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" GH_LOG="$GH_LOG" PI_LOG="$PI_LOG" PROMPT_LOG="$PROMPT_LOG" \
    GRALPH_RALPH_SKILL="$RALPH_SKILL" GRALPH_MAX_ITERATIONS="${GRALPH_MAX_ITERATIONS:-1}" \
    FAKE_PI_SCENARIO="${FAKE_PI_SCENARIO:-success}" FAKE_CHILD_VERIFY="${FAKE_CHILD_VERIFY:-test -f worker-output.txt}" \
    "$GRALPH" "$@")
}

plan_repo() {
  : >"$GH_LOG"
  run_gralph "$1" 42 --dry-run --verify 'bash verify-integration.sh' >/dev/null
}

expect_execution_failure() {
  local name="$1" repo="$2"
  if run_gralph "$repo" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/$name.out" 2>"$TMPDIR/$name.err"; then
    echo "FAIL: $name unexpectedly succeeded" >&2
    exit 1
  fi
  jq -e '.execution.status == "failed" and (.execution.reason | type == "string")' \
    "$repo/.gralph/runs/42/manifest.json" >/dev/null
}

# Successful child execution and all coordinator-owned completion gates.
REPO="$TMPDIR/success"
new_repo "$REPO"
BASE_SHA="$(git -C "$REPO" rev-parse HEAD)"
plan_repo "$REPO"
: >"$PI_LOG"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >/dev/null
[ "$(git -C "$REPO" rev-parse HEAD)" = "$BASE_SHA" ]
[ "$(git -C "$REPO" branch --show-current)" = master ]
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
WORKTREE="$(jq -r '.children[0].execution.worktree' "$MANIFEST")"
COMMIT="$(jq -r '.children[0].execution.commitSha' "$MANIFEST")"
jq -e --arg base "$BASE_SHA" --arg commit "$COMMIT" '
  .baseSha == $base and .dryRun == false and .execution.status == "complete"
  and .children[0].claim.label == "gralph:claimed"
  and .children[0].claim.status == "claimed"
  and .children[0].verificationCommand == "test -f worker-output.txt"
  and .children[0].execution.status == "complete"
  and .children[0].execution.startingSha == $base
  and .children[0].execution.commitSha == $commit
  and .children[0].execution.ralphComplete == true
  and .children[0].execution.clean == true
  and .children[0].execution.verificationExitCode == 0
' "$MANIFEST" >/dev/null
[ "$(git -C "$WORKTREE" rev-parse HEAD)" = "$COMMIT" ]
[ "$(git -C "$WORKTREE" rev-list --count "$BASE_SHA..$COMMIT")" -ge 1 ]
[ -z "$(git -C "$WORKTREE" status --porcelain)" ]
grep -q '^label create gralph:claimed ' "$GH_LOG"
grep -q '^issue edit 101 --add-label gralph:claimed$' "$GH_LOG"
for flag in -p --no-session --no-extensions -e --no-skills --skill --no-context-files --no-prompt-templates --no-themes --tools; do
  grep -Fx -- "$flag" "$PI_LOG" >/dev/null || { echo "FAIL: missing Pi flag $flag" >&2; exit 1; }
done
grep -Fx 'read,write,edit,grep,find,ls,gralph_check' "$PI_LOG" >/dev/null
! grep -Fx bash "$PI_LOG" >/dev/null
grep -F "Worktree: $WORKTREE" "$PROMPT_LOG" >/dev/null
grep -F 'Issue body and acceptance criteria:' "$PROMPT_LOG" >/dev/null
grep -F 'Prior iteration status:' "$PROMPT_LOG" >/dev/null
grep -E '^HOME=.*/\.gralph/runs/42/home-' "$PI_LOG" >/dev/null
grep -E '^PI_CODING_AGENT_DIR=.+/\.pi/agent$' "$PI_LOG" >/dev/null
! grep -E '^PI_CODING_AGENT_DIR=.*/\.gralph/' "$PI_LOG" >/dev/null

# Worker guard blocks escape and secret paths and runs only its admitted no-arg check.
GUARD_ROOT="$TMPDIR/guard-root"
OUTSIDE="$TMPDIR/outside"
mkdir -p "$GUARD_ROOT/safe" "$OUTSIDE"
printf secret >"$GUARD_ROOT/.env"
ln -s "$OUTSIDE" "$GUARD_ROOT/escape"
cp "$GUARD" "$TMPDIR/guard.mjs"
GRALPH_WORKTREE="$GUARD_ROOT" GRALPH_VERIFY_COMMAND='test -z "${GH_TOKEN-}" && test -z "${SSH_AUTH_SOCK-}" && printf guard-ok' \
  GH_TOKEN=secret SSH_AUTH_SOCK=/tmp/agent.sock node --input-type=module <<EOF
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const handlers = {};
let check;
const pi = {
  on(name, handler) { handlers[name] = handler; },
  registerTool(tool) { check = tool; },
};
const { default: guard } = await import(pathToFileURL("$TMPDIR/guard.mjs"));
guard(pi);
assert.equal(handlers.tool_call({ toolName: "read", input: { path: "safe" } }), undefined);
assert.equal(handlers.tool_call({ toolName: "write", input: { path: "escape/new.txt" } }).block, true);
assert.equal(handlers.tool_call({ toolName: "read", input: { path: ".env" } }).block, true);
assert.deepEqual(check.parameters.properties, {});
assert.equal(check.parameters.additionalProperties, false);
const result = await check.execute("id", {}, undefined);
assert.equal(result.details.exitCode, 0);
assert.match(result.content[0].text, /guard-ok/);
EOF

# Mechanical failures fail closed and preserve worktrees for inspection.
for scenario in no-status no-diff; do
  repo="$TMPDIR/$scenario"
  new_repo "$repo"
  plan_repo "$repo"
  FAKE_PI_SCENARIO="$scenario" expect_execution_failure "$scenario" "$repo"
  [ -n "$(git -C "$repo" branch --list 'gralph/42/issue-101')" ]
  [ -d "$(jq -r '.children[0].execution.worktree' "$repo/.gralph/runs/42/manifest.json")" ]
done

repo="$TMPDIR/verify-fail"
new_repo "$repo"
FAKE_CHILD_VERIFY=false plan_repo "$repo"
FAKE_CHILD_VERIFY=false expect_execution_failure verify-fail "$repo"
grep -q 'issue verification failed' "$TMPDIR/verify-fail.err"

# A live coordinator lock refuses duplicate execution before GitHub mutation.
repo="$TMPDIR/live-claim"
new_repo "$repo"
plan_repo "$repo"
lock="$repo/.gralph/runs/42/.coordinator-lock"
mkdir "$lock"
jq -n --arg host "$(hostname)" --argjson pid "$$" '{host:$host,pid:$pid}' >"$lock/owner.json"
if run_gralph "$repo" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/live.out" 2>"$TMPDIR/live.err"; then
  echo 'FAIL: live claim unexpectedly succeeded' >&2
  exit 1
fi
grep -q 'another live Gralph run owns child #101' "$TMPDIR/live.err"
! grep -q '^issue edit ' "$GH_LOG"

printf '%s\n' 'gralph single-child tests passed'
