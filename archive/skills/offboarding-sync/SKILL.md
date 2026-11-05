---
name: offboarding-sync
description: Bring this repo and its copy on another machine to the same commit, merging divergence with the user.
disable-model-invocation: true
---

# Offboarding sync

Sync one repo's committed history between this machine and a peer over SSH. The machine you run it on is the source of truth. Nothing goes through a git remote, so nothing is published. It moves commits, not dirty trees. For sending a task to a fresh agent use `offload-task`.

`GUARD` is `../_shared/offload/git_guard.py`, resolved against this skill's real directory. Its `scan` command is the history secret scan, see [the scan recipe](../_shared/offload/commands.md#prep-and-history-scan). Keep private captures in a mode-0700 directory outside the working tree, with `umask 077`. Pass paths to remote commands as arguments, as in [the inventory batch](../_shared/offload/inventory.md#batch-each-stage), never interpolated into a command string.

## Establish both sides

1. Use the current git repo as `LOCAL`. Ask for the peer and its absolute repo path if omitted. Resolve the peer with `ssh -G`, preferring its NetBird IPv4 address, and check hostname and user against the topology in the root `AGENTS.md`.
2. Record on both sides: absolute path, current branch, full HEAD, and the root commit from `git rev-list --max-parents=0 HEAD`. Require equal single roots and the same branch name. Ask when the branches differ. Refuse a detached HEAD and any merge, rebase or cherry-pick in progress.
3. List tracked-modified and untracked filenames on both sides, without contents. Check the peer has `user.name` and `user.email`.

Finish when both sides are bound to one root, one branch and one connection, and both dirty lists are recorded.

## Commit the peer's tracked edits

Skip this step when the peer's tracked tree is clean.

1. Take the peer's tracked modifications and deletions. Hold back any path named `.env*`, `.pem`, `.key`, `.pfx`, `.p7m`, `.kdbx` or `.mcp.json` at any depth. Stop if one of those is already staged. Report held names as still uncommitted.
2. Show the filenames and a diff stat. Ask for an explicit yes.
3. On the peer, commit exactly those paths with a normal `git commit -m "sync: WIP from <peer> <YYYY-MM-DD>" -- <paths>`. Hooks run. Capture their output privately, since some hooks print matched plaintext. A failing hook stops the sync and goes to the user.
4. Record the new commit hash for the final report.

Finish when the peer has no committed-eligible edits left and the WIP hash is recorded.

## Compare

Fetch the peer's branch into a collision-free local ref `refs/offboarding-sync/<token>/peer` with `git fetch ssh://<user>@<host>/<path> <branch>:<ref>`. Record the local ref and the merge base. List the unique commits on each side and classify:

- **Equal.** Report and finish.
- **Local ahead.** Push step only.
- **Peer ahead.** Local fast-forward only.
- **Diverged.** Merge step first.

Before changing anything, check overlap on each receiving side. Paths changed by the incoming side since the merge base must not intersect the local dirty or untracked-add paths. On the peer, the same paths must not intersect its held-back files or its untracked files. Stop and list overlapping filenames. Never stash, reset or overwrite a dirty tree. The user commits or discards and reruns.

Finish when the relation is classified and both overlap checks passed.

## Merge divergence

1. Create a temporary worktree from the local tip in a directory this run owns. Run `git merge --no-ff --no-commit <peer-ref>` there.
2. For each conflicted file, show both sides, propose a resolution with the reason, and wait for approval before writing it. Resolve nothing silently. Offer to abort at any conflict.
3. Commit the merge normally so hooks run, capturing output privately. Record the merge commit as `MERGED`.

Finish when `MERGED` is a commit whose parents are the local tip and the peer tip, and the user approved every resolution.

## Verify, then update both checkouts

1. Set `TIP` to `MERGED`, or to the full SHA of whichever side is ahead when no merge was needed. Resolve it with `git rev-parse`, because the helper rejects branch names and `HEAD`. Run `python3 "$GUARD" scan --repo "$LOCAL" --tip "$TIP"` and require `ok: true`. A genuine hit blocks the sync. Report only filenames, object IDs and rule IDs. History travels in full, including previously tracked secrets.
2. Show the commits that will reach the peer and the files they change. Ask for an explicit yes.
3. Confirm the local branch still sits at the recorded tip. Run `git merge --ff-only "$MERGED"` in the real checkout.
4. Push `$MERGED` to `refs/offboarding-sync/<token>` on the peer with a creation-only lease (`--force-with-lease=refs/offboarding-sync/<token>:`), keeping normal pre-push hooks. A refusing hook stops the sync. Read the remote ref back and require the full SHA to match.
5. On the peer, confirm HEAD still equals the recorded tip, then run `git merge --ff-only "$MERGED"`. Git refuses to overwrite a dirty file, so a late overlap fails safe.
6. Remove the peer ref with an exact-SHA lease, then remove only the local refs and worktree this run created. On any failure, report the token and the refs left behind. A timeout means reading the remote ref before retrying.

Finish when `git rev-parse HEAD` returns `MERGED` on both machines.

## Report

State both HEADs, the unique commits each side contributed, the WIP commit hash on the peer (reword it before either side pushes to a remote) and every file still dirty or untracked on either side, including held-back names. Give the retained refs if the run stopped early.
