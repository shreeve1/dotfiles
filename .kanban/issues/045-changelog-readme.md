---
id: 045
title: Update CHANGELOG and README
status: in-progress
blocked_by: [041, 042, 043, 044]
parent: null
priority: 0
created: 2026-07-25
---

## What to build

The four preceding fixes (researcher tool shape, async-recovery acceptance, per-call completionGuard, Fusion guidance decoupling) need CHANGELOG entries and a README note. Add `Unreleased` entries to `CHANGELOG.md` and a short section to `README.md` documenting the per-call `completionGuard` override and researcher tool-shape alignment.

## Acceptance criteria

- [ ] `CHANGELOG.md` `Unreleased` has `Fixed` entries for researcher tool shape and async-recovery acceptance
- [ ] `CHANGELOG.md` `Unreleased` has `Added` entry for per-call `completionGuard`
- [ ] `CHANGELOG.md` `Unreleased` has `Changed` entry for Fusion guidance decoupling
- [ ] `README.md` documents the per-call `completionGuard` override and researcher tool-shape alignment

## Verification

`grep -q "completionGuard" .pi/agent/extensions/pi-subagents/README.md && grep -q "web_search\|web_fetch" .pi/agent/extensions/pi-subagents/README.md && grep -q "completionGuard" .pi/agent/extensions/pi-subagents/CHANGELOG.md && echo "docs OK"`

## Blocked by

- Blocked by #041 (researcher tool shape)
- Blocked by #042 (async-recovery acceptance)
- Blocked by #043 (per-call completionGuard)
- Blocked by #044 (Fusion guidance)
