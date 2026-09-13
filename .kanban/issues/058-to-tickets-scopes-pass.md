---
id: 058
title: /to-tickets advisory scopes pass (optional files: frontmatter)
status: review
blocked_by: []
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

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

- [ ] Skill instructions describe the optional scopes pass and its
      advisory nature (wrong scope costs parallelism, never correctness)
- [ ] Local-ticket template shows the optional `files:` frontmatter field
- [ ] Guidance explicitly keeps body prose free of file paths (unchanged)

## Verification

`grep -n "files:" .agents/skills/to-tickets/SKILL.md`
