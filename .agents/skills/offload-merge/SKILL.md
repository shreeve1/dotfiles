---
name: offload-merge
description: Use when merging an Offload branch into the project copy on the machine where it ran, to keep working there before syncing back.
---

# Offload merge

Read [the shared contract](../_shared/offload/contract.md). Merge is user-triggered and runs on the machine that holds the Offload branch. It brings the branch's commits into the project working copy's `main` so work continues there. [offload-return](../offload-return/SKILL.md) is the other exit: it applies the Snapshot-to-Result delta to the original source's dirty tree without commits. Merge never pushes, never touches the source machine and never changes the Mirror's `main`, which stays stale on purpose.

## Resolve the Offload and the working copy

1. Identify the Offload by its slug or `offload/<slug>` branch. The Mirror is the local `~/offload/<repo>-<first7root>/` that holds `refs/heads/offload/<slug>`. If no local Mirror holds it, the branch lives on the other machine: run this skill there.
2. Check the worker. In `herdr agent list --json`, find the `offload-<slug>` agent. If its status is `working`, stop and ask the user to let it finish or stop it. Then require the worker checkout to be clean. Uncommitted worker files would be left out of the merge, so list them and stop.
3. Pin the exact tip: `TIP=$(git -C "$MIRROR" rev-parse --verify "refs/heads/offload/<slug>^{commit}")`. Every later step uses `$TIP`, not the branch name, so a commit that arrives afterwards is never merged by accident.
4. Resolve the Brief directory the way [offload-task](../offload-task/SKILL.md) does: the tracked path the repo's `AGENTS.md` declares, else `.offload/<slug>/`. Read `brief.json` there with `git -C "$MIRROR" show "$TIP:<dir>/brief.json"`. Record `identity.root`, `identity.snapshot`, `mirror.path`, `source.host`, `source.path`, `source_head` and `target.path`.
5. The working copy `$WC` is `target.path`, not `mirror.path`. Require it to exist on this machine as a git repo whose root commit is `identity.root`, on `main` or the branch the user named. Then fetch the pin into it: `git -C "$WC" fetch --no-tags "$MIRROR" "refs/heads/offload/<slug>"` and require `git -C "$WC" rev-parse FETCH_HEAD` to equal `$TIP`.
6. Require a clean working copy, including untracked files: `git -C "$WC" status --porcelain --untracked-files=all` prints nothing. Otherwise list the filenames without their contents and stop. Merge never stashes, resets or commits the user's work.

Finish when the working copy, branch, source record and pinned `$TIP` are concrete, `$WC` holds `$TIP`, and both checkouts are clean.

## Classify what will merge

1. If `git -C "$WC" merge-base --is-ancestor "$TIP" HEAD` succeeds, report `already_merged` and stop.
2. List `git -C "$WC" log --oneline HEAD.."$TIP"`. Find the Result: the newest commit in that range that changes only `<dir>/result.json`, whose sole parent equals the `work_tip` recorded in that file. A commit that fails either check is ordinary work. Read its `state`, `work_tip`, `limitations` and `next_steps`.
   - `complete`: report the summary and limitations.
   - `paused`: report every `next_steps` entry as remaining work.
   - No Result: the work is in flight. State that nothing in this range was verified by a Result.
3. List every commit after the Result (or every work commit when there is no Result). Their verification is not covered by the Result. Ask for an explicit yes to merge up to `$TIP`. If the user declines, set `TIP` to the Result commit and continue with that.
4. Check the Snapshot, with `SNAPSHOT` set to `identity.snapshot`: `git -C "$WC" diff --name-status "$SNAPSHOT^" "$SNAPSHOT"`. These are the source's dirty and untracked files at dispatch. The merge commits them to `main`. When you later sync back, the same files will still sit uncommitted on the source and block a fast-forward. Report them now.

Finish when the user has seen the Result state, every commit beyond the Result and the Snapshot's files, and has approved the exact `$TIP`.

## Merge

Record `OLD_HEAD=$(git -C "$WC" rev-parse HEAD)` first.

1. If `git -C "$WC" merge-base --is-ancestor HEAD "$TIP"` succeeds, run `git -C "$WC" merge --ff-only "$TIP"`.
2. Otherwise `main` moved after dispatch. Show the commits unique to each side (`git log --oneline "$TIP"..HEAD` and `HEAD.."$TIP"`). Ask for an explicit yes to create a merge commit, then run `git -C "$WC" merge --no-ff -m "Merge offload/<slug>" "$TIP"` with normal hooks. Rebasing is not offered because it rewrites the worker's commits, so the Result's `work_tip` no longer names a commit on `main`.
3. If the merge conflicts, list the conflicted paths and run `git -C "$WC" merge --abort`. Require `git -C "$WC" rev-parse HEAD` to equal `$OLD_HEAD` and `status --porcelain --untracked-files=all` to print nothing. Report and stop. Resolve conflicts only on the user's request.
4. Check: `git -C "$WC" merge-base --is-ancestor "$TIP" HEAD` succeeds and the working tree is clean.
5. Offer to run the Brief's verification commands in `$WC`. A merge commit always needs them, because neither side was verified against the combined tree. If the user declines, report the merge as unverified.

Finish when `HEAD` contains `$TIP`, the tree is clean, verification ran or the merge is reported unverified, and the outcome (`fast_forward`, `merge_commit`, `already_merged` or `conflict`) comes from what git actually reported.

## Continue and sync back

Report the working copy, branch, old and new `HEAD`, `$TIP`, Result state, commits included beyond the Result, Snapshot files and outcome. Retain the Offload branch, worker worktree, worker pane and private records until the user asks for cleanup. Delete a branch only with `git branch -d` after merge-base proves it merged.

Keep working in the working copy on `main`. The worker branch is finished: further commits to it need another merge, and a recorded Result is terminal. Run offload-merge again for each new Offload that reaches this machine.

The source copy is `source.host:source.path`, and it was at `source_head` when dispatched. When the work is done, choose how it goes back:

- [offload-prep](../offload-prep/SKILL.md) with this working copy as the source and the original source as the target. It fast-forwards that copy's `main` only when that `main` is still an ancestor and its tree is clean, and it carries full history. Use it whenever you continued working after the merge.
- [offload-return](../offload-return/SKILL.md) applies only this Offload's Snapshot-to-Result delta as uncommitted changes, and leaves out commits made on `main` after the merge. Use it only when the source has its own newer work or a dirty tree that blocks a fast-forward.

For one Offload, take one route only. A returned delta sits uncommitted on the source, so a later fast-forward carrying the same commits refuses to overwrite it.
