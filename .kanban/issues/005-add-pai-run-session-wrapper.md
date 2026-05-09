---
id: 005
title: Add pai-run session wrapper
status: review
type: AFK
blocked_by: [002, 004]
parent: null
created: 2026-05-09
---

## What to build

Create `pai-run <cli>` as the stable shared harness entrypoint that launches Claude Code, Codex, OpenCode, and Pi with canonical session identity, environment propagation, event capture, and degraded capability reporting.

## Acceptance criteria

- [ ] `pai-run` creates a canonical `pai_session_id` before launching a target CLI.
- [ ] Supported CLIs receive session environment variables without replacing their native invocation semantics.
- [ ] Wrapper emits session start, launch, stop, and degraded capability events.
- [ ] Soft aliases such as `pcc`, `pcodex`, `popencode`, and `ppi` are documented but opt-in.
- [ ] Tests cover wrapper launch behavior without invoking live external CLIs by default.

## Blocked by

- Blocked by #002.
- Blocked by #004.
