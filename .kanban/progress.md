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

## #007 Add memory review CLI - 2026-05-09

**What changed:** Added `pai-memory` search, context, and review commands backed by SQLite FTS, trust-gated retrieval, and local review queue transitions.
**Files:** `.pai/src/cli/pai-memory.ts`, `.pai/src/memory-store.ts`, `.pai/src/index.ts`, `.pai/tests/memory-store.test.ts`, `.pai/tests/memory-cli.test.ts`, `.kanban/issues/007-add-memory-review-cli.md`
**Decisions:** `pai-memory context` only emits bounded instruction-eligible memories from the existing trust gate; `pai-memory review list` includes diff preview plus linked memory confidence, assertion type, trust level, type, and source event refs.
**Conventions established:** Memory search filters are project/type/confidence/trust/recency/harness aware; review actions use `accept`, `reject`, and `defer` mapped to local review queue states.
**Notes for next iteration:** Future dream/retrieval work should reuse `searchMemories`, `buildContextBlock`, and review queue APIs rather than bypassing trust gates.

## #008 Add legacy migration inventory bridge - 2026-05-09

**What changed:** Added a non-destructive legacy migration bridge that inventories legacy Claude, Codex, OpenCode, and Pi surfaces and creates runtime-local bridge-read indexes.
**Files:** `.pai/src/legacy-bridge.ts`, `.pai/src/index.ts`, `.pai/tests/legacy-bridge.test.ts`, `.kanban/issues/008-add-legacy-migration-bridge.md`
**Decisions:** Legacy payloads are not promoted into canonical memory; bridge-read records store metadata, hashes, and provenance only, with `content_copied: false` and low trust.
**Conventions established:** Denied paths, auth files, private keys, and out-of-scope transcript classes are skipped during inventory; migration bridge state lives under `~/.pai/memory/legacy-bridge.sqlite`.
**Notes for next iteration:** Adapter tracer and migration-import work should use bridge-read provenance and require separate HITL approval before promoting any legacy payload into canonical memory.

## #018 Add installer contract template - 2026-05-09

