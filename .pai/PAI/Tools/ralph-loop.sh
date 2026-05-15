#!/usr/bin/env bash
# ralph-loop.sh — AFK implementation loop for local kanban
# Reads .kanban/issues/ for unblocked AFK issues and implements them one at a time.
# Each issue runs in a fresh OpenCode context (Memento approach).
#
# Based on Matt Pocock's Ralph loop patterns.
# Hardened after Codex security review (gpt-5.5, 2026-04-26).
#
# Usage:
#   ./ralph-loop.sh                    # Run from project root with .kanban/
#   ./ralph-loop.sh --dry-run          # Show what would be done without running
#   ./ralph-loop.sh --limit 3          # Stop after 3 issues
#   ./ralph-loop.sh --review           # Review last completed issue
#   ./ralph-loop.sh --validate         # Validate kanban schema
#   ./ralph-loop.sh --stale            # Detect and reset stale locks
#
# Requires: jq, opencode, git

set -euo pipefail

KANBAN_DIR=".kanban"
ISSUES_DIR=".kanban/issues"
ARCHIVE_DIR=".kanban/archive"
PROGRESS_FILE=".kanban/progress.md"
DRY_RUN=false
LIMIT=0
COUNT=0
REVIEW_MODE=false
VALIDATE_MODE=false
STALE_MODE=false
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
STALE_THRESHOLD_MINUTES=30
RUN_ID=$(uuidgen 2>/dev/null || echo "ralph-$$-$(date +%s)")

OPENCODE_PERMISSION_ARGS=()
if [[ "${PAI_OPENCODE_AUTO_APPROVE:-1}" == "1" ]]; then
  OPENCODE_PERMISSION_ARGS+=(--dangerously-skip-permissions)
fi

# --- Parse args ---
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --limit) LIMIT="${2:-0}"; shift 2 ;;
    --review) REVIEW_MODE=true; shift ;;
    --validate) VALIDATE_MODE=true; shift ;;
    --stale) STALE_MODE=true; shift ;;
    --help|-h)
      echo "Usage: ralph-loop.sh [--dry-run] [--limit N] [--review] [--validate] [--stale]"
      echo ""
      echo "  --dry-run    Show what would be done without running"
      echo "  --limit N    Stop after N issues"
      echo "  --review     Review the last completed issue with fresh eyes"
      echo "  --validate   Validate kanban schema (IDs, deps, fields)"
      echo "  --stale      Detect and reset stale locks (in-progress > 30min)"
      exit 0
      ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# --- Check dependencies ---
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required. Install with: apt install jq"
  exit 1
fi

if ! command -v opencode &>/dev/null; then
  echo "Error: opencode CLI is required."
  exit 1
fi

# --- Check kanban exists ---
if [[ ! -d "$ISSUES_DIR" ]]; then
  echo "Error: No .kanban/issues/ directory found. Run /kanban init first."
  exit 1
fi

# ============================================================
# Parse frontmatter from a markdown file
# NOTE: Uses grep/sed, not jq, because jq cannot parse YAML.
# This is fragile — it only handles the known frontmatter schema.
# For production use, consider rewriting in TypeScript with a proper YAML parser.
# ============================================================
parse_issue() {
  local file="$1"
  local id title status typ blocked_by priority updated actor

  id=$(grep -m1 '^id:' "$file" 2>/dev/null | sed 's/id: *//' | tr -d ' ')
  title=$(grep -m1 '^title:' "$file" 2>/dev/null | sed 's/title: *//' | tr -d '"')
  status=$(grep -m1 '^status:' "$file" 2>/dev/null | sed 's/status: *//' | tr -d ' ')
  typ=$(grep -m1 '^type:' "$file" 2>/dev/null | sed 's/type: *//' | tr -d ' ')
  blocked_by=$(grep -m1 '^blocked_by:' "$file" 2>/dev/null | sed 's/blocked_by: *//')
  priority=$(grep -m1 '^priority:' "$file" 2>/dev/null | sed 's/priority: *//' | tr -d ' ')
  updated=$(grep -m1 '^updated:' "$file" 2>/dev/null | sed 's/updated: *//' | tr -d ' ')

  # Defaults
  : "${id:=0}"
  : "${title:=untitled}"
  : "${status:=unknown}"
  : "${typ:=AFK}"
  : "${priority:=0}"
  : "${updated:=}"

  # Parse blocked_by array
  local blocked_json
  if [[ "$blocked_by" == "[]" ]] || [[ -z "$blocked_by" ]]; then
    blocked_json="[]"
  else
    blocked_json=$(echo "$blocked_by" | sed 's/\[//;s/\]//' | tr ',' '\n' | jq -R 'gsub("^\\s+|\\s+$"; "") | tonumber? // .' | jq -s .)
  fi

  jq -n \
    --arg id "$id" \
    --arg title "$title" \
    --arg status "$status" \
    --arg type "$typ" \
    --argjson blocked_by "$blocked_json" \
    --arg priority "$priority" \
    --arg updated "$updated" \
    --arg file "$file" \
    '{id: ($id | tonumber), title: $title, status: $status, type: $type, blocked_by: $blocked_by, priority: ($priority | tonumber), updated: $updated, file: $file}'
}

