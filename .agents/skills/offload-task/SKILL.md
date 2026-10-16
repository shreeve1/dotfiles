---
name: offload-task
description: Use when sending a current or cold repo task to a fresh pi agent on another machine, optionally naming the skill that agent starts with.
---

# Offload task

Read [the shared contract](../_shared/offload/contract.md). Use this for a task already in progress or a cold one-sentence goal. The session that holds the context writes the Brief. A grill is optional.

Use [commands.md](../_shared/offload/commands.md) for the request schema, helper invocations, installed-version record, safe receipt and push lease. Read it in this invocation even when prep read it earlier in the session; it changes between dispatches. Resolve actual helper/private metadata paths before writing Finish instructions.

Keep this dispatch's source records (request, prose, receipt, captures and `return-control.json`) in a new `<absolute-git-common-dir>/offload-receipts/<slug>/` for this slug. A prep directory from earlier in the session belongs to prep.

## Resolve and write

1. Use the current git repo and goal. Ask for the SSH host if omitted. Resolve its saved profile with `herdr machine list --json`. Select the matching saved ID or label for `--machine`, not the SSH alias. Verify the connected host and user.
2. Take the start skill from the invocation, e.g. `offload-task to aidev, start with tralph-shepherd`. It is chosen per dispatch; there is no default. If none is named, ask which skill the worker should start with; `none` is a valid answer. Bind `START_SKILL` to the bare skill name matching `^[a-z0-9][a-z0-9-]*$`, or leave it empty for none. Confirm `.agents/skills/$START_SKILL/SKILL.md` is tracked in the repo or `~/.agents/skills/$START_SKILL/SKILL.md` exists on the target. Stop if it resolves in neither.
3. Read repo instructions and the declared tracked Brief path. Resolve the root identity, Mirror and collision-free date-plus-three-word slug from the shared contract. The agent name is `offload-<slug>` and must fit 32 characters. Verify branch, worktree and agent-name availability on both sides. If the Mirror or project dependencies are not ready, follow [offload-prep](../offload-prep/SKILL.md).
4. Run [the target inventory](../_shared/offload/inventory.md) for the project copy. Label project readiness separately from the worker checkout that does not exist yet. Write the complete Brief from live context, or mark a cold goal `unrefined`. Record the start skill name, or `None`, in Decisions. Record dependencies, access gaps and the approved worker-provisioning plan. Mark provisioning that ordered startup performs, such as an approved `.env` copy, as done before the worker starts, so the worker does not repeat it. Finish names actual helper and private metadata paths, including a private destination for this worker's journals and temporary summaries. Include the Result command with its separate reviewed allowlist when used. Keep the checkout unchanged after terminal Result. Finish also tells the worker that a later request for more changes, including a cleanup reminder, is new work: report that it needs a fresh Offload and leave this branch at its Result. Put no credential values in the Brief.

Finish when the goal, hosts, start skill (or explicit none), paths, root identity, slug, target inventory and Brief are concrete.

## Snapshot and send

1. Run the shared helper's `snapshot` command with the request and prose. It creates the Snapshot and then a separate normal-hook Brief transport commit. Keep the Snapshot SHA out of its own content. The source HEAD, index and files remain unchanged. Refuse unsafe history, unsupported pattern extraction and dirty submodules. Omit excluded credential/config additions. Handle reviewed scanner false positives only through exact object/path/rule allowances in the shared contract.
2. Show all transported filenames and held or omitted exclusions. State that tracked history still travels. Ask for an explicit yes before push. If permission is declined, keep the local Offload record and do not send it.
3. Push only `refs/heads/offload/<slug>` to the verified Mirror's explicit URL. Use a creation-only ref lease so a collision cannot overwrite work. Use `--no-verify` only for this verified Mirror push. Compare the remote full SHA with the local transport commit. On timeout, read the remote ref before deciding whether to retry.

## Start fresh pi

Follow [the ordered startup recipe](../_shared/offload/commands.md#ordered-startup). It owns worktree creation, actual-checkout provisioning, original-shell containment, optional focus before startup, fresh pi readiness and observed task acceptance. Complete each stage's gate before advancing.

Finish only after that recipe's acceptance gate and publication of the complete discoverable server dispatch/control record. Preserve the independent source receipt and source-side locator so return survives loss of this chat. Report any reverse-route gap and the available source-pull path. Include the target, slug, branch, start skill, Snapshot SHA, Brief path, actual worktree path, workspace and pane IDs, and user-triggered return command. Name the worker workspace label `offload:<slug>` and the Mirror base-checkout workspace herdr opened beside it. Ask the user to leave both open: closing that tab group hangs up the worker. Report backend focus separately from the machine selected in the user's UI. Leave the worker pane open until the user requests return or cleanup. Worker completion does not trigger an automatic return or close. A recorded Result is final. Commits added after it, including follow-up work the user starts in that pane, make offload-return refuse. Bring them in with [offload-merge](../offload-merge/SKILL.md) on the target, or dispatch the follow-up as a fresh Offload.
