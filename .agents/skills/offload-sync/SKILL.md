---
name: offload-sync
description: Use when bringing a project's default branch level on the user's machines, after an Offload exit, before a dispatch, or when a copy is behind.
---

# Offload sync

Read [the shared contract](../_shared/offload/contract.md). Sync keeps the project copies on omarchy, aidev and itan8n on the same default-branch commit, so the next Offload's Snapshot carries only fresh dirty work. It only fast-forwards. It never merges, rebases, resets or stashes, and it never pushes to a checked-out branch.

Use [commands.md](../_shared/offload/commands.md) for the [push fast-forward](../_shared/offload/commands.md#push-fast-forward), [pull fast-forward](../_shared/offload/commands.md#pull-fast-forward) and [history scan](../_shared/offload/commands.md#prep-and-history-scan). Copies are the ones this project has on each machine. A machine without a copy is skipped unless the user asks for [offload-prep](../offload-prep/SKILL.md) to create one.

## Compare

1. Start in the current project copy (refuse an Offload worktree or retired Mirror as the contract says). Read `DEFAULT` and the root commit.
2. For each other machine, resolve its SSH alias and find its copy of this project: the path recorded by the most recent Offload or prep for this root, else ask. Over `ssh -o BatchMode=yes -o ConnectTimeout=5`, read the copy's root, current branch and `HEAD`, and its `status --porcelain --untracked-files=all` filenames. Do not read file contents.
3. Fetch each reachable peer's tip into this copy as `refs/offload-sync/<host>` from its `HOST:/path` URL. Classify each peer against this copy's `HEAD`:
   - **level**: same commit.
   - **behind**: the peer's `HEAD` is an ancestor of this copy's.
   - **ahead**: this copy's `HEAD` is an ancestor of the peer's.
   - **diverged**: neither.
   - **offline**: the SSH probe failed. Name the failure (refused, timeout, host key, auth), because only a timeout or refusal suggests a sleeping machine.
   - **refused**: a different root, or a branch other than `DEFAULT` checked out.
4. Show one table: machine, path, state, commits ahead/behind, and dirty filenames.

Finish when every machine has a state. When reached from offload-task, return this table and stop there.

## Bring copies level

Pick the **newest tip**, the one every other reachable tip is an ancestor of. If none exists, some copies diverged; go to [Diverged](#diverged) first.

1. If this copy is behind the newest tip, run the pull fast-forward from that peer. This is the only way a machine catches up from a peer that cannot reach it, such as a laptop waking after work finished on aidev.
2. For each peer that is behind, run the push fast-forward from this copy once it holds the newest tip. Ask once for the set of machines to advance and use that approval for this run. Uncommitted edits on a peer are fine unless they overlap incoming changes; then `merge --ff-only` refuses with nothing changed, so report the overlapping filenames.
3. Re-read each advanced copy's `HEAD` and require it to equal the newest tip.

Delete each `refs/offload-sync/<host>` after its copy is level. Keep the ref and report it when a scan or fast-forward refused.

Finish when every reachable copy is level, or each remaining one has a named reason.

## Diverged

Two copies each have commits the other lacks. Show both lists. Offer [offload-merge's peer merge](../offload-merge/SKILL.md#merge-a-diverged-peer-main) on the copy the user picks, using that peer's `refs/offload-sync/<host>` as the peer tip. After that merge, restart from Compare: the other copy is now behind and fast-forwards.

## Report

List each machine with its old and new `HEAD` and final state. For every machine that is still not level, say what to run and from where: for example `offload-sync from omarchy when it wakes` for an offline laptop, since the pull fast-forward lets it catch up by itself. A machine left behind makes the next Offload from it carry an old base.
