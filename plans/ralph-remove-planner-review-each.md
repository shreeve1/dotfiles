# Remove planner + review-each driver stages from ralph-loop.sh

Date: 2026-08-22 · Status: awaiting approval · Precedes: one conventional commit `refactor(ralph): drop planner and review-each stages, keep driver verification gate`

## Decisions (settled with user 2026-08-22)

1. **Delete the planner stage** (`run_planner`, `PLAN_EACH`, plan sentinel machinery). The implement skill + Ralph protocol §5 step "read the plan if present" cover planning.
2. **Delete the review-each stage** (`run_inline_review` mode=review, `REVIEW_EACH`, `RALPH_REVIEW_MODEL`). The worker already runs its own fresh reviewer per Ralph protocol §4 (SKILL.md:327-386) — under today's defaults the driver reviewer was a duplicate second review.
3. **Delete the BLOCKED repair + drain machinery** (`AUTO_REVIEW_BLOCKED`, `run_inline_review` mode=repair, `select_next_blocked_target`). Attended runs stop at first BLOCKED (old behavior); unattended runs exit 1 → supervisor relaunch skips the blocked issue. `--review-loop` remains the manual unblock tool and is untouched.
4. **Keep a driver verification gate** on DONE: deterministically re-run the issue's cleanly-runnable `## Verification` command; pass → ensure `done`; fail → `blocked` + Blocker note; prose → trust the worker's DONE and ensure `done`. Extracted from old `run_inline_review` :1179-1233 into a new `run_verification_gate()`.
5. Full positional renumber 28 → 24 with count assertions in verification (lesson: 24-vs-28 misalignment bug, commit 6901a27 session).

All line anchors below are PRE-EDIT (commit 6901a27). They shift as edits land — apply top-down or re-locate by quoted text.

## A. ralph-loop.sh — outer script

- `:44-46` delete:
  ```bash
  AUTO_REVIEW_BLOCKED="${RALPH_AUTO_REVIEW_BLOCKED:-true}"
  REVIEW_EACH="${RALPH_REVIEW_EACH:-true}"
  PLAN_EACH="${RALPH_PLAN_EACH:-true}"
  ```
- `:54-56` delete (dead outer twins of inner state; review machinery only):
  ```bash
  # shellcheck disable=SC2034  # populated/consumed by the inner LOOP_SCRIPT heredoc
  REVIEW_BASE_SHA=""
  # shellcheck disable=SC2034  # ditto
  BASE_REMINDER=""
  ```
- `:59-62` delete the comment + `RALPH_REVIEW_MODEL="${RALPH_REVIEW_MODEL:-minimax/MiniMax-M3}"`.
- usage() `:86-92` delete the `--auto-review-blocked`, `--no-auto-review-blocked`, `--review-each`, `--no-review-each`, `--review-model`, `--plan-each`, `--no-plan-each` lines. Keep `--review-loop` (:84) and `--skip-blocked` (:85).
- Arg parsing: delete `--review-model` block `:147-154`, `--auto-review-blocked`/`--no-auto-review-blocked` `:168-175`, `--review-each`/`--no-review-each` `:176-183`, `--plan-each`/`--no-plan-each` `:184-191`.
- `:1679-1681` delete the three `Configuration:` echo lines for Auto-review blocked / Review each / Plan each.
- INNER_ARGS `:1657-1666`: remove `"$AUTO_REVIEW_BLOCKED"`, `"$REVIEW_EACH"`, `"$RALPH_REVIEW_MODEL"`, `"$PLAN_EACH"` → 24 elements (see §C).

## B. ralph-loop.sh — inner LOOP_SCRIPT

