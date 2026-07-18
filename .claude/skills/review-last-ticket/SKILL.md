---
name: review-last-ticket
description: "Review the last finished kanban ticket for gaps, fix them, and leave a reviewer note. Use when the user wants to gap-check, audit, or close out the most recently completed ticket. Skips tickets already carrying a reviewer note."
---

Review the most recently finished `.kanban/` ticket for gaps, fix them, and leave a reviewer note.

## 1. Find the last finished ticket

Scan `.kanban/issues/*.md`. The target is the `status: done` issue with the latest `updated` date (tie-break: highest `id`).

## 2. Guard against re-review

If the target's frontmatter already has an `action_reviewed:` date, it has been reviewed. Stop and report that — do not review or change anything.

## 3. Review for gaps

Run `/code-review` with the fixed point set to the ticket's implementation base (the commit before its first `(#<id>)` commit):

```bash
FIRST=$(git log -F --grep="(#<id>)" --reverse --format=%H | head -1)
# fixed point = ${FIRST}^
```

Gaps are: unmet acceptance criteria, a failing `## Verification` command, or Standards/Spec findings from the review.

## 4. Fix the gaps

Fix every gap found. Rerun the ticket's `## Verification` command; it must exit 0. Commit the fixes to the current branch with a `fix(#<id>): ...` message.

## 5. Leave the reviewer note

Update the ticket file:

- Add `action_reviewed: <today>` to frontmatter (the guard for step 2).
- Add a `## Reviewer Note` section: what was checked, what gaps were found, how they were fixed (or "no gaps found").

Commit the ticket file. Report the ticket id and outcome.
