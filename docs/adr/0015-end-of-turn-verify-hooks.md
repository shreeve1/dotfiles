# 0015 — Final answers are fact-checked by end-of-turn hooks in all three harnesses

**Status:** Accepted (2026-10-09)

## Context

The grounding check (ADR 0001) only ran where an agent chose to run it, or in
Pi's `gap-review` extension as a background audit whose findings the agent never
saw. Pi is now helper-only (ADR 0014), and day-to-day work happens in Claude
Code, Codex and omp.

## Decision

- One checker, `.agents/bin/verify-final`, reads a Stop-hook event
  (`last_assistant_message`, `cwd`, `stop_hook_active`) and runs the read-only
  `pi -p` checker from `_shared/verify-claims.md` on the final answer.
- A FALSE claim returns `{"decision":"block","reason":…}`: the agent gets the
  findings and corrects itself (a **gate**, not an audit). UNSURE claims and
  checker failures only produce a warning; the hook never blocks when the check
  itself fails.
- Adapters: Claude Code and Codex `Stop` hooks, installed into the
  machine-local `~/.claude/settings.json` and `~/.codex/hooks.json` by
  `.agents/bin/verify-final-install` (run from `install.sh`, idempotent,
  `--remove` reverts); omp `agent_end` extension
  `.omp/agent/extensions/verify-final.ts`.
- Scope: every final answer of 200+ characters in the main interactive
  session. One correction pass per turn (`stop_hook_active`). Kill switch
  `VERIFY_FINAL=0`. Every run is logged to `~/.cache/verify-final.log`.

## Consequences

- The correction appears after the original answer has streamed; nothing is
  buffered or hidden.
- Each answer costs one extra checker run (about 6 s in testing). Headless
  `claude -p` / `codex exec` runs driven by other tools are also checked unless
  `VERIFY_FINAL=0`.
- Codex does not run a hook until you trust it once (`/hooks`).
- omp's `-p` mode exits before the correction turn runs, so the extension acts
  only in the interactive TUI (or `VERIFY_FINAL_HEADLESS=1`, which logs but
  cannot complete the correction).
- Other tools that rewrite hook entries in the Claude/Codex configs may drop
  the hook; re-run the installer if it disappears.
- The grill skills no longer run their own per-turn check; the hook covers
  each turn's final message. `grill-with-docs` still runs the independent
  verify once on a brainstorm intent doc.
