---
id: 044
title: Decouple Fusion guidance from hardcoded model labels
status: review
blocked_by: []
parent: null
priority: 0
created: 2026-07-25
updated: 2026-07-25
---

## What to build

`FUSION_GUIDANCE_BODY` in the Fusion extension and ADR 0002 hardcode specific model/thinking labels (`minimax/MiniMax-M3`, `deepseek/deepseek-v4-flash`) that drift from `settings.json` `subagents.agentOverrides`. Replace hardcoded labels with a pointer to `settings.json`. Append the five session-efficiency rules from the review (no duplicate parent discovery, scout repo-only, stop after bash-policy block, bounded child budgets, return control for long async). Update `fusion-smoke.sh` to assert the new guidance strings.

## Acceptance criteria

- [x] `FUSION_GUIDANCE_BODY` in `fusion/index.ts` keeps role semantics but strips model/thinking labels
- [x] A single sentence references `settings.json` `subagents.agentOverrides` as the source of truth for model/thinking
- [x] Five session-efficiency rules appended to the guidance body
- [x] `docs/adr/0002-fusion-mode.md` hardcoded model table replaced with pointer to `settings.json`
- [x] ADR gains a "Session-efficiency rules" section with the same five rules
- [x] `fusion-smoke.sh` asserts `FUSION_GUIDANCE_BODY` contains the canonical pointer sentence and efficiency rule keywords

## Verification

`bash .pi/agent/extensions/fusion/tests/fusion-smoke.sh` → exit 0, including new `OK: guidance body decoupled ...` line.

## Blocked by

None

## Implementation Notes

- `FUSION_GUIDANCE_BODY`: removed the four role bullets and replaced with the canonical pointer sentence (verbatim) + a `Session-efficiency rules:` block listing the five rule names verbatim, one bullet each, one-clause rationale. Worker delegation contract, retry ladder, advisor paragraph, and "One writer per cwd" line kept verbatim.
- ADR 0002 (Models and tools): removed the Role/Model/Thinking/Tools table; the section now opens with the canonical pointer sentence, keeps the existing frontmatter-pinning sentence verbatim, and keeps the parent-model + pi-duo paragraphs intact. Added a new `## Session-efficiency rules` H2 immediately after `Models and tools` with the same five bullets, same order.
- Smoke test: added section (13) that imports the extension, loads `FUSION_GUIDANCE_BODY`, asserts neither `minimax/MiniMax-M3` nor `deepseek/deepseek-v4-flash` appear, asserts the canonical pointer sentence substring (built via `String.fromCharCode(96)` for backticks, matching the surrounding pattern), and asserts the five rule names as standalone substrings whose indices increase monotonically.
- Two commits: feature + review-status flip.
- review cycle: restored role-semantic bullets per FAIL feedback.
