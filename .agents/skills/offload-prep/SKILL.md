---
name: offload-prep
description: Use when preparing a repo in either direction without overwriting divergent history or dirty work.
---

# Offload prep

Read [the shared contract](../_shared/offload/contract.md). Prep works in either direction. It prepares a repository and its dependencies, not a running service.

Use [commands.md](../_shared/offload/commands.md) for executable `prep` and `scan` gates. Supply fresh target free-space facts and the exact fetched peer SHA.

## Establish source and target

1. Use the current git repo. Ask for the target SSH host if omitted. Resolve the target connection and saved herdr machine profile. Record both absolute repo paths, full HEAD SHAs and root identity. Ask which source to retain when both machines have copies. Do not infer authority from timestamps or the machine name.
2. Show source dirty and untracked filenames without file contents. Inspect the target copy read-only if it exists. Fetch its HEAD into an isolated local inspection ref so both commits can be compared without moving either checkout. Report unique commits on both sides. Refuse divergent histories. Preserve both trees and explain which commits need an explicit reconciliation before prep can continue.
3. Read [the target inventory](../_shared/offload/inventory.md). Require at least 15 GB free on the destination filesystem before cloning, copying or rebuilding. Verify the target's full root identity if a copy already exists. Refuse an ambiguous root or a mismatched repo.

Finish when the user has chosen the retained source, histories are compatible, the target has sufficient space and every dependency has an observed status or a recorded gap.

## Prepare the copy

1. Create a new target copy only if the destination is absent. Retain tracked history. For an existing copy, refuse a dirty tree before changing its checkout. Fast-forward only when the source is the chosen authority, the target HEAD is its ancestor and the user authorized advancing that copy. Do not reset, overwrite or delete either side's work. A target ahead of the selected source requires a new source decision.
2. Create or verify the dedicated Mirror at the shared contract's identity path. Keep main stale intentionally. Only named `offload/*` refs carry task transport. Copy tracked history through a narrowly named prep-check branch, not a push to the target's main. Configure target-local `core.hooksPath` if the repo requires it.
3. Classify every ignored file proposed for transfer as `copy`, `rebuild` or `ask`. Obtain per-file approval for copying local state. Keep private keys on their original machine. Prefer target-side credential provisioning. Explicitly approved ignored config such as `.mcp.json` may travel separately through stdin with mode 0600. It does not enter a branch. Transfer approved `.env` files only after the target ignore check and path/mode protections in the inventory. Rebuild approved dependencies from the repo's declared commands.
4. Complete the read-only dependency inventory again after approved setup. Record unresolved credentials or permissions as gaps. Missing secret access is not permission to copy an age key.

## Prove transport

Generate a unique token and reserve `refs/heads/offload/prep-check-<token>` locally and on the verified Mirror. Refuse an existing ref. Create the temporary ref from the chosen source HEAD. Scan the reachable history with the shared helper before transfer. Push to the explicit Mirror URL and exact temporary destination ref. Fetch that same ref into an isolated local verification ref and compare full object IDs.

Use `--no-verify` only for this verified Mirror push. After a successful comparison, remove only the temporary remote ref with an exact SHA lease, then remove only the local refs this run created. On failure, report the token and retained refs. Never wildcard-delete Offload branches or touch user refs. A timeout requires reading the remote ref before retrying.

Finish when the retained source, target copy, Mirror identity and push/fetch check are verified. Report dirty trees left untouched, copied filenames, rebuilt dependencies and remaining access gaps. Keep the user's actual target project copy. Do not restart or deploy any existing live service.
