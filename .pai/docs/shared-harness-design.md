# Shared PAI CLI Harness Design

## Status

Current harness scope: OpenCode and Pi are the active shared-memory writers. Claude Code and Codex remain installed tools and historical bridge sources, but they are disabled-by-default for new shared-memory writes.

## Problem

James uses multiple CLI agent harnesses: Claude Code, Codex, OpenCode, and Pi. Each has different lifecycle hooks, policy controls, transcript formats, memory locations, and context-injection mechanisms. Existing PAI behavior is strict in Claude Code and partially ported into Codex/OpenCode, while Pi currently has strict local instructions but no shared PAI memory integration.

The current goal is a shared local-first PAI execution harness where OpenCode and Pi are the only active writers to shared memory. Claude Code and Codex stay usable outside this memory harness and remain available for historical bridge reads, review workflows, and future re-enablement decisions.

## Non-Goals

- Do not replace the original CLIs.
- Do not commit runtime events, memory databases, transcripts, auth files, or local user context.
- Do not assume `pai-run` is the only way James will launch CLIs.
- Do not treat PRD-to-ISA migration as a simple rename.
- Do not store full prompts, tool outputs, transcripts, or model responses by default.

## Canonical Locations

Runtime home:

```text
~/.pai/
```

Dotfiles source and bootstrap home:

```text
/home/james/dotfiles/.pai/
```

Runtime stores under `~/.pai/` are machine-local and must never be symlinked into tracked dotfiles paths. Dotfiles may contain source code, schemas, templates, docs, adapter config templates, and installer logic only.

## Architecture

```text
pai-run <cli>                         native hooks/plugins/extensions
      |                                           |
      +-------------------+-----------------------+
                          |
                    adapter layer
                          |
        +-----------------+------------------+
        |                                    |
  canonical event ingest              canonical policy API
        |                                    |
  SQLite + redacted JSONL              adapter decision mapping
        |
  pai-memory / pai-dream / retrieval
        |
  typed durable memories + ISA work artifacts
```

Core commands:

- `pai-run`: creates or attaches canonical sessions, wraps CLI launches, sets environment, records degraded capabilities.
- `pai-memory`: searches, renders context, reviews proposed memories, imports legacy stores.
- `pai-dream`: distills raw events into durable typed memories through a promotion workflow.
- `pai-policy`: evaluates canonical policy requests and returns canonical decisions.

Soft aliases may call `pai-run`, for example `pcc`, `pcodex`, `popencode`, and `ppi`, but direct CLI use must remain possible and explicitly handled.

Active shared-memory writer policy:

- OpenCode and Pi install/session plans are enabled by default after explicit user approval.
- Claude Code and Codex install/session plans are recognized but disabled by default for shared-memory writes.
- Claude Code and Codex bridge-read records are archive-only; attempted new bridge-read writes fail with a structured archive error.
- Claude Code and Codex CLIs, auth helpers, and review agents are not removed by this harness scope.

## Direct Launch Handling

`pai-run` is the preferred session boundary, not the only boundary.

Native adapters must detect whether `PAI_SESSION_ID` is already present.

Only active shared-memory writer adapters emit new lifecycle events into the shared substrate. Disabled historical adapters may still render dry-run plans and report why shared-memory writes are skipped.

If present:

- Attach native hook events to the existing canonical session.
- Store the harness-native session ID as an alias.

If absent and adapter can create a session:

- Create a new canonical session.
- Set or persist the new `pai_session_id` if the harness supports it.
- Emit `session.created_by_native_adapter`.

If absent and adapter cannot create or inject a session:

- Emit a redacted `capability_degraded` event when possible.
- Mark missing capabilities explicitly.
- Do not silently pretend the session is fully managed.

Security policy failures must not degrade silently. If a security/destructive policy cannot be enforced by a native adapter, the adapter must either block the action when possible or report an explicit blocking/degraded state to James.

## Migration Contract

Current legacy stores include at least:

- Claude: `~/.claude/MEMORY`, `~/.claude/PAI`, Claude Code project transcripts, active hooks in `~/.claude/settings.json`.
- Codex: `/home/james/dotfiles/.codex/pai/MEMORY`, `.codex/pai/hooks`, `.codex/pai/lib`, `.codex/hooks.json`.
- OpenCode: `~/.config/opencode` plugins and instructions referencing `~/.claude/PAI`.
- Pi: `~/.pi/agent`, `~/.pi/agent-sessions`, TypeScript extension/team/session-note surfaces.

