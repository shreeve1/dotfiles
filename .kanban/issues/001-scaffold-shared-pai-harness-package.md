---
id: 001
title: Scaffold shared PAI harness package
status: review
type: AFK
blocked_by: []
parent: null
created: 2026-05-09
---

## What to build

Create the source-controlled shared PAI harness package skeleton under `.pai/` while keeping runtime state in `~/.pai`. This slice establishes the package layout, command entry stubs, runtime path resolver, configuration template, and initial tests proving runtime artifacts are not tracked in dotfiles.

## Acceptance criteria

- [ ] `.pai/` contains a minimal TypeScript/Bun package structure for shared harness source code.
- [ ] CLI entry stubs exist for `pai-run`, `pai-memory`, `pai-dream`, and `pai-policy`.
- [ ] Runtime path resolution points to `~/.pai` by default and never to tracked dotfiles runtime directories.
- [ ] A config template documents canonical runtime paths, adapter enablement, and safe defaults.
- [ ] Tests or checks prove runtime DBs, JSONL trails, transcripts, auth files, and local memories are ignored.

## Blocked by

None - can start immediately.