**What changed:** Added the adapter install plan contract, safe fixture rendering, validation rules, documentation, and fixture tests for Claude, Codex, OpenCode, and Pi.
**Files:** `.pai/src/installer-contract.ts`, `.pai/src/index.ts`, `.pai/docs/installer-contract.md`, `.pai/tests/installer-contract.test.ts`, `.kanban/issues/018-add-installer-contract-template.md`
**Decisions:** Adapter tracer issues may render and validate install plans, but live configuration mutation remains forbidden and deferred to a HITL safe installer issue.
**Conventions established:** Install plans require explicit user approval and adapter enablement; validators reject runtime/secret path exposure and tracked-source symlinks into runtime stores.
**Notes for next iteration:** Adapter tracer issues (#009, #010, #011, and related) should use `renderInstallPlanFixture` and `validateInstallPlan` instead of inventing target-specific install shapes.

## #009 Add Claude adapter tracer - 2026-05-09

**What changed:** Added the Claude adapter tracer library, installable tracer template docs, and tests for session attachment, direct-launch managed events, active hook preservation, policy mapping, redacted canonical events, and canonical ingest.
**Files:** `.pai/src/claude-tracer.ts`, `.pai/src/index.ts`, `.pai/docs/claude-adapter-tracer.md`, `.pai/tests/claude-tracer.test.ts`, `.kanban/issues/009-add-claude-adapter-tracer.md`
**Decisions:** Claude tracer issues remain template-only and do not mutate `~/.claude/settings.json`; active installed hook commands are preserved in generated templates while uninstalled/document-only hook names are ignored.
**Conventions established:** Direct Claude launches emit `session.created_by_native_adapter`; `PAI_SESSION_ID` launches emit `session.attached_to_pai_run`; hook observations map to `session.start`, `prompt.submit`, `policy.pre_tool_use`, `tool.post_use`, and `session.stop` through redaction and policy evaluation.
**Notes for next iteration:** Codex/OpenCode/Pi adapter tracers should mirror this pattern: preserve active behavior, render validated install fixtures only, emit explicit managed/degraded events, and avoid live config mutation.

## #010 Add Codex adapter tracer - 2026-05-09

**What changed:** Added the Codex adapter tracer library, installable tracer docs, and tests for session attachment, Codex hook contract mapping, bridge compatibility, PRD compatibility, canonical ingest, and auth/approval safety.
**Files:** `.pai/src/codex-tracer.ts`, `.pai/src/index.ts`, `.pai/docs/codex-adapter-tracer.md`, `.pai/tests/codex-tracer.test.ts`, `.kanban/issues/010-add-codex-adapter-tracer.md`
**Decisions:** Codex hook session IDs are hashed into canonical `pai_codex_` IDs without exposing raw native IDs; `.codex/pai/MEMORY` remains a bridge-read surface while canonical writes target `~/.pai`.
**Conventions established:** Codex tracer templates are legacy-compatible, fixture-only, and must not mutate live config, auth, approval policy, or hooks; PRD-first enforcement remains preserved until ISA migration completes.
**Notes for next iteration:** OpenCode and Pi tracers should reuse the same template-only boundary, canonical session resolution, redacted event mapping, and explicit managed/degraded launch semantics.

## #011 Add OpenCode adapter tracer - 2026-05-09

**What changed:** Added the OpenCode adapter tracer library, responsibility matrix, install template, plugin-ordering check, retrieval/degraded-capability helpers, docs, and 9 tests covering all six acceptance criteria. Resumed an in-flight slice that had a syntax corruption at lines 198-208 of `opencode-tracer.ts` (a `buildOpenCodeDirectLaunchEvent` body collided with `opencodeTracerRuntimeTemplatePath`); also dropped a stray `sensitivity` field on the `prepareEventForDestination` input and re-typed `buildOpenCodeRetrievalContext` against the exported `MemoryContextOptions`.
**Files:** `.pai/src/opencode-tracer.ts`, `.pai/src/index.ts`, `.pai/docs/opencode-adapter-tracer.md`, `.pai/tests/opencode-tracer.test.ts`, `.kanban/issues/011-add-opencode-adapter-tracer.md`
**Decisions:** Existing OpenCode PAI plugins keep ownership of routing (`pai-mode-router`), ISA sync (`pai-isa-sync`), containment (`pai-containment-guard`), and config audit (`pai-config-audit`); the tracer owns only event emission and retrieval, and reflection stays with `pai-dream`. The tracer never mutates `~/.config/opencode/opencode.json` or plugin ordering; all install output is a `#018` validated fixture. Sensitivity labels are derived inside `redactEvent` and read back from the redacted envelope — adapters must NOT pass `sensitivity` on `PaiEventInput`.
**Conventions established:** Adapter tracer modules expose typed options (e.g. `MemoryContextOptions`) instead of `Parameters<>` gymnastics so consumers get clean type errors. The corrupted-source recovery pattern (resume in-flight via Inspect-first, fix mechanically, run typecheck before review) is now established. The `live_config_mutation_allowed: false` literal type continues to gate any future tracer install plan.
**Notes for next iteration:** Pi tracer (#012) should mirror this same shape — responsibility matrix, fixture-only template, plugin-ordering check, redacted event mapping through `prepareEventForDestination` and `evaluatePolicy`, retrieval via `CanonicalMemoryStore.buildContextBlock`, and explicit `policy.degraded` events for surfaces it cannot enforce. Do NOT pass `sensitivity` on the redaction input — let `redactEvent` derive it.

## #012 Add Pi wrapper tracer - 2026-05-09

**What changed:** Added the Pi wrapper-first tracer library, install template, source-grep auth-file safety test, and explicit deferred-extension matrix. Pi is the only adapter without a hook/plugin contract — the tracer is wrapper-only and delegates lifecycle to the #005 `pai-run` session wrapper.
**Files:** `.pai/src/pi-tracer.ts`, `.pai/src/index.ts`, `.pai/docs/pi-wrapper-tracer.md`, `.pai/tests/pi-tracer.test.ts`, `.kanban/issues/012-add-pi-wrapper-tracer.md`
**Decisions:** Pi adapter never imports `node:fs`; the tracer source is grepped by tests to prove no read of `.pi/agent/auth.json` (or any path under `.pi/agent`) is even spellable in the module. The Pi install plan targets `~/.pi/agent/config.json` only — auth.json is never in `files_to_change`/`backup_paths`/`symlink_actions`. Non-zero Pi wrapper exit is recorded as `session.degraded_capability` (not a silent stop). Pi-unsupported capabilities (`can_observe_tool_output`, `can_observe_final_response`, `can_attach_native_session_id`) emit explicit degraded events through `#005.buildLifecycleEvents` and through the on-demand `buildPiDegradedCapabilityEvent`.
**Conventions established:** Wrapper-first adapters do not need their own session-resolution function — they thin-wrap `buildPaiRunPlan({ target: <name> })`. The forbidden-paths surface (`PI_FORBIDDEN_AUTH_PATHS` + `assertNoPiAuthFileAccess`) is the standard shape for adapters that must NEVER touch a credential file: publish the list as data, expose a pure assertion, source-grep the tracer module to prove the call sites cannot exist. Adapter capabilities table in `session-wrapper.ts` is the single source of truth for which lifecycle events degrade — the tracer reads the capability map rather than re-declaring it.
**Notes for next iteration:** ISA compatibility tracer (#014) and dream pipeline (#013) are next AFK candidates. #015 safe installer dry-run and #021 legacy import approval are HITL — Ralph must NOT auto-implement them. The smart-zone limit suggests stopping after this issue (2 done in this session: resumed #011, completed #012); next session should pick up at #013 or #014.

## #022 Restrict shared memory to OpenCode and Pi - 2026-05-09

**What changed:** Narrowed the shared-memory harness scope so OpenCode and Pi are the only active writers. Claude Code and Codex remain installed tools, review surfaces, and historical bridge sources, but their shared-memory install/session plans are disabled by default.
**Files:** `.pai/src/installer-contract.ts`, `.pai/src/session-wrapper.ts`, `.pai/src/legacy-bridge.ts`, `.pai/src/index.ts`, `.pai/docs/shared-harness-design.md`, `.pai/tests/installer-contract.test.ts`, `.pai/tests/session-wrapper.test.ts`, `.pai/tests/legacy-bridge.test.ts`, `.kanban/issues/022-restrict-shared-memory-to-opencode-and-pi.md`
**Decisions:** #009 Claude tracer and #010 Codex tracer are superseded as active shared-memory writers and retained as historical/template code. #011 OpenCode tracer and #012 Pi tracer remain active writer surfaces. #008 bridge now treats Claude/Codex as archive-only for new bridge-read writes while preserving existing read semantics. OpenCode runtime plugins should write PAI work state under `~/.pai/memory/` instead of Claude memory paths.
**Conventions established:** Disabled historical adapters must still be recognized by type-level APIs and replay/inventory flows; active flows must skip their shared-memory lifecycle writes. A hard structured archive error is preferred over silent no-op for accidental Claude/Codex bridge writes.
**Notes for next iteration:** The previous big-bang OpenCode port plan is abandoned. Resume #013, #014, #015, #016, #019, #020, and #021 under the narrower scope, with #015 and #021 still requiring HITL approval.

## Board recovery - 2026-05-09

**What changed:** Added explicit numeric priorities to all issue frontmatter using the existing issue ID order, and reset stale `in_progress` locks for #013 and #022 back to `pending` for retry/reconciliation.
**Files:** `.kanban/issues/001-scaffold-shared-pai-harness-package.md` through `.kanban/issues/027-document-and-reconcile-kanban-scope.md`, `.kanban/progress.md`
**Decisions:** Priority values intentionally mirror issue IDs to satisfy Ralph's required field without reordering the existing board. Stale locks were not marked done because completion was not re-verified in this recovery pass.
**Notes for next iteration:** Ralph should revalidate the board before claiming work. If validation passes, #013 is expected to sort before #014 because it has priority 13 and its blockers are done.

## #013 Add provider-agnostic dream pipeline - 2026-05-09

**What changed:** Added `pai-dream` core for turning redacted canonical events into review-gated proposed memories through deterministic and local/offline providers only.
**Files:** `.pai/src/dream-pipeline.ts`, `.pai/src/cli/pai-dream.ts`, `.pai/src/index.ts`, `.pai/src/memory-store.ts`, `.pai/tests/dream-pipeline.test.ts`, `.pai/docs/pai-dream.md`, `.kanban/issues/013-add-provider-agnostic-dream-pipeline.md`
**Decisions:** Real Claude inference remains disabled and documented as a future #019 provider option; this slice only enables deterministic and local/offline modes.
**Conventions established:** Dream outputs are proposed memories with review queue entries, low or medium trust, provenance, confidence, assertion type, source event IDs, and `review_status: proposed`.
**Notes for next iteration:** #014 is now the next lowest-priority unblocked AFK issue; #019 remains HITL because it enables real provider calls.
