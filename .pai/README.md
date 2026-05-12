# Shared PAI Harness

This directory contains source-controlled bootstrap material for the shared PAI CLI harness.

Runtime state belongs in `~/.pai/`, not in this repository. Do not commit event databases, JSONL trails, transcripts, auth files, full memories, or local user context.

## Package Layout

- `src/` contains the shared TypeScript/Bun harness source.
- `src/cli/` contains command entry stubs for `pai-run`, `pai-memory`, `pai-dream`, and `pai-policy`.
- `config/pai.config.example.json` documents runtime paths, adapter enablement, and safe defaults.
- `tests/` contains scaffold checks for runtime path resolution and ignored runtime artifacts.

Run checks from this directory with:

```bash
bun test
```

Start with the design document:

- `docs/shared-harness-design.md`

## Capture Loop (Phase 6)

The capture loop turns harness events into memory *proposals* automatically. Acceptance is always human.

- `pai-memory distill` — stage proposals from recent events; advances a per-`(harness, provider, pai_session_id)` watermark under `<runtime-home>/state/distill-watermark.json`.
- `pai-memory review pending` — list open proposals, grouped by type, with watermark age and stale flags.
- `pai-memory review accept <id>` — accept a proposal; optionally refresh the tracked portable export when `PAI_AUTO_EXPORT_ON_ACCEPT=1`.

The distill engine debounces itself (default 60s, configurable via `PAI_DISTILL_DEBOUNCE_SECONDS`) and acquires a lock at `<runtime-home>/state/distill.lock` to prevent concurrent runs. Errors append to `<runtime-home>/logs/distill.log` (rotates at 1 MB). All of `state/`, `logs/`, and `*.lock` are machine-local and gitignored.

Stop-hook integrations in the claude/codex/opencode tracer templates dispatch `pai-memory distill --quiet` detached so harness exit is never coupled to distill completion. Subagents invoked via the Task tool inherit `--runtime-home` from the parent, so the parent's Stop hook covers subagent events; cross-runtime-home subagent merge is out of scope.

Environment variables:

- `PAI_AUTO_EXPORT_ON_ACCEPT=1` — refresh `accepted-memories.json` via atomic rename after each acceptance.
- `PAI_DISTILL_DEBOUNCE_SECONDS=N` — override the 60s default debounce window.
- `PAI_REVIEW_STALE_DAYS=N` — override the 14-day default for stale-flagging review proposals.
