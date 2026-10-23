---
name: codex-handoff
description: Start a new Codex app chat from a written brief. Two modes - `task` spins off a separate task found mid-session into a background chat; `handoff` continues the current work in a fresh chat and switches to it. Use when the user says $codex-handoff, or, inside the Codex app, "hand this off", "continue in a fresh chat", "spin this off into a new chat".
---

# codex-handoff

Write a brief and start a new Codex chat whose first message is that brief. The new chat
starts with an empty history, so the brief is all it knows.

Invocation: `$codex-handoff task "<the task>"` or `$codex-handoff handoff "<focus>"`.
If the mode is missing, infer it. Something separate from the current work is `task`.
Carrying on with the current work is `handoff`. Ask only if it is truly unclear.

| Mode | Brief covers | New chat | Afterwards |
| --- | --- | --- | --- |
| `task` | only the named task | background, you stay here | carry on with the current work |
| `handoff` | the current work, steered by the focus | opens in the app window | offer to archive this chat |

## 1. Check Codex

You need the Codex app thread tools `create_thread` and `list_projects`. If they are
missing, say this needs the Codex desktop app and stop. Use `create_thread` because it
starts with an empty history. `fork_thread` copies this history, and `handoff_thread`
moves a chat to a worktree, so neither one makes a fresh chat.

## 2. Write the brief

The brief is the new chat's first message and is visible to the user. Write it for a capable
engineer who has seen nothing. Use facts from this session: real paths, commands, error
text and decisions. Leave out the story of how you got here. A brief that says "the bug we
found" without saying what the bug is fails.

**`task` brief:** include only what the new task needs. Leave out the current work unless it
explains the task.

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

**`handoff` brief:** include everything needed to carry on. The focus decides what comes
first and what can be cut.

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

End either brief with a line that names the previous chat so the new chat can
use `read_thread` for more:
`Previous chat: <threadId>`. Get the ID from the `CODEX_THREAD_ID` environment variable.

## 3. Create the chat

1. Run `list_projects` and pick the project whose path is the directory the new chat
   should work in. This is normally the current workspace root.
2. Call `create_thread` with the brief as `prompt`, a short `title`, and
   `target: {type: "project", projectId, environment: {type: "local"}}`. Leave
   `model` and `thinking` unset. If no project matches, use `{type: "projectless"}`
   and put the working directory in the brief.
3. If you get a `threadId`, call `wait_threads` once on it with `timeoutMs: 0`. If it is
   waiting for approval or input, tell the user what it needs and do not offer to archive
   this chat. Do not answer it for the user. If you get a `clientThreadId` instead, the
   chat is still being set up, so skip this check.
4. `handoff` only: call `navigate_to_codex_page` with the new `threadId` to switch the
   window to it.

If `create_thread` fails, show the error and the brief so the user can start the chat
by hand.

## 4. Report

Give the chat title in one line, then put `::created-thread{threadId="..."}` on its own line
(`clientThreadId` if that is what you got).

- `task`: then go back to what you were doing.
- `handoff`: ask whether to archive this chat. If the user says yes, call
  `set_thread_archived` with `archived: true` and no `threadId` as your last action. The
  chat stays recoverable from the archive.