# ============================================================
# Validate all issue files
# ============================================================
validate_board() {
  local errors=0
  local ids=()

  echo "Validating .kanban/issues/..."

  for f in "$ISSUES_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    local parsed
    parsed=$(parse_issue "$f") || { echo "  ERROR: $f — failed to parse frontmatter"; errors=$((errors + 1)); continue; }

    local iid title status typ blocked_by
    iid=$(echo "$parsed" | jq -r '.id')
    title=$(echo "$parsed" | jq -r '.title')
    status=$(echo "$parsed" | jq -r '.status')
    typ=$(echo "$parsed" | jq -r '.type')
    blocked_by=$(echo "$parsed" | jq -c '.blocked_by')

    # Required fields
    [[ -z "$iid" || "$iid" == "0" || "$iid" == "null" ]] && { echo "  ERROR: $f — missing or invalid id"; errors=$((errors + 1)); }
    [[ -z "$title" || "$title" == "null" ]] && { echo "  ERROR: $f — missing title"; errors=$((errors + 1)); }

    # Valid status
    local valid_statuses="pending in-progress review done blocked cancelled"
    if ! echo "$valid_statuses" | grep -qw "$status"; then
      echo "  ERROR: $f — invalid status '$status' (valid: $valid_statuses)"
      errors=$((errors + 1))
    fi

    # Valid type
    if [[ "$typ" != "HITL" && "$typ" != "AFK" ]]; then
      echo "  ERROR: $f — invalid type '$typ' (valid: HITL, AFK)"
      errors=$((errors + 1))
    fi

    # Self-dependency
    if echo "$blocked_by" | jq -e ". | index($iid)" >/dev/null 2>&1; then
      echo "  ERROR: $f — self-dependency (blocked_by contains own id $iid)"
      errors=$((errors + 1))
    fi

    # Duplicate IDs
    if printf '%s\n' "${ids[@]}" 2>/dev/null | grep -qx "$iid"; then
      echo "  ERROR: $f — duplicate id $iid"
      errors=$((errors + 1))
    fi
    ids+=("$iid")
  done

  # Check blocked_by references exist
  local all_ids_json
  all_ids_json=$(printf '%s\n' "${ids[@]}" | jq -R 'tonumber? // .' | jq -s '.')

  for f in "$ISSUES_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    local parsed
    parsed=$(parse_issue "$f") || continue
    local bid
    for bid in $(echo "$parsed" | jq -r '.blocked_by[]'); do
      if ! echo "$all_ids_json" | jq -e ". | index($bid)" >/dev/null 2>&1; then
        # Check archive
        if [[ -d "$ARCHIVE_DIR" ]] && find "$ARCHIVE_DIR" -name "*.md" -exec grep -El "^id: 0*$bid$" {} \; 2>/dev/null | head -1 | grep -q .; then
          : # archived, OK
        else
          echo "  ERROR: $f — blocked_by #$bid does not exist (not in issues/ or archive/)"
          errors=$((errors + 1))
        fi
      fi
    done
  done

  if [[ $errors -eq 0 ]]; then
    echo "Validation passed. No errors found."
    return 0
  else
    echo "Validation failed. $errors error(s) found."
    return 1
  fi
}

