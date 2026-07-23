#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

GH_LOG="$TMPDIR/gh.log"
mkdir -p "$TMPDIR/bin"
PATH="$TMPDIR/bin:$PATH"

# gh is only needed for dry-run planning. The merge path itself does not call gh.
cat >"$TMPDIR/bin/gh" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$GH_LOG"
if [ "${1-} ${2-}" = "repo view" ]; then
  printf '%s\n' owner/repo
  exit 0
fi
if [ "${1-} ${2-}" = "api graphql" ]; then
  cat <<'JSON'
{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Implement fixture","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}}]}}}}}
JSON
  exit 0
fi
exit 0
EOF
chmod +x "$TMPDIR/bin/gh"

new_repo() {
  local dir="$1" integration_script="${2:-verify-integration.sh}"
  mkdir -p "$dir"
  git -C "$dir" init -q -b master
  git -C "$dir" config user.name test
  git -C "$dir" config user.email test@example.com
  printf 'fixture\n' >"$dir/README"
  cat >"$dir/$integration_script" <<EOF
#!/usr/bin/env bash
set -euo pipefail
test -f worker-output.txt
EOF
  chmod +x "$dir/$integration_script"
  git -C "$dir" add README "$integration_script"
  git -C "$dir" commit -qm init
}

# Plan a parent so a manifest exists, then manipulate the manifest directly to
# simulate reviewed workers in various states. The merge step does not call gh.
plan_manifest() {
  local repo="$1" integration="${2:-verify-integration.sh}"
  (cd "$repo" && PATH="$TMPDIR/bin:$PATH" GH_LOG="$GH_LOG" "$GRALPH" 42 --dry-run --verify "bash $integration") >/dev/null
}

# Source gralph into a fresh shell so merge_one_child is callable with a
# caller-prepared manifest. PARENT and REPO_ROOT must be exported before sourcing.
# The script's top-level arg parser exits when sourced with no positional args,
# so we run it under a stub function and discard the parser by stripping it.
# shellcheck disable=SC1090
source_gralph() {
  set +e
  local script="$GRALPH"
  local extracted
  extracted="$(awk '
    /^PARENT_ARG=/{ p=1 }
    !p
    /^case "\$PARENT_ARG" in/{ exit }
  ' "$script")"
  extracted="$(printf '%s\n' "$extracted" "$(sed -n '/^write_manifest() {/,/^}$/p' "$script")")"
  extracted="$(printf '%s\n' "$extracted" "$(sed -n '/^merge_one_child() {/,/^}$/p' "$script")")"
  set -e
  eval "$extracted"
}

# Stamp a manifest with a complete+accepted child whose worker branch exists
# on disk and contains a real diff against the recorded baseSha.
stamp_accepted_child() {
  local repo="$1" manifest="$2" child="$3" branch_name="$4" commit_message="$5" content_file="$6"
  local base_sha child_branch child_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  git -C "$repo" worktree add -b "$child_branch" "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null
  printf '%s\n' "$commit_message" >"$repo/.gralph/runs/42/worktrees/issue-$child/$content_file"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && git add "$content_file" && git commit -qm "$commit_message")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"complete", commitSha:$commit, branch:$branch, startingSha:.execution.startingSha}
      | .review = {status:"approved", criticalCount:0, blockerCount:0, gate:"accepted", findings:[], processExitCode:0, timedOut:false}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
  printf '%s\n' "$child_branch"
}

