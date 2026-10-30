---
title: pi Compaction Overrides Are Per Machine
summary: Pi compaction.modelOverrides (800000 reserve for every 1M-context cliproxy model) live in each machine's gitignored settings.json.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

## Active memory

- Pi compacts when context tokens exceed `contextWindow - reserveTokens`; the built-in `compaction.reserveTokens` is 16384, so a 1,000,000-token window compacted at about 984k.
- Since 2026-10-30 every cliproxy model with a 1,000,000-token window carries `compaction.modelOverrides` with `reserveTokens: 800000`, so it compacts at about 200k: `claude-opus-5-5`, `claude-sonnet-5-5`, `deepseek-v4.1-flash`, `glm-5.3`, `glm-5.3-flash`, `minimax-m3`. Applied on aidev, itan8n, wrk WSL, wrk Windows and surftop. Smaller models (272k, 500k) keep the default reserve.
- `reserveTokens` also caps the compaction summary response at 0.8x the reserve, so these models can now write longer summaries (up to their own output cap).
- Override keys are the exact `provider/modelId`; Pi has no wildcard, so a new 1M-context model needs its own entry.
- The live override sits in each machine's gitignored `~/.pi/agent/settings.json`; `.pi/agent/settings.json.template` is the tracked copy that travels by git. Changing one means editing every machine, like the default model.

## Related

- [pi Default Model Is Per Machine](memory/docs/workstation/pi-default-model-per-machine.md) - same per-machine settings file and template rule