Migration phases:

1. Inventory: list every legacy read/write surface and classify it as policy, event, memory, work artifact, transcript, user context, or config.
2. Import: copy or summarize selected legacy data into `~/.pai` with provenance and original path references.
3. Bridge-read: adapters may read legacy stores only through explicit bridge modules.
4. Canonical-write: new shared harness writes only to `~/.pai` runtime stores, and only from active OpenCode/Pi writers.
5. Dual-write only by exception: if a legacy hook requires a legacy write for compatibility, mark the write with `compatibility_write: true` and test it.
6. Deprecate: keep Claude/Codex bridge surfaces read-only until an explicit future decision re-enables them.

Read precedence:

1. `~/.pai` canonical runtime memory.
2. Explicit per-project aliases or overrides under `~/.pai`.
3. Legacy bridge reads with provenance and lower trust.

Write ownership:

- Durable shared memories: `~/.pai/memory/**` only.
- Canonical events: `~/.pai/events.sqlite` plus redacted trail files only.
- Canonical work artifacts: ISA files managed through `~/.pai` project/work indexes plus repo-local `ISA.md` where appropriate.
- Legacy writes: compatibility only, never the source of truth. Claude/Codex legacy writes are disabled by default for this shared-memory scope.

Migration acceptance tests:

- Claude and Codex install fixtures render disabled-by-default shared-memory plans.
- Claude and Codex bridge-read write attempts fail with structured archive-only errors while existing bridge rows remain readable.
- OpenCode plugin execution does not double-inject or double-sync ISA.
- Pi wrapper launch records degraded capability and does not read `auth.json`.
- Legacy stores can be imported repeatedly without duplicate durable memories.

## Event Store Contract

SQLite is authoritative. JSONL is an inspection and recovery trail only.

SQLite requirements:

- Use WAL mode.
- Write events transactionally.
- Enforce idempotency by `event_id` and `(pai_session_id, sequence)`.
- Store schema migrations under version control.
- Include recovery tooling for reconciling SQLite and JSONL trails.
- Test concurrent writes from multiple harnesses.

JSONL requirements:

- JSONL receives redacted envelopes only.
- JSONL append occurs after successful SQLite ingest, or uses explicit pending markers with reconciliation.
- JSONL must not contain full prompt, transcript, tool output, or model response payloads by default.

Canonical event envelope:

```ts
type PaiEventEnvelope = {
  schema_version: string;
  event_id: string;
  pai_session_id: string;
  harness: "claude" | "codex" | "opencode" | "pi" | "pai";
  event_type: string;
  timestamp: string;
  sequence: number;
  cwd?: string;
  project_id?: string;
  parent_event_id?: string;
  turn_id?: string;
  tool_call_id?: string;
  actor_id?: string;
  adapter_version: string;
  capabilities: AdapterCapabilities;
  sensitivity: SensitivityLabel;
  redaction_status: RedactionStatus;
  ingest_status: "accepted" | "rejected" | "pending" | "replayed";
  policy_decision_id?: string;
  payload_summary?: string;
  payload_ref?: string;
  payload?: never;
};
```

Full payloads are not part of the default envelope. If enabled, full payloads must live in separate encrypted or quarantined local storage referenced by `payload_ref`, after redaction and explicit retention policy checks.

## Redaction And Secret Handling

Default policy: no full payload retention.

Central redaction runs before any SQLite, JSONL, dream, retrieval, or provider call.

Redaction must handle:

- Prompt text.
- Tool inputs.
- Tool outputs.
- File paths.
- Command lines.
- Transcripts.
- Model responses.
- Environment variables.
- Known auth files such as `.codex/auth.json`, `.pi/agent/auth.json`, `.env*`, private keys, SSH config secrets, tokens, cookies, and cloud credentials.

Required controls:

- Hard path denylist.
- Token and credential pattern tests.
- Payload size limits.
- Taint labels that survive through dream/retrieval.
- Redaction status recorded on every event.
- Quarantined encrypted local storage for explicit full-capture mode only.
- Tests proving JSONL never receives unredacted payloads.

Adapters must not rely on their own sensitivity labels as authoritative. Adapter labels are hints; central redaction is mandatory.

## Policy Contract

`pai-policy` owns policy semantics. Adapters translate harness-specific lifecycle events into canonical requests and translate canonical responses back into harness-specific behavior.

Canonical request:

