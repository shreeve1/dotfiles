---
title: verify-final Logs and How to Measure It
summary: Every verify-final check appends to ~/.cache/verify-final.log per machine; pi logs as "pi" since 2026-10-28, other --check callers as "manual".
type: doc
status: promoted
created: 2026-10-28
updated: 2026-10-29
topics: []
---

## Active memory

- Each machine logs every grounding check to its own `~/.cache/verify-final.log` (written by `.agents/bin/verify-final`). Line: `<time> <harness> <status> <secs>s <detail> [sid=] len=<answer chars>`. Statuses: `ok` (with `false= unsure= ungrounded= verified=` counts), `no_claims`, `error`, `skip_short`, `skip_correction_pass`, `ledger_missing`.
- The harness column: `--check` runs log as `manual` unless `--harness NAME` is passed. The pi extension passes `--harness pi` from 2026-10-28 (earlier pi rows say `manual`). The OpenCode plugin and durable-bot (`~/durable-bot`) still log as `manual`. Claude Code, Codex and omp are labelled `claude`, `codex`, `omp`.
- On aidev, 211 `manual` rows with `len=22396` (2026-10-18 to 10-27) are one answer re-checked, caller unknown. Not durable-bot (its findings file never has more than 2 entries per answer), not a pi or OpenCode session (no answer of that length). The pi-durable dpi-backend verifier hook also calls `--check`. A clean repeat is now answered from `~/.cache/verify-final` and logged `cached`.
- In pi, a turn that edited, wrote or ran a command also gets a completion check (`verify-final --done`), logged `done_clean`, `done_missing`, `done_error`, `done_cached` or `done_skip_short`. Its catch rate is `done_missing` against all `done_` rows that reached the model.
- Checks start at 500 characters (script, pi extension and OpenCode plugin) since 2026-10-28.
- The script canonicalizes checker verdicts to uppercase `VALUE | ...`; pi also checks short answers that name an existing `.kanban/grilling/<name>.md` ledger. In headless pi, cleanup continuation runs before grounding, so the post-cleanup answer is checked.
- Pulling the logs: aidev local; itan8n `ssh itan8n`; wrk `ssh -p 2222 james@100.95.235.60`; surftop (Windows) `%USERPROFILE%\.cache\verify-final.log`, only when it is online.
- Corrections the agent actually received in pi are in `~/.pi/agent/sessions/**.jsonl` as a user message starting "An independent fact-check of your final answer". Cleanup-gate holds contain "Commit held once by the post-work-cleanup gate".
- Checker model: `cliproxy/glm-5.3-flash` since 2026-10-29 (script default; `VERIFY_FINAL_MODEL` overrides), served by the z.ai GLM Coding Plan quota instead of per-call billing. Rows before then used `deepseek-v4.1-flash` through cliproxy's OpenRouter key, about $0.02 per check ($27.29 over 1,252 checks in the week to 2026-10-28). On 10 past answers both found the same problems in 8; DeepSeek flagged one extra claim on another and timed out on a third, and neither reproduced 3 of the 6 original catches (those files have likely changed since). GLM averaged about 53 s per check against DeepSeek's 48 s, and DeepSeek timed out once. Cost fields in pi session files are list prices; Claude and Codex calls go through cliproxy subscription logins and may cost nothing extra.

## Related

- `memory/docs/pi-tool-call-blocks.md` - the message shape to parse when reading pi session files for these counts.
