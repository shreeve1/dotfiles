#!/usr/bin/env bash
# test-checkpoint-scope.sh
#
# Exercises checkpoint_dirty_worktree() and its files-mode scoping helpers
# against a real (throwaway) git repo. Confirms:
#   1. default ("all") scope: every dirty path outside .pi-lens/ is staged
#      and committed, regardless of in-scope/out-of-scope boundaries.
#   2. files ("files") scope: only in-scope paths under the ticket's files:
#      frontmatter (plus .kanban/) get committed. Out-of-scope paths remain
#      dirty in the worktree and are never staged.
#   3. pre-worker skip-and-log when files scope cannot determine a target
#      ticket or has no files:.
#   4. checkpoint_out_of_scope_warning names the out-of-scope paths that
#      appeared in the post-worker snapshot but were absent pre-worker.
#
# Run: bash tests/test-checkpoint-scope.sh
set -euo pipefail

RALPH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RALPH_LOOP="$RALPH_DIR/ralph-loop.sh"

PASS=0
FAIL=0
RESULTS_FILE=$(mktemp)
trap 'rm -f "$RESULTS_FILE"' EXIT

# pass/fail append to a file because the test fixtures run inside `( ... )`
# subshells (for repo cwd isolation), and counter increments made inside a
# subshell would not survive back to the parent. The shim prints one tag plus
# the assertion text so failures stay readable in the log.
pass() {
  printf '  \033[32m✓\033[0m %s\n' "$1"
  printf 'PASS\n%s\n' "$1" >>"$RESULTS_FILE"
}
fail() {
  printf '  \033[31m✗\033[0m %s\n' "$1"
  shift
  if [[ $# -gt 0 ]]; then printf '      %s\n' "$@"; fi
  printf 'FAIL\n%s\n%s\n' "$1" "$*" >>"$RESULTS_FILE"
}
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

need() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    printf 'missing: %s\n' "$cmd" >&2
    exit 1
  }
}
need git
need mktemp
need bash

# Make commits possible in a sandbox without global identity.
export GIT_AUTHOR_NAME="Ralph Test"
export GIT_AUTHOR_EMAIL="ralph@example.invalid"
export GIT_COMMITTER_NAME="Ralph Test"
export GIT_COMMITTER_EMAIL="ralph@example.invalid"

# ---- helpers ---------------------------------------------------------------

# Build a temp repo with .kanban/issues/<id>.md containing the requested
# files: frontmatter (mode = "inline" or "block"). Returns the repo path on
# stdout and prints the ticket path as its first line.
build_repo() {
  local mode="$1" ticket_id="42" repo
  repo=$(mktemp -d -t ralph-ckpt-XXXXXX)
  git -C "$repo" init -q -b main
  git -C "$repo" config user.name "$GIT_AUTHOR_NAME"
  git -C "$repo" config user.email "$GIT_AUTHOR_EMAIL"
  mkdir -p "$repo/.kanban/issues" "$repo/src" "$repo/other" "$repo/docs"

  local body
  if [[ "$mode" == "inline" ]]; then
    body=$'---\nid: '"$ticket_id"$'\nstatus: pending\ntitle: Test\nfiles: [src/, docs/]\nlabels: [ready-for-agent]\n---\n\n## Verification\n\nnoop\n'
  elif [[ "$mode" == "block" ]]; then
    body=$'---\nid: '"$ticket_id"$'\nstatus: pending\ntitle: Test\nfiles:\n  - src/\n  - docs/\nlabels: [ready-for-agent]\n---\n\n## Verification\n\nnoop\n'
  else
    body=$'---\nid: '"$ticket_id"$'\nstatus: pending\ntitle: Test\nlabels: [ready-for-agent]\n---\n\n## Verification\n\nnoop\n'
  fi
  printf '%s' "$body" >"$repo/.kanban/issues/${ticket_id}-test.md"
  # Seed an empty committed state so add -A behaves deterministically. The
  # .gitignore plus .pi-lens/ entry ensures .pi-lens/ stays untracked across
  # every fixture, so the tests' claim that "default mode never touched
  # .pi-lens/" is unambiguous.
  echo seed >"$repo/README.md"
  echo canned >"$repo/.kanban/progress.md"
  printf '.pi-lens/\n' >"$repo/.gitignore"
  git -C "$repo" add README.md .kanban/progress.md .gitignore
  git -C "$repo" commit -q -m "seed"
  printf '%s\n' "$repo" "$repo/.kanban/issues/${ticket_id}-test.md"
}

