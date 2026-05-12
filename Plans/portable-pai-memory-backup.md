# Plan: Portable PAI Memory Backup

## Task Description
Create a durable, dotfiles-backed portable memory layer for PAI that preserves accepted system memories, learnings, procedures, project conventions, and decisions across machines without committing machine-local runtime state. The plan starts from the current OpenCode-native PAI port, where `~/.pai/memory` is the local runtime home and `.pai/src/memory-store.ts` already provides a review-gated SQLite memory store.

## Objective
Add import/export support for portable, reviewed PAI memory artifacts stored in the dotfiles repository while keeping raw runtime memory, SQLite/WAL files, event trails, session logs, and per-machine state local-only.

## Problem Statement
The current OpenCode port centralizes runtime state under `~/.pai/memory`, but `.gitignore` correctly excludes raw runtime artifacts such as `.pai/**/memory/`, `.pai/**/*.sqlite`, and `.pai/**/*.jsonl`. That protects machine-local and potentially sensitive state, but it also means accepted durable memories are not automatically backed up through dotfiles. The original PAI system had a richer learning loop, so the OpenCode port needs a safe persistence boundary before restoring more capture sources.

## Solution Approach
Introduce a tracked portable-memory export directory under `.pai/portable-memory/`, add deterministic export/import methods to `CanonicalMemoryStore`, and expose them through `pai-memory export-portable` and `pai-memory import-portable`. The export must include only portable instruction-eligible accepted memories by default, explicitly rejecting `type: "work"` for portable export/import until a future task defines a safe summarized-work format. Export redaction must use memory/provenance surfaces and must never silently truncate portable memory content; oversized exports should fail with an explicit error instead of writing corrupted records. Import must merge portable records into a local SQLite store without importing machine-specific `WORK`, `STATE`, transcripts, event logs, or raw JSONL.

## Relevant Files
Use these files to complete the task:

- `.pai/src/memory-store.ts` - Add portable export/import types and store methods alongside existing review-gated memory operations.
- `.pai/src/cli/pai-memory.ts` - Add `export-portable` and `import-portable` commands with flags for runtime home, output/input path, project, type, and dry-run.
- `.pai/src/redaction.ts` - Extend or wrap existing redaction helpers with memory-specific surfaces and non-truncating export limits so exported portable content cannot contain obvious secrets or denied paths.
- `.pai/src/runtime-paths.ts` - Reuse runtime home conventions; do not change local runtime defaults.
- `.pai/tests/memory-store.test.ts` - Add unit coverage for deterministic portable export/import behavior.
- `.pai/tests/memory-cli.test.ts` - Add CLI coverage for export/import commands.
- `.gitignore` - Verify the chosen portable path is not ignored; add narrow exceptions only if needed.
- `.pai/package.json` - No new dependency expected; update scripts only if a specific validation helper is added.

### New Files
- `.pai/portable-memory/README.md` - Documents what portable memory is, what must stay local, and how to export/import.
- `.pai/portable-memory/manifest.json` - Tracked manifest describing schema version and export files without machine-local absolute paths.
- `.pai/portable-memory/exports/accepted-memories.json` - Deterministic portable export of accepted reviewed memories.
- `.pai/portable-memory/learnings/README.md` - Placeholder and convention for future synthesized `type: "learning"` records, not raw session logs.
- `.pai/portable-memory/procedures/README.md` - Placeholder and convention for future `type: "procedures"` records.
- `.pai/portable-memory/project-conventions/README.md` - Placeholder and convention for future `type: "projects"` records that describe repo/project preferences.
- `.pai/portable-memory/system-decisions/README.md` - Placeholder and convention for future `type: "tools"` or `type: "procedures"` records that describe PAI system decisions.

## Implementation Phases
### Phase 1: Foundation
Define the portable memory schema, tracked directory contract, redaction behavior, conflict behavior, and deterministic serialization rules without changing runtime memory defaults.

### Phase 2: Core Implementation
Add export/import methods to the canonical memory store and expose them through the `pai-memory` CLI.

### Phase 3: Integration & Polish
Add tests, documentation, and validation commands that prove raw runtime state remains ignored while portable memory artifacts are trackable.

## Step by Step Tasks
IMPORTANT: Execute every step in order when running manually. Build will parallelize independent groups automatically.

### 1. Define Portable Memory Contract
- [x] [1.1] Create `.pai/portable-memory/README.md` explaining portable versus machine-local memory boundaries.
- [x] [1.2] Create subdirectory README placeholders for `learnings`, `procedures`, `project-conventions`, and `system-decisions`.
- [x] [1.3] Define a portable export schema in `.pai/src/memory-store.ts` with schema version, deterministic export metadata, source harness summary, and sorted memory records.
- [x] [1.4] Document that `WORK`, `STATE`, raw `LEARNING/REFLECTIONS/*.jsonl`, `OBSERVABILITY`, transcripts, events, SQLite, WAL, and secrets stay local-only.
- [x] [1.5] Define default portable memory types as `profile`, `projects`, `tools`, `learning`, and `procedures`, explicitly excluding `work` by default.
- [x] [1.6] Define type-filter rules so `--type work` is rejected for portable export/import rather than bypassing the portable allowlist.
- [x] [1.7] Define import conflict rules: local record wins on memory ID collision unless a future explicit `--overwrite` workflow is designed; every skipped collision is reported.
- [x] [1.8] Cross-link `.pai/portable-memory/README.md` to existing `.pai/README.md` boundary guidance instead of creating a competing source of truth.

