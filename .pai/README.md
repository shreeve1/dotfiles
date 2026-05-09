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
