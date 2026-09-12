---
id: 052
title: Kanban graph source for gralph (pluggable frontier reader)
status: review
blocked_by: []
parent: null
created: 2026-09-10
updated: 2026-09-12
actor: to-tickets

## What to build

`bin/gralph` gains a second graph source: a local `.kanban` board. A new
board mode (e.g. `gralph --board <dir> --dry-run --verify <cmd>`) reads
`status` / `blocked_by` / optional `files:` frontmatter from the board's
issue files into the same manifest child shape the GitHub GraphQL source
produces, so the existing wave orchestrator runs unchanged. The frontier is
re-derived from disk between waves (a ticket dropped mid-run joins the next
wave). GitHub mode keeps working untouched.

Vocabulary per CONTEXT.md § Parallel Ralph (graph source, frontier, wave).

## Acceptance criteria

- [ ] Dry-run against a fixture board prints the frontier waves implied by
      `blocked_by` (blockers before dependents)
- [ ] A wave with two independent ready tickets lists both in the SAME wave
- [ ] A blocked ticket excludes only its own subtree; unrelated tickets
      still schedule (no full-stop on blocked)
- [ ] Frontier is re-read from disk between waves
- [ ] Existing GitHub-mode tests still pass

## Verification

`bash tests/tralph-kanban-frontier.test.sh` and `bash tests/gralph-frontier.test.sh`