# Source ralph-loop.sh helpers (sourcing is a no-op for the cli body).
# Returns 0 once helpers are visible.
load_helpers() {
  # shellcheck source=/dev/null
  source "$RALPH_LOOP" >/dev/null
  type -t checkpoint_dirty_worktree >/dev/null || {
    echo "checkpoint_dirty_worktree not defined"
    return 1
  }
}

# Tear down a repo created by build_repo.
cleanup_repo() {
  local repo="$1"
  [[ -n "$repo" && -d "$repo" ]] && rm -rf "$repo"
}

# ---- tests -----------------------------------------------------------------

hdr "files-mode checkpoint only stages in-scope dirty paths"

TMPDIR_ROOT=$(mktemp -d)
trap 'rm -rf "$TMPDIR_ROOT"' EXIT

{
  read -r REPO
  read -r TICKET
} < <(build_repo inline)
(
  cd "$REPO"
  load_helpers

  # In-scope dirt under src/ + a .kanban change
  echo in-scope-1 >src/foo.py
  echo "progress one" >.kanban/progress.md
  # Out-of-scope dirt under other/
  echo out-of-scope-1 >other/bar.py
  # Plus an .pi-lens/ edit that the helper should always ignore
  mkdir -p .pi-lens
  echo "ignore me" >.pi-lens/cache.json
  git add .pi-lens 2>/dev/null || true

  export CHECKPOINT_DIRTY=true
  export CHECKPOINT_SCOPE=files
  LOG_FILE="$TMPDIR_ROOT/files-mode.log"
  : >"$LOG_FILE"

  if checkpoint_dirty_worktree "chore(ralph): pre-worker" "$TICKET" pre-worker >>"$LOG_FILE" 2>&1; then
    :
  else
    fail "files-mode pre-worker checkpoint returned nonzero" "$(tail -5 "$LOG_FILE")"
    exit 1
  fi

  # The in-scope src/foo.py and the .kanban/ change should be committed.
  if git log -1 --format=%s | grep -Fq "pre-worker"; then
    pass "files-mode created a checkpoint commit"
  else
    fail "files-mode did not create a checkpoint commit" "$(git log --oneline)"
  fi

  # Out-of-scope other/bar.py must NOT be committed (still dirty in worktree).
  other_status=$(git status --porcelain -- other)
  if [[ -n "$other_status" && "$other_status" != *".pi-lens"* ]]; then
    pass "files-mode left other/bar.py dirty (not staged)"
  else
    fail "files-mode staged or cleared other/bar.py" "status=$other_status"
  fi

  # .pi-lens should never be touched.
  if git log -1 --name-only --pretty=format: | grep -v '^$' | grep -q '^.pi-lens/'; then
    fail "files-mode committed into .pi-lens/"
  else
    pass "files-mode did not touch .pi-lens/"
  fi

  # In-scope src/foo.py should be part of the checkpoint commit.
  if git log -1 --name-only --pretty=format: | grep -q '^src/foo.py$'; then
    pass "files-mode committed in-scope src/foo.py"
  else
    fail "files-mode did not commit src/foo.py" "$(git log -1 --name-only --pretty=format:)"
  fi

  # And the .kanban/ change should ride along.
  if git log -1 --name-only --pretty=format: | grep -q '\.kanban/progress\.md'; then
    pass "files-mode committed .kanban/progress.md alongside"
  else
    fail "files-mode did not commit .kanban/progress.md" "$(git log -1 --name-only --pretty=format:)"
  fi
)
cleanup_repo "$REPO"

hdr "default (all) scope stages every dirty path outside .pi-lens"

