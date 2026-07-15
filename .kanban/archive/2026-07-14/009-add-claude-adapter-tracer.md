---
id: 009
title: Add Claude adapter tracer
status: done
type: AFK
priority: 9
blocked_by: [004, 005, 008, 018]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement the first Claude Code adapter tracer library and installable templates so Claude sessions can attach to canonical PAI sessions, emit redacted events, and map existing hook observations into the shared policy model without changing live auth, config, or security semantics.

## Acceptance criteria

- [x] Adapter detects `PAI_SESSION_ID` when launched through `pai-run` and creates or attaches when direct-launched.
- [x] Claude hook events emit canonical session, prompt, tool, policy, and stop events where supported.
- [x] Existing Claude hook behavior is preserved unless explicitly routed through the canonical policy contract.
- [x] This issue does not mutate live Claude config; it produces installable templates or fixtures only.
- [x] Direct Claude launches emit managed or degraded capability events instead of silently bypassing PAI.
- [x] Compatibility tests cover active hooks without relying on documented hooks that are not installed.

## Blocked by

- Blocked by #004.
- Blocked by #005.
- Blocked by #008.
- Blocked by #018.

## Implementation Notes

Added a Claude adapter tracer library that resolves `PAI_SESSION_ID`, creates managed direct-launch sessions, maps active Claude hook observations into redacted canonical event-store inputs, and evaluates each event through the shared policy contract. The tracer template preserves existing active hook commands while adding installable fixture hooks and validated install-plan output only; it does not mutate live Claude config. Tests cover pai-run attachment, direct-launch managed events, session/prompt/policy/tool/stop event mapping, active-hook preservation, ignored uninstalled hook names, canonical ingest, and runtime-local template paths.