stamp_unreviewed_child() {
  local repo="$1" manifest="$2" child="$3" gate_value="$4"
  jq --argjson child "$child" --arg gate "$gate_value" '
    .children |= map(if .number == $child then
      .execution = ((.execution // {}) | . + {status:"complete"})
      | .review = ((.review // {}) | . + {status:"changes_requested", gate:$gate, criticalCount:0, blockerCount:0, findings:[]})
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
}

# Accepted merge: complete+reviewed child produces a non-fast-forward merge
# onto gralph/42/batch, runs the integration command, and records landed SHA.
REPO="$TMPDIR/accepted"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_accepted_child "$REPO" "$MANIFEST" 101 "branch-101" "implement 101" "worker-output.txt"
PARENT=42; export PARENT; REPO_ROOT="$REPO"; export REPO_ROOT; source_gralph
mkdir -p "$REPO/.gralph/runs/42"
if ! (cd "$REPO" && merge_one_child 101 "$MANIFEST" "$REPO/.gralph/runs/42" "$(jq -r '.baseSha' "$MANIFEST")" 'bash verify-integration.sh' "test-accepted-101" "gralph/42/issue-101" "$(jq -r '.children[0].execution.commitSha' "$MANIFEST")"); then
  echo "FAIL: accepted merge did not succeed" >&2
  exit 1
fi
git -C "$REPO" show-ref --verify --quiet refs/heads/gralph/42/batch
[ "$(git -C "$REPO" rev-parse gralph/42/batch)" = "$(jq -r '.children[0].merge.mergedSha' "$MANIFEST")" ]
jq -e '
  .execution.status == "landed"
  and .children[0].merge.status == "landed"
  and .children[0].merge.batchBranch == "gralph/42/batch"
  and (.children[0].merge.mergedSha | type == "string")
  and .children[0].merge.integrationExitCode == 0
  and (.children[0].merge.landedSha | type == "string")
' "$MANIFEST" >/dev/null
[ "$(git -C "$REPO" rev-list --count gralph/42/batch)" -ge 2 ]
parent_base="$(jq -r '.baseSha' "$MANIFEST")"
git -C "$REPO" merge-base --is-ancestor "$parent_base" gralph/42/batch
[ -n "$(git -C "$REPO" branch --list 'gralph/42/issue-101')" ]
[ -d "$REPO/.gralph/runs/42/worktrees/issue-101" ]
[ -n "$(git -C "$REPO" rev-list --count gralph/42/batch ^"$parent_base")" ]
[ -n "$(git -C "$REPO" rev-list --count gralph/42/batch ^"$parent_base")" ]

# Rejected unreviewed work: a child whose review.gate is not "accepted" must
# not be merged; the batch branch must remain untouched.
REPO="$TMPDIR/unreviewed"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_unreviewed_child "$REPO" "$MANIFEST" 101 rejected
PARENT=42; export PARENT; REPO_ROOT="$REPO"; export REPO_ROOT; source_gralph
if (cd "$REPO" && merge_one_child 101 "$MANIFEST" "$REPO/.gralph/runs/42" "$(jq -r '.baseSha' "$MANIFEST")" 'bash verify-integration.sh' "test-rejected-101" "gralph/42/issue-101" "$(git -C "$REPO" rev-parse HEAD)") 2>"$TMPDIR/unreviewed.err"; then
  echo "FAIL: unreviewed merge unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'not mechanically complete with an accepted review' "$TMPDIR/unreviewed.err"
jq -e '.execution.status == "failed" and .children[0].merge.status == "failed" and .children[0].merge.reason == "not_reviewed"' "$MANIFEST" >/dev/null
[ -z "$(git -C "$REPO" branch --list 'gralph/42/batch')" ]

# Conflict: the batch branch diverges from the worker branch on a shared file
# so the merge fails, the batch branch and its worktree survive, and the
# manifest records a merge_conflict reason.
REPO="$TMPDIR/conflict"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
# Stamp the worker branch directly so it modifies README (not the fixture
# worker-output.txt) — that lets us provoke a real text conflict with the
# batch branch's divergent commit.
branch="$(stamp_accepted_child "$REPO" "$MANIFEST" 101 "branch-101" "implement 101" "README")"
# Seed an existing batch branch with a divergent commit to README, then
# drop the seeding worktree so merge_one_child can attach to the branch.
TMP_INIT="$REPO/.gralph/runs/42/batch-conflict-init"
git -C "$REPO" worktree add -b gralph/42/batch "$TMP_INIT" "$(jq -r '.baseSha' "$MANIFEST")" >/dev/null
(cd "$TMP_INIT" && printf 'batch-side\n' > README && git add README && git commit -qm "batch-init")
git -C "$REPO" worktree remove --force "$TMP_INIT" >/dev/null
PARENT=42; export PARENT; REPO_ROOT="$REPO"; export REPO_ROOT; source_gralph
if (cd "$REPO" && merge_one_child 101 "$MANIFEST" "$REPO/.gralph/runs/42" "$(jq -r '.baseSha' "$MANIFEST")" 'bash verify-integration.sh' "test-conflict-101" "gralph/42/issue-101" "$(jq -r '.children[0].execution.commitSha' "$MANIFEST")") 2>"$TMPDIR/conflict.err"; then
  echo "FAIL: conflict merge unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'merge of gralph/42/issue-101 into gralph/42/batch reported a conflict' "$TMPDIR/conflict.err" || { echo "FAIL: missing conflict error message" >&2; cat "$TMPDIR/conflict.err" >&2; exit 1; }
jq -e '
  .execution.status == "failed"
  and .execution.reason == "merge_conflict"
  and .children[0].merge.status == "failed"
  and .children[0].merge.reason == "merge_conflict"
' "$MANIFEST" >/dev/null || {
  echo "conflict manifest:" >&2
  cat "$MANIFEST" >&2
  exit 1
}
if [ -z "$(git -C "$REPO" branch --list 'gralph/42/batch')" ]; then echo "FAIL: batch branch missing after conflict" >&2; exit 1; fi
if [ ! -d "$REPO/.gralph/runs/42/worktrees/batch-test-conflict-101" ]; then echo "FAIL: batch worktree missing after conflict" >&2; ls -la "$REPO/.gralph/runs/42/worktrees/" >&2; exit 1; fi
if [ -z "$(git -C "$REPO" branch --list 'gralph/42/issue-101')" ]; then echo "FAIL: worker branch missing after conflict" >&2; exit 1; fi

# Integration failure: merge succeeds but the integration command exits
# non-zero, leaving the merged batch branch and worktree on disk.
REPO="$TMPDIR/integration-fail"
new_repo "$REPO" "verify-integration.sh"
cat >"$REPO/verify-integration.sh" <<'EOF'
#!/usr/bin/env bash
exit 7
EOF
git -C "$REPO" add verify-integration.sh && git -C "$REPO" commit -qm "integration-fail"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_accepted_child "$REPO" "$MANIFEST" 101 "branch-101" "implement 101" "worker-output.txt"
PARENT=42; export PARENT; REPO_ROOT="$REPO"; export REPO_ROOT; source_gralph
if (cd "$REPO" && merge_one_child 101 "$MANIFEST" "$REPO/.gralph/runs/42" "$(jq -r '.baseSha' "$MANIFEST")" 'bash verify-integration.sh' "test-intfail-101" "gralph/42/issue-101" "$(jq -r '.children[0].execution.commitSha' "$MANIFEST")") 2>"$TMPDIR/intfail.err"; then
  echo "FAIL: integration failure unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'integration command exited 7' "$TMPDIR/intfail.err"
jq -e '
  .execution.status == "failed"
  and .execution.reason == "integration_failed"
  and .children[0].merge.status == "failed"
  and .children[0].merge.reason == "integration_failed"
  and .children[0].merge.integrationExitCode == 7
' "$MANIFEST" >/dev/null
[ -n "$(git -C "$REPO" branch --list 'gralph/42/batch')" ]
[ -d "$REPO/.gralph/runs/42/worktrees/batch-test-intfail-101" ]

# Stale base SHA: the recorded base SHA no longer resolves; the merge must
# fail closed with the reason recorded and the batch branch left untouched.
REPO="$TMPDIR/stale-base"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_accepted_child "$REPO" "$MANIFEST" 101 "branch-101" "implement 101" "worker-output.txt"
# Forge a manifest whose recorded base SHA does not exist in the repo's object database.
old_base="$(jq -r '.baseSha' "$MANIFEST")"
ghost_base="$(printf '%s' "$old_base" | sed 's/^./0/')"
jq --arg base "$ghost_base" '.baseSha = $base' "$MANIFEST" >"$MANIFEST.tmp.$$" && mv "$MANIFEST.tmp.$$" "$MANIFEST"
PARENT=42; export PARENT; REPO_ROOT="$REPO"; export REPO_ROOT; source_gralph
if (cd "$REPO" && merge_one_child 101 "$MANIFEST" "$REPO/.gralph/runs/42" "$ghost_base" 'bash verify-integration.sh' "test-stale-101" "gralph/42/issue-101" "$(jq -r '.children[0].execution.commitSha' "$MANIFEST")") 2>"$TMPDIR/stale.err"; then
  echo "FAIL: stale base merge unexpectedly succeeded" >&2
  exit 1
fi
grep -q "saved base SHA is unavailable: $ghost_base" "$TMPDIR/stale.err"
jq -e '
  .execution.status == "failed"
  and .execution.reason == "stale_base_sha"
  and .children[0].merge.status == "failed"
  and .children[0].merge.reason == "stale_base_sha"
' "$MANIFEST" >/dev/null
[ -z "$(git -C "$REPO" branch --list 'gralph/42/batch')" ]

printf '%s\n' 'gralph merge tests passed'
