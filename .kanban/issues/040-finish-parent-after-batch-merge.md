---
id: 040
title: Finish the parent after the batch PR merges
status: in-progress
blocked_by: [039]
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Add `bin/gralph finish <parent>` as the explicit post-merge phase. It must confirm the recorded batch PR is merged, every recorded child-closing reference resulted in a closed child issue, the local default branch contains the merged PR, and the checkout is clean. It then resolves `$HOME/.claude/skills/finish-spec/SKILL.md` to an existing absolute path and starts a fresh ephemeral Pi process with that skill explicitly loaded to run the full integration suite, walk the parent acceptance criteria, make only permitted small integration fixes, and close the parent last.

This command must refuse to finish a partially merged spec. If `finish-spec` identifies work requiring a new slice, its normal behavior of filing a new ready ticket applies and the parent remains open.

## Acceptance criteria

- [ ] The command exits non-zero before launching Pi when the batch PR is unmerged, a recorded child remains open, the default branch lacks the merge, or the checkout is dirty.
- [ ] Pi runs with `--no-session` and `--skill "$(realpath "$HOME/.claude/skills/finish-spec/SKILL.md")"`; a missing skill fails before launch, and Pi receives the parent number, PR, child list, integration command, and run manifest.
- [ ] Parent closure is delegated to the loaded `finish-spec` workflow and can occur only after its clean suite and acceptance-criteria walk succeed.
- [ ] A failed suite, material gap, Pi failure, or newly filed child leaves the parent open and records the reason.
- [ ] Successful completion records the finish result in the manifest without modifying or reopening closed child issues.
- [ ] Tests use fake `gh` and `pi` executables to cover every precondition, exact skill invocation, failure propagation, and successful completion.

## Verification

`bash tests/gralph-finish.test.sh`

## Blocked by

- Blocked by #039