- Positional header `:427-434`: delete `AUTO_REVIEW_BLOCKED="${19}"`, `REVIEW_EACH="${22:-true}"`, `RALPH_REVIEW_MODEL="${23:-}"`, `PLAN_EACH="${26:-true}"`; renumber to §C order.
- `:445-459` delete the whole block: comment + `REVIEW_BASE_SHA=""` + `BASE_REMINDER=""` + `PLAN_MODE=false` + `REVIEW_PROMPT_REMINDER=...` (with comment :453-454) + `PLAN_PROMPT_REMINDER=...`. Sole consumers were `run_inline_review`/`run_planner` (fact-checked: review-loop mode uses its own outer inline literal, NOT `REVIEW_PROMPT_REMINDER`).
- Prompt concat: `:710` (run_pi_adapter) and `:842` (run_tmux_adapter) drop `"$BASE_REMINDER"` from the `full_prompt`/`prompt` concatenation.
- `:682-690` delete `has_plan_result()` + its comment block.
- `:692-701` `blocked_is_skippable()`: drop the `"$AUTO_REVIEW_BLOCKED" == "true"` clause and rewrite the comment to:
  ```bash
  # A BLOCKED sentinel is non-fatal (keep looping instead of stopping) when running
  # the review loop or when --skip-blocked is set, as long as there is no FAIL.
  ```
- run_tmux_adapter: delete PLAN_MODE branch in result-file path `:876-880` and pane path `:902-906`.
- `:599-620` delete `select_next_blocked_target()` + comment (sole caller was the drain).
- KEEP: `review_issue_attempted` (:539), `ATTEMPTED_REVIEW_ISSUES` (init :1312), `count_actionable_review_targets`, `select_actionable_review_target` — review-loop machinery still uses them (:554, :581, :1560-1562).
- `:1049-1089` delete `run_planner()` + its comment block.
- `:1091-1244` delete `run_inline_review()` + its comment block. KEEP `extract_runnable_verification` (:1002-1033) and `set_issue_status` (:1035-1047) — the new gate calls them.
- New function after `set_issue_status` (reuses old :1179-1233 semantics; note the guard BEFORE `normalize_issue_id` — it maps empty → "0"):
  ```bash
  # Driver verification gate: after a worker prints RALPH_RESULT: DONE #<id>, the
  # driver itself re-runs the issue's cleanly-runnable ## Verification command and
  # overrides to blocked on failure — the worker's DONE is not trusted on faith.
  # Prose verifications have no runnable command, so the DONE stands (the worker's
  # own protocol §4 fresh review remains the review layer). Driver-authored status
  # changes are committed immediately so the worktree-merge finalizer sees them.
  run_verification_gate() {
    local output_file="$1" raw_id target_id target_file verify_cmd
    raw_id=$(extract_completed_issue "$output_file")
    [[ -n "$raw_id" ]] || return 0
    target_id=$(normalize_issue_id "$raw_id")
    target_file=$(grep -l "^id: ${target_id}$" .kanban/issues/*.md 2>/dev/null | head -1 || true)
    [[ -n "$target_file" ]] || return 0
    verify_cmd=$(extract_runnable_verification "$target_file")
    if [[ -n "$verify_cmd" ]]; then
      echo "▶ Verification gate (#$target_id): $verify_cmd" | tee -a "$LOG_FILE"
      if bash -lc "$verify_cmd" 2>&1 | tee -a "$LOG_FILE"; then
        set_issue_status "$target_file" done
        echo "✅ Verification gate passed for #$target_id (status: done)" | tee -a "$LOG_FILE"
      else
        echo "❌ Verification FAILED for #$target_id; overriding DONE→blocked" | tee -a "$LOG_FILE"
        set_issue_status "$target_file" blocked
        printf '\n## Blocker\n\nWorker printed DONE but the driver verification gate failed: `%s` (exit nonzero). Auto-parked done→blocked; see the loop log for output.\n' "$verify_cmd" >> "$target_file"
      fi
    else
      set_issue_status "$target_file" done
      echo "✅ Verification gate: prose verification for #$target_id — trusting worker DONE (status: done)" | tee -a "$LOG_FILE"
    fi
    if git rev-parse --git-dir >/dev/null 2>&1; then
      if ! git diff --quiet -- "$target_file" 2>/dev/null; then
        git add -- "$target_file" 2>/dev/null \
          && git commit -m "review(#$target_id): driver-authored status after verification gate" 2>&1 | tee -a "$LOG_FILE" || true
      fi
    fi
    return 0
  }
  ```

## C. Positional contract — LOCKSTEP (the 24-vs-28 bug class)

The `INNER_ARGS` list (outer, post-`:1656`) and the positional header (inner, `:409-436`) are ONE contract. New order, 24 elements, identical in both:

