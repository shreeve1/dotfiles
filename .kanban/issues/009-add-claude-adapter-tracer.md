---
id: 009
title: Add Claude adapter tracer
status: review
type: AFK
blocked_by: [004, 005, 008, 018]
parent: null
created: 2026-05-09
---

## What to build

Implement the first Claude Code adapter tracer library and installable templates so Claude sessions can attach to canonical PAI sessions, emit redacted events, and map existing hook observations into the shared policy model without changing live auth, config, or security semantics.

## Acceptance criteria

- [ ] Adapter detects `PAI_SESSION_ID` when launched through `pai-run` and creates or attaches when direct-launched.
- [ ] Claude hook events emit canonical session, prompt, tool, policy, and stop events where supported.
- [ ] Existing Claude hook behavior is preserved unless explicitly routed through the canonical policy contract.
- [ ] This issue does not mutate live Claude config; it produces installable templates or fixtures only.
- [ ] Direct Claude launches emit managed or degraded capability events instead of silently bypassing PAI.
- [ ] Compatibility tests cover active hooks without relying on documented hooks that are not installed.

## Blocked by

- Blocked by #004.
- Blocked by #005.
- Blocked by #008.
- Blocked by #018.
