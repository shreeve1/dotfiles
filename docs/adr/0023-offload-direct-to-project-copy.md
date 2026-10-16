---
status: accepted
---
# Offloads push into the target's project copy; sync and cleanup keep machines level

Supersedes the Mirror transport in ADR 0016 and the Mirror-based prep fast-forward in ADR 0021.

ADR 0016 sent each Offload branch to a transport-only Mirror at `~/offload/<repo>-<first7root>/` and hung the worker's worktree off it. ADR 0021 added prep's two-hop fast-forward through that Mirror. In use this left a third repo per project per machine with a `main` that went stale on purpose. Work had to be fetched from the Mirror into the project copy before merge. Nothing removed worktrees or branches after an exit. Nothing prompted the other machines to catch up, so a machine's default branch fell behind and the next Offload from it started from an old base.

## Decision

- offload-task pushes `offload/<slug>` straight into the target's **project copy** with a creation-only lease, and herdr creates the worker worktree from that copy. Private records live under the copy's `.git/offload-receipts/`. The receipt keeps its `mirror` field for helper compatibility; it now names the target project copy.
- Pushes into a project copy are only new `offload/*` refs, or exact-SHA deletions of them, never a checked-out branch. `--no-verify` is allowed only for those. A machine moves its own default branch by a local fast-forward or merge.
- **offload-sync** (new) compares every machine's copy and fast-forwards each one to the newest tip: by pushing a temporary `offload/prep-check-<token>` ref and running `merge --ff-only` on the peer, or by fetching from a peer that cannot reach back. Divergence goes to offload-merge's peer merge. offload-task runs sync's comparison before every dispatch. offload-merge and offload-return end by offering sync.
- **offload-cleanup** (new) removes one Offload's worktree, workspace, scope and branches on both machines once merge-base proves the merge, or the returned work is committed on the source. It keeps private records and retires old Mirrors after moving their records into the project copy.
- prep is reduced to first-time setup of a target copy and its dependencies. The default branch is the source copy's current branch, not a hardcoded `main`.
- The source must be a project copy. An Offload worktree is detected structurally: its common directory is not its toplevel's `.git`, or its branch is `offload/*`.

## Considered options

- Keep the Mirror and only add cleanup and sync: still leaves a stale `main` per machine and an extra fetch hop on every merge.
- Push into a dedicated ref namespace such as `refs/offload-transport/*` and create the worktree from it: herdr's `worktree create` takes a branch name, and the objects land in the same repository either way.
- Push to the peer's checked-out branch with `receive.denyCurrentBranch=updateInstead`: refuses on any dirty tree and changes files under an editing user. ADR 0016's reason still holds.

## Consequences

- Pushed objects now land in the user's working repository, not a disposable one. Deleting a branch leaves its objects until git prunes them, so the history scan before each push is the only gate on what arrives. The rule was already scan-before-push; the containment is weaker than a separate Mirror.
- `git_guard.py` and `return_state.py` are unchanged. The Mirror-source refusal and default-branch rule are enforced by skill text.
- Offloads dispatched before this change keep their branch and records in the old Mirror. offload-merge fetches such a branch once into the project copy; offload-return finds its records there; offload-cleanup retires the Mirror after moving its records.
- A project copy's uncommitted edits survive a fast-forward unless they overlap incoming changes; then `merge --ff-only` refuses with nothing changed. Sync and prep no longer require a clean target tree.
