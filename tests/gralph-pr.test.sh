#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

GH_LOG="$TMPDIR/gh.log"
GIT_LOG="$TMPDIR/git.log"
PR_STATE="$TMPDIR/pr-state"
export GH_LOG GIT_LOG PR_STATE
mkdir -p "$TMPDIR/bin"
# Save the real PATH before shimming the fake bin onto it so the fake git
# wrapper can re-exec the real git without recursing into itself.
REAL_PATH="$PATH"
export REAL_PATH
PATH="$TMPDIR/bin:$PATH"

# Persistent PR state: tracks the most recently created PR number so that
# gh pr list returns it on subsequent calls (idempotency).
: >"$PR_STATE"

# Fake gh: logs every call to GH_LOG. The "$*" expansion joins args with
# the first IFS char (space), so newlines in --body become spaces in the log.
cat >"$TMPDIR/bin/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >>"$GH_LOG"
# Refuse any "gh issue close" — the coordinator never closes issues.
if [ "${1-}" = "issue" ] && [ "${2-}" = "close" ]; then
  echo "FAIL: gh issue close was called" >&2
  exit 1
fi
if [ "${1-} ${2-}" = "repo view" ]; then
  for arg in "$@"; do
    if [ "$arg" = "nameWithOwner" ]; then
      printf '%s\n' "owner/repo"
      exit 0
    fi
    if [ "$arg" = "defaultBranchRef" ]; then
      printf '%s\n' "main"
      exit 0
    fi
  done
  printf '%s\n' "owner/repo"
  exit 0
fi
if [ "${1-} ${2-}" = "api graphql" ]; then
  cat <<'JSON'
{"data":{"repository":{"issue":{"number":42,"title":"Parent","state":"OPEN","subIssues":{"pageInfo":{"hasNextPage":false},"nodes":[{"number":101,"title":"Implement fixture","state":"OPEN","labels":{"nodes":[{"name":"ready-for-agent"}]},"blockedBy":{"pageInfo":{"hasNextPage":false},"nodes":[]}}]}}}}}
JSON
  exit 0
fi
if [ "${1-}" = "pr" ] && [ "${2-}" = "list" ]; then
  if [ -s "$PR_STATE" ]; then
    cat "$PR_STATE"
  fi
  exit 0
fi
if [ "${1-}" = "pr" ] && [ "${2-}" = "create" ]; then
  echo "https://github.com/owner/repo/pull/7"
  printf '%s' "7" >"$PR_STATE"
  exit 0
fi
if [ "${1-}" = "pr" ] && [ "${2-}" = "edit" ]; then
  exit 0
fi
exit 0
EOF
chmod +x "$TMPDIR/bin/gh"

# Fake git: delegates to real git for everything except push. Records every
# call to GIT_LOG. Honors FAKE_PUSH_FAIL=1 to refuse pushes with a non-zero
# exit code (for the push-failure scenario).
cat >"$TMPDIR/bin/git" <<'EOF'
#!/usr/bin/env bash
printf 'git %s\n' "$*" >>"$GIT_LOG"
# Detect any "push" subcommand anywhere in the args (handles `git push ...`
# and `git -C repo push ...`).
is_push=0
for a in "$@"; do
  if [ "$a" = "push" ]; then is_push=1; break; fi
done
if [ "$is_push" -eq 1 ]; then
  if [ "${FAKE_PUSH_FAIL:-0}" = "1" ]; then
    echo "fatal: simulated push failure" >&2
    exit 1
  fi
  /usr/bin/env -i PATH="$REAL_PATH" git "$@"
  exit $?
fi
exec /usr/bin/env -i PATH="$REAL_PATH" git "$@"
EOF
chmod +x "$TMPDIR/bin/git"

new_repo() {
  local dir="$1" integration_script="${2:-verify-integration.sh}"
  local remote_dir="$TMPDIR/remote-$(basename "$dir")"
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
  # Wire a per-test local bare repo as origin so fake `git push` succeeds.
  rm -rf "$remote_dir"
  git init -q --bare "$remote_dir/repo.git"
  git -C "$dir" remote add origin "$remote_dir/repo.git"
}

