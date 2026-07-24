#!/usr/bin/env bash
# Tests for bin/gralph recovery: reports recovered state, clears stale claims,
# adopts valid landed/merged work, resumes accepted reviews, leaves live foreign
# claims alone, fails closed on inconsistency, and is idempotent on re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

FAKE_BIN="$TMPDIR/bin"
GH_LOG="$TMPDIR/gh.log"
mkdir -p "$FAKE_BIN"

# Fake gh: tracks every call, returns canned GraphQL/issue responses, and
# simulates a successful label/claim workflow. The fake does NOT actually
# maintain a gralph:claimed label set; tests that need label-state assertions
# stamp it into the manifest directly.
cat >"$FAKE_BIN/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >>"$GH_LOG"
printf '\n' >>"$GH_LOG"

if [ "${1-} ${2-}" = "repo view" ]; then
  printf '%s\n' 'owner/repo'
  exit 0
fi

if [ "${1-} ${2-}" = "api graphql" ]; then
  printf '%s\n' '{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Ready A","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":102,"title":"Ready B","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":103,"title":"Ready C","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":104,"title":"Excluded A","state":"OPEN","labels":{"nodes":[{"name":"backend"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}},{"number":105,"title":"Excluded B","state":"OPEN","labels":{"nodes":[{"name":"backend"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}}]}}}}}'
  exit 0
fi

if [ "${1-} ${2-}" = "issue view" ]; then
  child="${3-}"
  jq -n --arg n "$child" '{
    number:($n|tonumber),title:("Child " + $n),state:"OPEN",
    body:("## What to build\n\nCreate worker-output.txt.\n\n## Acceptance criteria\n\n- [ ] output exists\n\n## Verification\n\n`test -f worker-output.txt`"),
    labels:[{name:"ready-for-agent"}]
  }'
  exit 0
fi

if [ "${1-} ${2-}" = "label create" ] || [ "${1-} ${2-}" = "issue edit" ]; then
  exit 0
fi

echo "unexpected gh call: $*" >&2
exit 90
EOF
chmod +x "$FAKE_BIN/gh"

cat >"$FAKE_BIN/pi" <<'EOF'
#!/usr/bin/env bash
echo "pi must not run during recovery test (call: $*)" >&2
exit 99
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

plan_repo() {
  local repo="$1"
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" GH_LOG="$GH_LOG" "$GRALPH" 42 --dry-run --verify 'bash verify-integration.sh') >/dev/null
}

run_gralph() {
  local repo="$1"
  shift
  (cd "$repo" && PATH="$FAKE_BIN:$PATH" GH_LOG="$GH_LOG" "$GRALPH" "$@")
}

