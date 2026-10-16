---
name: offload-prep
description: Use when preparing a repo in either direction without overwriting divergent history or dirty work.
---

# Offload prep

Read [the shared contract](../_shared/offload/contract.md). Prep gets a target machine ready for Offloads of this project: a project copy on the default branch, its hooks and its dependencies. Repeat sync after that is [offload-sync](../offload-sync/SKILL.md). Prep prepares a repository and its dependencies, not a running service.

Use [commands.md](../_shared/offload/commands.md) for the `prep` and `scan` gates and the target-copy, transport and fast-forward recipes. Supply fresh target free-space facts and the exact fetched peer SHA.

## Establish source and target

1. The source is the current git repo, which must be a project copy (see the contract). Ask for the target SSH host if omitted. Resolve the target connection and saved herdr machine profile. Record the default branch, both absolute project copy paths, full HEAD SHAs and root identity. Ask which copy to retain as the authority when both machines have copies. Do not infer authority from timestamps or the machine name.
2. Show source dirty and untracked filenames without file contents. Inspect the target copy read-only if it exists. Fetch its HEAD into an isolated local inspection ref so both commits can be compared without moving either checkout. Report unique commits on both sides.
3. If both sides have unique commits, histories have diverged. Preserve both trees and name the commits on each side. Offer [offload-merge](../offload-merge/SKILL.md)'s peer merge on the copy the user picks as authority, using the inspection ref as the peer tip. Once that copy's default branch contains both sides, restart prep from it. If the user declines, stop.
4. Read [the target inventory](../_shared/offload/inventory.md). Require at least 15 GB free on the destination filesystem before cloning, copying or rebuilding. Verify the target's full root identity if a copy already exists. Refuse an ambiguous root or a mismatched repo.

Finish when the user has chosen the retained source, histories are compatible (one side an ancestor of the other), the target has sufficient space and every dependency has an observed status or a recorded gap.

## Prepare the copy

1. If the target has no project copy, create one with [the target-copy recipe](../_shared/offload/commands.md#create-a-target-copy) and fill it with [the push fast-forward](../_shared/offload/commands.md#push-fast-forward). Retain tracked history. Configure target-local `core.hooksPath` if the repo requires it.
2. For an existing copy, bring it level only when the source is the chosen authority, the target HEAD is its ancestor and the user authorized advancing it. Use the push fast-forward. Unrelated uncommitted edits on the target survive; an overlap refuses with nothing changed. Do not reset, overwrite or delete either side's work. A target ahead of the source requires a new source decision: run prep or sync from that machine instead.
3. Classify every ignored file proposed for transfer as `copy`, `rebuild` or `ask`. Obtain per-file approval for copying local state. Keep private keys on their original machine. Prefer target-side credential provisioning. Explicitly approved ignored config such as `.mcp.json` may travel separately through stdin with mode 0600. It does not enter a branch. Transfer approved `.env` files only after the target ignore check and path/mode protections in the inventory. Rebuild approved dependencies from the repo's declared commands.
4. Complete the read-only dependency inventory again after approved setup. Record unresolved credentials or permissions as gaps. Missing secret access is not permission to copy an age key.
5. If the target still has a retired `~/offload/` Mirror for this project, list it and offer [offload-cleanup](../offload-cleanup/SKILL.md#retire-old-mirrors).

## Prove transport

The push fast-forward includes [the prep transport check](../_shared/offload/commands.md#prep-transport-check): a fresh `refs/heads/offload/prep-check-<token>` pushed into the target copy with a creation-only lease, fetched back and compared by full object ID, then deleted with an exact SHA lease. Scan the reachable history with the shared helper before the push. Use `--no-verify` only for this push. Never wildcard-delete Offload branches or touch user refs. On failure, report the token and retained refs. A timeout requires reading the remote ref before retrying.

Finish when the retained source, target project copy and push/fetch check are verified. Report dirty trees left untouched, copied filenames, rebuilt dependencies and remaining access gaps. Report each copy's old and new HEAD. Do not restart or deploy any existing live service.