{
  read -r REPO
  read -r TICKET
} < <(build_repo inline)
(
  cd "$REPO"
  load_helpers

  echo in-scope >src/foo.py
  echo out-of-scope >other/bar.py
  mkdir -p .pi-lens
  echo ignore >.pi-lens/cache.json
  git add .pi-lens 2>/dev/null || true

  export CHECKPOINT_DIRTY=true
  export CHECKPOINT_SCOPE=all
  LOG_FILE="$TMPDIR_ROOT/all-mode.log"
  : >"$LOG_FILE"

  if ! checkpoint_dirty_worktree "chore(ralph): pre-worker" "$TICKET" pre-worker >>"$LOG_FILE" 2>&1; then
    fail "all-mode pre-worker checkpoint returned nonzero" "$(tail -5 "$LOG_FILE")"
    exit 1
  fi

  # The other/bar.py out-of-scope path must be staged in default mode.
  if git log -1 --name-only --pretty=format: | grep -q '^other/bar.py$'; then
    pass "all-mode committed out-of-scope other/bar.py"
  else
    fail "all-mode did not commit other/bar.py" "$(git log -1 --name-only --pretty=format:)"
  fi

  # .pi-lens/ stays untouched even in default mode.
  if git log -1 --name-only --pretty=format: | grep -v '^$' | grep -q '^.pi-lens/'; then
    fail "all-mode committed into .pi-lens/"
  else
    pass "all-mode ignored .pi-lens/"
  fi

  # Worktree should be clean after default-mode commit.
  if [[ -z "$(git_status_ignoring_pi_lens)" ]]; then
    pass "all-mode: worktree clean after commit"
  else
    fail "all-mode: worktree still dirty" "$(git_status_short_ignoring_pi_lens)"
  fi
)
cleanup_repo "$REPO"

hdr "files-mode: skipping when ticket has no files: frontmatter"

{
  read -r REPO
  read -r TICKET
} < <(build_repo empty)
(
  cd "$REPO"
  load_helpers

  echo out >other/x.py
  echo in >src/in.py

  export CHECKPOINT_DIRTY=true
  export CHECKPOINT_SCOPE=files
  LOG_FILE="$TMPDIR_ROOT/skip-mode.log"
  : >"$LOG_FILE"

  # pre-worker: a missing files: frontmatter logs and SKIPS (returns 0).
  if checkpoint_dirty_worktree "chore(ralph): pre-worker" "$TICKET" pre-worker >>"$LOG_FILE" 2>&1; then
    pass "files-mode pre-worker skipped on missing files: (no fall-back to add -A)"
  else
    fail "files-mode pre-worker did NOT skip on missing files:" "$(tail -5 "$LOG_FILE")"
  fi

  # No checkpoint commit should have been created.
  if ! git log -1 --format=%s | grep -Fq "pre-worker"; then
    pass "no pre-worker checkpoint commit was created when files: is absent"
  else
    fail "a pre-worker commit was created despite missing files:" "$(git log --oneline)"
  fi

  # post-issue: a missing files: frontmatter REFUSES and stops the loop.
  LOG_FILE="$TMPDIR_ROOT/stop-mode.log"
  : >"$LOG_FILE"
  if checkpoint_dirty_worktree "chore(ralph): post-issue" "$TICKET" post-issue >>"$LOG_FILE" 2>&1; then
    fail "files-mode post-issue did NOT stop on missing files:"
  else
    pass "files-mode post-issue refused (return 1) on missing files: — caller will stop the loop"
  fi
)
cleanup_repo "$REPO"

hdr "checkpoint_out_of_scope_warning names new out-of-scope paths"

{
  read -r REPO
  read -r TICKET
} < <(build_repo inline)
(
  cd "$REPO"
  load_helpers

  # Pre-worker state: dirty `src/foo.py` (already in-scope) and a clean tree
  # elsewhere. The pre-worker checkpoint will sweep src/foo.py into a commit,
  # so we capture the BEFORE snapshot up to that.
  echo pre-existing >src/foo.py
  echo "progress" >.kanban/progress.md
  PRE_BEFORE=$(git_status_snap_recursive)
  # Use the new helper that emits a snapshot file
  echo "$PRE_BEFORE" >"$TMPDIR_ROOT/before.snap"

  # Run the pre-worker checkpoint to clear the in-scope dirt.
  export CHECKPOINT_DIRTY=true
  export CHECKPOINT_SCOPE=files
  LOG_FILE="$TMPDIR_ROOT/warn-flow.log"
  : >"$LOG_FILE"
  checkpoint_dirty_worktree "chore(ralph): pre-worker" "$TICKET" pre-worker >>"$LOG_FILE" 2>&1 || true

  # Now simulate what a worker in a shared tree would do: create a path
  # outside the in-scope prefixes.
  echo leakage >other/sneaky.md

  POST_AFTER=$(git_status_snap_recursive)
  echo "$POST_AFTER" >"$TMPDIR_ROOT/after.snap"

  # The warning should name other/sneaky.md and explain it was NOT staged.
  PREFIXES_FILE="$TMPDIR_ROOT/prefixes.list"
  build_files_mode_pathspec "$TICKET" "$PREFIXES_FILE"

  WARNING_LOG="$TMPDIR_ROOT/warning.log"
  : >"$WARNING_LOG"
  checkpoint_out_of_scope_warning "$TMPDIR_ROOT/before.snap" "$TMPDIR_ROOT/after.snap" "$PREFIXES_FILE" "iter #1" >>"$WARNING_LOG" 2>&1

  if grep -q "other/sneaky.md" "$WARNING_LOG"; then
    pass "checkpoint_out_of_scope_warning named other/sneaky.md"
  else
    fail "checkpoint_out_of_scope_warning did not name other/sneaky.md" "$(cat "$WARNING_LOG")"
  fi
  if grep -q "out-of-scope" "$WARNING_LOG"; then
    pass "warning text described out-of-scope paths"
  else
    fail "warning text missing out-of-scope phrasing" "$(cat "$WARNING_LOG")"
  fi

  # The warning should NOT name in-scope paths.
  if grep -q "src/foo" "$WARNING_LOG"; then
    fail "warning incorrectly included in-scope src/foo"
  else
    pass "warning did not include in-scope src/foo"
  fi
)
cleanup_repo "$REPO"