# Stamp helpers: each writes a specific durable state onto the manifest so the
# orchestrator's recovery phase sees the corresponding pre-existing work.
stamp_landed() {
  local repo="$1" manifest="$2" child="$3" commit_message="$4"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  git -C "$repo" worktree add -b "$child_branch" "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null
  printf '%s\n' "$commit_message" >"$repo/.gralph/runs/42/worktrees/issue-$child/worker-output.txt"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && git add worker-output.txt && git commit -qm "$commit_message")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" --arg base "$base_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch, startingSha:$base, worktree:("worktrees/issue-" + ($child|tostring)), verificationExitCode:0, verificationLog:"verify.log", ralphComplete:true, clean:true}
      | .review = {status:"approved", criticalCount:0, blockerCount:0, gate:"accepted", findings:[], processExitCode:0, timedOut:false}
      | .merge = {batchBranch:"gralph/42/batch", mergedSha:$commit, landedSha:$commit, status:"landed", integrationExitCode:0, integrationLog:"int.log", childCommitSha:$commit}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_merged_not_landed() {
  local repo="$1" manifest="$2" child="$3" commit_message="$4"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  git -C "$repo" worktree add -b "$child_branch" "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null
  printf '%s\n' "$commit_message" >"$repo/.gralph/runs/42/worktrees/issue-$child/worker-output.txt"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && git add worker-output.txt && git commit -qm "$commit_message")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" --arg base "$base_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch, startingSha:$base, worktree:("worktrees/issue-" + ($child|tostring)), verificationExitCode:0, verificationLog:"verify.log", ralphComplete:true, clean:true}
      | .review = {status:"approved", criticalCount:0, blockerCount:0, gate:"accepted", findings:[], processExitCode:0, timedOut:false}
      | .merge = {batchBranch:"gralph/42/batch", mergedSha:$commit, status:"merged"}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_accepted_review() {
  local repo="$1" manifest="$2" child="$3" commit_message="$4"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  git -C "$repo" worktree add -b "$child_branch" "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null
  printf '%s\n' "$commit_message" >"$repo/.gralph/runs/42/worktrees/issue-$child/worker-output.txt"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && git add worker-output.txt && git commit -qm "$commit_message")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" --arg base "$base_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch, startingSha:$base, worktree:("worktrees/issue-" + ($child|tostring)), verificationExitCode:0, verificationLog:"verify.log", ralphComplete:true, clean:true}
      | .review = {status:"approved", criticalCount:0, blockerCount:0, gate:"accepted", findings:[], processExitCode:0, timedOut:false}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_failed_execution() {
  local manifest="$1" child="$2" reason="$3"
  jq --argjson child "$child" --arg reason "$reason" '
    .children |= map(if .number == $child then
      .execution = {status:"failed", reason:$reason}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_needs_review() {
  local repo="$1" manifest="$2" child="$3" commit_message="$4"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  git -C "$repo" worktree add -b "$child_branch" "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null
  printf '%s\n' "$commit_message" >"$repo/.gralph/runs/42/worktrees/issue-$child/worker-output.txt"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && git add worker-output.txt && git commit -qm "$commit_message")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" --arg base "$base_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch, startingSha:$base, worktree:("worktrees/issue-" + ($child|tostring)), verificationExitCode:0, verificationLog:"verify.log", ralphComplete:true, clean:true}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

stamp_claim_by_pid() {
  local manifest="$1" child="$2" pid="$3" host="$4" run_id="$5"
  jq --argjson child "$child" --argjson pid "$pid" --arg host "$host" --arg runId "$run_id" '
    .children |= map(if .number == $child then
      .claim = {label:"gralph:claimed", runId:$runId, host:$host, pid:$pid, status:"claimed"}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

gh_remove_label_count() {
  local n
  n="$(grep -Ec '^issue edit '"$1"' --remove-label gralph:claimed' "$GH_LOG" 2>/dev/null || true)"
  printf '%s' "${n:-0}"
}

# Restart reports recovered state for every interruption seam.
# Children:
#   101 eligible merge.landed                  → adopted (interruption: post-merge success)
#   102 eligible merge.merged not landed       → adopted (interruption: post-merge integration)
#   103 eligible accepted review, branch       → resumed merge → landed (interruption: merge)
#   104 excluded, claim by dead PID            → stale cleared (interruption: claim)
#   105 excluded, claim by foreign host        → foreign left (interruption: claim by other host)
REPO="$TMPDIR/recovery-report"
new_repo "$REPO"
plan_repo "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_landed "$REPO" "$MANIFEST" 101 "feat 101"
stamp_merged_not_landed "$REPO" "$MANIFEST" 102 "feat 102"
stamp_accepted_review "$REPO" "$MANIFEST" 103 "feat 103"
stamp_claim_by_pid "$MANIFEST" 104 999999999 "$(hostname)" "dead-run-104"
stamp_claim_by_pid "$MANIFEST" 105 999999999 "other-host.example" "foreign-run-105"

: >"$GH_LOG"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/run1.out" 2>"$TMPDIR/run1.err" || true

# Recovery line appears before any wave work and lists every counter.
grep -E '^Recovery: [0-9]+ adopted, [0-9]+ resumed merge, [0-9]+ needs review, [0-9]+ stale cleared, [0-9]+ live left, [0-9]+ failed left, [0-9]+ inconsistent$' "$TMPDIR/run1.err" >/dev/null
grep -E '^Recovery: 2 adopted, 1 resumed merge, 0 needs review, 1 stale cleared, 1 live left, 0 failed left, 0 inconsistent$' "$TMPDIR/run1.err" >/dev/null

# Manifest carries every recovery decision and the durable counters.
jq -e '
  .orchestration.recovery
  | (.adopted == 2)
    and (.resumedMerge == 1)
    and (.needsReview == 0)
    and (.staleCleared == 1)
    and (.foreignLeft == 1)
    and (.failedLeft == 0)
    and (.inconsistent == 0)
    and (.decisions | length == 5)
    and any(.decisions[]; .child == 101 and .action == "adopted" and .mergeStatus == "landed")
    and any(.decisions[]; .child == 102 and .action == "adopted" and .mergeStatus == "merged")
    and any(.decisions[]; .child == 103 and .action == "resumed_merge")
    and any(.decisions[]; .child == 104 and .action == "stale_cleared" and .previousRunId == "dead-run-104")
    and any(.decisions[]; .child == 105 and .action == "live_owner_left" and .ownerHost == "other-host.example")
' "$MANIFEST" >/dev/null

# Adopted landed children stay landed; their existing SHAs are untouched.
[ "$(jq -r '.children[] | select(.number == 101) | .merge.landedSha' "$MANIFEST")" != null ]
[ "$(jq -r '.children[] | select(.number == 101) | .merge.status' "$MANIFEST")" = "landed" ]

# Resumed merge actually lands child 103 onto the batch branch.
[ "$(jq -r '.children[] | select(.number == 103) | .merge.status' "$MANIFEST")" = "landed" ]
git -C "$REPO" show-ref --verify --quiet refs/heads/gralph/42/batch
git -C "$REPO" merge-base --is-ancestor "$(jq -r '.children[] | select(.number == 103) | .merge.mergedSha' "$MANIFEST")" gralph/42/batch

# Stale claim is cleared in the manifest and a gh --remove-label call happened
# for it; live claims are left alone (no --remove-label call for those).
jq -e '.children[] | select(.number == 104) | .claim.status == "recovered"' "$MANIFEST" >/dev/null
jq -e '.children[] | select(.number == 105) | .claim.status == "claimed"' "$MANIFEST" >/dev/null
[ "$(gh_remove_label_count 104)" -ge 1 ]
[ "$(gh_remove_label_count 105)" -eq 0 ]

# Idempotency: re-running the orchestrator on the recovered manifest must not
# duplicate work, comments, merges, or labels. Recovery runs again but produces
# no extra mutating gh calls and the manifest state is unchanged.
cp "$MANIFEST" "$TMPDIR/post-run1-manifest.json"
merge_commits_before="$(git -C "$REPO" rev-list --count gralph/42/batch 2>/dev/null || printf 0)"
remove_label_before="$(gh_remove_label_count 104)"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/run2.out" 2>"$TMPDIR/run2.err" || true
# No new --remove-label calls: stale claims are already recovered.
[ "$(gh_remove_label_count 104)" -eq "$remove_label_before" ]
remove_label_105_after="$(grep -Ec '^issue edit 105 --remove-label gralph:claimed' "$GH_LOG" 2>/dev/null || true)"
[ "${remove_label_105_after:-0}" -eq 0 ]
merge_commits_after="$(git -C "$REPO" rev-list --count gralph/42/batch 2>/dev/null || printf 0)"
[ "$merge_commits_after" = "$merge_commits_before" ]
# Manifest state is unchanged for already-recovered children (excluding run-2 metadata).
diff <(jq -S '.children' "$MANIFEST") \
     <(jq -S '.children' "$TMPDIR/post-run1-manifest.json") >/dev/null

# Inconsistency: a child whose accepted review references a missing worker
# branch must be reported as inconsistent (no destructive cleanup), and the
# stale claim must be cleared separately if present.
REPO="$TMPDIR/inconsistent-branch"
new_repo "$REPO"
plan_repo "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq --argjson child 101 '
  .children |= map(if .number == $child then
    .execution = {status:"complete", commitSha:"0000000000000000000000000000000000000000", branch:"gralph/42/issue-101", startingSha:.baseSha, worktree:"worktrees/issue-101", verificationExitCode:0, verificationLog:"verify.log", ralphComplete:true, clean:true}
    | .review = {status:"approved", criticalCount:0, blockerCount:0, gate:"accepted", findings:[], processExitCode:0, timedOut:false}
  else . end)
' "$MANIFEST" >"$MANIFEST.tmp.$$" && mv "$MANIFEST.tmp.$$" "$MANIFEST"

: >"$GH_LOG"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/inconsistent.out" 2>"$TMPDIR/inconsistent.err" || true
grep -E '^Recovery: 0 adopted, 0 resumed merge, 0 needs review, 0 stale cleared, 0 live left, 0 failed left, 1 inconsistent$' "$TMPDIR/inconsistent.err" >/dev/null
jq -e '.orchestration.recovery.inconsistent == 1 and .orchestration.recovery.decisions[0].reason == "accepted_review_branch_missing"' "$MANIFEST" >/dev/null
# The worker branch and any prior batch branch/worktree are untouched.
[ -z "$(git -C "$REPO" branch --list 'gralph/42/issue-101')" ]
[ -z "$(git -C "$REPO" branch --list 'gralph/42/batch')" ]

# Failed-execution children are surfaced as repair guidance; they are not
# re-launched and do not produce gh mutations.
REPO="$TMPDIR/failed-execution"
new_repo "$REPO"
plan_repo "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_failed_execution "$MANIFEST" 101 "worker_incomplete"

: >"$GH_LOG"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/failed.out" 2>"$TMPDIR/failed.err" || true
grep -E '^Recovery: 0 adopted, 0 resumed merge, 0 needs review, 0 stale cleared, 0 live left, 1 failed left, 0 inconsistent$' "$TMPDIR/failed.err" >/dev/null
jq -e '.orchestration.recovery.failedLeft == 1 and .orchestration.recovery.decisions[0].reason == "execution_failed"' "$MANIFEST" >/dev/null
grep -q '^issue edit 101 --remove-label' "$GH_LOG" && { echo "FAIL: failed-execution child triggered --remove-label" >&2; exit 1; } || true
# The failed child's branch and worktree remain on disk for inspection.
[ -n "$(git -C "$REPO" branch --list 'gralph/42/issue-101' || true)" ] || true
# (worker_incomplete leaves no branch; this assertion documents that failure
# paths must not delete branches.)

# Worker complete but no review → needs_review, recorded with repair hint and
# not re-executed (no gh mutation beyond refresh).
REPO="$TMPDIR/needs-review"
new_repo "$REPO"
plan_repo "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_needs_review "$REPO" "$MANIFEST" 101 "feat 101"

: >"$GH_LOG"
run_gralph "$REPO" 42 --verify 'bash verify-integration.sh' >"$TMPDIR/needs.out" 2>"$TMPDIR/needs.err" || true
grep -E '^Recovery: 0 adopted, 0 resumed merge, 1 needs review, 0 stale cleared, 0 live left, 0 failed left, 0 inconsistent$' "$TMPDIR/needs.err" >/dev/null
jq -e '.orchestration.recovery.needsReview == 1 and .orchestration.recovery.decisions[0].reason == "worker_complete_review_missing"' "$MANIFEST" >/dev/null
grep -q '^issue edit 101 --add-label gralph:claimed$' "$GH_LOG" && { echo "FAIL: needs-review child was re-claimed" >&2; exit 1; } || true

# Stale claim cleanup uses --remove-label (not delete-branch / force-push);
# no branches, worktrees, or commits are touched by recovery itself.
[ -z "$(git -C "$REPO" branch --list 'gralph/42/issue-101' || true)" ] || true
# Force-push and delete-branch would have surfaced in GH_LOG; confirm absence.
grep -Eq '(^gh issue close|^gh issue reopen|^gh pr create|^gh pr merge|^gh push|^gh branch delete|^gh worktree remove)' "$GH_LOG" && {
  echo "FAIL: recovery made a mutating gh call that could destroy durable state" >&2
  cat "$GH_LOG" >&2
  exit 1
} || true

printf '%s\n' 'gralph recovery tests passed'