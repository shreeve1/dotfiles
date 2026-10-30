# verify-final: Jev in shadow mode

Date: 2026-10-30. Status: approved by James (data sharing to TypeSafe approved, no folder exclusions). Work type: Pi extension in `~/dotfiles`.
Sources: the 2026-10-29/30 sessions; `memory/docs/jev-verify-final-tests.md`; the tuning repo `~/jev-tune` (`results.tsv`, `checker.py`); `docs/adr/0015-end-of-turn-verify-hooks.md`.

## Why

verify-final's fact check runs on `cliproxy/glm-5.3-flash` through the z.ai GLM Coding Plan. The plan's 5-hour and weekly limits are shared with GLM 5.3, which James keeps as his fallback model, so every check uses up fallback capacity (James). The aim is to move as many checks as safely possible off GLM and onto Jev, TypeSafe's decision model (yes/no, choice or score answers only, about $0.042 per million input tokens).

Three tuning runs on past sessions (2026-10-30) reached the same ceiling: at a threshold that still sends 90% of GLM's catches to GLM, Jev could clear only about 1 clean answer in 8 on unseen cases. Past sessions cannot show more, because Jev only sees what the agent read, and about 4 in 10 of the files GLM cited have changed since. Shadow mode runs Jev on live checks, where files are current, and records GLM's verdict beside it, so later tuning uses real, fair cases (James chose this, option 1).

## Goals

- On every pi fact check, run a Jev gate beside GLM and record both results.
- Read the project's files as they are at check time, the way GLM can.
- Build a growing labelled set that a later tuning run (run 4, `~/jev-tune`) can use directly.
- Change nothing the agent or James sees.

## Non-goals

- Saving any GLM use in this version. Handing checks to Jev is a later design, gated on the shadow results.
- The work-done and recommendation checks. Fact check only.
- Claude Code, Codex, OpenCode, omp and durable-bot (James: durable-bot is a separate matter).
- Changing GLM's prompt, model, timing or delivery.

## Anti-goals

- A slower or less reliable GLM check. Jev runs alongside it and can never delay, block or alter it.
- Any message to the agent or notice to James from the Jev side.
- Secrets sent to TypeSafe or written to the log.
- A log that grows without bound.

## Decided

- Shadow only; GLM keeps deciding everything (James, option 1).
- Jev model pinned to `jev-1.14.0` so thresholds do not drift with `jev-latest` (as in the tuning runs).
- The gate is `~/jev-tune/checker.py` at its best kept version (run 1, `passed` 57/112): a claim question limited to file-checkable claims, a three-way verdict (`supported`, `contradicted`, `not_addressed`) per claim against picked evidence, and answer risk as a noisy-or over claims.
- Data sent to TypeSafe: answer sentences, excerpts of this session's tool results and of current project files, redacted with the tuning run's patterns. James approved this kind of data for the tuning work; this design asks him to approve it for every live pi check.

## Decided (my calls, open to override)

- **A separate script, `.agents/bin/jev-shadow` (Python, standard library only).** It ports `checker.py`'s logic almost unchanged, keeps `verify-final` untouched for the other harnesses, and deletes cleanly if the experiment ends.
- **Two risks per check.** The script computes risk from session evidence only, and risk from session evidence plus a project-folder search (ripgrep for the claim's terms, top 2 files, as tuning run 3). Logging both lets run 4 decide whether current files help in live use, without a second shadow period.
- **The extension is the only log writer.** It starts the script beside the GLM check, waits for both, and appends one row with GLM's verdict lines and the script's JSON. One row per check, so labels and Jev results cannot drift apart.
- **Interactive pi (TUI) only.** Headless `pi -p` exits right after its boundary check, so a background job would often be killed. `ponytail:` headless runs get no shadow row; add it at `agent_before_settle` if headless volume turns out to matter.
- **Credential:** `TYPESAFE_API_KEY` if set, else the `jev` entry Pi stores in `~/.pi/agent/auth.json` (`/login jev`). Read at run time, never logged. No key on a machine means the script exits quietly and logs `jev_no_key`; nothing to set up elsewhere.
- **On by default where a key exists.** `VERIFY_JEV_SHADOW=0` turns it off; `VERIFY_FINAL=0` turns off everything as today.
- **Log:** `~/.cache/verify-final-jev/YYYY-MM-DD.jsonl`, one file per day, files older than 60 days deleted at start-up. It holds the inputs Jev saw (redacted), so run 4 can replay new question wording without new sessions.
- **Timeout:** 120 s for the script; a timeout is logged, never retried.

## How it works

1. In the TUI `agent_settled` path, wherever the extension starts `runCheck` today, it also starts `jev-shadow` with JSON on stdin: `{cwd, sessionId, answer, record}`. `record` is this session's tool calls and results up to the answer, newest first, capped at 40,000 characters as in the tuning cases (`~/jev-tune/build_cases.py`). Tool calls in pi sessions are `toolCall` blocks with `name` and `arguments` (`memory/docs/pi-tool-call-blocks.md`).
2. The script splits the answer into sentences, asks Jev which are file-checkable claims, picks evidence per claim (session excerpts; and session plus search excerpts), asks the verdict question for each, and prints one JSON object: claim probabilities, per-claim verdict probabilities for both evidence sets, both risks, model, request count, input tokens and seconds.
3. The extension waits for GLM's result and the script's, then appends one row: time, session id, answer length and hash, GLM status and its `FALSE`/`UNSURE` lines, and the script's JSON (or its error status).
4. Nothing else changes: GLM's findings go to the agent exactly as today, whatever Jev said.

Statuses in the row: `jev_ok`, `jev_error`, `jev_timeout`, `jev_no_key`, `jev_skip` (no checkable claims). A clean GLM result that came from GLM's 24-hour cache is still logged, marked `glm_cached`.

## Afterwards: tuning run 4

After about two weeks (expected 300-400 rows at about 28 pi checks a day on aidev), `~/jev-tune` gains a case builder for the shadow log and runs the same autoagent loop, with `jev_ok` rows as cases and GLM's verdict as the label, and a held-out set of the most recent days. Handing any checks to Jev is a new design for James's approval, with his accuracy bar: the share of GLM's catches he accepts losing, still open (the tuning runs used 9 in 10 as a placeholder).

## Costs and limits

- About 15 to 30 Jev requests per check, 25,000 to 50,000 input tokens: under $2 a month at today's volume (estimate from the tuning runs' token counts).
- Runs only on machines with a Jev key; today that is aidev, where this session ran. Other machines log `jev_no_key`.
- The project-folder search is skipped when the working directory is the home folder (too broad), as in run 3.
- Disk: an estimated 1 MB a day of log, kept 60 days.

## Acceptance

- `tests/verify-final-jev-shadow.test.sh`: with a fake TypeSafe endpoint (an override URL for tests only), one check writes one row holding both GLM's lines and Jev's result; the agent receives exactly the follow-up it gets today; `VERIFY_JEV_SHADOW=0` writes no row and sends no request; no key means `jev_no_key` and no request; a slow fake endpoint does not delay GLM's follow-up; redaction removes a planted fake key from the request.
- One live run in a real TUI session on aidev writes a `jev_ok` row with both risks.
- `bash tests/run-all.sh` passes; ADR 0015 gets an addendum; `memory/docs/verify-final-logs.md` names the new log.

## Left to the builder

How the extension reads the session's tool results (within pi's documented extension API), the JSON field names, the test layout, and how the script's port of `checker.py` is structured.
