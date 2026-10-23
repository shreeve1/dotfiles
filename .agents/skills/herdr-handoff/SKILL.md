---
name: herdr-handoff
description: Open a new herdr tab with a fresh pi session that starts from a written brief. Two modes - `task` spins off a separate task found mid-session into a background tab; `handoff` continues the current work in a fresh session and switches to it. Use when the user says /herdr-handoff, or, inside herdr, "hand this off", "continue in a fresh session", "spin this off into a new tab", or "start a new pi on this".
---

# herdr-handoff

Write a brief, open a herdr tab, start pi in it, and point pi at the brief. The new
session has none of this conversation, so the brief is the only thing it knows.

Invocation: `/skill:herdr-handoff task "<the task>"` or `/skill:herdr-handoff handoff "<focus>"`.
If the mode is missing, infer it: something separate from the current work is `task`;
carrying on the current work is `handoff`. Ask only if it is truly unclear.

| Mode | Brief covers | New tab | Afterwards |
| --- | --- | --- | --- |
| `task` | only the named task | background, you stay here | carry on with the current work |
| `handoff` | the current work, steered by the focus | opens and takes focus | offer to close this pane |

## 1. Check herdr

`test "${HERDR_ENV:-}" = 1` must pass. If not, say you are not inside herdr and stop.

## 2. Write the brief

Write it to `~/.local/state/herdr-handoff/<YYYYMMDD-HHMMSS>-<slug>.md`, where `<slug>`
is 2-4 lowercase words joined by hyphens (`fix-sync-timeout`). Keep it out of the repo.
If that file already exists, another session wrote it: pick a new name, never overwrite it.

Write for a capable engineer who has seen nothing. Use facts from this session:
real paths, commands, error text, and decisions. Leave out the story of how you got here.
A brief that says "the bug we found" without saying what the bug is fails.

**`task` brief** - only what the new task needs; leave out the current work unless it
explains the task:

```markdown
# <Task title>
## Goal
<what done looks like, in one or two sentences>
## Context
<why this came up, what was observed: files, lines, errors, commands>
## Known so far
<anything already checked or ruled out>
## Constraints
<scope limits, things not to touch, the user's stated preferences>
## Verify
<how to prove it is done>
```

**`handoff` brief** - everything needed to carry on. The focus decides what comes
first and what can be cut:

```markdown
# <Work title> (continued)
## Focus for this session
<the user's focus, made concrete>
## Goal
## State now
<what is done and verified, what is changed but unverified; branch and uncommitted files>
## Next steps
<ordered, specific>
## Decisions made
<choice + reason, so they are not reopened>
## Gotchas
<traps already hit>
## Key files
```

At the end of either brief, add a line with the previous session file so the new
session can search it if it needs more:
`Previous session: <path>`. Get the path from
`herdr pane current --current | jq -r '.result.pane.agent_session.value'`.

## 3. Spawn

```bash
~/.agents/skills/herdr-handoff/scripts/spawn.sh <task|handoff> <brief-path> <slug>
```

Run it from the directory the new session should work in, which is normally the current
one. The script opens the tab (in the background for `task`, with focus for `handoff`),
starts pi there, gives it the brief, and waits until pi starts working. It prints
the agent name, pane ID and status.

- Exit 2 (`status=blocked`): the new pi stopped at a question or approval. Run
  `herdr agent read <agent>`, tell the user what it is asking, and do not offer to close
  this pane. Do not answer the question for them.
- Any other failure: show the error and the brief path; the brief is still useful by hand.
  A tab may have opened without an agent in it; say so, so the user can close it.

## 4. Report

In one or two lines: the tab label, the agent name, and the brief's absolute path
as plain text in a codespan.

- `task`: then go back to what you were doing.
- `handoff`: ask whether to close this pane. If the user says yes, make
  `herdr pane close "$HERDR_PANE_ID"` your last action, because it ends this session.
  The session file stays on disk.