hdr "list_ticket_file_prefixes (block-list form) returns each - entry"

(
  load_helpers
  TMP_DOC=$(mktemp --suffix=.md)
  cat >"$TMP_DOC" <<EOF
---
id: 9
status: pending
files:
  - src/auth
  - "docs/spec"
  - "packages/ui"
---
EOF
  out=$(list_ticket_file_prefixes "$TMP_DOC" | sort -u | tr '\n' '|' | sed 's/|$//')
  if [[ "$out" == "docs/spec|packages/ui|src/auth" ]]; then
    pass "block-list parsed: $out"
  else
    fail "block-list parse" "expected docs/spec|packages/ui|src/auth got '$out'"
  fi
  rm "$TMP_DOC"
)

hdr "list_ticket_file_prefixes: empty when no files: frontmatter"

(
  load_helpers
  TMP_DOC=$(mktemp --suffix=.md)
  cat >"$TMP_DOC" <<EOF
---
id: 10
status: pending
---
EOF
  out=$(list_ticket_file_prefixes "$TMP_DOC")
  if [[ -z "$out" ]]; then
    pass "no files: frontmatter -> no prefixes"
  else
    fail "expected empty output got [$out]"
  fi
  rm "$TMP_DOC"
)

hdr "list_ticket_file_prefixes: ~  and null are equivalent to no files:"

(
  load_helpers
  for marker in "~" "null"; do
    TMP_DOC=$(mktemp --suffix=.md)
    cat >"$TMP_DOC" <<EOF
---
id: 11
status: pending
files: $marker
---
EOF
    out=$(list_ticket_file_prefixes "$TMP_DOC")
    if [[ -z "$out" ]]; then
      pass "files: $marker -> no prefixes"
    else
      fail "files: $marker produced prefixes: [$out]"
    fi
    rm "$TMP_DOC"
  done
)

hdr "git_path_under_prefix treats .kanban as always-in-scope"

(
  load_helpers
  if git_path_under_prefix ".kanban/issues/1.md" "src/" "docs/" &&
    git_path_under_prefix ".kanban" "src/" &&
    ! git_path_under_prefix "src/extra.py" "docs/" &&
    ! git_path_under_prefix "src2/extra.py" "src"; then
    pass "git_path_under_prefix matches .kanban and rejects prefix substring"
  else
    fail "git_path_under_prefix logic regression"
  fi
)

hdr "Fix #1: pick_next_target_for_warning picks the pending ticket via board next when no active resume"

