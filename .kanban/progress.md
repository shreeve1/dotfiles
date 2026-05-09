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

## #004 Add canonical policy contract - 2026-05-09

**What changed:** Added the canonical `pai-policy` contract, policy evaluation rules, policy documentation, CLI action output, and adapter fixture tests.
**Files:** `.pai/src/policy.ts`, `.pai/src/index.ts`, `.pai/src/cli/pai-policy.ts`, `.pai/docs/policy-contract.md`, `.pai/tests/policy.test.ts`, `.kanban/issues/004-add-canonical-policy-contract.md`
**Decisions:** Policy responses use the canonical actions `allow`, `deny`, `confirm`, `warn`, `redact`, and `degrade`; capability mismatches emit explicit `policy.degraded` events instead of silently succeeding.
**Conventions established:** Memory, logging, and context-injection failures degrade; security-sensitive and destructive actions confirm or deny when enforceable, and become critical degraded events when an adapter cannot enforce them.
**Notes for next iteration:** Runtime ingest/session wrappers should call `evaluatePolicy` after redaction and before tool execution, storage, context injection, or adapter lifecycle decisions.

## #006 Add project identity resolver - 2026-05-09

**What changed:** Added a project identity resolver that derives stable hashed IDs from normalized git remote and repo root inputs, falls back to hashed paths, and keeps manual alias metadata runtime-local.
**Files:** `.pai/src/project-identity.ts`, `.pai/src/index.ts`, `.pai/tests/project-identity.test.ts`, `.kanban/issues/006-add-project-identity-resolver.md`
**Decisions:** Project IDs are opaque hashes with `git:`, `path:`, or `manual:` prefixes; display aliases are separate sanitized labels; manual alias files live under `~/.pai` via the runtime path resolver.
**Conventions established:** Do not export remote normalization internals because normalized owner/repo details are hash inputs, not public API; collision handling appends deterministic numeric suffixes without changing display aliases.
**Notes for next iteration:** Canonical event ingest should attach `project_id` from `resolveProjectIdentity` after redaction/policy checks and should not persist raw remotes or absolute local paths.

## #002 Add canonical event ingest - 2026-05-09

**What changed:** Added the canonical event ingest store with SQLite WAL storage, versioned migrations, redacted JSONL trails, idempotent replay behavior, pending markers, and reconciliation.
**Files:** `.pai/src/event-store.ts`, `.pai/src/index.ts`, `.pai/tests/event-store.test.ts`, `.kanban/issues/002-add-canonical-event-ingest.md`
**Decisions:** SQLite is authoritative; JSONL is inspection/recovery only; JSONL accepted events append only after successful SQLite ingest, while interrupted windows use explicit pending markers.
**Conventions established:** Canonical event envelopes never include raw `payload` or `payloads`; duplicate `event_id` or duplicate `(pai_session_id, sequence)` returns a replayed envelope instead of inserting a second row.
**Notes for next iteration:** Session wrapper and memory features can depend on `CanonicalEventStore.ingest()` and should continue using redacted destination-prepared events before durable writes.

## #005 Add pai-run session wrapper - 2026-05-09

**What changed:** Added `pai-run` session wrapper planning and lifecycle recording, a dry-run-by-default CLI, opt-in alias documentation, and tests that avoid live external CLI invocation.
**Files:** `.pai/src/session-wrapper.ts`, `.pai/src/cli/pai-run.ts`, `.pai/src/index.ts`, `.pai/docs/pai-run.md`, `.pai/tests/session-wrapper.test.ts`, `.kanban/issues/005-add-pai-run-session-wrapper.md`
**Decisions:** Default CLI mode is dry-run and does not invoke live CLIs; `--exec` is required for live launch; native command and args are preserved while PAI environment variables are added.
**Conventions established:** Session wrapper environment uses `PAI_SESSION_ID`, `PAI_RUNTIME_HOME`, `PAI_HARNESS`, `PAI_TARGET_CLI`, and optional `PAI_PROJECT_ID`; lifecycle events use `session.start`, `session.launch`, `session.degraded_capability`, and `session.stop`.
**Notes for next iteration:** Future memory and review CLIs can launch through `buildPaiRunPlan` and `recordPaiRunLifecycle`; do not install soft aliases automatically.

## #017 Add canonical memory substrate - 2026-05-09

**What changed:** Added a canonical memory substrate with versioned SQLite migrations, typed memory stores, provenance-preserving records, review queue transitions, and trust-gated retrieval.
**Files:** `.pai/src/memory-store.ts`, `.pai/src/index.ts`, `.pai/tests/memory-store.test.ts`, `.kanban/issues/017-add-canonical-memory-substrate.md`
**Decisions:** Durable memory records carry explicit assertion type, trust level, review status, source event IDs, provenance, confidence, timestamps, expiration, and revalidation metadata.
**Conventions established:** Instruction-eligible retrieval only returns accepted memories with medium/high trust and non-inferred assertion types; low-trust, inferred, and unaccepted memories stay out of instruction injection paths.
**Notes for next iteration:** Future `pai-memory`, dream, migration, and retrieval features should use `CanonicalMemoryStore` instead of inventing alternate memory shapes.