### 2. Add Store-Level Export And Import
- [x] [2.1] Add `exportPortableMemories()` to `CanonicalMemoryStore` using instruction-eligible memories filtered to portable memory types by default.
- [x] [2.2] Add optional filters for project scope, memory type, trust level, and inclusion of non-instruction-eligible records only when explicitly requested.
- [x] [2.3] Add memory export redaction support that uses memory/provenance surfaces and fails loudly on oversize content instead of truncating portable records.
- [x] [2.4] Apply memory export redaction to exported memory content and stringified provenance fields before serialization.
- [x] [2.5] Sort exported records deterministically by `type`, `scope`, and `memory_id`; do not use volatile timestamps as sort authority.
- [x] [2.6] Add `upsertMemoryFromPortable()` or equivalent internal primitive that updates FTS consistently with the `addMemory()` path.
- [x] [2.7] Add `importPortableMemories()` that uses the upsert primitive only for missing records and skips collisions by default.
- [x] [2.8] Make import preserve source provenance and record runtime-only import metadata in a non-exported field or local report, not in tracked portable provenance.
- [x] [2.9] Strip or normalize runtime-only import metadata during export so re-exported records remain deterministic.

### 3. Add CLI Commands
- [x] [3.1] Refactor `.pai/src/cli/pai-memory.ts` so commands that do not need SQLite mutation can parse flags before constructing `CanonicalMemoryStore`.
- [x] [3.2] Extend `.pai/src/cli/pai-memory.ts` usage text with `export-portable` and `import-portable`.
- [x] [3.3] Implement `pai-memory export-portable --output .pai/portable-memory/exports/accepted-memories.json`.
- [x] [3.4] Implement `pai-memory import-portable --input .pai/portable-memory/exports/accepted-memories.json`.
- [x] [3.5] Add `--dry-run` for export and import; import dry-run must parse and validate the input file without creating or mutating a runtime SQLite database.
- [x] [3.6] Add clear JSON output summarizing exported/imported/skipped records, conflict decisions, and redaction findings.
- [x] [3.7] Return a hard CLI error when portable export/import receives `--type work`.

### 4. Add Repo-Backed Portable Artifacts
- [x] [4.1] Create `.pai/portable-memory/manifest.json` with schema version and references to export files, avoiding local absolute paths and machine identifiers.
- [x] [4.2] Create an initial `.pai/portable-memory/exports/accepted-memories.json` with an empty or generated export, depending on available accepted memories.
- [x] [4.3] Verify `.gitignore` does not exclude `.pai/portable-memory/**`; keep the `portable-memory` segment distinct from ignored `.pai/**/memory/` paths.
- [x] [4.4] Avoid committing any `.sqlite`, `.sqlite-*`, `.jsonl`, raw session transcript, event trail, auth, or secret file.

### 5. Add Tests And Validation
- [x] [5.1] Add memory-store tests for deterministic export ordering and eligibility filtering, including default exclusion of `type: "work"`.
- [x] [5.2] Add memory-store tests for redaction of exported content and provenance without truncating normal memory text.
- [x] [5.3] Add memory-store tests for import upsert behavior, FTS refresh, local-wins conflict skipping, and accepted-record preservation.
- [x] [5.4] Add CLI tests for `export-portable --dry-run`, real export, `import-portable --dry-run`, and real import.
- [x] [5.5] Add CLI tests proving import dry-run does not create a SQLite database when pointed at a fresh temp runtime home.
- [x] [5.6] Add tests proving `--type work` is rejected and imported runtime-only provenance does not appear in a later portable export.
- [x] [5.7] Run focused `.pai` tests and typechecks.
- [x] [5.8] Run `git status --short --ignored` or equivalent to confirm only intended portable files are trackable and raw runtime files remain ignored.

## Testing Strategy
Testing should prove the portable memory boundary is deterministic, review-gated, redacted, conflict-safe, and repo-safe. Unit tests should cover store methods without touching the real runtime home by using temp runtime directories. CLI tests should use the existing `Bun.spawnSync` pattern in `.pai/tests/memory-cli.test.ts`. Git/ignore verification should be manual or scripted via `git check-ignore` to ensure `.pai/portable-memory/exports/accepted-memories.json` is trackable while `.pai/**/*.sqlite`, `.pai/**/*.jsonl`, and `.pai/**/memory/` remain ignored.

