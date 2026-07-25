---
id: 044
title: Decouple Fusion guidance from hardcoded model labels
status: pending
blocked_by: []
parent: null
priority: 0
created: 2026-07-25
---

## What to build

`FUSION_GUIDANCE_BODY` in the Fusion extension and ADR 0002 hardcode specific model/thinking labels (`minimax/MiniMax-M3`, `deepseek/deepseek-v4-flash`) that drift from `settings.json` `subagents.agentOverrides`. Replace hardcoded labels with a pointer to `settings.json`. Append the five session-efficiency rules from the review (no duplicate parent discovery, scout repo-only, stop after bash-policy block, bounded child budgets, return control for long async). Update `fusion-smoke.sh` to assert the new guidance strings.

## Acceptance criteria

- [ ] `FUSION_GUIDANCE_BODY` in `fusion/index.ts` keeps role semantics but strips model/thinking labels
- [ ] A single sentence references `settings.json` `subagents.agentOverrides` as the source of truth for model/thinking
- [ ] Five session-efficiency rules appended to the guidance body
- [ ] `docs/adr/0002-fusion-mode.md` hardcoded model table replaced with pointer to `settings.json`
- [ ] ADR gains a "Session-efficiency rules" section with the same five rules
- [ ] `fusion-smoke.sh` asserts `FUSION_GUIDANCE_BODY` contains the canonical pointer sentence and efficiency rule keywords

## Verification

`bash .pi/agent/extensions/fusion/tests/fusion-smoke.sh`

## Blocked by

None — can start immediately
