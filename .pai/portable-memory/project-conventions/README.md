# Project Conventions (placeholder)

Convention overlay for portable memories with `type: "projects"` — repo/project preferences that should travel across machines (e.g. "this repo uses Bun, not Node", "prefer `bun test` over `vitest`", "lint must pass before push").

The canonical memory type is still `projects` in the SQLite store. This directory is an organizational view; the source of truth is `exports/accepted-memories.json`.

See [`../README.md`](../README.md) for the full portable memory contract.
