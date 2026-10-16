---
status: partially superseded by 0023
---
# Offload roles are source and target; prep syncs project copies in any direction

**Status:** The Mirror-based prep fast-forward is superseded by ADR 0023 (push into the target project copy; offload-sync). The source/target roles still hold.

ADR 0016 described Offload as laptop to server. In practice work moves among three machines (omarchy, aidev, itan8n) in any order. A task can go out from omarchy, be merged and continued on aidev (ADR 0020), then go on to itan8n, and finally sync back to omarchy. The skills named machines by role ("laptop", "server"). They had no rule against starting an Offload from a Mirror, and they offered no route when two project copies had both moved.

## Decision

- Roles are **source** and **target** for one Offload. Any machine can take either role. A **project copy** is the checkout a user works in. A Mirror is transport-only and never a source.
- Each Offload ends through one exit: return, merge or deployment (the contract's Exits section). Return and merge are not combined for one Offload.
- `offload-prep` syncs project copies by a two-hop fast-forward: the source pushes a `offload/prep-check-<token>` ref to the target's Mirror, then the target copy fetches it from its local Mirror path and runs `merge --ff-only`. Each hop checks the full SHA, and the temporary refs are removed afterwards. Nothing pushes to a project copy or a Mirror's `main`, except the one-time seeding of a new Mirror.
- When both copies have unique commits, prep hands off to `offload-merge`'s peer-main merge on the copy the user picks. Prep then fast-forwards the other copy from there. Prep itself never merges.

## Considered options

- Push straight to the peer project copy: needs `receive.denyCurrentBranch=updateInstead` and fails on any dirty tree, the reason ADR 0016 rejected it.
- A separate sync skill: duplicates prep's divergence, dirty-tree and history-scan gates.
- Rebase the diverged side: rewrites commits the other machine already holds.

## Consequences

- The fast-forward needs a Mirror on the target. Prep seeds one the first time a direction is used, so omarchy gets Mirrors on its first use as a target.
- `return_state.py` and `git_guard.py` are unchanged. The rule that the source must not be a Mirror is enforced by the skill text, not the helper.
- Dispatch needs a saved herdr profile from source to target. With this change itan8n saved an omarchy profile (`herdr machine add omarchy`), so every ordered pair of the three machines has one. Profiles are machine-local, not in this repo.

## Observed verification

- On aidev to itan8n with a scratch repo, the exact Mirror and fast-forward recipe blocks from `commands.md` seeded a new Mirror with the right root. They fast-forwarded a target copy that had no Mirror remote and removed every temporary ref, and the Mirror's `main` stayed stale.
- Divergence: `prep` refused with `DIVERGED` and listed one commit on each side. A peer-main merge on the source produced a two-parent commit, then `prep` passed and the fast-forward brought the itan8n copy to the merged SHA. A dirty target copy refused the fast-forward with HEAD unchanged.
- Not exercised: omarchy as a target, and a full `offload-task` dispatch after this rewording. omarchy's pi is `~/bin/pi`, which is not on its non-interactive PATH. The startup recipe binds `PI_DIR` from the installed-version record, so check that record on the first omarchy dispatch.
