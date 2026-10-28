---
title: verify-final Logs and How to Measure It
summary: Every verify-final check appends to ~/.cache/verify-final.log per machine; pi logs as "pi" since 2026-10-28, OpenCode and durable-bot still as "manual".
type: doc
status: promoted
created: 2026-10-28
updated: 2026-10-28
topics: []
---

## Active memory

- Each machine logs every grounding check to its own `~/.cache/verify-final.log` (written by `.agents/bin/verify-final`). Line: `<time> <harness> <status> <secs>s <detail> [sid=] len=<answer chars>`. Statuses: `ok` (with `false= unsure= ungrounded= verified=` counts), `no_claims`, `error`, `skip_short`, `skip_correction_pass`, `ledger_missing`.
- The harness column: `--check` runs log as `manual` unless `--harness NAME` is passed. The pi extension passes `--harness pi` from 2026-10-28 (earlier pi rows say `manual`). The OpenCode plugin and durable-bot (`~/durable-bot`) still log as `manual`. Claude Code, Codex and omp are labelled `claude`, `codex`, `omp`.
- On aidev, `manual` rows with `len=22396` (211 of them, 2026-10-18 to 10-27) are durable-bot re-checking one long answer, not pi.
- Pulling the logs: aidev local; itan8n `ssh itan8n`; wrk `ssh -p 2222 james@100.95.235.60`; surftop (Windows) `%USERPROFILE%\.cache\verify-final.log`, only when it is online.
- Corrections the agent actually received in pi are in `~/.pi/agent/sessions/**.jsonl` as a user message starting "An independent fact-check of your final answer". Cleanup-gate holds contain "Commit held once by the post-work-cleanup gate".
- Cost: the checker (`deepseek-v4.1-flash`) is billed through cliproxy's OpenRouter key, which other services share, so its spend is an upper bound. On 2026-10-28 it was about $0.02 per check ($27.29 over 1,252 checks in a week). Cost fields in pi session files are list prices; Claude and Codex calls go through cliproxy subscription logins and may cost nothing extra.

## Related

- `memory/docs/pi-tool-call-blocks.md` - the message shape to parse when reading pi session files for these counts.
