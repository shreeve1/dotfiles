# Memory System

**The unified PAI memory substrate: what happened, what is being worked on, what was verified, and what should be recalled later.**

**Version:** 8.0 (OpenCode-native runtime, 2026-05-10)
**Runtime location:** `~/.pai/memory/`
**Runtime override:** `PAI_RUNTIME_HOME`, defaulting to `~/.pai`

---

## Current OpenCode Architecture

OpenCode is now the active runtime. PAI memory is stored under the tool-neutral runtime root at `~/.pai/memory`.

```
OpenCode session
    ↓
pai-mode-router plugin
    ├── classifies first prompt as MINIMAL / NATIVE / ALGORITHM
    ├── writes STATE/mode-router.json
    └── creates WORK/{timestamp_slug}/ISA.md for ALGORITHM sessions
    ↓
Model + tools execute work
    ├── model edits ISA.md directly during Algorithm work
    ├── pai-isa-sync mirrors ISA state to STATE/work.json
    ├── pai-config-audit records OpenCode config edits
    ├── pai-opencode-tracer writes redacted canonical events to ~/.pai/events.sqlite
    └── pai-reflection-loop records idle markers in LEARNING/REFLECTIONS/
    ↓
pai-memory distill --provider local
    └── proposes review-queued memories only; acceptance remains James-controlled
```

The current OpenCode implementation is **review-gated and partially automated**:

- Work state and ISA scaffolds are created automatically.
- Reflection files are created automatically, but substantive learning content is still model-authored during LEARN.
- Redacted OpenCode prompt/tool/idle events are captured by `pai-opencode-tracer` into `~/.pai/events.sqlite` and `~/.pai/trails/events.jsonl`.
- Local distillation can propose memories into the SQLite review queue, but it never auto-accepts them.
- Automatic context injection is still not wired into OpenCode startup; accepted-memory retrieval remains explicit unless separately approved.

---

## Directory Structure

```
~/.pai/
├── events.sqlite                  # Canonical redacted event store
├── trails/
│   └── events.jsonl               # Append-only redacted event trail
├── state/
│   ├── opencode-tracer-sequences.json
│   ├── distill-watermark.json
│   └── distill-debounce.json
├── logs/
│   └── distill.log
└── memory/
├── WORK/                         # Active and historical task artifacts
│   └── {timestamp_slug}/
│       └── ISA.md                # Ideal State Artifact for Algorithm work
├── STATE/                        # Fast mutable operational state
│   ├── mode-router.json          # Session mode, first prompt, slug, ISA path
│   └── work.json                 # ISA frontmatter + criteria mirror, if synced
├── LEARNING/                     # Reflections, ratings, synthesized learnings
│   └── REFLECTIONS/
│       └── algorithm-reflections.jsonl
├── OBSERVABILITY/                # Runtime/config/system observations
│   └── config-changes.jsonl      # OpenCode config edit audit log, if created
├── VERIFICATION/                 # Per-ISC evidence, when authored
├── KNOWLEDGE/                    # Durable facts, when authored
├── RESEARCH/                     # Agent/research outputs, when authored
├── SECURITY/                     # Security events, when authored
└── memories.sqlite               # Canonical reviewed memory database, if initialized
```

Some directories are created lazily. Absence of a directory usually means no active writer has needed it yet.

---

## Memory Categories

### WORK

**Purpose:** Track specific units of work.

**Current OpenCode writer:** `pai-mode-router`

**When created:** On the first user message of a session classified as `ALGORITHM`.

**Current format:**

`~/.pai/memory/WORK/{timestamp_slug}/ISA.md`

The ISA is the source of truth for:

- Problem
- Goal
- Criteria / ISCs
- Test Strategy
- Decisions
- Changelog
- Verification

### STATE

**Purpose:** Fast mutable state that can be regenerated or repaired.

Current OpenCode writers:

- `pai-mode-router` writes `STATE/mode-router.json`.
- `pai-isa-sync` writes `STATE/work.json` after Write/Edit operations on `ISA.md` or legacy `PRD.md` under `memory/WORK/`.
- `pai-opencode-tracer` writes `~/.pai/state/opencode-tracer-sequences.json` so event ordering survives plugin reloads.
- `pai-memory distill` writes `~/.pai/state/distill-watermark.json`, `~/.pai/state/distill-debounce.json`, and `~/.pai/state/distill.lock` during local distillation.

