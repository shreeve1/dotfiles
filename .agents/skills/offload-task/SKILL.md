---
name: offload-task
description: Use when sending a current or cold repo task to a fresh pi agent on another machine.
---

# Offload task

Read [the shared contract](../_shared/offload/contract.md). Use this for a task already in progress or a cold one-sentence goal. The session that holds the context writes the Brief. A grill is optional.

Use [commands.md](../_shared/offload/commands.md) for the request schema, helper invocations, installed-version record, safe receipt and push lease. Resolve actual helper/private metadata paths before writing Finish instructions.

## Resolve and write

1. Use the current git repo and goal. Ask for the SSH host if omitted. Resolve its saved profile with `herdr machine list --json`. Select the matching saved ID or label for `--machine`, not the SSH alias. Verify the connected host and user.
2. Read repo instructions and the declared tracked Brief path. Resolve the root identity, Mirror and collision-free date-plus-three-word slug from the shared contract. The agent name is `offload-<slug>` and must fit 32 characters. Verify branch, worktree and agent-name availability on both sides. If the Mirror or project dependencies are not ready, follow [offload-prep](../offload-prep/SKILL.md).
3. Run [the target inventory](../_shared/offload/inventory.md) for the project copy. Label project readiness separately from the worker checkout that does not exist yet. Write the complete Brief from live context, or mark a cold goal `unrefined`. Record dependencies, access gaps and the approved worker-provisioning plan. Finish names actual helper and private metadata paths, including a private destination for this worker's journals and temporary summaries. Include the Result command with its separate reviewed allowlist when used. Keep the checkout unchanged after terminal Result. Put no credential values in the Brief.

Finish when the goal, hosts, paths, root identity, slug, target inventory and Brief are concrete.

## Snapshot and send

1. Run the shared helper's `snapshot` command with the request and prose. It creates the Snapshot and then a separate normal-hook Brief transport commit. Keep the Snapshot SHA out of its own content. The source HEAD, index and files remain unchanged. Refuse unsafe history, unsupported pattern extraction and dirty submodules. Omit excluded credential/config additions. Handle reviewed scanner false positives only through exact object/path/rule allowances in the shared contract.
2. Show all transported filenames and held or omitted exclusions. State that tracked history still travels. Ask for an explicit yes before push. If permission is declined, keep the local Offload record and do not send it.
3. Push only `refs/heads/offload/<slug>` to the verified Mirror's explicit URL. Use a creation-only ref lease so a collision cannot overwrite work. Use `--no-verify` only for this verified Mirror push. Compare the remote full SHA with the local transport commit. On timeout, read the remote ref before deciding whether to retry.

## Start fresh pi

Follow [the ordered startup recipe](../_shared/offload/commands.md#ordered-startup). It owns worktree creation, actual-checkout provisioning, original-shell containment, optional focus before startup, fresh pi readiness and observed task acceptance. Complete each stage's gate before advancing.

Finish only after that recipe's acceptance gate and publication of the complete discoverable server dispatch/control record. Preserve the independent source receipt and source-side locator so return survives loss of this chat. Report any reverse-route gap and the available source-pull path. Include the target, slug, branch, Snapshot SHA, Brief path, actual worktree path, workspace and pane IDs, and user-triggered return command. Report backend focus separately from the machine selected in the user's UI. Leave the worker pane open until the user requests return or cleanup. Worker completion does not trigger an automatic return or close.
