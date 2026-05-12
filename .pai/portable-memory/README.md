# Portable PAI Memory

This directory is the **tracked, dotfiles-backed** layer for PAI memory. It holds reviewed, durable knowledge that should travel across machines: project conventions, system decisions, accepted procedures, synthesized learnings, and durable profile facts.

For the broader source-controlled boundary, see [`../README.md`](../README.md). This file is the authoritative description of the portable export/import contract; do not duplicate it elsewhere.

## What lives here (trackable in git)

- `manifest.json` — schema version + list of export files (no absolute paths or machine identifiers).
- `exports/accepted-memories.json` — deterministic portable export of accepted, trusted, non-inferred memories.
- `learnings/`, `procedures/`, `project-conventions/`, `system-decisions/` — organizational overlays for human review. The canonical store still uses memory types `profile`, `projects`, `tools`, `learning`, `procedures`.

## What stays local-only (must NOT be committed)

The following machine-local runtime state lives under `~/.pai/` and is excluded by the repository's `.gitignore`:

- `~/.pai/memory/*.sqlite`, `*.sqlite-*`, WAL files — the live memory database.
- `~/.pai/memory/`, `~/.pai/MEMORY/` — raw runtime memory trees.
- `~/.pai/events/`, `~/.pai/transcripts/`, `~/.pai/trails/` — event trails and session transcripts.
- `~/.pai/**/*.jsonl` — raw event logs (including `LEARNING/REFLECTIONS/*.jsonl`).
- `~/.pai/auth/`, `~/.pai/**/auth.json`, `~/.pai/**/secrets.*` — credentials.
- `~/.pai/STATE/`, `~/.pai/WORK/`, `~/.pai/OBSERVABILITY/` — machine-local working state.

## Portable memory types

Default portable export/import operates on these memory types:

- `profile`
- `projects`
- `tools`
- `learning`
- `procedures`

`work` is **explicitly excluded by default** from portable export and import. The CLI returns a hard error when `--type work` is passed to `export-portable` or `import-portable` — a future task may define a summarized portable shape for work memories, but until then they remain local-only.

## Eligibility filter (defaults)

Default portable export includes only records that satisfy ALL of:

- `review_status = "accepted"`
- `trust_level IN ("medium", "high")`
- `assertion_type != "inferred"`
- `type` is in the portable-types allowlist above

Filters for project scope, memory type, and trust level can narrow this further. Including non-instruction-eligible records requires an explicit override flag.

## Conflict policy on import

Default import is **local-wins**: on `memory_id` collision, the existing local record is preserved and the incoming record is skipped. Every skipped collision is reported in the CLI output for review. Wall-clock `updated_at` is not used as cross-machine merge authority.

A future explicit `--overwrite` workflow may be added if it can be designed safely.

## Export determinism

Exported records are sorted by `(type, scope, memory_id)`. Volatile timestamps such as `generated_at: now` are not written into committed export files — they belong in CLI stdout or local runtime logs, not in diff-tracked artifacts. Re-exporting after import strips or normalizes runtime-only import metadata so the diff stays clean.

## Redaction

Exports run through memory-specific redaction (secret patterns, denylisted credential paths) before serialization. **Portable exports never silently truncate memory content** — when content exceeds the safe portable size budget, the export fails loudly so the operator can investigate, rather than committing corrupted records.

## Workflow

Export from this machine:

```bash
bun run src/cli/pai-memory.ts export-portable \
  --output .pai/portable-memory/exports/accepted-memories.json
```

Import onto another machine (after pulling dotfiles):

```bash
bun run src/cli/pai-memory.ts import-portable \
  --input .pai/portable-memory/exports/accepted-memories.json
```

Both commands accept `--dry-run` to validate without writing. Import dry-run does **not** create a SQLite database when pointed at a fresh runtime home.

## Capture Loop Integration

The Phase 6 capture loop produces *proposals*, never auto-accepts. After acceptance, set `PAI_AUTO_EXPORT_ON_ACCEPT=1` to have `pai-memory review accept` refresh this directory automatically via atomic rename. See `.pai/README.md` for distill/review/auto-export details.
