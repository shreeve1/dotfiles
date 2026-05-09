---
id: 015
title: Add safe installer dry-run
status: done
type: HITL
priority: 15
blocked_by: [009, 010, 011, 012, 018]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Create the installer dry-run and explicit adapter enablement flow for the shared harness. This is HITL because it touches live CLI configuration and must preserve safety, backups, and negative guarantees.

## Acceptance criteria

- [x] Installer defaults to dry-run or provides an explicit dry-run mode before any config mutation.
- [x] Dry-run prints exact config changes, backups, symlinks, and adapter enablement steps.
- [x] Installer refuses to expose `.env`, auth files, private keys, runtime memory stores, transcripts, DBs, or JSONL trails.
- [x] No symlink from tracked dotfiles source into live runtime stores is created.
- [x] Tests assert ignored runtime paths, backups for touched config, and explicit adapter enablement.

## Blocked by

- Blocked by #009.
- Blocked by #010.
- Blocked by #011.
- Blocked by #012.
- Blocked by #018.

## Implementation Notes

Added `pai-install dry-run <target>` as a non-mutating installer preview command. The dry-run renderer validates the install plan and prints the full plan plus ordered `write_file`, `symlink`, and `enable_adapter` steps, including backups and explicit adapter enablement. Tests cover dry-run output, forbidden runtime/secret paths, backups, explicit enablement, and tracked-source symlink rejection. Live config mutation remains out of scope.
