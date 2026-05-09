---
id: 015
title: Add safe installer dry-run
status: pending
type: HITL
priority: 15
blocked_by: [009, 010, 011, 012, 018]
parent: null
created: 2026-05-09
---

## What to build

Create the installer dry-run and explicit adapter enablement flow for the shared harness. This is HITL because it touches live CLI configuration and must preserve safety, backups, and negative guarantees.

## Acceptance criteria

- [ ] Installer defaults to dry-run or provides an explicit dry-run mode before any config mutation.
- [ ] Dry-run prints exact config changes, backups, symlinks, and adapter enablement steps.
- [ ] Installer refuses to expose `.env`, auth files, private keys, runtime memory stores, transcripts, DBs, or JSONL trails.
- [ ] No symlink from tracked dotfiles source into live runtime stores is created.
- [ ] Tests assert ignored runtime paths, backups for touched config, and explicit adapter enablement.

## Blocked by

- Blocked by #009.
- Blocked by #010.
- Blocked by #011.
- Blocked by #012.
- Blocked by #018.
