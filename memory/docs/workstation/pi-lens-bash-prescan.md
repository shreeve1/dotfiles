---
title: pi-lens Scans the Project Before Every bash Call
summary: pi-lens 4.4.8 scans the session folder before each bash command; in itastack that adds about 1.3 s per command, the main reason pi feels slower than dsh.
type: doc
status: promoted
created: 2026-11-05
updated: 2026-11-05
topics: [workstation]
---

## Active memory

- pi-lens 4.4.8 runs `opaque_mutation_prescan` in its `tool_call` hook before every bash command, including commands inside `fabric_exec`. It takes a file baseline of the session cwd so it can spot what the command changed. No setting or env var turns it off; only `--no-lens` or excluding the extension does.
- Measured 2026-11-05 on wsl with three trivial commands: in `~/Documents/itastack` (~11k files) each command took 1.3-1.6 s with pi-lens, against 25-35 ms without it. In a small repo it is about 40 ms. `~/.pi-lens/latency.log` showed 660 s of prescan in 38 minutes across the open itastack sessions.
- Also slow: lint and format after each edit or write (median about 1.7 s).
- `pi -p --no-lens` in itastack exits after ~1.8 s with no tool calls and no answer, so don't use it for A/B timing. Exclude the extension with `--no-extensions` plus `-e` for every other extension instead.
- Fixed for itastack 2026-11-05 (James): `~/Documents/itastack/.pi/pi-lens.json` sets `lens.enabled: false`, read through the global `.pi/agent/pi-lens-project-off.ts` (docs/pi-extensions.md). Code repos keep pi-lens. Project-level extensions load after pi-lens reads its config and can't do this, and pi refuses a second extension registering `--no-lens`.
- With pi-lens excluded, pi's per-step model time is close to dsh's (Opus median about 6-7 s per step for both). What's left is the bigger system prompt and extensions loading at startup (about 1.2 s).
