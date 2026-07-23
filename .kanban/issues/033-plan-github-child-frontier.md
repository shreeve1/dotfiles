---
id: 033
title: Plan the eligible GitHub child frontier
status: done
blocked_by: []
parent: null
priority: 0
created: 2026-07-22
updated: 2026-07-23
actor: ralph
action_reviewed: 2026-07-23
---

## What to build

Add a read-only `bin/gralph <parent> --dry-run` path that turns one trusted GitHub parent issue into a deterministic execution plan. It must query the parent's direct child issues and native blocking relationships, admit only open children carrying `ready-for-agent`, and classify every child as eligible, blocked, or excluded without changing GitHub or Git state. Record the parent, immutable base SHA, selected integration verification command, child metadata, and dependency edges in `.gralph/runs/<parent>/manifest.json` for later slices.

The coordinator will invoke `gh` itself; issue data must be handled as data rather than interpolated into shell commands. Mutating runs must require an operator-supplied `--verify <command>` integration command, while `--dry-run` may omit it.

## Acceptance criteria

- [x] `bin/gralph <parent> --dry-run` rejects a missing, non-numeric, closed, or inaccessible parent with a non-zero exit and useful error.
- [x] Only direct, open children of the requested parent with the exact `ready-for-agent` label can be eligible.
- [x] A child is eligible only when every issue reported as blocking it is closed; blocked and excluded children include a machine-readable reason.
- [x] The command writes a deterministic JSON manifest containing the parent number, base SHA, integration command when supplied, child issue numbers, labels, dependency edges, and classifications.
- [x] The dry run performs no issue edits, label changes, branch creation, worktree creation, pushes, or agent launches.
- [x] Tests use fixture responses through a fake `gh` executable and cover malformed data, unrelated issues, missing labels, and open versus closed blockers.

## Verification

`bash tests/gralph-frontier.test.sh`

## Blocked by

None — can start immediately

## Implementation Notes

Added a read-only GraphQL frontier planner with strict response validation, deterministic manifest output, and fixture-driven shell coverage for classification and failure paths.
