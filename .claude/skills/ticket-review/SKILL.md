---
name: ticket-review
description: "Review the last finished ticket for gaps, fix them, and leave a reviewer note. Works with local kanban or GitHub/GitLab tickets. Use when the user wants to gap-check, audit, or close out the most recently completed ticket. Skips tickets that already have a reviewer note."
---

Review the most recently finished ticket for gaps, fix them, and leave a reviewer note.

## 1. Find the last finished ticket

Locate the most recently completed ticket from whatever tracker this repo uses:

- **Local kanban** (`.kanban/issues/*.md` exists): the `status: done` issue with the latest `updated` date (tie-break: highest `id`).
- **GitHub / GitLab** (per `docs/agents/issue-tracker.md`): the most recently closed issue.

If no tracker is configured, ask the user which one to use.

## 2. Guard against re-review

Check whether this ticket already carries a reviewer note (see step 5 for where it lives — `action_reviewed:` frontmatter for kanban, a `ticket-reviewed` marker comment for GitHub/GitLab). If it does, the ticket was already reviewed. Stop and report that — do not review or change anything.

## 3. Review for gaps

Run `/code-review` with the fixed point set to the ticket's implementation base — the commit before its first commit referencing the ticket:

```bash
FIRST=$(git log -F --grep="<ticket-ref>" --reverse --format=%H | head -1)
# fixed point = ${FIRST}^
```

Gaps are: unmet acceptance criteria, a failing verification command, or Standards/Spec findings from the review.

## 4. Fix the gaps

Fix every gap found. Rerun the ticket's verification command; it must exit 0. Commit the fixes to the current branch with a message referencing the ticket.

## 5. Leave the reviewer note

Record what was checked, what gaps were found, and how they were fixed (or "no gaps found"), using the tracker's note mechanism — this doubles as the step-2 guard:

- **Local kanban**: add `action_reviewed: <today>` to frontmatter and a `## Reviewer Note` section to the issue file, then commit it.
- **GitHub / GitLab**: post a comment prefixed `ticket-reviewed:` (per `docs/agents/issue-tracker.md`).

Report the ticket reference and outcome.
