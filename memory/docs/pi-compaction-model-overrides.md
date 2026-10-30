---
title: pi Compaction Overrides Are Per Machine
summary: Pi compaction.modelOverrides live in each machine's gitignored settings.json; the tracked template carries them to new machines.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: []
---

## Active memory

- Pi compacts when context tokens exceed `contextWindow - reserveTokens`; the built-in `compaction.reserveTokens` is 16384, so a 1,000,000-token window compacted at about 984k.
- Since 2026-10-30 the two 1M-context models `cliproxy/claude-opus-5-5` and `cliproxy/minimax-m3` carry `compaction.modelOverrides` with `reserveTokens: 800000`, so they compact at about 200k. Applied on aidev, itan8n, wrk WSL, wrk Windows and surftop.
- Override keys are the exact `provider/modelId`; Pi has no wildcard, so another 1M-context model needs its own entry.
- The live override sits in each machine's gitignored `~/.pi/agent/settings.json`; `.pi/agent/settings.json.template` is the tracked copy that travels by git. Changing one means editing every machine, like the default model.

## Related

- [pi Default Model Is Per Machine](memory/docs/pi-default-model-per-machine.md) - same per-machine settings file and template rule
