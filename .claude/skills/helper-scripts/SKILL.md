---
name: helper-scripts
description: Set up repo-local agent helper scripts that emit compact context for Claude Code/Pi/OpenCode. Use when the user asks to reduce token usage during repo inspection, install AI helper scripts, bootstrap scripts/ai, create repo_summary.py/extract_imports.py/etc., or prepare a local repo for agent work.
---

# Helper Scripts

Install small repo-local helper scripts so agents can inspect a project through compact, repeatable summaries instead of repeatedly reading large files.

## Goal

Create or refresh this local repo surface:

```text
scripts/ai/
  context.sh
  repo_summary.py
  tree_compact.py
  list_recent_changes.py
  summarize_json.py
  extract_imports.py
  find_large_files.py
  scan_errors.py
  compact_logs.py
```

Then update local `CLAUDE.md` so Claude Code and Pi know to use these helpers before broad manual file inspection.

## Inputs

- Target repo: `$ARGUMENTS`, if supplied; otherwise current working directory.
- Script templates: relative to this skill at `templates/scripts/ai/`.

## Workflow

### 1. Locate target repo

1. If `$ARGUMENTS` names a path, use it. Otherwise use current directory.
2. Run `git rev-parse --show-toplevel` from that path.
3. If not a git repo, ask before proceeding. These scripts are most useful in repo roots.
4. Check existing `scripts/ai/` contents before changing anything.

### 2. Install helper scripts

Copy each file from this skill's `templates/scripts/ai/` into target repo `scripts/ai/`.

Rules:

- Create `scripts/ai/` if missing.
- If destination file is missing, create it.
- If destination exists and contains `# Generated from helper-scripts skill`, it may be overwritten after reading it.
- If destination exists without that marker, read it and ask before overwriting. Prefer preserving local custom tools.
- Mark `scripts/ai/context.sh` executable.

### 3. Update local agent instructions

Update target repo `CLAUDE.md`:

- If missing, create it only when no global helper-script guidance applies.
- If present, read it first and append only if no equivalent helper-script guidance exists.
- If a global `~/.claude/CLAUDE.md` already carries the "Agent Helper Scripts" guidance, skip the local copy — global covers it.
- When local guidance is needed, add this section:

```markdown
## Agent Helper Scripts

Before broad repo inspection, prefer compact helper scripts when present:

- `scripts/ai/context.sh` — one-shot repo context: structure, manifests, git state, errors, large files
- `scripts/ai/repo_summary.py` — language/tooling/entrypoint summary
- `scripts/ai/tree_compact.py` — filtered tree without dependency/cache noise
- `scripts/ai/list_recent_changes.py` — status, recent commits, diff summary
- `scripts/ai/extract_imports.py` — compact import/dependency scan
- `scripts/ai/find_large_files.py` — files to avoid reading whole
- `scripts/ai/summarize_json.py` — compact package/config JSON summary
- `scripts/ai/scan_errors.py` / `compact_logs.py` — error-focused log views

Use these first to reduce token usage, then read only the specific files needed. Pi uses this Claude setup too, so keep this guidance in `CLAUDE.md` rather than harness-specific config.
```

### 4. Verify

Run from target repo:

```bash
python3 -m py_compile scripts/ai/*.py
scripts/ai/context.sh --help
scripts/ai/context.sh | head -200
```

If Python 3 is missing, report that verification is blocked and list exact command to run later.

### 5. Report

Report:

- Installed/updated files.
- Whether `CLAUDE.md` was created or updated.
- Verification commands and results.
- Any existing custom scripts preserved.

### 6. Tune skip filters for the repo (optional)

The scripts prune common noise dirs (`node_modules`, `.git`, `dist`, `.venv`, etc.). If the target repo keeps large backup/archive/snapshot dirs (e.g. `*-pre-reset-*`, `archive/`, `backups/`), add them to the `SKIP`/`SKIP_DIRS` sets in `repo_summary.py`, `tree_compact.py`, `extract_imports.py`, and `find_large_files.py` so they don't dominate the summary.

## Notes on output safety

- `scan_errors.py`, `compact_logs.py`, and `summarize_json.py` redact common secret shapes (AWS/Stripe/GitHub/Slack keys, JWTs, `token=`/`password=` pairs) before printing. Redaction is best-effort, not a guarantee — never paste raw log/config files into agent context expecting full coverage.
- The redaction pattern list (`SECRET_RES`) is duplicated in each of those three scripts because the scripts are standalone (copied individually, no shared module). To extend coverage, update every copy.
- `summarize_json.py` falls back to a JSONC parse (strips `//` and `/* */` comments and trailing commas) so files like `tsconfig.json` summarize instead of erroring.

## Operating Rule for Agents

When these scripts exist, use them before recursive manual inspection. Script output is a map, not source of truth: verify claims by reading targeted files before editing.
