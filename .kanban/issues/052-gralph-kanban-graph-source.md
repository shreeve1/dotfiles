---
id: 052
title: Kanban graph source for gralph (pluggable frontier reader)
status: done
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

- [x] Dry-run against a fixture board prints the frontier waves implied by
      `blocked_by` (blockers before dependents)
- [x] A wave with two independent ready tickets lists both in the SAME wave
- [x] A blocked ticket excludes only its own subtree; unrelated tickets
      still schedule (no full-stop on blocked)
- [x] Frontier is re-read from disk between waves
- [x] Existing GitHub-mode tests still pass

## Verification

`bash tests/tralph-kanban-frontier.test.sh` and `bash tests/gralph-frontier.test.sh`

## Implementation Notes

Added `--board <dir>` to `bin/gralph`. New functions `read_kanban_children`
and `refresh_frontier_kanban` produce the same manifest child shape the
GitHub GraphQL source already produces, so `orchestrate_waves` runs
unchanged. The orchestrator branches on `BOARD_DIR` to call the right
refresher between waves. Classification mirrors GitHub: status=done →
CLOSED/excluded; status=pending and no open blockers → eligible;
otherwise blocked or excluded. A referenced blocker id that is missing
from the board is fail-closed (keeps the dependent blocked).

The first implementation parsed the whole `.md` file with yq; real
ticket bodies are markdown prose (not YAML), and some titles contain
embedded `:` (e.g. issue 058), so yq rejected every real ticket. The fix
extracts just the frontmatter slice (after the first `---`, up to the
next blank line or `---`) with awk and parses each field with awk too.
`yq` is no longer a dependency.

Mutating `--board` runs are refused (`exit 2`) until an offline lane
adapter lands. The current orchestrator still drives gh for ticket
admission and claim; without the guard, a mutating board run would
silently call `gh issue view/edit` against real GitHub issues whose
numbers happen to match kanban ticket ids.

`files:` frontmatter (optional) is captured into the manifest's per-child
`files` array.