# ============================================================
# Detect and reset stale locks
# ============================================================
stale_check() {
  local now_epoch
  now_epoch=$(date +%s)
  local stale_found=false

  for f in "$ISSUES_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    local parsed
    parsed=$(parse_issue "$f") || continue
    local status updated id title
    status=$(echo "$parsed" | jq -r '.status')
    updated=$(echo "$parsed" | jq -r '.updated')
    id=$(echo "$parsed" | jq -r '.id')
    title=$(echo "$parsed" | jq -r '.title')

    if [[ "$status" != "in-progress" && "$status" != "review" ]]; then
      continue
    fi

    # Check if stale (no updated field, or updated > threshold minutes ago)
    if [[ -n "$updated" && "$updated" != "null" ]]; then
      local updated_epoch
      updated_epoch=$(date -d "$updated" +%s 2>/dev/null || echo "$now_epoch")
      local age_minutes=$(( (now_epoch - updated_epoch) / 60 ))
      if [[ $age_minutes -gt $STALE_THRESHOLD_MINUTES ]]; then
        echo "STALE: #$id $title — $status for ${age_minutes}min (threshold: ${STALE_THRESHOLD_MINUTES}min)"
        stale_found=true
      fi
    else
      echo "STALE: #$id $title — $status with no updated timestamp"
      stale_found=true
    fi
  done

  if [[ "$stale_found" == false ]]; then
    echo "No stale locks detected."
  fi
}

# ============================================================
# Dirty worktree check
# ============================================================
check_dirty_worktree() {
  if git rev-parse --git-dir >/dev/null 2>&1; then
    local dirty
    dirty=$(git status --porcelain 2>/dev/null | grep -vE '^.. \.kanban/.*\.log$' || true)
    if [[ -n "$dirty" ]]; then
      echo "ERROR: Dirty worktree detected. Commit or stash before running ralph-loop."
      echo ""
      echo "$dirty"
      return 1
    fi
  fi
  return 0
}

# ============================================================
# Log progress
# ============================================================
log_progress() {
  local issue_id="$1"
  local issue_title="$2"
  local status="$3"
  local details="$4"

  if [[ ! -f "$PROGRESS_FILE" ]]; then
    echo "# Progress Log" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "Notes from each Ralph loop iteration. Read this at the start of a new session." >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
  fi

  echo "## #$issue_id $issue_title — $TIMESTAMP [run:$RUN_ID]" >> "$PROGRESS_FILE"
  echo "**Status:** $status" >> "$PROGRESS_FILE"
  echo "$details" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"

  # Rotate if too large (keep last 50 entries)
  local line_count
  line_count=$(wc -l < "$PROGRESS_FILE" | tr -d ' ')
  if [[ $line_count -gt 500 ]]; then
    mkdir -p "$ARCHIVE_DIR"
    cat "$PROGRESS_FILE" >> "$ARCHIVE_DIR/progress-archive.md"
    # Keep only the header and last 200 lines
    echo "# Progress Log" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "(Archived older entries. See .kanban/archive/progress-archive.md)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    tail -200 "$ARCHIVE_DIR/progress-archive.md" >> "$PROGRESS_FILE"
  fi
}

# ============================================================
# Update a scalar frontmatter field, inserting it if missing
# ============================================================
upsert_frontmatter_field() {
  local file="$1"
  local field="$2"
  local value="$3"

  FIELD="$field" VALUE="$value" perl -0pi -e '
    my $field = $ENV{"FIELD"};
    my $value = $ENV{"VALUE"};
    if (s/^\Q$field\E:\s*.*$/$field: $value/m) {
      next;
    }
    s/\A---\n/---\n$field: $value\n/s;
  ' "$file"
}

# ============================================================
# Mark a reviewed issue done after an independent PASS review
# ============================================================
mark_issue_done() {
  local file="$1"

  upsert_frontmatter_field "$file" "status" "done"
  upsert_frontmatter_field "$file" "updated" "$(date '+%Y-%m-%d')"
  upsert_frontmatter_field "$file" "actor" "ralph"
  upsert_frontmatter_field "$file" "previous_status" "review"
}