```ts
type PolicyRequest = {
  request_id: string;
  pai_session_id?: string;
  harness: string;
  event_type: string;
  action_type: "command" | "file_read" | "file_write" | "tool_call" | "prompt" | "final_response" | "adapter_start";
  cwd?: string;
  project_id?: string;
  subject?: RedactedSubject;
  adapter_capabilities: AdapterCapabilities;
  sensitivity: SensitivityLabel;
  redaction_status: RedactionStatus;
};
```

Canonical response:

```ts
type PolicyResponse = {
  policy_decision_id: string;
  action: "allow" | "deny" | "confirm" | "warn" | "redact" | "degrade";
  reason: string;
  severity: "info" | "warning" | "critical";
  required_capability?: keyof AdapterCapabilities;
  user_message?: string;
  audit_event_required: boolean;
};
```

Adapter capabilities:

```ts
type AdapterCapabilities = {
  can_inject_context: boolean;
  can_block_tool: boolean;
  can_request_confirmation: boolean;
  can_observe_tool_input: boolean;
  can_observe_tool_output: boolean;
  can_observe_final_response: boolean;
  can_set_environment: boolean;
  can_attach_native_session_id: boolean;
};
```

Policy failure modes:

- Memory/logging/injection failures fail open with degraded capability events.
- Security/destructive-policy failures fail closed when the adapter can enforce.
- If security enforcement is impossible, the adapter must surface degraded status explicitly and avoid silent logging-only behavior.

## Memory Model

Typed durable memory lives under `~/.pai/memory/`:

```text
profile/
projects/
tools/
learning/
work/
procedures/
```

Every durable memory includes:

- Stable memory ID.
- Type.
- Scope.
- Source event IDs.
- Provenance.
- Confidence.
- Assertion type: `user-stated`, `observed`, `inferred`, or `verified`.
- Trust level.
- Review status.
- Last updated timestamp.
- Expiration or revalidation rule when appropriate.

Promotion rules:

- Session summaries and low-risk tool telemetry may auto-promote.
- Preferences, rules, project facts, security memories, and global-injection memories require review or strong repeated evidence.
- Inferred memories are never injected as instructions.
- Low-trust memories may be surfaced as context with provenance, not as authority.

## Retrieval And Injection

Context injection is retrieval-gated.

Always eligible:

- Small identity/safety block.
- Active work summary.
- Current project aliases and ISA pointer.

Prompt-specific retrieval uses:

- Project ID.
- Tool/harness.
- Memory type.
- Confidence.
- Trust level.
- Assertion type.
- Recency.
- Review status.

Injection controls:

- Never inject unreviewed low-trust inferred memories as instructions.
- Show provenance for memories that influence behavior.
- Keep prompt-injected context bounded and auditable.
- Emit retrieval events with memory IDs, not full memory payloads, unless already redacted.

## Dream And Inference

`pai-dream` distills event streams into proposed durable memories.

Inference must be provider-agnostic behind an interface. Existing Claude CLI inference can be one provider, not the architecture.

Requirements:

- Redact before inference.
- Record provider privacy labels.
- Support deterministic test doubles.
- Support local/offline no-op or rules-only distillation mode.
- Dream failures must not corrupt raw events.
- Proposed memory writes go through the same review/promotion rules as other memory updates.

## ISA And PRD Compatibility

ISA is the canonical shared work artifact.

Compatibility is required because current Claude and Codex logic still has PRD-centered hooks, active work discovery, finalization gates, and sync logic.

Migration requirements:

- Define canonical ISA schema and fixed section order.
- Provide PRD-to-ISA import mapping.
- Generate compatibility PRDs only where legacy hooks require them.
- Migrate hooks in a safe order: read support, dual-read, canonical-write, legacy read-only, removal.
- Acceptance tests must prove existing PRD workflows still resume, sync, and finalize during transition.

Compatibility mapping:

```text
PRD title/status/progress        -> ISA frontmatter and Goal/Verification
PRD ideal state criteria         -> ISA Criteria
PRD implementation plan          -> ISA Features / Decisions / Test Strategy
PRD changelog                    -> ISA Changelog
PRD completion/finalization gate -> ISA Verification
```

## Project Identity

Project identity must avoid leaking private hostnames, usernames, credentials, or local paths.

Canonical project ID:

- Hash normalized git remote and repo root when available.
- Strip credentials and normalize host aliases before hashing.
- Use path fallback only as a hashed ID.
- Store human display aliases separately.
- Support manual alias files in runtime-local `~/.pai`, not committed dotfiles data.

