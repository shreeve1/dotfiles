---
name: offload-cleanup
description: Use when removing a finished Offload's worktree, workspace and branches after merge or return, or retiring old ~/offload Mirrors.
---

# Offload cleanup

Read [the shared contract](../_shared/offload/contract.md). Cleanup removes what one Offload left on both machines once its work has provably landed. It keeps the private records under `offload-receipts/<slug>/`. It never forces a removal the user has not approved, and it never touches the default branch or a deployment.

## Resolve the Offload

1. Take the slug from the invocation, or list candidates: `offload/*` branches in this project copy and the peer's, and `herdr worktree list` entries labelled `offload:<slug>`. Exclude `offload/prep-check-*`; [Leftover refs](#leftover-refs) handles those.
2. Read the dispatch record `dispatch.json` and the source locator `return-control.json` for the slug. Bind the target host, `TARGET_COPY` (the receipt's `mirror.path`), `WORKTREE`, `WORKSPACE`, `PANE`, `BASE_WORKSPACE` and whether it existed before dispatch, the scope unit, the source host and `SOURCE` copy. A pre-ADR 0023 Offload has `~/offload/<repo>-<root7>` as `mirror.path`; treat that Mirror as the place its branch and worktree live.
3. Pin `TIP=$(git -C "$TARGET_COPY" rev-parse --verify "refs/heads/offload/<slug>^{commit}")` on the target. If the branch is already gone, skip the target-side steps that need it.

Finish when every path, ID and the pinned tip are bound, or each missing one is reported as already removed.

## Prove the work landed

Use exactly one proof:

- **Merged**: on the target, `git -C "$PROJECT_COPY" merge-base --is-ancestor "$TIP" "$DEFAULT"` succeeds, where `PROJECT_COPY` is the target's project copy (for a pre-0023 Offload, the copy offload-merge used, not the Mirror).
- **Returned and committed**: the slug's attempt outcome is `applied` or `already_applied`, and the source committed it. Bind `RESULT` from the pin. Let `PATHS` be `git -C "$SOURCE" diff --name-only "$SNAPSHOT" "$RESULT"` and require `git -C "$SOURCE" diff --quiet "$RESULT" HEAD -- $PATHS` on the source. If later commits changed those paths again, show the differing paths and ask the user to confirm the work is in.

Otherwise stop and say which exit is still needed. An unmerged branch is the only copy of the worker's commits.

## Stop and remove the worker

1. Run cleanup outside the worker: `/proc/self/cgroup` must not be inside the recorded scope's ControlGroup.
2. Through the target's herdr session, read the worker agent. If it is `working`, stop and ask the user to let it finish. Require `git -C "$WORKTREE" status --porcelain --untracked-files=all` to print nothing, or list those files and ask before continuing: removing the worktree deletes them.
3. Remove the worktree and its workspace: `herdr --machine "$MACHINE_ID" worktree remove --workspace "$WORKSPACE"`. It refuses a tree with untracked or modified files; add `--force` only after the user approved deleting the files listed in step 2. Ignored files such as `node_modules` go with it. Require `git -C "$TARGET_COPY" worktree list` to no longer show `WORKTREE`.
4. If `BASE_WORKSPACE` was opened by this dispatch and holds no other panes, close it with `herdr workspace close`. Leave a workspace that existed before dispatch.
5. Read `systemctl --user show "offload-<slug>.scope" --property=ActiveState,InvocationID` on the target. Inactive or not-found is done. If it is still active with the recorded InvocationID and its ControlGroup has no process outside the recorded pane's tree, stop that exact unit. Any other state is reported, not stopped.

## Delete the branches

On the target, delete the Offload branch:

- Merged: `git -C "$TARGET_COPY" branch -d "offload/<slug>"`. Git refuses an unmerged branch, which double-checks the proof.
- Returned: `git -C "$TARGET_COPY" update-ref -d "refs/heads/offload/<slug>" "$TIP"`, an exact-SHA delete, because the branch was never merged there.

Also delete the target's pinned Result ref `refs/offload-return/<slug>/result` with an exact-SHA `update-ref -d` when it exists.

On the source, delete its local `offload/<slug>` branch and any `refs/offload-return/<slug>*` fetch refs with exact-SHA `update-ref -d`. Keep `refs/offload-local/<slug>/*`: they hold the reviewed allowlist the retained receipt names.

A changed SHA refuses the delete. Report it and stop: something moved after the proof.

## Leftover refs

List `refs/heads/offload/prep-check-*` and `refs/offload-sync/*` on both copies. They come from an interrupted prep or sync. Delete each with an exact-SHA `update-ref -d` after the user approves the list.

## Retire old Mirrors

On each machine, list `~/offload/*`. For each, show its root, `offload/*` branches with whether the matching project copy contains them, its worktrees and the slugs under `.git/offload-receipts/`. A Mirror can go when it has no worktree, every `offload/*` branch is merged or proved returned, and the user approves it by name. Before deleting it, copy `.git/offload-receipts/` into the project copy's `<git-common-dir>/offload-receipts/` with `cp -a`, refusing to overwrite an existing slug directory. Then `rm -rf` exactly that Mirror path after checking it is under `~/offload/`.

## Report

For each machine, list what was removed (worktree path, workspaces, branches and refs with their SHAs, Mirrors) and what remains with its reason. Name where the private records now live. Then offer [offload-sync](../offload-sync/SKILL.md) if any copy is not level.