```
 1 ADAPTER            13 USE_NORMAL_TMUX
 2 PROJECT_DIR        14 SHARED_PROMPT_REMINDER
 3 SESSION_NAME       15 RALPH_MODEL
 4 CONTINUE_ON_ERROR  16 CHECKPOINT_DIRTY
 5 SLEEP_INTERVAL     17 REVIEW_LOOP
 6 READY_DELAY        18 LSP_CHECK_CMD
 7 ITERATION_TIMEOUT  19 UNATTENDED          (:-false)
 8 READY_TIMEOUT      20 MAX_ISSUE_FAILS     (:-2)
 9 AGENT_CMD          21 AGENT_CMD_EXPLICIT  (:-false)
10 AGENT_PROMPT       22 SKIP_BLOCKED        (:-false)
11 SKILL_DIR          23 IMPLEMENT_SKILL_DIR (:-"")
12 TMUX_SOCKET        24 USE_IMPLEMENT_SKILL (:-false)
```

Bindings 1-18 keep `"${N}"` form; 19-24 keep `"${N:-default}"`. Any element change must edit BOTH sides and re-run the count assertions in §F.

## D. ralph-loop.sh — main loop

- `:1275-1277` delete the three banner echo lines (Auto-review blocked / Review each / Plan each).
- Drain `:1414-1435` — the `elif` collapses to (delete the whole `AUTO_REVIEW_BLOCKED`/`DRAIN_*`/`run_inline_review` inner block, keep the completion):
  ```bash
  elif [[ $UNBLOCKED_COUNT -eq 0 && $ACTIVE_COUNT -eq 0 ]]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ No active or unblocked pending issues found" | tee -a "$LOG_FILE"
    echo "Ralph loop complete!" | tee -a "$LOG_FILE"
    break
  fi
  ```