# Plan a parent so a manifest exists, then manipulate the manifest directly.
plan_manifest() {
  local repo="$1" integration="${2:-verify-integration.sh}"
  (cd "$repo" && PATH="$TMPDIR/bin:$PATH" GH_LOG="$GH_LOG" GIT_LOG="$GIT_LOG" PR_STATE="$PR_STATE" REAL_PATH="$REAL_PATH" FAKE_PUSH_FAIL="${FAKE_PUSH_FAIL:-0}" "$GRALPH" 42 --dry-run --verify "bash $integration") >/dev/null
}

# Source gralph into a fresh shell so publish_pr is callable with a
# caller-prepared manifest. PARENT and REPO_ROOT must be exported before sourcing.
# The script's top-level arg parser exits when sourced with no positional args,
# so we strip the parser and eval the rest.
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
  extracted="$(printf '%s\n' "$extracted" "$(sed -n '/^publish_pr() {/,/^}$/p' "$script")")"
  set -e
  eval "$extracted"
}

# Stamp a manifest with an eligible, landed, accepted child. The worker branch
# is on disk and contains a real diff against the recorded baseSha, and the
# batch branch already has the merge applied (matching the post-merge_one_child
# state). Returns the child branch name.
stamp_landed_child() {
  local repo="$1" manifest="$2" child="$3" content_file="$4" branch_name="${5:-branch-101}"
  local base_sha child_branch child_sha batch_sha
  base_sha="$(jq -r '.baseSha' "$manifest")"
  child_branch="gralph/42/issue-$child"
  git -C "$repo" worktree add -b "$child_branch" "$repo/.gralph/runs/42/worktrees/issue-$child" "$base_sha" >/dev/null
  printf '%s\n' "implement $child" >"$repo/.gralph/runs/42/worktrees/issue-$child/$content_file"
  (cd "$repo/.gralph/runs/42/worktrees/issue-$child" && git add "$content_file" && git commit -qm "implement $child")
  child_sha="$(git -C "$repo/.gralph/runs/42/worktrees/issue-$child" rev-parse HEAD)"
  # Build the batch branch with the merge already applied.
  git -C "$repo" worktree add -b "gralph/42/batch" "$repo/.gralph/runs/42/worktrees/batch" "$base_sha" >/dev/null
  (cd "$repo/.gralph/runs/42/worktrees/batch" && git merge --no-ff --no-edit -m "merge" "$child_branch" >/dev/null)
  batch_sha="$(git -C "$repo/.gralph/runs/42/worktrees/batch" rev-parse HEAD)"
  git -C "$repo" worktree remove --force "$repo/.gralph/runs/42/worktrees/batch" >/dev/null
  git -C "$repo" worktree remove --force "$repo/.gralph/runs/42/worktrees/issue-$child" >/dev/null
  jq --argjson child "$child" --arg branch "$child_branch" --arg commit "$child_sha" --arg batchSha "$batch_sha" '
    .children |= map(if .number == $child then
      .execution = {status:"landed", commitSha:$commit, branch:$branch, startingSha:.execution.startingSha}
      | .review = {status:"approved", criticalCount:0, blockerCount:0, gate:"accepted", findings:[], processExitCode:0, timedOut:false}
      | .merge = {batchBranch:"gralph/42/batch", status:"landed", mergedSha:$batchSha, landedSha:$batchSha, childCommitSha:$commit, integrationExitCode:0}
    else . end)
  ' "$manifest" >"$manifest.tmp.$$" && mv "$manifest.tmp.$$" "$manifest"
  printf '%s\n' "$child_branch"
}

# Sync REPO_ROOT/manifest into the helper's environment and source publish_pr.
load_publish() {
  local repo="$1" manifest="$2"
  PARENT=42; export PARENT
  REPO_ROOT="$repo"; export REPO_ROOT
  PATH="$TMPDIR/bin:$PATH"; export PATH
  GH_LOG="$GH_LOG"; export GH_LOG
  GIT_LOG="$GIT_LOG"; export GIT_LOG
  PR_STATE="$PR_STATE"; export PR_STATE
  REAL_PATH="$REAL_PATH"; export REAL_PATH
  FAKE_PUSH_FAIL="${FAKE_PUSH_FAIL:-0}"; export FAKE_PUSH_FAIL
  source_gralph
}

reset_fakes() {
  : >"$GH_LOG"
  : >"$GIT_LOG"
  : >"$PR_STATE"
}

