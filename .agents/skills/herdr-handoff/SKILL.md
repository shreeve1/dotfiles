---
name: herdr-handoff
description: Use when spinning off separate work into a herdr tab, coordinating that task between sessions, or continuing the current work in a fresh session. Also use for /herdr-handoff, "hand this off", "continue in a fresh session", "spin this off into a new tab", "start a new pi on this", or merging and cleaning up work from agent-opened herdr tabs.
---

# herdr-handoff

Write a brief, open a herdr tab, start pi in it, and point pi at the brief. The new
session has none of this conversation, so the brief is the only thing it knows. In `task`
mode, keep a two-way conversation: the originating session owns the main task; the new
session owns the bounded side task and sends evidence back directly. The originating
session owns the finish: verify, merge locally, verify the combined result, remove
the task worktree and branch, then close the tab. James has given standing approval
for this sequence; do not present routine merge/cleanup choices again.

Invocation: `/skill:herdr-handoff task "<the task>"` or `/skill:herdr-handoff handoff "<focus>"`.
If the mode is missing, infer it: something separate from the current work is `task`;
carrying on the current work is `handoff`. Ask only if it is truly unclear.

| Mode | Brief covers | New tab | Afterwards |
| --- | --- | --- | --- |
| `task` | only the named task | background, you stay here | carry on with the current work |
| `handoff` | the current work, steered by the focus | opens and takes focus | offer to close this pane |

## 1. Check herdr

Inside a herdr pane, `test "${HERDR_ENV:-}" = 1` passes. Outside one (Codex, a plain shell),
a running herdr server still works: `herdr workspace list` must answer. The script then opens
the tab in the workspace with a pane in the current directory, else the focused one, and always
in the background, so `handoff` behaves like `task`. If neither check passes, say herdr is not
reachable and stop.

## 2. Write the brief

