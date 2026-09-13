---
id: 058
title: /to-tickets advisory scopes pass (optional files: frontmatter)
status: done
blocked_by: []
parent: null
created: 2026-09-10
updated: 2026-09-13
actor: ralph

## What to build

The to-tickets skill optionally emits a best-guess `files:` scope per
ticket when publishing to a local kanban board: during the
verify-before-publish step, estimate each ticket's write set from the
exploration already done, record it as `files:` frontmatter, and where two
tickets' scopes overlap, note it (the scheduler in #055 turns overlaps into
serialization at run time — the skill only declares, never enforces).
Scopes are advisory: the skill must say they are best-guess, and omitting
the field entirely remains valid (tickets without scopes schedule by
blocked_by alone). Update the skill's local-ticket template accordingly.
This respects the skill's existing "avoid file paths, they go stale"
guidance by scoping the exception narrowly: `files:` is a machine-read
frontmatter field for the parallel scheduler, not prose file references in
the ticket body.

## Acceptance criteria

- [x] Skill instructions describe the optional scopes pass and its
      advisory nature (wrong scope costs parallelism, never correctness)
- [x] Local-ticket template shows the optional `files:` frontmatter field
- [x] Guidance explicitly keeps body prose free of file paths (unchanged)

## Verification

`grep -n "files:" .agents/skills/to-tickets/SKILL.md`

## Implementation Notes

Added an "Optional scopes pass" paragraph to step 5 of the to-tickets skill process, explaining that `files:` is advisory, a wrong scope costs parallelism never correctness, and body prose stays path-free. Updated `<local-ticket-template>` to include a `**Files:**` line, and added a `## Files (optional)` section to `<issue-template>` with the same advisory framing. Fresh reviewer returned `RALPH_REVIEW: PASS`.