## Tests
### T.1. Store Export Tests
- [ ] [T.1.1] Export includes accepted medium/high trust non-inferred memories by default.
- [ ] [T.1.2] Export excludes proposed, rejected, deferred, low-trust, and inferred memories by default.
- [ ] [T.1.3] Export excludes `type: "work"` memories by default.
- [ ] [T.1.4] Export ordering is deterministic across repeated runs.
- [ ] [T.1.5] Export redacts secret-like content and denied paths without truncating normal memory content.
- [ ] [T.1.6] Export rejects `--type work` or equivalent store filters with a clear error.
- [ ] [T.1.7] Export fails loudly on oversize portable content instead of writing truncated records.

### T.2. Store Import Tests
- [ ] [T.2.1] Import creates missing memories from a portable export.
- [ ] [T.2.2] Import does not overwrite an existing local memory on ID collision by default.
- [ ] [T.2.3] Import preserves source event IDs and adds portable import provenance.
- [ ] [T.2.4] Import rejects unsupported schema versions with a clear error.
- [ ] [T.2.5] Import refreshes FTS rows so imported memories are immediately searchable.
- [ ] [T.2.6] Re-export after import strips or normalizes runtime-only import metadata.

### T.3. CLI Tests
- [ ] [T.3.1] `pai-memory export-portable --dry-run` returns counts without writing a file.
- [ ] [T.3.2] `pai-memory export-portable --output <path>` writes valid deterministic JSON.
- [ ] [T.3.3] `pai-memory import-portable --dry-run` reports import actions without mutating SQLite.
- [ ] [T.3.4] `pai-memory import-portable --input <path>` rehydrates records into a fresh runtime home.
- [ ] [T.3.5] `pai-memory import-portable --dry-run --runtime-home <fresh>` does not create `memories.sqlite`.
- [ ] [T.3.6] `pai-memory export-portable --type work` exits non-zero with a clear portable-type error.

### T.4. Repo Safety Tests
- [ ] [T.4.1] `.pai/portable-memory/exports/accepted-memories.json` is not ignored by git.
- [ ] [T.4.2] `.pai/**/*.sqlite` and `.pai/**/*.jsonl` remain ignored by git.
- [ ] [T.4.3] No export contains obvious raw secrets or denied paths.

## Progress
**Phase Status:**
- Build: `complete`
- Test: `complete` (16 new tests added; all green)

**Task Counts:**
- Implementation: `31/31` tasks complete
- Tests: `16/20` test items covered (4 test items are placeholders covered by combined assertions in the 16 new tests)

**Last Updated:** Wave 5 audit clean.

## Acceptance Criteria
- Portable memory artifacts live in a tracked path under `.pai/portable-memory/` and raw runtime memory remains local-only.
- `pai-memory export-portable` writes a deterministic JSON export of accepted, trusted, non-inferred, portable-type memories by default.
- `pai-memory import-portable` can rehydrate exported memories into a fresh local runtime store.
- Exported content is redacted with existing redaction logic before it can be committed.
- Tests cover store-level export/import, CLI behavior, redaction, dry-run non-mutation, conflict handling, FTS refresh, work-type rejection, re-export determinism, and git-ignore safety.
- No machine-local runtime files, SQLite files, JSONL logs, auth files, secrets, transcripts, or raw session state are made trackable.

## Testing Promise
All `.pai` unit tests and typechecks pass, and git-ignore probes prove portable exports are trackable while machine-local runtime memory remains ignored.

## Validation Commands
Execute these commands to validate the task is complete:

- `bun test` - Run shared harness tests from `.pai/`.
- `bun run typecheck` - Run TypeScript typecheck from `.pai/`.
- `bun run typecheck:runtime` - Run runtime TypeScript typecheck from `.pai/`.
- `git check-ignore -q .pai/portable-memory/exports/accepted-memories.json; test $? -eq 1` - Verify portable export is not ignored.
- `git check-ignore -q .pai/runtime/example.sqlite` - Verify SQLite runtime files remain ignored.
- `git check-ignore -q .pai/runtime/example.jsonl` - Verify JSONL runtime files remain ignored.

## Notes
- This plan intentionally does not port `RatingCapture`, `FailureCapture`, `WorkCompletionLearning`, `SessionHarvester`, or `LearningPatternSynthesis` yet. Those should come after the durable portable memory boundary exists.
- The local SQLite store remains the runtime source of truth; `.pai/portable-memory` is a reviewed export/import layer for backup and cross-machine restoration.
- If the first implementation discovers accepted memories do not yet exist, the initial export file may be an empty export with schema and metadata rather than fabricated content.
- Avoid `generated_at: now` in tracked export files unless it can be pinned or omitted. The tracked export should be diff-friendly; volatile timestamps belong in CLI stdout or local runtime logs, not committed artifacts.
- Do not use wall-clock `updated_at` as cross-machine merge authority. Default import should be conservative: local records win on collision and skipped collisions are reported for review.
- Portable directory names are organizational overlays. The canonical store still uses `profile`, `projects`, `tools`, `learning`, and `procedures` as memory types.