# Regression test for the bug the reviewer flagged: in normal mode the driver
# used to defer the board-next pick until AFTER the pre-worker checkpoint,
# so files mode always skipped the pre-worker checkpoint in that case. The
# helper is now invoked with REVIEW_LOOP=false, ACTIVE_ISSUES empty, BOARD_SH
# set, and must return the next pending ticket path.
{
  TMP_REPO=$(mktemp -d -t ralph-fix1-XXXXXX)
  cd "$TMP_REPO"
  git init -q -b main >/dev/null
  git config user.name "Ralph Test" >/dev/null
  git config user.email "ralph@example.invalid" >/dev/null
  git config ralph.checkpointScope files >/dev/null
  mkdir -p .kanban/issues
  cat >.kanban/issues/01-test.md <<'EOF'
---
id: 1
status: pending
title: Pending
files: [src/]
labels: [ready-for-agent]
---
EOF
  cat >.kanban/issues/02-test.md <<'EOF'
---
id: 2
status: pending
title: Higher priority
files: [src/]
priority: 1
labels: [ready-for-agent]
---
EOF
  mkdir -p src other
  echo seed >README.md
  git add README.md
  git commit -q -m seed >/dev/null

  load_helpers
  BOARD_SH_TEST="$HOME/.agents/skills/kanban/board.sh"
  pick=$(
    PICKW_REVIEW_LOOP="false" \
      PICKW_BOARD_SH="$BOARD_SH_TEST" \
      PICKW_SPEC="" \
      PICKW_ACTIVE_ISSUES="" \
      pick_next_target_for_warning
  )
  if [[ -n "$pick" && "$pick" == *.kanban/issues/0?-test.md ]]; then
    pass "helper returned the next pending ticket: $pick"
  else
    fail "helper did not return a pending ticket path" "got '$pick'"
  fi

  # Full end-to-end: with files mode scope and the helper's pick as target,
  # the pre-worker checkpoint must commit only in-scope paths (this is the
  # regression that produced commit 964268c sweeping 31+ files in itastack).
  echo in-scope >src/foo.py
  echo progress >.kanban/progress.md
  echo out >other/leak.py
  mkdir -p .pi-lens
  echo ignore >.pi-lens/cache.json
  echo ".pi-lens/" >.gitignore
  git add .gitignore
  git commit -q -m "gitignore" >/dev/null

  export CHECKPOINT_DIRTY=true
  export CHECKPOINT_SCOPE=files
  export LOG_FILE=/tmp/ralph-fix1.log
  export GIT_AUTHOR_NAME="Ralph Test"
  export GIT_AUTHOR_EMAIL="ralph@example.invalid"
  export GIT_COMMITTER_NAME="Ralph Test"
  export GIT_COMMITTER_EMAIL="ralph@example.invalid"
  : >"$LOG_FILE"

  if ! checkpoint_dirty_worktree "chore(ralph): pre-worker (fix1)" "$pick" pre-worker >>"$LOG_FILE" 2>&1; then
    fail "pre-worker checkpoint did not run cleanly" "$(tail -5 "$LOG_FILE")"
  else
    # HEAD must be a checkpoint commit (not just 'seed' or 'gitignore').
    if git log -1 --format=%s | grep -Fq "pre-worker (fix1)"; then
      pass "pre-worker checkpoint created the expected chore commit"
    else
      fail "pre-worker checkpoint did not create a chore commit" "$(git log --oneline)"
    fi
    # In-scope path src/foo.py MUST be in the commit.
    if git log -1 --name-only --pretty=format: | grep -q '^src/foo.py$'; then
      pass "pre-worker committed in-scope src/foo.py (no skipped checkpoint)"
    else
      fail "pre-worker missed src/foo.py" "$(git log -1 --name-only --pretty=format:)"
    fi
    # Out-of-scope other/leak.py MUST remain dirty (not staged, not committed).
    leak_status=$(git status --porcelain -uall -- other)
    if [[ "$leak_status" == *"leak.py"* ]]; then
      pass "pre-worker left other/leak.py unstaged"
    else
      fail "pre-worker staged or cleared other/leak.py" "status=$leak_status"
    fi
  fi

  unset CHECKPOINT_DIRTY CHECKPOINT_SCOPE LOG_FILE GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
  cd /
  rm -rf "$TMP_REPO" /tmp/ralph-fix1.log
}

hdr "Fix #3: emit_pre_existing_dirty_warning filters paths in files mode (env) and prints only a count when no target"