# ============================================================
# Commit review closeout changes so the next issue starts clean
# ============================================================
commit_review_closeout() {
  local issue_id="$1"
  local issue_title="$2"
  local issue_file="$3"

  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi

  git add "$issue_file" "$PROGRESS_FILE"
  if git diff --cached --quiet; then
    return 0
  fi

  git commit -m "review(#$issue_id): $issue_title"
}

# ============================================================
# Ensure each successful issue has an implementation commit
# ============================================================
commit_or_verify_implementation() {
  local issue_id="$1"
  local issue_title="$2"
  local before_head="$3"

  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi

  local dirty
  dirty=$(git status --porcelain 2>/dev/null | grep -vE '^.. \.kanban/.*\.log$' || true)
  if [[ -n "$dirty" ]]; then
    git add -A
    git reset -q -- .kanban/*.log 2>/dev/null || true
    if ! git diff --cached --quiet; then
      git commit -m "feat(#$issue_id): $issue_title"
    fi
  fi

  local after_head
  after_head=$(git rev-parse HEAD 2>/dev/null || echo "")
  if [[ -n "$before_head" && -n "$after_head" && "$before_head" == "$after_head" ]]; then
    echo "ERROR: Issue #$issue_id completed without an implementation commit."
    return 1
  fi

  return 0
}

# ============================================================
# Mark a reviewed issue blocked after an independent FAIL review
# ============================================================
mark_issue_review_blocked() {
  local file="$1"

  upsert_frontmatter_field "$file" "status" "blocked"
  upsert_frontmatter_field "$file" "updated" "$(date '+%Y-%m-%d')"
  upsert_frontmatter_field "$file" "actor" "ralph"
  upsert_frontmatter_field "$file" "previous_status" "review"
}

# ============================================================
# Mark an implementation issue blocked before review
# ============================================================
mark_issue_blocked() {
  local file="$1"
  local reason="$2"

  upsert_frontmatter_field "$file" "status" "blocked"
  upsert_frontmatter_field "$file" "updated" "$(date '+%Y-%m-%d')"
  upsert_frontmatter_field "$file" "actor" "ralph"
  upsert_frontmatter_field "$file" "previous_status" "pending"

  if ! grep -q '^## Blocker' "$file"; then
    {
      echo ""
      echo "## Blocker"
      echo ""
      echo "$reason"
    } >> "$file"
  fi
}

# ============================================================
# Commit blocked or failed issue bookkeeping
# ============================================================
commit_issue_bookkeeping() {
  local issue_id="$1"
  local issue_title="$2"
  local prefix="$3"
  local issue_file="$4"

  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi

  git add "$issue_file" "$PROGRESS_FILE"
  if git diff --cached --quiet; then
    return 0
  fi

  git commit -m "$prefix(#$issue_id): $issue_title"
}

# ============================================================
# Run mandatory fresh-session review before advancing
# ============================================================
review_completed_issue() {
  local issue_id="$1"
  local issue_title="$2"
  local issue_file="$3"

  local review_prompt="You are reviewing a completed Ralph issue for quality.

Run ID: $RUN_ID
Issue file: $issue_file

Read the issue file, then review all changed files. Use git diff HEAD~1 if a recent commit exists; otherwise use git status and git diff to inspect the working tree.

Check ALL of these:
1. Every acceptance criterion checkbox is checked AND verified
2. The verification command from the issue's ## Verification section passes
3. Lint passes if configured
4. Typecheck passes if configured
5. No unrelated changes leaked into the diff
6. Changes match the issue scope — no scope creep
7. No security concerns
8. .kanban/progress.md was updated for this issue with what changed, decisions, conventions, and notes for next iteration

Report as one of:
- PASS: all criteria verified, no issues
- PASS WITH NOTES: all criteria met, but suggestions for future
- FAIL: criteria not met, needs rework

End with EXACTLY: <promise:$RUN_ID:REVIEW-PASS</promise> or <promise:$RUN_ID:REVIEW-FAIL</promise>"

  echo "Starting fresh review for issue #$issue_id..."
  echo ""

  local review_output_file
  review_output_file=$(mktemp)
  if opencode run --agent quick-review-codex "${OPENCODE_PERMISSION_ARGS[@]}" "$review_prompt" 2>&1 | tee "$review_output_file"; then
    echo ""
    if grep -q "<promise:$RUN_ID:REVIEW-PASS</promise>" "$review_output_file"; then
      echo "Review passed for issue #$issue_id."
      mark_issue_done "$issue_file"
      log_progress "$issue_id" "$issue_title" "REVIEW PASS" "**Review:** Fresh quick-review-codex session passed. Issue marked done."
      commit_review_closeout "$issue_id" "$issue_title" "$issue_file"
      rm -f "$review_output_file"
      return 0
    fi

    if grep -q "<promise:$RUN_ID:REVIEW-FAIL</promise>" "$review_output_file"; then
      echo "Review failed for issue #$issue_id. Marking blocked."
      mark_issue_review_blocked "$issue_file"
      log_progress "$issue_id" "$issue_title" "REVIEW FAIL" "**Action needed:** Fresh review failed. Check review output and issue file."
      rm -f "$review_output_file"
      return 1
    fi

    echo "Review completed but no structured review signal detected. Marking blocked."
    mark_issue_review_blocked "$issue_file"
    log_progress "$issue_id" "$issue_title" "REVIEW UNCONFIRMED" "**Action needed:** No review promise detected. Manual verification required."
    rm -f "$review_output_file"
    return 1
  fi

  echo "Review command failed for issue #$issue_id. Marking blocked."
  mark_issue_review_blocked "$issue_file"
  log_progress "$issue_id" "$issue_title" "REVIEW ERROR" "**Action needed:** Review session exited with an error."
  rm -f "$review_output_file"
  return 1
}

# ============================================================
# MODE: Validate
# ============================================================
if [[ "$VALIDATE_MODE" == true ]]; then
  validate_board
  exit $?
fi

# ============================================================
# MODE: Stale lock detection
# ============================================================
if [[ "$STALE_MODE" == true ]]; then
  stale_check
  exit 0
fi

# ============================================================
# MODE: Review
# ============================================================
if [[ "$REVIEW_MODE" == true ]]; then
  LATEST_DONE_FILE=""
  for f in "$ISSUES_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    STATUS=$(grep -m1 '^status:' "$f" | sed 's/status: *//')
    if [[ "$STATUS" == "review" || "$STATUS" == "done" ]]; then
      LATEST_DONE_FILE="$f"
    fi
  done

  # Also check for review status (not just done)
  for f in "$ISSUES_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    STATUS=$(grep -m1 '^status:' "$f" | sed 's/status: *//')
    if [[ "$STATUS" == "review" ]]; then
      LATEST_DONE_FILE="$f"
      break  # prefer review-status over done-status
    fi
  done

  if [[ -z "$LATEST_DONE_FILE" ]]; then
    echo "No issues in 'review' or 'done' status to review."
    exit 0
  fi

  ISSUE_ID=$(grep -m1 '^id:' "$LATEST_DONE_FILE" | sed 's/id: *//')
  ISSUE_TITLE=$(grep -m1 '^title:' "$LATEST_DONE_FILE" | sed 's/title: *//' | tr -d '"')

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Reviewing: #$ISSUE_ID $ISSUE_TITLE"
  echo "Run ID: $RUN_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # NOTE: The review prompt uses the run-specific UUID to prevent prompt injection.
  # The completion signal includes the RUN_ID so it can't be spoofed by issue content.
  REVIEW_PROMPT="You are reviewing a recently completed issue for quality.

Run ID: $RUN_ID
Issue file: $LATEST_DONE_FILE

Read the issue file, then review all changed files (use git diff HEAD~1 to see the last commit).

Check ALL of these:
1. Every acceptance criterion checkbox is checked AND verified
2. Tests pass (run them)
3. Lint passes (run it if configured)
4. Typecheck passes (run it if configured)
5. No unrelated changes in the diff
6. Changes match the issue scope — no scope creep
7. No security concerns
8. Code is testable — would you recommend deep module improvements?

Report as one of:
- PASS: all criteria verified, no issues
- PASS WITH NOTES: all criteria met, but suggestions for future
- FAIL: criteria not met, needs rework

End with EXACTLY: <promise:$RUN_ID:REVIEW-PASS</promise> or <promise:$RUN_ID:REVIEW-FAIL</promise>"

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Would review: #$ISSUE_ID $ISSUE_TITLE"
    exit 0
  fi

  opencode run --agent quick-review-codex "${OPENCODE_PERMISSION_ARGS[@]}" "$REVIEW_PROMPT"
  exit $?
fi

# ============================================================
# MAIN LOOP: Pre-flight checks
# ============================================================
echo "Ralph loop starting. Run ID: $RUN_ID"

# Dirty worktree check
if ! check_dirty_worktree; then
  exit 1
fi

# Stale lock warning
stale_check

# --- Collect all issues ---
echo ""
echo "Scanning .kanban/issues/..."
ISSUES=()
for f in "$ISSUES_DIR"/*.md; do
  [[ -f "$f" ]] || continue
  ISSUES+=("$(parse_issue "$f")")
done

if [[ ${#ISSUES[@]} -eq 0 ]]; then
  echo "No issues found in .kanban/issues/"
  exit 0
fi

ALL_JSON=$(printf '%s\n' "${ISSUES[@]}" | jq -s '.')

# --- Find done and archived IDs ---
DONE_IDS=$(echo "$ALL_JSON" | jq '[.[] | select(.status == "done") | .id]')
# Archived issues count as done
ARCHIVED_IDS="[]"
if [[ -d "$ARCHIVE_DIR" ]]; then
  for af in "$ARCHIVE_DIR"/*.md; do
    [[ -f "$af" ]] || continue
    aid=$(grep -m1 '^id:' "$af" | sed 's/id: *//' | tr -d ' ')
    [[ -n "$aid" ]] && ARCHIVED_IDS=$(echo "$ARCHIVED_IDS" | jq ". + [$aid]")
  done
fi
RESOLVED_IDS=$(echo "$DONE_IDS" | jq --argjson archived "$ARCHIVED_IDS" '. + $archived | unique')

# --- Board state ---
echo ""
echo "Board state:"
echo "$ALL_JSON" | jq -r '.[] | "  \(.id). \(.title) [\(.type)] \(.status) p:\(.priority)\(if (.blocked_by | length) > 0 then " blocked_by:\(.blocked_by)" else "" end)"'
echo ""

# --- Find eligible issues: pending + AFK + no unblocked blockers + priority sort ---
ELIGIBLE=$(echo "$ALL_JSON" | jq --argjson resolved "$RESOLVED_IDS" '
  [.[] | select(
    .status == "pending" and
    .type == "AFK" and
    (.blocked_by | map(select(. as $b | $resolved | index($b) | not)) | length == 0)
  )] | sort_by([.priority, .id])
')

TOTAL=$(echo "$ELIGIBLE" | jq 'length')

if [[ "$TOTAL" -eq 0 ]]; then
  echo "No eligible AFK issues found."
  BLOCKED=$(echo "$ALL_JSON" | jq '[.[] | select(.status == "pending" and .type == "AFK")] | length')
  HITL=$(echo "$ALL_JSON" | jq '[.[] | select(.type == "HITL" and .status != "done" and .status != "cancelled")] | length')
  IN_PROGRESS=$(echo "$ALL_JSON" | jq '[.[] | select(.status == "in-progress" or .status == "review")] | length')
  echo "  Pending AFK (dependency-blocked): $BLOCKED"
  echo "  Pending HITL (needs human): $HITL"
  echo "  In progress/review: $IN_PROGRESS"
  exit 0
fi

echo "Found $TOTAL eligible AFK issue(s)."

# Show progress notes from last iteration
if [[ -f "$PROGRESS_FILE" ]]; then
  echo ""
  echo "Last progress notes:"
  tail -15 "$PROGRESS_FILE"
  echo ""
fi

# ============================================================
# Process each eligible issue
# ============================================================
IDX=0
while [[ $IDX -lt $TOTAL ]]; do
  ISSUE=$(echo "$ELIGIBLE" | jq ".[$IDX]")
  ID=$(echo "$ISSUE" | jq -r '.id')
  TITLE=$(echo "$ISSUE" | jq -r '.title')
  FILE=$(echo "$ISSUE" | jq -r '.file')
  PRIORITY=$(echo "$ISSUE" | jq -r '.priority')

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Issue #$ID: $TITLE (priority: $PRIORITY)"
  echo "File: $FILE"
  echo "Run ID: $RUN_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Would implement: #$ID $TITLE"
    echo ""
    IDX=$((IDX + 1))
    continue
  fi

  # Dirty worktree re-check (in case previous issue left dirt)
  if ! check_dirty_worktree; then
    echo "Dirty worktree after previous issue. Stopping."
    exit 1
  fi

  # Build the implementation prompt with RUN_ID for signal isolation
  PROMPT="You are implementing a vertical slice from a local kanban board.

Run ID: $RUN_ID
Issue file: $FILE

CRITICAL: ONLY WORK ON A SINGLE ISSUE. Do not touch scope outside this issue.

Context from prior iterations (read this first):
$(if [[ -f "$PROGRESS_FILE" ]]; then tail -100 "$PROGRESS_FILE"; else echo "No prior progress notes."; fi)

Your instructions:
1. Read the issue file to understand the vertical slice
2. Read the progress notes above for context from prior iterations
3. Explore the relevant parts of the codebase
4. Plan your approach briefly (2-3 sentences)
5. Implement the full vertical slice end-to-end
6. Run tests/lint/typecheck to verify
7. If the project uses git, commit all implementation changes, the issue file, and .kanban/progress.md with message: feat(#$ID): $TITLE

SAFETY: Stop immediately and report <promise:$RUN_ID:BLOCKED</promise> if this issue involves any of the following, unless the issue frontmatter explicitly contains afk_approved: true:
- Authentication or authorization changes
- Billing or payment logic
- Database migrations (destructive)
- File deletions
- Security-sensitive code (keys, tokens, secrets)
- Dependency version upgrades
- Production configuration changes

When done, update the issue file:
- Change status: pending to status: review
- Check all acceptance criteria: [ ] to [x]
- Add updated: $(date '+%Y-%m-%d')
- Add actor: ralph
- Add previous_status: pending
- Add a ## Implementation Notes section with what you changed and why

Then write progress to .kanban/progress.md:
- Append section with issue number, title, what changed, decisions, conventions, notes for next iteration

Then commit the completed implementation if git is available:
- git add all files changed for this issue, the issue file, and .kanban/progress.md
- git commit -m 'feat(#$ID): $TITLE'

If you CANNOT complete the issue:
- Change status: pending to status: blocked
- Add updated: $(date '+%Y-%m-%d')
- Add actor: ralph
- Add a ## Blocker section explaining what went wrong
- Append to .kanban/progress.md noting the blocker

On successful completion, output EXACTLY this line (nothing else on that line):
<promise:$RUN_ID:COMPLETE</promise>

On blocked/failure, output EXACTLY this line:
<promise:$RUN_ID:BLOCKED</promise>"

  # Run OpenCode in the current workspace
  echo "Starting OpenCode for issue #$ID..."
  echo ""

  BEFORE_HEAD=""
  if git rev-parse --git-dir >/dev/null 2>&1; then
    BEFORE_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
  fi

  OUTPUT_FILE=$(mktemp)
  if opencode run --agent build "${OPENCODE_PERMISSION_ARGS[@]}" "$PROMPT" 2>&1 | tee "$OUTPUT_FILE"; then
    echo ""

    # Check for run-specific completion signal (prevents prompt injection from issue content)
    if grep -q "<promise:$RUN_ID:COMPLETE</promise>" "$OUTPUT_FILE"; then
      echo "Issue #$ID completed successfully."
      log_progress "$ID" "$TITLE" "IMPLEMENTED" "**Files:** See Implementation Notes in issue file. Starting fresh review before next issue."
      if ! commit_or_verify_implementation "$ID" "$TITLE" "$BEFORE_HEAD"; then
        mark_issue_review_blocked "$FILE"
        log_progress "$ID" "$TITLE" "COMMIT MISSING" "**Action needed:** Implementation completed but no implementation commit was created."
        rm -f "$OUTPUT_FILE"
        exit 1
      fi
      if ! review_completed_issue "$ID" "$TITLE" "$FILE"; then
        echo "Stopping loop because issue #$ID did not pass review."
        rm -f "$OUTPUT_FILE"
        exit 1
      fi
    elif grep -q "<promise:$RUN_ID:BLOCKED</promise>" "$OUTPUT_FILE"; then
      echo "Issue #$ID BLOCKED. Check the issue file for details."
      mark_issue_blocked "$FILE" "Ralph stopped before implementation or review. Check the run output for details."
      log_progress "$ID" "$TITLE" "BLOCKED" "**Action needed:** Check issue file for Blocker section"
      commit_issue_bookkeeping "$ID" "$TITLE" "block" "$FILE"
      # Continue to next issue instead of stopping
    else
      echo "Issue #$ID completed but no structured signal detected."
      echo "WARNING: Verify manually. The agent may not have followed the protocol."
      mark_issue_blocked "$FILE" "Ralph did not receive a structured completion or blocked signal. Manual verification required."
      log_progress "$ID" "$TITLE" "DONE (UNCONFIRMED)" "**Note:** No completion signal detected. Manual verification required."
      commit_issue_bookkeeping "$ID" "$TITLE" "block" "$FILE"
    fi
  else
    echo ""
    echo "Issue #$ID FAILED (OpenCode exited with error)."
    mark_issue_blocked "$FILE" "OpenCode exited with an error during Ralph implementation. Re-run manually after investigating the log."
    log_progress "$ID" "$TITLE" "FAILED" "**Action needed:** Re-run this issue manually"
    commit_issue_bookkeeping "$ID" "$TITLE" "block" "$FILE"
    rm -f "$OUTPUT_FILE"
    echo "Stopping loop. Fix the issue and re-run."
    exit 1
  fi

  rm -f "$OUTPUT_FILE"
  COUNT=$((COUNT + 1))

  if [[ $LIMIT -gt 0 ]] && [[ $COUNT -ge $LIMIT ]]; then
    echo ""
    echo "Reached limit of $LIMIT issues. Stopping."
    exit 0
  fi

  IDX=$((IDX + 1))

  if [[ $IDX -lt $TOTAL ]]; then
    echo ""
    echo "Moving to next issue in 3 seconds..."
    sleep 3
  fi
done

if [[ "$DRY_RUN" == false && $COUNT -gt 0 ]]; then
  if [[ $LIMIT -eq 0 ]]; then
    echo ""
    echo "Rescanning for newly unblocked issues..."
    exec "$0"
  fi

  REMAINING=$((LIMIT - COUNT))
  if [[ $REMAINING -gt 0 ]]; then
    echo ""
    echo "Rescanning for newly unblocked issues... remaining limit: $REMAINING"
    exec "$0" --limit "$REMAINING"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ralph loop complete. Processed $COUNT issue(s). Run ID: $RUN_ID"
echo ""
echo "Remaining board state:"
for f in "$ISSUES_DIR"/*.md; do
  [[ -f "$f" ]] || continue
  PARSED=$(parse_issue "$f")
  PARSED_ID=$(echo "$PARSED" | jq -r '.id')
  PARSED_TITLE=$(echo "$PARSED" | jq -r '.title')
  PARSED_STATUS=$(echo "$PARSED" | jq -r '.status')
  PARSED_TYPE=$(echo "$PARSED" | jq -r '.type')
  PARSED_PRIORITY=$(echo "$PARSED" | jq -r '.priority')
  echo "  #$PARSED_ID $PARSED_TITLE [$PARSED_TYPE] $PARSED_STATUS p:$PARSED_PRIORITY"
done
echo ""
echo "Progress log: .kanban/progress.md"
echo "Validate board: ./ralph-loop.sh --validate"
echo "Review completed work: ./ralph-loop.sh --review"
echo "Check for stale locks: ./ralph-loop.sh --stale"
