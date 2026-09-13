---
id: 057
title: tralph --jobs N entry point (default 1 = today's behavior)
status: done
blocked_by: [056]
parent: null
created: 2026-09-10
updated: 2026-09-13
actor: ralph

## What to build

The user-facing switch. `tralph` (the `.zshrc` function fixed in #051)
gains `--jobs N`: N ≥ 2 routes into the board-mode orchestrator (kanban
graph source → waves → lanes → landing queue → ff-only finish) against the
current repo's `.kanban`. `--jobs 1` (default, no flag) preserves the
existing sequential ralph-loop.sh path byte-for-byte — existing flags
(`--review-loop`, `--agent-cmd`, adapter args) keep working. The sentinel
contract (`RALPH_RESULT` lines) is unchanged in both paths so
tralph-shepherd keeps functioning against the sequential path.

## Acceptance criteria

- [x] `tralph` with no flags behaves exactly as before (sequential driver)
- [x] `tralph --jobs 2` runs a 2-ticket board end-to-end: both lanes in one
      wave, landed, main fast-forwarded, run-report written
- [x] Existing tralph flags pass through unchanged in sequential mode
- [x] `--jobs` validation rejects non-positive/non-numeric values

## Verification

`zsh -ic 'tralph --help' | grep -q jobs` and `bash tests/tralph-e2e.test.sh`

## Implementation Notes

Extended the `tralph` zsh function in `.zshrc` with a front-end arg parser:
- `--help` heredoc mentions `--jobs` (satisfies `zsh -ic 'tralph --help' | grep -q jobs`)
- `--jobs N` validation: rejects missing value, non-numeric, zero, negative
- `--jobs 1` (default): strips flag and delegates remaining args to `ralph-loop.sh` unchanged
- `--jobs N≥2` (board mode): extracts `--verify`/`--agent-cmd` from args, resolves
  `gralph` via `$DOTFILES_DIR` or `$HOME/dotfiles` fallback then `$PATH`,
  runs plan (`gralph 0 --board .kanban --dry-run`) then execute
  (`gralph 0 --board .kanban --jobs N --verify V --agent-cmd CMD`)

Fixed a zsh 1-indexing bug (loop started at `i=0`; zsh arrays are 1-indexed)
in the board-mode option-extraction loop — fix commit 5aa13745.

New test: `tests/tralph-e2e.test.sh` (force-added past `.gitignore`) covering
all 4 acceptance criteria.