# Like reset_fakes but keeps PR_STATE so the next call sees the existing PR.
reset_logs_only() {
  : >"$GH_LOG"
  : >"$GIT_LOG"
}

# ----------------------------------------------------------------------------
# (a) Success: one landed child produces a PR, push happens, no gh issue close.
# ----------------------------------------------------------------------------
REPO="$TMPDIR/success"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_landed_child "$REPO" "$MANIFEST" 101 "worker-output.txt"
reset_fakes
load_publish "$REPO" "$MANIFEST"
if ! (cd "$REPO" && publish_pr "$MANIFEST" 'bash verify-integration.sh') 2>"$TMPDIR/success.err"; then
  echo "FAIL: publish_pr should succeed for a landed child" >&2
  cat "$TMPDIR/success.err" >&2
  exit 1
fi
grep -q 'gh pr list --head gralph/42/batch' "$GH_LOG"
grep -q 'gh pr create --base main --head gralph/42/batch --title Gralph batch for parent #42 --body Closes #101' "$GH_LOG"
grep -q 'git .*push origin gralph/42/batch' "$GIT_LOG"
jq -e '
  .orchestration.publication.prNumber == 7
  and .orchestration.publication.batchBranch == "gralph/42/batch"
  and (.orchestration.publication.publishedAt | type == "string")
' "$MANIFEST" >/dev/null
# No gh issue close.
if grep -q 'issue close' "$GH_LOG"; then
  echo "FAIL: gh issue close was called" >&2
  cat "$GH_LOG" >&2
  exit 1
fi

