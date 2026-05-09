## #001 Scaffold shared PAI harness package - 2026-05-09

**What changed:** Created the shared PAI Bun/TypeScript harness scaffold under `.pai/` with CLI stubs, runtime path resolver, config template, tests, and typecheck setup.
**Files:** `.pai/package.json`, `.pai/bun.lock`, `.pai/tsconfig.json`, `.pai/src/`, `.pai/config/pai.config.example.json`, `.pai/tests/`, `.pai/README.md`, `.gitignore`, `.kanban/issues/001-scaffold-shared-pai-harness-package.md`
**Decisions:** Runtime home defaults to `~/.pai`; adapters are disabled by default; full payload retention is disabled; redaction and explicit adapter enablement are required by default.
**Conventions established:** Source lives under `.pai/src/`; CLI entry stubs live under `.pai/src/cli/`; runtime artifacts and package installs remain ignored machine-local state.
**Notes for next iteration:** This slice is scaffold-only. It does not create runtime stores, wire live adapters, or mutate shell/OpenCode configuration.

## #003 Add central redaction pipeline - 2026-05-09

**What changed:** Added a central redaction library and tests for secret patterns, denylisted paths, payload limits, event taint metadata, destination-boundary redaction, and safe JSONL serialization.
**Files:** `.pai/src/redaction.ts`, `.pai/src/index.ts`, `.pai/tests/redaction.test.ts`, `.kanban/issues/003-add-central-redaction-pipeline.md`
**Decisions:** Event payloads are never retained as raw `payloads` on redacted envelopes; destination handoffs use `prepareEventForDestination` so SQLite, JSONL, dream, retrieval, and inference providers receive redacted summaries only.
**Conventions established:** Redacted events use `schema_version: "pai.event.v1"`, `redaction_status`, `taint_labels`, `payload_size_limit`, `payload_summary`, `findings`, and optional `redaction_destination`.
**Notes for next iteration:** This slice does not create persistent SQLite/JSONL writers; future storage/export issues should call the redaction boundary before writing or sending any payload-derived content.
