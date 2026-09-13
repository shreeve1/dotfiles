---
id: 057
title: tralph --jobs N entry point (default 1 = today's behavior)
status: in-progress
blocked_by: [056]
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

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

- [ ] `tralph` with no flags behaves exactly as before (sequential driver)
- [ ] `tralph --jobs 2` runs a 2-ticket board end-to-end: both lanes in one
      wave, landed, main fast-forwarded, run-report written
- [ ] Existing tralph flags pass through unchanged in sequential mode
- [ ] `--jobs` validation rejects non-positive/non-numeric values

## Verification

`zsh -ic 'tralph --help' | grep -q jobs` and `bash tests/tralph-e2e.test.sh`
