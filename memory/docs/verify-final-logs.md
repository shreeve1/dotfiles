---
title: verify-final Logs and How to Measure It
summary: Every verify-final check appends to ~/.cache/verify-final.log per machine; pi and OpenCode runs log as harness "manual" because both call --check.
type: doc
status: promoted
created: 2026-10-28
updated: 2026-10-28
topics: []
---

## Active memory

- Each machine logs every grounding check to its own `~/.cache/verify-final.log` (written by `.agents/bin/verify-final`). Line: `<time> <harness> <status> <secs>s <detail> [sid=] len=<answer chars>`. Statuses: `ok` (with `false= unsure= ungrounded= verified=` counts), `no_claims`, `error`, `skip_short`, `skip_correction_pass`, `ledger_missing`.
- The harness column is `manual` for the pi extension (`.pi/agent/extensions/verify-final.ts`) and the OpenCode plugin, because both call `verify-final --check -`, and `--check` forces `manual`. Only Claude Code (`claude`), Codex (`codex`) and omp (`omp`) are labelled. pi and OpenCode runs cannot be told apart in the log.
- Pulling the logs: aidev local; itan8n `ssh itan8n`; wrk `ssh -p 2222 james@100.95.235.60`; surftop (Windows) `%USERPROFILE%\.cache\verify-final.log`, only when it is online.
- Corrections the agent actually received in pi are in `~/.pi/agent/sessions/**.jsonl` as a user message starting "An independent fact-check of your final answer". Cleanup-gate holds contain "Commit held once by the post-work-cleanup gate".
- Cost: the checker (`deepseek-v4.1-flash`) is billed through cliproxy's OpenRouter key, which other services share, so its spend is an upper bound. On 2026-10-28 it was about $0.02 per check ($27.29 over 1,252 checks in a week). Cost fields in pi session files are list prices; Claude and Codex calls go through cliproxy subscription logins and may cost nothing extra.

## Related

- `memory/docs/pi-tool-call-blocks.md` - the message shape to parse when reading pi session files for these counts.
