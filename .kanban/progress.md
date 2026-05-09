## #001 Scaffold shared PAI harness package - 2026-05-09

**What changed:** Created the shared PAI Bun/TypeScript harness scaffold under `.pai/` with CLI stubs, runtime path resolver, config template, tests, and typecheck setup.
**Files:** `.pai/package.json`, `.pai/bun.lock`, `.pai/tsconfig.json`, `.pai/src/`, `.pai/config/pai.config.example.json`, `.pai/tests/`, `.pai/README.md`, `.gitignore`, `.kanban/issues/001-scaffold-shared-pai-harness-package.md`
**Decisions:** Runtime home defaults to `~/.pai`; adapters are disabled by default; full payload retention is disabled; redaction and explicit adapter enablement are required by default.
**Conventions established:** Source lives under `.pai/src/`; CLI entry stubs live under `.pai/src/cli/`; runtime artifacts and package installs remain ignored machine-local state.
**Notes for next iteration:** This slice is scaffold-only. It does not create runtime stores, wire live adapters, or mutate shell/OpenCode configuration.
