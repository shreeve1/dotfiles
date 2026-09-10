---
name: issue-tracker
description: Track long-running coding issues across Claude conversations using Markdown files with frontmatter, so context about a bug, the fixes tried, and its status survives between sessions. Use this skill when the user asks to "track an issue", "create a new issue", "update the issue status", "show all issues", "add work performed to issue", or mentions tracking a bug or problem across conversations or over time.
---

# Issue Tracker

Track issues across conversations as Markdown files with YAML frontmatter, so
context about a problem, the work tried, and its status survives between
sessions. You do this with your normal file tools (Read, Write, Edit, Glob) —
there is no separate program to run.

## Where issues live

Store issues in `./issuetracker/` in the current project directory. If it
doesn't exist, create it. Never write to parent directories. If the user names
a path ("use ~/notes/issues"), use that instead.

## File format

One file per issue, named after a slug of the title (lowercase, spaces and
punctuation → hyphens, e.g. "Auth Bug" → `auth-bug.md`).

```markdown
---
title: auth bug
status: open
created: 2025-01-02
last_updated: 2025-01-02
tags: []
---

# Issue: auth bug

## Original Problem
Users cannot log in with API tokens after deployment.

## Work Performed

## Resolution
```

`status` is a free label — typically `open`, `investigating`, `resolved`, or
`closed`, but use whatever fits. Don't block "invalid" transitions; just set
what the user asks for.

## Operations

Find an existing issue by matching the user's words against filenames and
`title` fields. On a clear single match, act on it. On several plausible
matches, list them and ask which. On none, offer to create one.

**Create** — "track the X" / "new issue for X". Slug the title, and if that file
already exists, confirm before overwriting or pick a more distinct title. Create
from the template above; ask for the problem description if the user didn't give
one. Suggest a tag or two (e.g. `security`, `perf`, the repo name) for later
filtering.

**Add work** — "update X — tried Y". Append a timestamped entry under
`## Work Performed` (`### YYYY-MM-DD HH:MM` then bullet points: what was tried,
what happened). Bump `last_updated`. Recording failed attempts is the point —
it stops you repeating them.

**Change status** — "mark X as resolved". Update the `status` field and
`last_updated`, and add a short work entry noting the change. On reopening a
closed issue, leave `created` as the original date and only bump `last_updated`.

**View** — "show X". Print title, status, dates, tags, the problem, and the most
recent few work entries.

**List** — "show all issues". Read every `.md` in the directory and show a
table: title, status, tags, last_updated, newest first. When the user names a
status or tag ("show open issues", "show security issues"), filter to matching
issues.

**Close** — "close X". Ask for a one-line resolution, fill the `## Resolution`
section, set `status: closed`, bump `last_updated`.

## Tips

- Descriptive titles beat "bug" — you search by them later.
- Always document what fixed it before closing.
- Split genuinely separate problems into separate issues.

See [examples.md](examples.md) for worked examples.