# ----------------------------------------------------------------------------
# (b) Blocked child: an eligible child not landed fails publication.
# ----------------------------------------------------------------------------
REPO="$TMPDIR/blocked"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
# Mark the eligible child as complete (not landed) — review gate accepted,
# merge status absent → not landed → fail closed.
jq '
  .children |= map(if .number == 101 then
    .execution = ((.execution // {}) + {status:"complete"})
    | .review = ((.review // {}) + {status:"approved", gate:"accepted", criticalCount:0, blockerCount:0, findings:[]})
  else . end)
' "$MANIFEST" >"$MANIFEST.tmp.$$" && mv "$MANIFEST.tmp.$$" "$MANIFEST"
reset_fakes
load_publish "$REPO" "$MANIFEST"
if (cd "$REPO" && publish_pr "$MANIFEST" 'bash verify-integration.sh') 2>"$TMPDIR/blocked.err"; then
  echo "FAIL: publish_pr should fail when an eligible child is not landed" >&2
  exit 1
fi
grep -q 'not all eligible children are landed and accepted' "$TMPDIR/blocked.err"
[ -z "$(grep 'gh pr create' "$GH_LOG" || true)" ]
[ -z "$(grep 'push origin' "$GIT_LOG" || true)" ]
# No gh issue close.
if grep -q 'issue close' "$GH_LOG"; then
  echo "FAIL: gh issue close was called in blocked scenario" >&2
  exit 1
fi

# ----------------------------------------------------------------------------
# (c) Failed child: an eligible child in execution.status == "failed" fails.
# ----------------------------------------------------------------------------
REPO="$TMPDIR/failed"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
jq '
  .children |= map(if .number == 101 then
    .execution = ((.execution // {}) + {status:"failed", reason:"worker_failed"})
  else . end)
' "$MANIFEST" >"$MANIFEST.tmp.$$" && mv "$MANIFEST.tmp.$$" "$MANIFEST"
reset_fakes
load_publish "$REPO" "$MANIFEST"
if (cd "$REPO" && publish_pr "$MANIFEST" 'bash verify-integration.sh') 2>"$TMPDIR/failed.err"; then
  echo "FAIL: publish_pr should fail when an eligible child is failed" >&2
  exit 1
fi
grep -q 'not all eligible children are landed and accepted' "$TMPDIR/failed.err"
if grep -q 'gh pr create' "$GH_LOG"; then
  echo "FAIL: pr create should not be called in failed scenario" >&2
  exit 1
fi

# ----------------------------------------------------------------------------
# (d) Idempotency: running publish_pr twice updates the existing PR instead
#     of creating a duplicate.
# ----------------------------------------------------------------------------
REPO="$TMPDIR/idempotent"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_landed_child "$REPO" "$MANIFEST" 101 "worker-output.txt"
reset_fakes
load_publish "$REPO" "$MANIFEST"
if ! (cd "$REPO" && publish_pr "$MANIFEST" 'bash verify-integration.sh') 2>"$TMPDIR/idem1.err"; then
  echo "FAIL: first publish_pr should succeed" >&2
  cat "$TMPDIR/idem1.err" >&2
  exit 1
fi
# Drop the manifest record so the function actually re-runs the body.
jq 'del(.orchestration.publication)' "$MANIFEST" >"$MANIFEST.tmp.$$" && mv "$MANIFEST.tmp.$$" "$MANIFEST"
reset_logs_only
load_publish "$REPO" "$MANIFEST"
if ! (cd "$REPO" && publish_pr "$MANIFEST" 'bash verify-integration.sh') 2>"$TMPDIR/idem2.err"; then
  echo "FAIL: second publish_pr should succeed (idempotent)" >&2
  cat "$TMPDIR/idem2.err" >&2
  exit 1
fi
# Second run should edit, not create.
if grep -q 'gh pr create' "$GH_LOG"; then
  echo "FAIL: second publish_pr should not create a new PR" >&2
  cat "$GH_LOG" >&2
  exit 1
fi
grep -q 'gh pr edit 7 --body Closes #101' "$GH_LOG"
# Manifest has exactly one publication record with the same PR number.
jq -e '.orchestration.publication.prNumber == 7' "$MANIFEST" >/dev/null

# ----------------------------------------------------------------------------
# (e) Integration failure: verify_cmd on the batch tip exits non-zero.
# ----------------------------------------------------------------------------
REPO="$TMPDIR/integration-fail"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_landed_child "$REPO" "$MANIFEST" 101 "worker-output.txt"
reset_fakes
load_publish "$REPO" "$MANIFEST"
# Use a verify command that always exits non-zero to trigger the
# integration_failed path on the batch tip.
if (cd "$REPO" && publish_pr "$MANIFEST" 'exit 7') 2>"$TMPDIR/intfail.err"; then
  echo "FAIL: publish_pr should fail when integration command fails" >&2
  exit 1
fi
grep -q 'integration command exited 7' "$TMPDIR/intfail.err"
if grep -q 'gh pr create' "$GH_LOG"; then
  echo "FAIL: pr create should not be called when integration fails" >&2
  exit 1
fi
if grep -q 'git .*push origin' "$GIT_LOG"; then
  echo "FAIL: push should not run when integration fails" >&2
  exit 1
fi

# ----------------------------------------------------------------------------
# (f) Push failure: fake git push fails — publish_pr fails closed.
# ----------------------------------------------------------------------------
REPO="$TMPDIR/push-fail"
new_repo "$REPO"
plan_manifest "$REPO"
MANIFEST="$REPO/.gralph/runs/42/manifest.json"
stamp_landed_child "$REPO" "$MANIFEST" 101 "worker-output.txt"
reset_fakes
load_publish "$REPO" "$MANIFEST"
FAKE_PUSH_FAIL=1
if (cd "$REPO" && FAKE_PUSH_FAIL=1 publish_pr "$MANIFEST" 'bash verify-integration.sh') 2>"$TMPDIR/pushfail.err"; then
  echo "FAIL: publish_pr should fail when push fails" >&2
  exit 1
fi
FAKE_PUSH_FAIL=0
grep -q 'could not push batch branch' "$TMPDIR/pushfail.err"
if grep -q 'gh pr create' "$GH_LOG"; then
  echo "FAIL: pr create should not be called when push fails" >&2
  exit 1
fi
# Manifest untouched (no publication record).
jq -e '.orchestration.publication == null' "$MANIFEST" >/dev/null

# ----------------------------------------------------------------------------
# (g) No gh issue close in any scenario. The fake gh itself refuses
#     "gh issue close" with exit 1, so any attempt would have failed the
#     owning test earlier; this final check guards against silent regressions
#     in the per-scenario grep above.
# ----------------------------------------------------------------------------
if grep -q 'issue close' "$GH_LOG"; then
  echo "FAIL: gh issue close was called" >&2
  cat "$GH_LOG" >&2
  exit 1
fi

printf '%s\n' 'gralph pr tests passed'