For `task`, first establish a verified reply address on the same herdr server. Inside
herdr, use `herdr pane current --current` to get the originating pane ID and session
path, then confirm that `herdr agent get <pane-id>` resolves to that session. A pane ID
works even when the agent has no name; never derive an agent name from the tab label.
Outside herdr, use `herdr agent list` only if its session path identifies the originating
session unambiguously. Otherwise state that no direct reply target is available and
choose a unique report-file path alongside the brief for the originating session to read.

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
<files/branch this session owns; leave them alone and commit only your own files>
<task-owned files; use a separate worktree for overlapping repository work>
<repository path, destination checkout/branch, starting commit, task branch and worktree path or none>
<finish owner: originating session; local merge and safe task cleanup are pre-approved>
<approval limits: pushes, deployments and live changes still require their usual approval>
## Coordination
Reply to: <verified originating herdr agent name or pane ID, or unavailable>
Report file: <unique absolute path for results if direct delivery is unavailable>
Send with `herdr agent prompt <reply-target> "From <your-target>: <message>"`.
Acknowledge the task and your ownership via the reply target. Send blockers, scope
conflicts and findings that affect the main task promptly. Ask James for approvals;
the originating session cannot grant them on his behalf. Before declaring completion,
send the result, exact commits, checks and remaining limitations back directly.
## Cleanup
The originating session saves and verifies the result, merges into the recorded
destination branch, checks the combined result, removes the task worktree/branch
and closes the tab. Report the exact final commit and stop writing while it finishes.
Keep the task session available for questions and fixes until then.
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
## Cleanup
This is an agent-opened continuation tab. Once the work is complete and verified,
save the final result and close this tab as your last action (skill section 7).
```

At the end of either brief, add a line with the previous session file so the new
session can search it if it needs more:
`Previous session: <path>`. Get the path:

- pi in a herdr pane: `herdr pane current --current | jq -r '.result.pane.agent_session.value'`
- Codex: `ls ~/.codex/sessions/*/*/*/*"$CODEX_THREAD_ID"*.jsonl`

## 3. Pick the model

Pick the new session's model from the brief. If the user named one of these four, use it.

| Model | Fits |
| --- | --- |
| `glm-5.3` | small, clear work: config or doc edits, lookups, simple fixes. Text only: never for a brief that needs images |
| `claude-sonnet-5-5` | the usual pick: ordinary coding, debugging, carrying on current work |
| `gpt-6.1-sol` | hard reasoning: stubborn bugs, design decisions, careful review |
| `claude-opus-5-5` | large or high-stakes work: long multi-file builds, writing where quality matters most |

## 4. Spawn

```bash
~/.agents/skills/herdr-handoff/scripts/spawn.sh <task|handoff> <brief-path> <slug> <model>
```

Run it from the directory the new session should work in, which is normally the current
one. The script opens the tab (in the background for `task`, with focus for `handoff`),
starts pi there on `cliproxy/<model>`, gives it the brief, and waits until pi starts working.
It prints the agent name, pane ID, status and model.

- Exit 2 (`status=blocked`): the new pi stopped at a question or approval. Run
  `herdr agent read <agent>`, tell the user what it is asking, and do not offer to close
  this pane. Do not answer the question for them.
- On any other failure, inspect `herdr agent list`, `herdr tab list` and the candidate
  agent's output before retrying. A timeout is not proof that creation failed. Match the
  new tab/pane and brief, then reuse that session: if it is already working, leave it
  running; if the brief is visibly unsubmitted, submit it there. The script already
  retries Enter for `agent_prompt_stalled`; inspect before sending another Enter or
  prompt. Create a replacement only after confirming no usable task session exists.
  If recovery fails, show the error, brief path and any tab left open.

## 5. Report

In one or two lines: the tab label, the agent name, the model and why it fits, and the brief's absolute path
as plain text in a codespan. From outside herdr, also name the workspace from the script's
`workspace=` output: the tab opened there without taking focus.

- Record the new agent name, pane ID, session path and tab/workspace IDs from
  `herdr agent get` and `herdr pane list` alongside the brief. Include repository,
  destination checkout/branch, starting commit, task branch and worktree path, and
  which resources this dispatch created; use these identities for integration and cleanup.
- `task`: keep those identities for follow-ups, then go back to the main task.
  Follow the coordination contract below.
- `handoff` from inside herdr: ask whether to close this pane. If the user says yes, make
  `herdr pane close "$HERDR_PANE_ID"` your last action, because it ends this session.
  The session file stays on disk.

## 6. Coordinate `task` work

Use the verified targets, not tab labels:

```bash
herdr agent prompt <target> "From <sender-target>: <update or question>"
```

- **Originating session:** send relevant new evidence or constraints directly to the
  task session and continue independent work. Read a returned question before acting;
  relay approval requests to James instead of answering for him. Use `herdr agent read`
  for a needed status check, not repeated status polling.
- **Task session:** acknowledge scope and ownership, report blockers or conflicts
  promptly, and send the final evidence and exact commits before saying the task is
  complete. Include branch/worktree, checks actually run, failures and anything not
  merged or deployed. If the reply target disappears or submission is rejected, save
  the report at the agreed path and state delivery failed; a local final answer alone
  is not a delivered report. Avoid automatic acknowledgements of acknowledgements.
- **Originating session on receipt:** verify the returned diff/commits and the checks
  relevant to the main task before relying on the result. Record what remains separate
  or unverified. A result message is evidence to inspect, not proof of completion.
  After verification, carry out the pre-approved local merge and cleanup in section 7;
  pushes and deployments retain their usual approval requirements.

This communication and the standing local merge/cleanup approval are scoped to the
delegated task; they do not authorise unrelated changes or external actions. In
`handoff` mode, continuity comes from the brief; do not require messages back to a
pane the user may close.

## 7. Integrate and clean up completed tasks

Close tabs opened for agent work automatically, without asking James, once the work
is complete, results are saved and checks are verified. A `done` or `idle` status
alone is not completion. Keep blocked, unfinished or still-needed task sessions open.

### Merge and remove task worktrees

For `task`, the originating session performs this sequence, even if the worker's
finishing skill offers James merge/cleanup options. The worker reports readiness;
the originating session acts. A full `handoff` still transfers ownership as in section 5.
For non-Git tasks, save and verify the result, skip the Git-only steps and close the tab.

1. Save the final report alongside the brief, outside any worktree being removed.
   Retrieve and verify it before continuing if direct delivery failed. Review the
   exact commits, resolve findings and confirm the worker has stopped writing.
2. Confirm the recorded repository, destination checkout/branch and task worktree
   with `git worktree list --porcelain`. Pin the reviewed task tip. Require a clean
   task worktree, including untracked files, and a clean destination before merging.
   Preserve unrelated edits; do not auto-stash, reset or discard them to pass this gate.
3. In the recorded destination checkout, merge that exact tip: skip if already
   contained, use `git merge --ff-only <tip>` if possible, otherwise use a normal
   merge commit with hooks. No extra approval is needed for a conflict-free local
   merge of reviewed task work. On conflicts, abort the merge, verify the previous
   destination state is restored, retain the task resources and report the blocker.
   If the task used the same checkout/branch, verify its commits there; no merge is needed.
4. Run the checks relevant to the combined result. Require them to pass and prove
   `git merge-base --is-ancestor <tip> <destination-branch>` before cleanup. On a
   failed check, keep the worktree/branch/tab for fixes; do not reset the merged work.
5. From outside the task worktree, recheck its branch still names the pinned tip
   and its tracked/untracked files are clean. Inspect ignored files too: only
   disposable build/dependency caches may be removed with it. Save reports and
   retain any other data before removal; ask if its disposal is uncertain. Require
   that no other session or process still needs the worktree. Remove only resources
   this dispatch created: `git worktree remove <recorded-path>` for a plain Git
   worktree, or the installed herdr worktree removal command for a herdr-managed one.
   Herdr removal may also close its workspace: verify its panes belong only to this
   task first; if unrelated panes exist, leave it intact and report the blocker.
   Use no force flags. Confirm the worktree is absent, then delete its unchanged,
   merged task branch with `git branch -d <task-branch>` from the destination checkout.
   Keep destination branches and pre-existing worktrees/branches.
6. Close the recorded task tab using the identity checks below, if worktree removal
   has not already closed it. Save the merge commit, checks and removed/retained
   resources alongside the brief, and report the outcome to James. A blocked step
   remains the originating session's responsibility; do not call the task finished.

### Close the tab

- **`handoff`:** the continuation session saves its final result alongside the brief
  after completing and verifying the work, tells James where it is saved and that
  the tab is closing, then closes its own agent-opened tab as its last tool action.
  Closing the original pane at handoff time still requires the consent in section 5.
- Before closing, use `herdr agent get <recorded-pane-id>` and `herdr pane list` to
  confirm the recorded session still occupies the recorded tab. Close it with
  `herdr tab close <recorded-tab-id>`. If other panes have been added, close only
  the recorded task pane with `herdr pane close <recorded-pane-id>`.
- Leave pre-existing user tabs and unrelated sessions alone. If identity cannot be
  confirmed or closing fails, leave it open and report the tab/pane ID and reason.
  Keep briefs, reports and session files on disk. Standing approval covers only
  the verified task merge and safe cleanup above, not data loss, pushes or deployments.
