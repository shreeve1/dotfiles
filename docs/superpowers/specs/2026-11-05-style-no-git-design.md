# Explicit no-Git style support

Approved by the operator in chat, 2026-11-05.

## Intent and approaches

Apply the style contract to Syncthing-managed ITAStack without restoring Git or mass formatting. Config-only adoption leaves style-check unusable; opting out loses the contract. The operator chose explicit no-Git support in both commands.

## Design

- `style-init --no-git <folder>` copies missing standard configs only, using owned-path matching. Preserve existing configs. `--check` retains read-only exit 0/3/4 semantics. No Git initialization, commits, baseline formatting or blame files.
- `style-check --no-git <folder> [files…]` checks safely selected files. `--fix` requires explicit regular filenames within the root. Reject directories, missing paths, symlinks and escaped paths before writes.
- Require an explicit existing root; reject Git workspaces in no-Git mode to preserve normal Git safeguards.
- Both commands share null-delimited selection. Default excluded directory names: `.git`, `node_modules`, `.venv`, `venv`, `__pycache__`, `.stversions`, `.cache`, `.ruff_cache`, `.pytest_cache`, `.mypy_cache`, `.superpowers`, `vendor`, `dist`, `build`, `tmp`, `artifacts`, `.sessions`, `.sync`, plus `.pi/fabric` runtime trees. Honor `.styleignore` globs too. Do not follow symlinks; support spaces and literal filename metacharacters.
- Small shared Bash helper; no new dependencies. Keep pinned tools; disable Biome VCS explicitly in no-Git mode. Markdown stays lint-only. Pi-lens stays disabled in ITAStack.

## Verification and adoption

Regression tests cover invalid roots, ownership, exclusions, safe fixes, config preservation and Git behavior. Exercise real copied Python/shell/Markdown/TS fixtures under /tmp without Git. Adopt missing ITAStack configs, run report-only checks. No worktree, branch switch, push, deployment or fleet rollout. Preserve concurrent work.