## Adapter Strategy

Claude Code:

- Native hooks can provide deep lifecycle/tool visibility.
- Existing hooks are powerful but currently contain PRD/ISA drift and missing documented `PromptProcessing`/event-emitter paths.
- Adapter must bridge without assuming docs match active runtime.

Codex:

- Native hooks already exist and are PAI-ported.
- Current port writes to `.codex/pai/MEMORY` and enforces PRD-first workflows.
- Adapter should redirect canonical writes to `~/.pai` and preserve local compatibility only where required.

OpenCode:

- Existing plugins may overlap with shared harness responsibilities.
- Create a responsibility matrix before coding.
- Test plugin ordering and idempotency.

Pi:

- MVP remains wrapper-first.
- Do not read `.pi/agent/auth.json`.
- Record session IDs, redacted event metadata, and degraded capabilities.
- Deeper TypeScript extension work waits until lifecycle boundaries and secret handling are proven.

## OpenCode Responsibility Matrix

Before implementation, define which component owns each responsibility:

```text
mode routing        -> existing plugin or shared adapter, not both
ISA sync            -> existing plugin or shared adapter, not both
containment policy  -> existing plugin or pai-policy adapter, not both
event emission      -> shared adapter
memory retrieval    -> shared adapter
reflection/dream    -> pai-dream
config audit        -> existing plugin may remain read-only
```

Each OpenCode plugin path needs an idempotency test proving no duplicate context blocks, duplicate ISA writes, or conflicting containment decisions.

## Installer Requirements

Installer must have dry-run by default or an explicit dry-run mode.

Installer output must show exact config changes, backups, symlinks, and adapter enablement.

Negative guarantees:

- No runtime DB, JSONL, transcript, memory, or auth file is committed.
- No symlink from tracked dotfiles source points into live `~/.pai` runtime stores.
- No adapter is enabled silently.
- Every touched config gets a backup.
- Ignored runtime paths are asserted by tests.
- Installer refuses to proceed if it would expose `.env`, auth files, private keys, or local memory stores.

## Verification Plan

Required tests before enabling adapters:

- Event schema fixture tests per harness.
- Policy request/response mapping tests per harness.
- Redaction tests for prompts, tool inputs, tool outputs, command lines, env vars, file paths, transcripts, and known auth files.
- SQLite migration and WAL/concurrency tests.
- JSONL consistency and reconciliation tests.
- Legacy import idempotency tests.
- PRD-to-ISA compatibility tests.
- OpenCode plugin ordering/idempotency tests.
- Installer dry-run and negative-guarantee tests.
- Pi wrapper tests proving `auth.json` is not read.

## MVP Sequence

1. Create `~/.pai` runtime layout, source schemas, and test fixtures.
2. Implement central redaction and event ingest with SQLite WAL plus redacted JSONL trail.
3. Implement canonical policy request/response contract and adapter capability model.
4. Implement `pai-run` session creation and degraded-capability reporting.
5. Implement `pai-memory search/context/review` with SQLite FTS.
6. Implement legacy import/read bridges for Claude and Codex without canonical legacy writes.
7. Implement Claude and Codex adapters.
8. Define OpenCode responsibility matrix, then implement OpenCode adapter.
9. Implement Pi wrapper-only adapter.
10. Implement provider-agnostic `pai-dream` with deterministic test double first.
11. Migrate PRD workflows toward ISA canonical behavior behind compatibility tests.

## Design Decisions Incorporated From Review

- Split-brain migration is handled by explicit read precedence, write ownership, import/backfill, bridge-read, and deprecation phases.
- Direct CLI bypass is handled by native adapter bootstrap and degraded-capability events.
- Secret handling defaults to no full payload retention and redacted JSONL only.
- Central policy now has canonical request/response schemas and adapter capability mappings.
- ISA migration includes explicit PRD compatibility mapping and migration order.
- Event schema includes replay, debugging, audit, adapter, policy, and redaction fields.
- SQLite and JSONL consistency rules are defined.
- OpenCode plugin overlap requires a responsibility matrix and idempotency tests.
- Dream inference is provider-agnostic with redaction-before-inference and test doubles.
- Retrieval-gated injection includes trust controls and low-trust memory handling.
- Installer dry-run includes negative guarantees.
- Pi remains wrapper-first until lifecycle and secret boundaries are proven.
- Project identity uses hashed stable IDs plus display aliases.