- `:1456-1464` delete the planner-stage comment + `if PLAN_EACH ... run_planner` block.
- `:1466-1477` delete the `REVIEW_BASE_SHA`/`BASE_REMINDER` capture block + comment (worker's §4 reviewer computes its own diff base).
- `:1499-1510` becomes:
  ```bash
  if [[ $LAST_EXIT_CODE -eq 0 ]] && blocked_is_skippable "$RALPH_OUTPUT"; then
    BLOCKED_ISSUE=$(extract_result_issue "$RALPH_OUTPUT")
    echo "⏭️  Issue #${BLOCKED_ISSUE:-?} BLOCKED — skipping and continuing to the next eligible issue" | tee -a "$LOG_FILE"
  fi
  ```
  (Unskippable BLOCKED already fails the adapter via `has_failure_result`; no code needed here.)
- `:1544-1555` replace the review-each block with:
  ```bash
  # Driver verification gate: a DONE sentinel is not trusted on faith. Re-run the
  # issue's cleanly-runnable ## Verification command; pass → ensure done, fail →
  # blocked with a Blocker note. Prose verifications stay worker-authoritative.
  if [[ "$REVIEW_LOOP" != "true" && $LAST_EXIT_CODE -eq 0 ]]; then
    run_verification_gate "$RALPH_OUTPUT"
  fi
  ```
  Runs AFTER the post-worker checkpoint block (:1517-1542) so the gate's status flip + commit land on a clean tree.

## E. Docs, skill text, external callers

- **ralph/SKILL.md**: delete runner examples `--no-auto-review-blocked` (:33) and `--no-review-each` (:34); delete section "Inline auto-review on block (default)" (:41-68); replace section "Per-issue review on DONE (default on)" (:70-110) with a short "### Driver verification gate (on DONE)" section describing §D semantics (one worker per issue; the worker's §4 fresh review is the review layer; the gate is a deterministic backstop); delete section "Planner stage (loop only, optional)" (:291-301); reword step 5 (:311) to drop planner attribution ("if the issue file has a ## Plan section, follow it" — plans may be human-authored). Philosophy :9/:14 and durable-contract :131 stay valid as-is.
- **docs/adr/0007-ralph-single-worker-per-issue.md** (new, follow existing ADR format): decision = one driver worker per issue; worker-owned §4 review + implement skill replace driver planner/reviewer/repair; driver keeps deterministic verification gate; trade-offs (double review removed, blocked-drain self-healing moves to supervisor relaunch / manual --review-loop); supersedes 0005. Mark **docs/adr/0005-ralph-planner-stage.md** status Superseded by 0007.
- **CONTEXT.md**: add one glossary term under "Verification passes": **Verification gate (Ralph)** — the ralph-loop driver re-runs an issue's `## Verification` command after the DONE sentinel and overrides done→blocked on failure; deterministic, complements (not replaces) the fresh-session review.
- **~/.zshrc** `tralph()` :337: delete the `RALPH_REVIEW_MODEL=...` line (keep RALPH_MODEL).
- **/home/james/.config/systemd/user/ralph-loop.service** :16 (machine-local, NOT in repo): delete `Environment=RALPH_REVIEW_MODEL=minimax/MiniMax-M3`, then `systemctl --user daemon-reload`. Leave the `-bak-` sibling untouched.
- **plans/ralph-planner-stage.md**: delete (untracked scratch, superseded by this doc).

## F. Verification (all must pass before commit)

1. `bash -n .claude/skills/ralph/ralph-loop.sh`
2. Positional contract, both must print 24 and be equal:
   - `sed -n '/^cat >"\$LOOP_SCRIPT"/,/LOOP_EOF/p' .claude/skills/ralph/ralph-loop.sh | grep -c '^[A-Z_]*="\${[0-9]'` (header bindings)
   - `sed -n '/^INNER_ARGS=()/,/^done/p' .claude/skills/ralph/ralph-loop.sh | grep -o '"\$[A-Z_]*"' | wc -l` (list elements)
3. Dead-symbol sweep, expect ZERO hits in ralph-loop.sh:
   `grep -nE 'PLAN_EACH|REVIEW_EACH|AUTO_REVIEW_BLOCKED|RALPH_REVIEW_MODEL|PLAN_MODE|has_plan_result|run_planner|run_inline_review|REVIEW_BASE_SHA|BASE_REMINDER|PLAN_PROMPT_REMINDER|REVIEW_PROMPT_REMINDER|select_next_blocked_target|review-model|auto-review-blocked|plan-each|review-each' .claude/skills/ralph/ralph-loop.sh`
   (REVIEW_LOOP and SHARED_PROMPT_REMINDER must still be present.)
4. Doc sweep, expect ZERO hits: `grep -nE 'plan-each|review-each|review-model|auto-review' .claude/skills/ralph/SKILL.md` (prose "auto-review" references in history sections rewritten per §E).
5. Shimmed e2e (pi adapter, default socket, harness proven twice): scratch git repo + `.kanban/progress.md` + issue `001-demo.md` (id 1, pending, priority 0, blocked_by [], ## Acceptance, ## Verification), shim `bin/pi` appending argv to /tmp/ralph-pi-argv.txt. Three runs:
   a. Verification `` `true` `` → loop completes; issue ends `status: done`; log shows `▶ Verification gate (#1)` and `review(#1): driver-authored status` commit; exactly ONE pi invocation (implementer: both `--skill` ralph + implement, prompt starts `/skill:implement`).
   b. Verification `` `false` `` → issue ends `status: blocked` with `## Blocker` naming the failed command; loop completes (blocked issue ineligible).
   c. Prose verification ("Restart the service and check logs") → issue ends `status: done` via the prose branch.
   Cleanup per harness: kill tmux session, rm scratch + /tmp/ralph-pi-argv.txt + ~/.cache/ralph-loop-<session>.{log,sh}.
6. Independent reviewer subagent over the full diff (diff hygiene, gate semantics vs old :1179-1233, positional lockstep, review-loop mode untouched, no orphaned helpers).

## G. Commit & hygiene

- Single commit: `refactor(ralph): drop planner and review-each stages, keep driver verification gate` containing ralph-loop.sh, ralph/SKILL.md, docs/adr/0007 (new), docs/adr/0005 (superseded marker), CONTEXT.md, .zshrc, plans/ralph-remove-planner-review-each.md.
- systemd unit edit is machine-local — not part of the commit.
- Never stage `.omp/agent/config.yml` (pre-existing unrelated edit) or touch `.claude/skills/build-dark-factory/` (user's untracked work).
