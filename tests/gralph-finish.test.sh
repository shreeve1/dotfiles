#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
REAL_PATH="$PATH"
export REAL_PATH

new_case() {
    CASE="$TMPDIR/$1"
    REPO="$CASE/repo"
    HOME_DIR="$CASE/home"
    FAKE_BIN="$CASE/bin"
    GH_LOG="$CASE/gh.log"
    PI_LOG="$CASE/pi.log"
    mkdir -p "$REPO" "$HOME_DIR/.claude/skills/finish-spec" "$FAKE_BIN"
    printf 'finish skill\n' >"$HOME_DIR/.claude/skills/finish-spec/SKILL.md"
    git -C "$REPO" init -q -b main
    git -C "$REPO" config user.name test
    git -C "$REPO" config user.email test@example.com
    printf 'base\n' >"$REPO/README"
    git -C "$REPO" add README
    git -C "$REPO" commit -qm base
    git init -q --bare "$CASE/origin.git"
    git -C "$REPO" remote add origin "$CASE/origin.git"
    git -C "$REPO" push -q -u origin main
    git -C "$REPO" checkout -qb gralph/42/batch
    printf 'merged\n' >"$REPO/batch"
    git -C "$REPO" add batch
    git -C "$REPO" commit -qm batch
    git -C "$REPO" push -q origin gralph/42/batch
    git -C "$REPO" checkout -q main
    git -C "$REPO" merge -q --no-ff gralph/42/batch -m merge
    git -C "$REPO" push -q origin main
    mkdir -p "$REPO/.gralph/runs/42"
    cat >"$REPO/.gralph/runs/42/manifest.json" <<'JSON'
{"schemaVersion":1,"parent":42,"integrationCommand":"bash tests/integration.sh","children":[{"number":101,"merge":{"status":"landed"}},{"number":102,"merge":{"status":"merged"}},{"number":103}],"orchestration":{"publication":{"prNumber":7,"batchBranch":"gralph/42/batch"}}}
JSON
    : >"$GH_LOG"
    : >"$PI_LOG"

    cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
if [ "${1-} ${2-}" = "pr view" ]; then printf '%s\n' "${FAKE_PR_STATE:-MERGED}"; exit 0; fi
if [ "${1-} ${2-}" = "issue view" ]; then
    child_num="${3-}"
    if [ "$child_num" = "42" ]; then printf '%s\n' "${FAKE_PARENT_STATE:-CLOSED}"; exit 0; fi
    if [ "${FAKE_OPEN_CHILD:-}" = "$child_num" ]; then printf '%s\n' OPEN; else printf '%s\n' CLOSED; fi
    exit 0
fi
if [ "${1-} ${2-}" = "repo view" ]; then printf '%s\n' main; exit 0; fi
echo "unexpected gh: $*" >&2
exit 90
EOF
    chmod +x "$FAKE_BIN/gh"

    cat >"$FAKE_BIN/pi" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >"$PI_LOG"
printf '\n' >>"$PI_LOG"
exit "${FAKE_PI_RC:-0}"
EOF
    chmod +x "$FAKE_BIN/pi"
}

run_finish() {
    (cd "$REPO" && HOME="$HOME_DIR" PATH="$FAKE_BIN:$REAL_PATH" GH_LOG="$GH_LOG" PI_LOG="$PI_LOG" \
        FAKE_PR_STATE="${FAKE_PR_STATE:-MERGED}" FAKE_OPEN_CHILD="${FAKE_OPEN_CHILD:-}" FAKE_PARENT_STATE="${FAKE_PARENT_STATE:-CLOSED}" \
        FAKE_PI_RC="${FAKE_PI_RC:-0}" "$GRALPH" finish 42)
}

expect_fail() {
    local name="$1" expected="$2"
    if run_finish >"$CASE/out" 2>"$CASE/err"; then
        echo "FAIL: $name should fail" >&2
        exit 1
    fi
    grep -q "$expected" "$CASE/err"
    [ ! -s "$PI_LOG" ] || { echo "FAIL: $name launched Pi" >&2; exit 1; }
    return 0
}

new_case missing-manifest
rm "$REPO/.gralph/runs/42/manifest.json"
expect_fail missing-manifest 'saved frontier missing'

new_case unmerged-pr
FAKE_PR_STATE=OPEN
expect_fail unmerged-pr 'batch PR #7 is not merged'
unset FAKE_PR_STATE

