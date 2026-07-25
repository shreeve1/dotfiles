---
id: 040
title: Finish the parent after the batch PR merges
status: done
updated: 2026-07-25
actor: ralph
blocked_by: [039]
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

## Blocked by

- Blocked by #039

## Implementation Notes

**What changed:** Added standalone `gralph finish <parent>` subcommand with 9 precondition gates (manifest, publication, PR state, child closure, ancestry, current branch, up-to-date local, clean checkout, skill present) before launching a fresh ephemeral Pi process with the finish-spec skill. After Pi exit, verifies parent closure via `gh issue view` and records either `completed` or `parent_left_open` with reason.

**Files:** `bin/gralph` (+finish_parent function, +finish subcommand parsing), `tests/gralph-finish.test.sh` (new, 12 test cases covering all preconditions, Pi failure, Pi success, parent-left-open)

**Decisions:** finish_parent delegates closure, integration, and acceptance review entirely to finish-spec; Gralph only validates mechanical preconditions and observes the outcome. The `parent_left_open` status records the observed state (parent still open after Pi success) rather than introspecting finish-spec's internal reasoning.
