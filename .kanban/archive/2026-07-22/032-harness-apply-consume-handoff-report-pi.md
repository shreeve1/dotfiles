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

## Implementation Notes

- **Handoff-consume input mode** — added `### Handoff-consume input mode` under `## Input` (SKILL.md ~L74). Builds a `HANDOFF_COVERED` set from the parsed `## Harness gap handoff` block (every gate row with `coverage ∈ {claude-global, claude-project, pi}`) and skips the matching Step 3 interview question when the surface row is actually wired (SKILL.md ~L569). Cites `.claude/skills/_shared/harness-gap-handoff.md` as the shared contract.
- **Pi adapter wiring** — added Step 2.4 (`### Step 2.4: Pi adapter wiring`, ~L243): probes `$PI_HOME/extensions/harness-gates` + the positive `extensions/harness-gates` settings entry, offers install+register / register-only / skip (never auto-installs), and handles the Pi-not-on-machine case. Records `PI_ADAPTER_STATE` + `PI_COVERAGE_REPORT`. Always runs, even in project mode.
- **Step 5 Pi-coverage report** — always prints coverage reflecting `PI_ADAPTER_STATE`/`PI_COVERAGE_REPORT` (wired / not-wired / opted-out / Pi-absent), with a `warn:` prefix on any non-wired state (~L1253).
- **Unified dual-target framing** — the report states the dual-target reality (one skill, one set of `.claude/hooks/*.sh` scripts, two thin adapters: Claude `settings.json` + the global Pi `harness-gates` extension). Added the explicit "Never generate a per-project Pi extension" guard citing the 2026-06-17 failure mode (~L1325). No stale `personalize-harness-pi` framing remains.
- **Verification** — the `## Verification` command passes (all greps hit; `personalize-harness-pi` negative grep clean).