new_case open-child
FAKE_OPEN_CHILD=102
expect_fail open-child 'landed child #102 is not closed'
unset FAKE_OPEN_CHILD

new_case default-lacks-merge
git -C "$REPO" push -q --force origin "$(git -C "$REPO" rev-list --max-parents=0 HEAD):main"
expect_fail default-lacks-merge 'does not contain gralph/42/batch'

new_case wrong-branch
git -C "$REPO" checkout -qb not-main
expect_fail wrong-branch "current checkout is 'not-main', expected 'main'"
git -C "$REPO" checkout -q main

new_case stale-local
git -C "$REPO" reset -q --hard HEAD~1
expect_fail stale-local 'local main is behind origin/main'
git -C "$REPO" merge -q --no-ff origin/main -m merge

new_case dirty
printf 'dirty\n' >>"$REPO/README"
expect_fail dirty 'checkout is dirty'

new_case missing-skill
rm "$HOME_DIR/.claude/skills/finish-spec/SKILL.md"
expect_fail missing-skill 'finish-spec skill missing'

new_case pi-failure
FAKE_PI_RC=9
if run_finish >"$CASE/out" 2>"$CASE/err"; then
    echo 'FAIL: Pi failure should propagate' >&2
    exit 1
fi
unset FAKE_PI_RC
grep -q 'finish-spec Pi process exited 9' "$CASE/err"
jq -e '.orchestration.finish.status == "failed" and .orchestration.finish.reason == "pi_failed" and .orchestration.finish.prNumber == 7 and .orchestration.finish.piExitCode == 9' "$REPO/.gralph/runs/42/manifest.json" >/dev/null

new_case parent-left-open
FAKE_PARENT_STATE=OPEN
if run_finish >"$CASE/out" 2>"$CASE/err"; then
    echo 'FAIL: parent left open should exit non-zero' >&2
    exit 1
fi
unset FAKE_PARENT_STATE
grep -q 'parent #42 remained OPEN' "$CASE/err"
jq -e '.orchestration.finish.status == "parent_left_open" and .orchestration.finish.parentState == "OPEN"' "$REPO/.gralph/runs/42/manifest.json" >/dev/null

new_case success
run_finish >"$CASE/out" 2>"$CASE/err"
grep -q '^Finished parent #42 via batch PR #7$' "$CASE/out"
grep -q -- '--no-session' "$PI_LOG"
grep -q -- '--no-extensions' "$PI_LOG"
grep -q -- '--no-skills' "$PI_LOG"
grep -q -- "--skill $HOME_DIR/.claude/skills/finish-spec/SKILL.md" "$PI_LOG"
grep -q -- '--tools' "$PI_LOG"
grep -q -- 'read' "$PI_LOG"
grep -q -- 'write' "$PI_LOG"
grep -q -- 'edit' "$PI_LOG"
grep -q -- 'grep' "$PI_LOG"
grep -q -- 'find' "$PI_LOG"
grep -q -- 'ls' "$PI_LOG"
# Prompts are shell-escaped in the fake log; assert the stable content tokens.
grep -q 'Parent.*issue.*#42' "$PI_LOG"
grep -q 'Batch.*PR.*#7' "$PI_LOG"
grep -q 'Landed.*children.*101,102' "$PI_LOG"
grep -q 'Integration.*command.*bash.*tests/integration.sh' "$PI_LOG"
grep -q 'Run.*manifest.*.gralph/runs/42/manifest.json' "$PI_LOG"
grep -q 'run.*integration.*suite' "$PI_LOG"
jq -e '.orchestration.finish.status == "completed" and .orchestration.finish.prNumber == 7 and .orchestration.finish.piExitCode == 0' "$REPO/.gralph/runs/42/manifest.json" >/dev/null
# Finish delegates closure; it never mutates issues directly.
if grep -Eq '^issue (close|edit)' "$GH_LOG"; then
    echo 'FAIL: finish mutated an issue directly' >&2
    exit 1
fi

new_case invalid-parent
if (cd "$REPO" && HOME="$HOME_DIR" PATH="$FAKE_BIN:$REAL_PATH" "$GRALPH" finish nope) >"$CASE/out" 2>"$CASE/err"; then
    echo 'FAIL: non-numeric parent should fail' >&2
    exit 1
fi
grep -q 'parent issue must be numeric' "$CASE/err"
[ ! -s "$PI_LOG" ]

printf '%s\n' 'gralph finish tests passed'
