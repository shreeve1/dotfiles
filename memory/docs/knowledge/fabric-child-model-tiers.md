---
title: Fabric Child Model Tiers
summary: A fabric child with no model runs on Main's model (agents.model unset); skill tiers map cheap->cheap, standard->reviewer, most capable->oracle.
type: doc
status: promoted
created: 2026-10-26
updated: 2026-11-05
topics: [knowledge]
---

## Active memory

- A pi-fabric child launched without `model` uses `agents.model`; that is unset in `.pi/agent/fabric.json`, so it inherits Main's session model (often the most expensive).
- Superpowers names tiers, not models. Mapping, set 2026-10-26 in `.pi/agent/APPEND_SYSTEM.md`: cheap/fast -> `cheap`, standard -> `reviewer`, most capable -> `oracle`. Alias targets live in `.pi/agent/fabric.json`.
- The mapping is guidance only. A hard fallback would be `agents.model` in `fabric.json`; James chose not to set one (it would also apply to Fabric's own patterns).

- `extensions: false` does not suppress target repository guidance. In the 2026-11-05 compatibility-skill test, all four children still followed dotfiles AGENTS.md memory instructions and appended memory-check lines. Tool restrictions and extension disabling are not isolation from repository instructions or Bash writes; review briefs need explicit write boundaries and output handling. No child memory writes occurred in that test. Evidence: `~/.local/state/herdr-handoff/20261105-095232-compat-skill-test.report.md` and its child receipts.

## Related

- [pi Default Model Is Per Machine](memory/docs/workstation/pi-default-model-per-machine.md): Main's model, which an unnamed child inherits, is set per machine.
