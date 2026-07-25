---
id: 040
title: Finish the parent after the batch PR merges
status: blocked
blocked_by: [039]
previous_status: done
updated: 2026-07-25
actor: human
action_reviewed: 2026-07-25
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Add `bin/gralph finish <parent>` as the explicit post-merge phase. It must confirm the recorded batch PR is merged, every recorded child-closing reference resulted in a closed child issue, the local default branch contains the merged PR, and the checkout is clean. It then resolves `$HOME/.claude/skills/finish-spec/SKILL.md` to an existing absolute path and starts a fresh ephemeral Pi process with that skill explicitly loaded to run the full integration suite, walk the parent acceptance criteria, make only permitted small integration fixes, and close the parent last.

This command must refuse to finish a partially merged spec. If `finish-spec` identifies work requiring a new slice, its normal behavior of filing a new ready ticket applies and the parent remains open.

## Acceptance criteria

- [x] The command exits non-zero before launching Pi when the batch PR is unmerged, a recorded child remains open, the default branch lacks the merge, or the checkout is dirty.
- [x] Pi runs with `--no-session` and `--skill "$(realpath "$HOME/.claude/skills/finish-spec/SKILL.md")"`; a missing skill fails before launch, and Pi receives the parent number, PR, child list, integration command, and run manifest.
- [x] Parent closure is delegated to the loaded `finish-spec` workflow and can occur only after its clean suite and acceptance-criteria walk succeed.
- [x] A failed suite, material gap, Pi failure, or newly filed child leaves the parent open and records the reason.
- [x] Successful completion records the finish result in the manifest without modifying or reopening closed child issues.
- [x] Tests use fake `gh` and `pi` executables to cover every precondition, exact skill invocation, failure propagation, and successful completion.

## Verification

`bash tests/gralph-finish.test.sh`

## Implementation Notes

**What changed:** Added standalone `gralph finish <parent>` subcommand with 9 precondition gates (manifest, publication, non-empty integration command, PR state, child closure, ancestry, current branch, up-to-date local, clean checkout, skill present) before launching a fresh ephemeral Pi process with the finish-spec skill. After Pi exit, verifies parent closure and remote equality, reopens a parent closed by a failing Pi, and records the structured finish result.

**Files:** `bin/gralph` (`finish_parent` function and `finish` subcommand parsing), `tests/gralph-finish.test.sh` (regression coverage for preconditions, exact Pi invocation, failure reopening, and success)

**Decisions:** finish_parent delegates closure, integration, and acceptance review entirely to finish-spec; Gralph only validates mechanical preconditions and observes the outcome. The `parent_left_open` status records the observed state (parent still open after Pi success) rather than introspecting finish-spec's internal reasoning.

**Actionable review:** The mandated `git diff 88836ffa51425373a9eabe037b5a439a7922f256 HEAD` was empty; audited current implementation directly. Added fail-closed validation for missing/empty `.integrationCommand` and guaranteed a parent closed by a nonzero Pi is reopened. Exact verification passed.

## Blocker

Blocked pending final review: successful-Pi reconciliation previously overwrote reopen diagnostics; this patch preserves them and adds whitespace/query regressions.
