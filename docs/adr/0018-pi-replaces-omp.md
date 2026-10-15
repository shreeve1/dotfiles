# 0018 — pi replaces omp everywhere

**Status:** Accepted (2026-10-15). Supersedes 0008. Supersedes 0006 and 0012
once their phases below land. Amends 0014.

## Context

Two forks of the same coding agent were installed side by side: `pi`
(`@earendil-works/pi-coding-agent`, 1.2.0 on all three machines) and `omp`
(oh-my-pi; 18.3.0 to 18.7.0 depending on the machine). Ralph workers, the
meeting-assistant Ask agent, the agent-orchestr panel, pstack skills, omp
Fusion and several docs depended on omp. pi was a headless helper only (ADR
0014). Keeping both meant two auth stores, two session layouts, two extension
trees and two sets of version drift. The user chose to consolidate on pi and
port every omp consumer.

Verified pi behaviour that the port relies on (2026-10-15):

- `pi -p '/skill:<name> …'` loads the skill in print mode, including skills
  with `disable-model-invocation: true`. Prompts can also name the
  `SKILL.md` path directly, which is what Ralph does.
- `pi -p <path>` with a bare path (no `@`) treats the path as message text.
  The model then reads the file, so `gralph`'s `"$agent_cmd $prompt_file"`
  works unchanged.
- pi's idle TUI footer (`0.0%/1.0M (auto)`) already matches
  `ralph-loop.sh`'s readiness regex.
- The tmux config sets `extended-keys on` with `csi-u`. Under that setting
  `send-keys C-m` reaches pi as Ctrl+M, which does not submit; omp accepted
  it. `ralph-loop.sh` now sends `Enter`.
- pi RPC (`--mode rpc`) reports completion with `agent_end` and
  `agent_settled`, and acknowledges a prompt with a
  `response{command:"prompt",data.disposition}`. omp's `prompt_result` and
  `session_settled` frames do not exist in pi.

## Decision

Port by phase. Commit each phase separately and smoke-test it on omarchy
before pulling to aidev and itan8n:

1. **Ralph/tralph.** `ralph-loop.sh` uses `pi --no-extensions [--model M]` in
   tmux workers and adds a `pi` non-interactive adapter (`pi --no-extensions
   --no-session -p`). The `omp` adapter name now exits with an error. Worker
   prompts name skills by `SKILL.md` path instead of `skill://`. In board
   mode, `tralph` passes `pi --no-extensions --model M --no-session -p` to
   gralph. The `tralph-shepherd` and `ralph` skills drop the omp-only
   tooling (`task`, hub, hashline `[PATH#TAG]` edits).
2. **Docs and skills.** pstack, browser-cdp, antislop, kanban, the hermes
   independent-reviewer, CONTEXT.md and README stop naming omp.
3. **`.omp/agent` assets.** Reviewer personas, pstack agents and the
   verify-final and session-log extensions move to pi. Fusion and
   moshi-hooks already have pi copies.
4. **meeting-assistant.** The Ask agent moves to pi RPC framing.
5. **agent-orchestr.** The panel reads pi sessions.
6. **Removal.** Drop the omp section from `install.sh`, the `.gitignore`
   block and `omarchy/defaults/agent`. Uninstall the binary on every
   machine. Before uninstalling, tarball `~/.omp` outside the repo. Never
   delete omp session history.

## Consequences

- ADR 0014 no longer holds in full: pi is now the interactive agent too. Its
  extension-exclusion mechanics still apply to each extension that stays
  excluded.
- Each phase is revertible on its own until phase 6. Until then a Ralph
  worker can still run omp explicitly with `--agent-cmd 'omp …'` or
  `RALPH_AGENT_CMD`.
- `ralph-loop.service` PATH now lists every per-machine pi launcher location
  instead of `~/.bun/bin`.