`mode-router.json` records session ID, mode, classification time, first prompt, message count, slug, and ISA path.

`work.json` mirrors each work slug's phase and criteria counts for dashboards/status tools.

### LEARNING

**Purpose:** Capture process improvements, task-execution lessons, ratings, and reflections.

Current OpenCode writer:

- `pai-reflection-loop` ensures `LEARNING/REFLECTIONS/algorithm-reflections.jsonl` exists, rotates it if large, and appends session-idle markers.

Current limitation:

- Idle markers are not substantive learnings. Actual reflections are expected to be model-authored during Algorithm LEARN via Write/Edit.
- OpenCode-previous automatic hooks such as `RatingCapture`, `WorkCompletionLearning`, `SessionHarvester`, and `LearningPatternSynthesis` are not currently active OpenCode plugins.

### OBSERVABILITY

**Purpose:** Record runtime and system observations.

Current OpenCode writer:

- `pai-config-audit` writes `OBSERVABILITY/config-changes.jsonl` when OpenCode tools write/edit `opencode.json` or `opencode.jsonc`.

Each entry includes timestamp, file path, SHA-256, byte size, tool, and optional session ID.

### Canonical Event Store

**Purpose:** Capture redacted local runtime evidence that can later feed review-gated memory proposals.

**Location:** `~/.pai/events.sqlite`

**JSONL trail:** `~/.pai/trails/events.jsonl`

**Active OpenCode writer:** `pai-opencode-tracer`

Captured event surfaces:

- User prompt text from `chat.message`, after synthetic/internal primer filtering.
- Strict allowlist tool metadata from `tool.execute.after`: tool name, high-level status, path category, and redacted summary only.
- Session stop markers from `session.idle` bus events.

The plugin does not serialize arbitrary tool args, auth headers, environment values, raw tool output, or raw `payload`/`payloads` fields. Event sequence state is recoverable from the canonical event store if plugin state is stale or corrupt.

### VERIFICATION

**Purpose:** Preserve per-ISC proof that criteria were tested.

Current status:

- The Algorithm expects verification evidence, but OpenCode does not yet have an active plugin that automatically writes `VERIFICATION/{work-slug}/ISC-N.md`.
- The model may write verification notes directly when following Algorithm LEARN/VERIFY requirements.

### KNOWLEDGE

**Purpose:** Durable factual knowledge that is too broad for a single work item.

Current status:

- Directory is reserved for model-authored durable facts.
- No active OpenCode plugin currently auto-distills knowledge into Markdown files.

### Canonical SQLite Memory Store

**Purpose:** Review-gated durable memory retrieval for future context injection.

**Location:** `~/.pai/memory/memories.sqlite`

**Implementation:** `.pai/src/memory-store.ts`

**CLI:** `.pai/src/cli/pai-memory.ts`

Memory record fields include:

- `type`: `profile`, `projects`, `tools`, `learning`, `work`, `procedures`
- `scope`
- `source_event_ids`
- `provenance`
- `confidence`
- `assertion_type`: `user-stated`, `observed`, `inferred`, `verified`
- `trust_level`: `low`, `medium`, `high`
- `review_status`: `proposed`, `accepted`, `rejected`, `deferred`
- `content`
- optional expiry and revalidation rule

Only memories with `review_status = accepted`, `trust_level` medium/high, and non-`inferred` assertion type are eligible for instruction/context injection.

---

## Active OpenCode Memory Plugins

| Plugin | Trigger | Writes To | Creates Durable Learning? |
|---|---|---|---|
| `pai-mode-router` | first `chat.message` in session | `STATE/mode-router.json`, `WORK/*/ISA.md` | No, work state only |
| `pai-isa-sync` | after Write/Edit of `ISA.md` or legacy `PRD.md` | `STATE/work.json` | No, mirror only |
| `pai-reflection-loop` | `session.idle` event | `LEARNING/REFLECTIONS/algorithm-reflections.jsonl` | Marker only |
| `pai-config-audit` | after Write/Edit of `opencode.json[c]` | `OBSERVABILITY/config-changes.jsonl` | No, audit only |
| `pai-containment-guard` | before Write/Edit | blocks unsafe writes outside `~/.pai/PAI/USER` and `~/.pai/memory` | No |
| `pai-checkpoint-per-isc` | after Write/Edit of ISA/PRD | `.checkpoint-state.json` and optional git commits | No |
| `pai-opencode-tracer` | `chat.message`, `tool.execute.after`, `session.idle` | `~/.pai/events.sqlite`, `~/.pai/trails/events.jsonl`, `~/.pai/state/opencode-tracer-sequences.json` | No, event evidence only |

