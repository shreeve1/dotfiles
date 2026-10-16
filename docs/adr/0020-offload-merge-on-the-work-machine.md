---
status: accepted
---
# Offload work may merge into the working copy on the machine where it ran

ADR 0016 brings Offload work home with `git apply` and never merges, because the laptop's `main` is almost never clean. That leaves no route for continuing on the server: the user wants the finished Offload branch on the server project copy's `main`, more tickets done there, and only then everything synced back.

`offload-merge` covers that case. It runs on the machine holding the Offload branch and only against the project working copy (`brief.json` `target.path`), never the Mirror, whose `main` stays stale. It requires a clean working copy and an idle, clean worker. It pins the exact branch tip, fast-forwards when possible, and creates a merge commit only after an explicit yes. A conflict aborts with nothing changed. It never pushes and never touches the source machine. Commits after the Result are listed and need an explicit yes, because the Result's verification does not cover them.

## Considered options

- A merge mode inside `offload-return`: mixes the freeze/pin/ACK apply contract with a different, history-keeping flow on a different machine.
- Rebase the branch onto `main`: rewrites the worker's commits, so the Result's `work_tip` no longer names a commit on `main`.
- Merge and also sync the source in one skill: duplicates `offload-prep`'s divergence and dirty-tree guards.

## Consequences

- The trip back after a merge goes through `offload-prep`, with the server copy as the source. `offload-return` still works, but it carries only the Snapshot-to-Result delta and leaves out later commits on `main`. Use one route per Offload: a returned delta left uncommitted on the source blocks a later fast-forward of the same commits.
- The Snapshot commit enters `main`'s history. Any source dirty or untracked files it captured become committed, and they block the later fast-forward on the source until those files are dealt with there. The skill reports them before merging.
