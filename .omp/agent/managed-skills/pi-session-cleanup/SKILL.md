---
name: pi-session-cleanup
description: "Clean up old Pi coding tool sessions in ~/.pi/agent/sessions/ (or symlinked equivalent). Use when the user asks to clean Pi sessions, free disk from coding-tool backlog, or asks why Pi is using N GB of space. Covers dry-run, pytest-tmp leak detection, safe deletion with overlap checks, and bookkeeping JSON pruning."
---

# Pi Coding Tool Session Cleanup

## Where sessions live

`~/dotfiles/.pi/agent/sessions/` (symlinked from `~/.pi/agent/sessions/`).
Already gitignored (`.pi/agent/.gitignore` excludes `sessions/` and `*-sessions*.json`).
This is a different tool from the OMP harness at `~/.omp/agent/sessions/` — never touch the latter from this skill.

## Layout

- Top level: project dirs named `--<path>--` (e.g. `--home-james-dotfiles--`, `--home-james-symphony--`).
- Inside: `<ISO>_<uuid>.jsonl` files. ISO is `YYYY-MM-DDTHH-MM-SS-mmmZ` (dashes not colons).
- Some sessions have subagent subdirs: `<session-uuid>/<hash>/run-N/`.
- One historical bug: 700+ dirs named `--tmp-pytest-of-james-pytest-N-test_...-binding-repo--` containing stub sessions (50–80 bytes, content like `{"type":"turn","content":"hello"}`). These come from a test harness writing into the real sessions dir instead of a tmp_path. Worth filing upstream.

## Bookkeeping files (in `~/dotfiles/.pi/agent/`)

- `cleon-sessions.json` — flat map `{project:sessionId: "absolute/path/to/<session>.jsonl"}`. ~40–100 entries, points at recent sessions.
- `cleon-sessions-registry.json` — nested `{sessions: {uuid: {piSessionFile, status, ...}}}`.
- Both are gitignored. Both must be pruned to match the disk state, or the tool will try to load stale paths.

## Safe procedure

1. **Dry-run first.** Walk all `.jsonl` files; classify by:
   - parent dir starts with `--tmp-pytest-of-james-` → pytest leak (delete)
   - filename matches `^\d{4}-\d{2}-\d{2}T` and date < cutoff → real old session (delete)
   - else (no date in name, usually subagent logs) → keep, or judge by mtime
   - Save the plan as JSON for review.
2. **Overlap checks before deleting:**
   - For every entry in `cleon-sessions.json` and `cleon-sessions-registry.json`, check if its `piSessionFile` is in the delete set. Compare absolute paths (bookkeeping files use absolute; dry-run plan may be relative — normalize).
   - Check `~/.omp/agent/agent.db` `threads.rollout_path` — OMP harness paths differ (`/home/james/.omp/...`), should never collide, but verify.
3. **Delete files**, then walk `topdown=False` and rmdir any now-empty dirs.
4. **Prune bookkeeping JSONs** — keep only entries whose `piSessionFile` still exists. Back up to `<name>.bak-<YYYYMMDD-HHMMSS>` before writing.
5. **Verify:** recount `*.jsonl`, recompute `du -sh`, confirm zero non-empty remaining project dirs that were entirely in the delete set.

## Expected magnitudes

User's actual cache (Aug 2026): 5,843 sessions, 1.63 GB, 879 project dirs. After pytest + >30d: 3,416 files, 935 MB, 29 project dirs. Sessions regrow ~150–500 per week of active use.

## Don'ts

- Never delete the OMP harness sessions (`/home/james/.omp/agent/sessions/`) from this skill.
- Never delete `cleon-sessions.json` outright — it tracks real session IDs the tool UI references.
- Don't trust mtime — the user's files have been moved around, so the filename ISO date is the truth.
- Don't use `sed`/regex on JSON files — load, mutate, dump with json module to preserve formatting.
