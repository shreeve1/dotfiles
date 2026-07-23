# Ralph Progress Log

This file tracks implementation notes across Ralph iterations.

# Conventions & Decisions

- Gralph reads GitHub issue data through GraphQL variables and validates response structure before writing run state.
- Frontier manifests sort children, labels, blockers, and dependency edges for deterministic output.
- Mechanically complete workers advance only after a fresh read-only Pi review returns `approved` with zero critical findings and blockers.

# Iteration Log

## #033 Plan the eligible GitHub child frontier — 2026-07-23

**What changed:** Added read-only direct-child planning, eligibility classification, and deterministic manifests with fixture-driven tests.
**Files:** `bin/gralph`, `tests/gralph-frontier.test.sh`
**Decisions:** Fail rather than silently truncate after 100 children or blockers; non-dry-run execution remains unavailable until later slices.
**Conventions established:** GitHub values cross the shell boundary as GraphQL variables, never interpolated commands.
**Notes for next iteration:** `.gralph/` runtime state is not ignored yet; decide its retention policy when execution artifacts arrive in #034.
**Actionable review:** Re-read the base-to-HEAD diff and every changed file; all criteria passed, the exact verification command exited 0, and shell-file diagnostics reported no errors.

## #034 Execute one child in an isolated Pi worktree — 2026-07-23

**What changed:** Added atomic local claims plus GitHub claim labels, isolated child branches/worktrees, bounded ephemeral Pi workers, a confined worker guard, and coordinator-owned verification and commits.
**Files:** `.gitignore`, `bin/gralph`, `lib/gralph-worker-guard.js`, `tests/gralph-single-child.test.sh`
**Decisions:** Child issue verification is admitted from exactly one backtick command under `## Verification`; workers receive file tools plus only the no-argument `gralph_check` process tool.
**Conventions established:** Gralph runtime state lives under ignored `.gralph/`; workers use temporary HOME directories while Pi core retains its configured agent directory for authentication.
**Notes for next iteration:** #035 can consume the recorded base/start/commit SHAs, verification log, branch, worktree, and Ralph completion fields for independent review.
**Actionable review:** Diffed `b3ef4763bb18cb17d2f940307568cdc232a60ced..HEAD` and read every changed file. Tightened the completion sentinel gate, blocked worker access to `.git`, removed Pi's auth-directory locator from verification environments, and added retry, existing-claim, contradictory-status, commit-failure, post-commit-dirty, and credential-scrubbing coverage. Exact verification passed; critical diagnostics were clean (shell LSP unavailable).

## #035 Independently review a completed worker — 2026-07-23

**What changed:** Added a bounded fresh read-only Pi review phase, evidence prompt and strict JSON artifact, fail-closed gate, and fixture coverage for every acceptance and failure outcome.
**Files:** `bin/gralph`, `tests/gralph-review.test.sh`, `tests/gralph-single-child.test.sh`
**Decisions:** The coordinator captures reviewer stdout as the artifact; only `approved` with internally consistent zero critical and blocker counts advances.
**Conventions established:** Review artifacts and prompts live with other durable run evidence under `.gralph/runs/<parent>/`.
**Notes for next iteration:** #036 can require child execution `complete` plus review gate `accepted` before merging onto the batch branch.
**Fresh review:** Reviewed `git diff 939e8a1521255f1d27b9cf1e5ef13984d3e2d244 HEAD` in an independent session; exact verification passed and the review returned `RALPH_REVIEW: PASS`. Shell LSP was unavailable for `bin/gralph`; test scripts reported no critical diagnostics.
**Actionable review:** Re-read the required base-to-HEAD diff and every changed file. Fixed a timeout race that could accept an `approved` artifact when a reviewer handled `TERM` and exited zero after the deadline; added a regression fixture. Exact verification and the related single-child suite passed; critical diagnostics were clean (shell LSP unavailable).

## #036 Land one accepted child on a batch branch — 2026-07-23 (blocked)

**Attempted:** Added the landing path and merge fixtures, then reproduced Git rejecting the required batch ref.
**Blocker:** `gralph/<parent>` cannot coexist with #034's required `gralph/<parent>/issue-<child>` branch because one Git ref path cannot be both a file and a directory.
**Preserved:** Reverted the incomplete implementation and tests; only the issue status and blocker record remain.
**Needed next:** Amend one branch-naming contract, then rerun #036.
