---
id: 032
title: harness-apply consume audit handoff + report Pi coverage
status: done
blocked_by: [028, 029, 030]
parent: null
priority: 0
created: 2026-07-14
updated: 2026-07-15
actor: ralph
---

## What to build

Close the loop between the two skills and surface the Pi target. Edits `.claude/skills/harness-apply/SKILL.md`.

- Add a step that ensures the global `harness-gates` Pi adapter is installed + registered (one-time; offer to add the `.pi/agent/settings.json` entry if missing), and a Step 5 report line stating that the project scripts also fire in Pi via the adapter.
- Add a handoff-consume input mode: accept the audit's `## Harness gap handoff` block (per `.claude/skills/_shared/harness-gap-handoff.md`) and pre-fill / skip interview questions already answered by the audit, so the interview shrinks to confirmations.
- Refresh any stale `personalize-harness-pi` / dual-harness cross-references to describe the unified dual-target reality: one skill, shared `.claude/hooks/*.sh` scripts, two thin adapters (Claude `settings.json` + the global Pi `harness-gates` extension). Do NOT reintroduce per-project Pi extension generation (that was the 2026-06-17 failure mode).

Reference: `/home/james/symphony/plans/harness-audit-apply-pairing-pi-gates.md`.

## Acceptance criteria

- [x] SKILL.md documents a handoff-consume input mode referencing the shared contract
- [x] SKILL.md includes a step to ensure/register the global `harness-gates` adapter and a Step 5 Pi-coverage report line
- [x] cross-references describe the unified dual-target (one skill, shared scripts, two adapters); no stale `personalize-harness-pi` framing and no per-project Pi extension generation

## Verification

`grep -q 'harness-gap-handoff' .claude/skills/harness-apply/SKILL.md && grep -q 'harness-gates' .claude/skills/harness-apply/SKILL.md && ! grep -q 'personalize-harness-pi' .claude/skills/harness-apply/SKILL.md`

## Blocked by

- Blocked by #028, #029, #030
