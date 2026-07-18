---
name: ticket-review
description: "Review every finished ticket without a reviewer note for gaps, fix them, and leave a reviewer note on each. Works with local kanban or GitHub/GitLab tickets. Use when the user wants to gap-check, audit, or close out completed tickets. Parent tickets are reviewed together with their child issues; already-noted tickets are skipped."
---

Review every finished ticket that lacks a reviewer note for gaps, fix them, and leave a reviewer note on each.

## 1. Build the review queue

List **all** finished tickets from whatever tracker this repo uses — not just the latest one:

- **Local kanban** (`.kanban/issues/*.md` exists): every `status: done` issue.
- **GitHub / GitLab** (per `docs/agents/issue-tracker.md`): every closed issue.

If `docs/agents/issue-tracker.md` is missing, run `/setup-matt-pocock-skills`. If no tracker is configured at all, ask the user which one to use.

Order the queue oldest-finished first (kanban: by `updated`, then `id`). Then run steps 2–5 for each ticket in turn.

## 2. Guard against re-review

Check whether this ticket already carries a reviewer note (see step 5 for where it lives — `action_reviewed:` frontmatter for kanban, a `ticket-reviewed:` marker comment for GitHub/GitLab). If it does, skip it and move to the next ticket in the queue — do not review or change it. If every ticket in the queue is already noted, report that and stop.

## Parent tickets

If the ticket is a parent (kanban: other issues name it in `parent:`; GitHub/GitLab: it tracks child/sub-issues), review it **together with all its child issues** as one unit: the review scope, acceptance-criteria check, and verification in steps 3–4 must cover the parent and every child. Leave the reviewer note (step 5) on the parent and on each child, and skip those children as standalone queue entries.

## 3. Review for gaps

Run `/code-review` with the fixed point set to the implementation base — the commit before the first commit referencing the ticket (for a parent, the earliest commit across it and all its children):

```bash
FIRST=$(git log -F --grep="<ticket-ref>" --reverse --format=%H | head -1)
# fixed point = ${FIRST}^
```

Gaps are: unmet acceptance criteria (across the parent and every child), a failing verification command, or Standards/Spec findings from the review.

## 4. Fix the gaps

Fix every gap found. Rerun the ticket's verification command (the kanban issue's `## Verification` section, or the command named in the GitHub/GitLab ticket body); it must exit 0. Commit the fixes to the current branch with a message referencing the ticket.

## 5. Leave the reviewer note

Record what was checked, what gaps were found, and how they were fixed (or "no gaps found"), using the tracker's note mechanism — this doubles as the step-2 guard:

- **Local kanban**: add `action_reviewed: <today>` to frontmatter and a `## Reviewer Note` section to the issue file, then commit it.
- **GitHub / GitLab**: post a comment prefixed `ticket-reviewed:` (per `docs/agents/issue-tracker.md`).

Report the ticket reference and outcome.
