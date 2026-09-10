---
id: 045
title: Update CHANGELOG and README
status: done
blocked_by: [041, 042, 043, 044]
parent: null
priority: 0
created: 2026-07-25
updated: 2026-07-25
action_reviewed: 2026-07-25
actor: ralph
---

## What to build

The four preceding fixes (researcher tool shape, async-recovery acceptance, per-call completionGuard, Fusion guidance decoupling) need CHANGELOG entries and a README note. Add `Unreleased` entries to `CHANGELOG.md` and a short section to `README.md` documenting the per-call `completionGuard` override and researcher tool-shape alignment.

## Acceptance criteria

- [x] `CHANGELOG.md` `Unreleased` has `Fixed` entries for researcher tool shape and async-recovery acceptance
- [x] `CHANGELOG.md` `Unreleased` has `Added` entry for per-call `completionGuard`
- [x] `CHANGELOG.md` `Unreleased` has `Changed` entry for Fusion guidance decoupling
- [x] `README.md` documents the per-call `completionGuard` override and researcher tool-shape alignment

## Verification

`grep -q "completionGuard" .pi/agent/extensions/pi-subagents/README.md && grep -q "web_search\|web_fetch" .pi/agent/extensions/pi-subagents/README.md && grep -q "completionGuard" .pi/agent/extensions/pi-subagents/CHANGELOG.md && echo "docs OK"`

## Blocked by

- Blocked by #041 (researcher tool shape)
- Blocked by #042 (async-recovery acceptance)
- Blocked by #043 (per-call completionGuard)
- Blocked by #044 (Fusion guidance)

## Review Notes

Fresh review session returned `RALPH_REVIEW: PASS_WITH_NOTES` after `55f1797` set status to review. All four acceptance criteria satisfied; verification command (`grep -q "completionGuard" README.md && grep -q "web_search\|web_fetch" README.md && grep -q "completionGuard" CHANGELOG.md && echo "docs OK"`) confirmed via three independent grep checks. One documented follow-up: `README.md:647-651` still describes the legacy researcher tooling (`fetch_content`, `get_search_content`, `pi-web-access`) and contradicts the new rpiv-web-tools alignment added at `README.md:118-122`; tracked as a separate cleanup, not a blocker.

## Reviewer Note

Plan acceptance criteria and Standards/Spec checked. Review found the stale README researcher paragraph contradicted the new rpiv-web-tools alignment; replaced it with the current `web_search`/`web_fetch` semantics. The four acceptance boxes above are now checked after verification. Final validation: full unit glob 22/22, Fusion smoke pass, plan Node preflight `preflight OK`. No remaining gaps.
