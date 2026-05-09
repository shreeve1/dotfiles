---
id: 001
title: Scaffold shared PAI harness package
status: done
type: AFK
blocked_by: []
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Create the source-controlled shared PAI harness package skeleton under `.pai/` while keeping runtime state in `~/.pai`. This slice establishes the package layout, command entry stubs, runtime path resolver, configuration template, and initial tests proving runtime artifacts are not tracked in dotfiles.

## Acceptance criteria

- [x] `.pai/` contains a minimal TypeScript/Bun package structure for shared harness source code.
- [x] CLI entry stubs exist for `pai-run`, `pai-memory`, `pai-dream`, and `pai-policy`.
- [x] Runtime path resolution points to `~/.pai` by default and never to tracked dotfiles runtime directories.
- [x] A config template documents canonical runtime paths, adapter enablement, and safe defaults.
- [x] Tests or checks prove runtime DBs, JSONL trails, transcripts, auth files, and local memories are ignored.

## Blocked by

None - can start immediately.

## Implementation Notes

Scaffolded the shared PAI harness package under `.pai/` with Bun/TypeScript package metadata, CLI entry stubs, runtime path resolution, safe default config, config template, tests, and reproducible typecheck dependencies. Runtime state and dependency installs stay machine-local via `.gitignore` rules.
