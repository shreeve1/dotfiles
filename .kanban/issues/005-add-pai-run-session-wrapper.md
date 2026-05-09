---
id: 005
title: Add pai-run session wrapper
status: done
type: AFK
priority: 5
blocked_by: [002, 004]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Create `pai-run <cli>` as the stable shared harness entrypoint that launches Claude Code, Codex, OpenCode, and Pi with canonical session identity, environment propagation, event capture, and degraded capability reporting.

## Acceptance criteria

- [x] `pai-run` creates a canonical `pai_session_id` before launching a target CLI.
- [x] Supported CLIs receive session environment variables without replacing their native invocation semantics.
- [x] Wrapper emits session start, launch, stop, and degraded capability events.
- [x] Soft aliases such as `pcc`, `pcodex`, `popencode`, and `ppi` are documented but opt-in.
- [x] Tests cover wrapper launch behavior without invoking live external CLIs by default.

## Blocked by

- Blocked by #002.
- Blocked by #004.

## Implementation Notes

Added `.pai/src/session-wrapper.ts` with deterministic session ID creation, launch-plan construction, PAI environment propagation, target capability metadata, lifecycle event building, and canonical event-store recording. Replaced the `pai-run` stub with a dry-run-by-default CLI that preserves native target command/args and requires `--exec` for live process launch. Documented opt-in soft aliases in `.pai/docs/pai-run.md` without installing them automatically. Added tests proving dry-run launch planning does not invoke external CLIs by default and lifecycle recording emits start, launch, degraded capability, and stop events through redacted canonical event inputs.
