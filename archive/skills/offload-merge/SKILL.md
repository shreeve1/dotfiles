---
name: offload-merge
description: Use when merging an Offload branch into the project copy on the machine where it ran, or merging a diverged peer's default branch that sync or prep fetched.
---

# Offload merge

Read [the shared contract](../_shared/offload/contract.md). Merge is user-triggered and changes one project copy's default branch (`$DEFAULT`, normally `main`) on the machine where it runs. It has two inputs:

- **Offload branch.** Run on the target. The Offload branch already lives in this project copy, because offload-task pushed it there. Merge brings its commits onto the default branch so work continues here. This is one of the contract's exits; [offload-return](../offload-return/SKILL.md) is the one that goes back to the source instead.
- **Peer default branch.** [offload-sync](../offload-sync/SKILL.md) or [offload-prep](../offload-prep/SKILL.md) found that this copy and another machine's copy both have unique commits, and fetched the peer's tip into a local ref. Merge that ref here so the peer can fast-forward afterwards.

Merge never pushes and never touches the other machine.

## Merge a diverged peer main

Use this branch for the peer input. Set `$WC` to the copy the user picked and `TIP` to the full SHA of the fetched peer ref (`refs/offload-sync/<host>` or prep's inspection ref), and record where it came from (host and path). Require `$WC` clean as in step 6 below and its root equal to the peer's. Skip the Offload-only steps. Show the commits unique to each side, then follow [Merge](#merge) with the message `Merge <host> <default>`. Finish by returning to the skill that sent you, with `$WC` as the source.

## Resolve the Offload and the working copy

1. Identify the Offload by its slug or `offload/<slug>` branch. `$WC` is this machine's project copy of the repo, and it holds `refs/heads/offload/<slug>`. If it does not, the Offload is older than ADR 0023 and its branch sits in a retired `~/offload/<repo>-<first7root>/` Mirror: fetch it once with `git -C "$WC" fetch --no-tags "$OLD_MIRROR" "refs/heads/offload/<slug>:refs/heads/offload/<slug>"`, then continue. If neither has it, the branch lives on the other machine: run this skill there.
2. Check the worker. In `herdr agent list --json`, find the `offload-<slug>` agent. If its status is `working`, stop and ask the user to let it finish or stop it. Then require the worker checkout to be clean. Uncommitted worker files would be left out of the merge, so list them and stop.
3. Pin the exact tip: `TIP=$(git -C "$WC" rev-parse --verify "refs/heads/offload/<slug>^{commit}")`. Every later step uses `$TIP`, not the branch name, so a commit that arrives afterwards is never merged by accident.
4. Resolve the Brief directory the way [offload-task](../offload-task/SKILL.md) does: the tracked path the repo's `AGENTS.md` declares, else `.offload/<slug>/`. Read `brief.json` there with `git -C "$WC" show "$TIP:<dir>/brief.json"`. Record `identity.root`, `identity.snapshot`, `source.host`, `source.path`, `source_head` and `target.path`.
5. Require `$WC` to equal `target.path` (or the retired Mirror's project copy for a pre-0023 Offload), to have root commit `identity.root`, and to be on `$DEFAULT` or the branch the user named.
6. Require a clean working copy, including untracked files: `git -C "$WC" status --porcelain --untracked-files=all` prints nothing. Otherwise list the filenames without their contents and stop. Merge never stashes, resets or commits the user's work.

Finish when the working copy, branch, source record and pinned `$TIP` are concrete, and both checkouts are clean.

## Classify what will merge

1. If `git -C "$WC" merge-base --is-ancestor "$TIP" HEAD` succeeds, report `already_merged` and go to [Finish the exit](#finish-the-exit).
2. List `git -C "$WC" log --oneline HEAD.."$TIP"`. Find the Result: the newest commit in that range that changes only `<dir>/result.json`, whose sole parent equals the `work_tip` recorded in that file. A commit that fails either check is ordinary work. Read its `state`, `work_tip`, `limitations` and `next_steps`.
   - `complete`: report the summary and limitations.
   - `paused`: report every `next_steps` entry as remaining work.
   - No Result: the work is in flight. State that nothing in this range was verified by a Result.
3. List every commit after the Result (or every work commit when there is no Result). Their verification is not covered by the Result. Ask for an explicit yes to merge up to `$TIP`. If the user declines, set `TIP` to the Result commit and continue with that.
4. Check the Snapshot, with `SNAPSHOT` set to `identity.snapshot`: `git -C "$WC" diff --name-status "$SNAPSHOT^" "$SNAPSHOT"`. These are the source's dirty and untracked files at dispatch. The merge commits them to the default branch. When sync later fast-forwards the source, its own uncommitted copies of the same files overlap and refuse. Report them now so the user can commit or discard them on the source first.

Finish when the user has seen the Result state, every commit beyond the Result and the Snapshot's files, and has approved the exact `$TIP`.

## Merge

Record `OLD_HEAD=$(git -C "$WC" rev-parse HEAD)` first.

1. If `git -C "$WC" merge-base --is-ancestor HEAD "$TIP"` succeeds, run `git -C "$WC" merge --ff-only "$TIP"`.
2. Otherwise the default branch moved after dispatch. Show the commits unique to each side (`git log --oneline "$TIP"..HEAD` and `HEAD.."$TIP"`). Ask for an explicit yes to create a merge commit, then run `git -C "$WC" merge --no-ff -m "Merge offload/<slug>" "$TIP"` with normal hooks. Rebasing is not offered because it rewrites the worker's commits, so the Result's `work_tip` no longer names a commit on the default branch.
3. If the merge conflicts, list the conflicted paths and run `git -C "$WC" merge --abort`. Require `git -C "$WC" rev-parse HEAD` to equal `$OLD_HEAD` and `status --porcelain --untracked-files=all` to print nothing. Report and stop. Resolve conflicts only on the user's request.
4. Check: `git -C "$WC" merge-base --is-ancestor "$TIP" HEAD` succeeds and the working tree is clean.
5. Offer to run the Brief's verification commands in `$WC`. A merge commit always needs them, because neither side was verified against the combined tree. If the user declines, report the merge as unverified.

Finish when `HEAD` contains `$TIP`, the tree is clean, verification ran or the merge is reported unverified, and the outcome (`fast_forward`, `merge_commit`, `already_merged` or `conflict`) comes from what git actually reported.

## Finish the exit

Report the working copy, branch, old and new `HEAD`, `$TIP`, Result state, commits included beyond the Result, Snapshot files and outcome.

Then offer the two follow-ups the contract's exits name, in this order, unless the outcome was `conflict`:

1. [offload-cleanup](../offload-cleanup/SKILL.md) for this slug: it removes the worker worktree, its workspace and the Offload branch on both machines, now that merge-base proves the work is in.
2. [offload-sync](../offload-sync/SKILL.md) from this copy: it fast-forwards the other machines' default branches to this `HEAD`, and names any that are offline or diverged.

Keep working in this copy on the default branch. A recorded Result is terminal; a follow-up task is a fresh Offload, which can start from this copy to any machine.

Do not also run offload-return for this slug. A returned delta sits uncommitted on the source and blocks sync's fast-forward of the same commits.