---

## How Memory Is Retrieved

### Explicit memory search

James can start a session with:

`context search: <topic>`

The assistant must run the ContextSearch flow before answering, planning, or editing. This searches PAI session registry/state and work artifacts for relevant prior context.

### SQLite context retrieval

The `pai-memory` CLI can retrieve reviewed durable memories:

```bash
bun ~/.pai/src/cli/pai-memory.ts search "query" --project PROJECT_ID
bun ~/.pai/src/cli/pai-memory.ts context --project PROJECT_ID --limit 5
bun ~/.pai/src/cli/pai-memory.ts review list
```

In the current OpenCode setup, this capability exists in code and tests, but there is no active plugin that automatically injects this context into every session.

### Review-gated distillation

Local distillation is run manually or by disabled-by-default Automation jobs:

```bash
bun ~/.pai/src/cli/pai-memory.ts distill --provider local --quiet
bun ~/.pai/src/cli/pai-memory.ts review pending
```

Runner scripts live at:

- `~/dotfiles/scripts/pai/run-memory-distill.sh`
- `~/dotfiles/scripts/pai/run-memory-review-pending.sh`

Automation registry entries exist for nightly distill and morning review reminders, but they are disabled until event capture has been smoke-tested or James explicitly approves enabling them.

`pai-dream run` remains an experimental direct path. Prefer `pai-memory distill` for normal use because it applies locks, debounce, watermarks, duplicate-replay handling, and review queue semantics.

---

## Known Gaps And Recommendations

1. **Wire `pai-memory context` into OpenCode startup or first-turn retrieval only after separate approval.** Use trust-gated accepted memories only, scoped by project ID when available.
2. **Add review UX for proposed memories.** `pai-memory review list|accept|reject|defer` exists; it needs a regular workflow or command surfaced to James.
3. **Update or split `THEHOOKSYSTEM.md`.** It is still primarily a OpenCode hook reference. Keep it as legacy reference or add an OpenCode plugin-system companion doc.
4. **Decide where substantive LEARN reflections are authored.** Current reflection plugin only writes idle markers; the model must write actual learning entries unless a separately approved distillation plugin is added.

Diary, reflection, or REM-style prose is not a memory promotion source. Proposed durable memory should come from canonical redacted events, then pass through the review queue.

Rollback path: remove `file://{env:HOME}/.config/opencode/plugins/pai-opencode-tracer` from `opencode.json`, keep the Automation memory jobs disabled, and review/reject any existing proposed memories rather than deleting them.

---

## Quick Reference

Check current runtime memory:

```bash
ls ~/.pai/memory
```

Check mode-router sessions:

```bash
cat ~/.pai/memory/STATE/mode-router.json
```

Check work artifacts:

```bash
ls ~/.pai/memory/WORK
```

Check reflections:

```bash
cat ~/.pai/memory/LEARNING/REFLECTIONS/algorithm-reflections.jsonl
```

Check reviewed durable memories:

```bash
bun ~/.pai/src/cli/pai-memory.ts context --limit 5
```

---

## Migration Notes

The historical PAI memory design lived under a prior runtime tree and relied on that runtime's transcript storage. That architecture is no longer the active OpenCode runtime path.

Historical repo paths may still exist as source-controlled compatibility assets. They are not active runtime reads.

The active runtime contract is:

`~/.pai/memory/...`

---

## Related Documentation

- Hook/plugin reference: `THEHOOKSYSTEM.md`
- System architecture: `PAISYSTEMARCHITECTURE.md`
- Context routing: `CONTEXT_ROUTING.md`
- OpenCode adapter design: `~/dotfiles/.pai/docs/opencode-adapter-tracer.md`
- Shared harness design: `~/dotfiles/.pai/docs/shared-harness-design.md`