{
  TMP_REPO=$(mktemp -d -t ralph-fix3-XXXXXX)
  cd "$TMP_REPO"
  git init -q -b main >/dev/null
  git config user.name "Ralph Test" >/dev/null
  git config user.email "ralph@example.invalid" >/dev/null
  mkdir -p src other .kanban/issues
  cat >.kanban/issues/1.md <<'EOF'
---
id: 1
status: pending
title: Test
files: [src/]
labels: [ready-for-agent]
---
EOF
  echo seed >README.md
  echo ".pi-lens/" >.gitignore
  git add README.md .gitignore
  git commit -q -m seed >/dev/null

  # Dirt
  echo in >src/foo.py
  echo shared >.kanban/progress.md
  echo out >other/leak.py

  load_helpers

  # Case A: files mode via env, known target → in-scope paths listed, count for the rest.
  # Match the cli's capture mode (`-uall`) so the warning can name individual
  # files instead of just collapsed untracked-dir entries.
  status_text=$(git status --porcelain -uall -- . ':(exclude).pi-lens' ':(exclude).sessions')
  warn_a=$(
    RALPH_CHECKPOINT_SCOPE=files \
      BOARD_SH="$HOME/.agents/skills/kanban/board.sh" \
      emit_pre_existing_dirty_warning "$status_text" ".kanban/issues/1.md"
  )
  if grep -q 'src/foo.py' <<<"$warn_a"; then
    pass "files-mode warning lists in-scope src/foo.py"
  else
    fail "files-mode warning missing in-scope src/foo.py" "$warn_a"
  fi
  if grep -q '.kanban/progress.md' <<<"$warn_a"; then
    pass "files-mode warning lists in-scope .kanban/progress.md (kanban always in scope)"
  else
    fail "files-mode warning missing .kanban/progress.md" "$warn_a"
  fi
  if grep -q 'other/leak.py' <<<"$warn_a"; then
    fail "files-mode warning incorrectly listed out-of-scope other/leak.py" "$warn_a"
  else
    pass "files-mode warning did NOT list out-of-scope other/leak.py"
  fi
  if grep -Eq 'Out-of-scope path count[^0-9]*1\b' <<<"$warn_a"; then
    pass "files-mode warning reported out-of-scope path count = 1"
  else
    fail "files-mode warning missing out-of-scope count line" "$warn_a"
  fi

  # Case B: files mode via git config (no env, no flag) → same filtering.
  git config ralph.checkpointScope files
  warn_b=$(
    unset RALPH_CHECKPOINT_SCOPE
    BOARD_SH="$HOME/.agents/skills/kanban/board.sh" \
      emit_pre_existing_dirty_warning "$status_text" ".kanban/issues/1.md"
  )
  if grep -q 'src/foo.py' <<<"$warn_b" && ! grep -q 'other/leak.py' <<<"$warn_b"; then
    pass "files mode from git config ralph.checkpointScope filters paths"
  else
    fail "git config ralph.checkpointScope did not engage files mode" "$warn_b"
  fi
  git config --unset ralph.checkpointScope

  # Case C: no target known → only a count is printed, no in-scope listing.
  warn_c=$(
    RALPH_CHECKPOINT_SCOPE=files \
      BOARD_SH="$HOME/.agents/skills/kanban/board.sh" \
      emit_pre_existing_dirty_warning "$status_text" ""
  )
  if grep -q 'no next-ticket target known yet' <<<"$warn_c" && grep -Eq 'Out-of-scope path count[^0-9]*4\b' <<<"$warn_c"; then
    pass "files mode without target prints count only (4 dirty paths)"
  else
    fail "files-mode no-target warning did not print count-only" "$warn_c"
  fi

  # Case D: default (all) scope → full status listed unfiltered.
  warn_d=$(
    unset RALPH_CHECKPOINT_SCOPE
    BOARD_SH="$HOME/.agents/skills/kanban/board.sh" \
      emit_pre_existing_dirty_warning "$status_text" ".kanban/issues/1.md"
  )
  if grep -q 'other/leak.py' <<<"$warn_d" && grep -q 'src/foo.py' <<<"$warn_d"; then
    pass "default-scope warning shows the full status (in-scope and out-of-scope alike)"
  else
    fail "default-scope warning did not show full status" "$warn_d"
  fi

  cd /
  rm -rf "$TMP_REPO"
}

# ---- summary ---------------------------------------------------------------

hdr "summary"
# Counters were accumulated into the parent-only RESULTS_FILE because each
# fixture runs inside its own subshell. Count the markers in that file.
if [[ -s "$RESULTS_FILE" ]]; then
  FAIL=$(grep -cx 'FAIL' "$RESULTS_FILE" || true)
  PASS=$(grep -cx 'PASS' "$RESULTS_FILE" || true)
else
  FAIL=0
  PASS=0
fi
printf '  passed: %d\n  failed: %d\n' "$PASS" "$FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  echo "checkpoint-scope test FAILED:" >&2
  # Reconstruct a readable failure list (each FAIL block is 3 lines: marker,
  # assertion text, joined extras line).
  awk 'BEGIN{p=1} /^FAIL$/{p=0} p{next} {p=1; print "  - " $0; getline extras; if (extras != "") print "    " extras}' "$RESULTS_FILE" >&2
  exit 1
fi
echo "checkpoint-scope test OK"
