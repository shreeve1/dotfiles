# Migrate Ralph loop workers from pi to omp

Date: 2026-08-22 · Status: executed in 0dad274 · Precedes: one conventional commit `refactor(ralph): migrate loop workers from pi to omp`

## Decisions (evidence-settled 2026-08-22; shape + auth pending user approval)

1. **In-place adapter rename `pi` → `omp`** (recommended shape). `run_pi_adapter` becomes `run_omp_adapter`; command construction swaps the binary. No parallel adapters (clean cutover), no `--agent-cmd`-only hack (it cannot cover the one-shot adapter).
2. **Skill delivery via omp default discovery** — omp's `claude` skill provider (priority 80, `skills.enableClaudeUser` default `true`, no `skills:` block in `.omp/agent/config.yml`) discovers `~/.claude/skills/*/SKILL.md`. `ralph` and `implement` both have valid `name:`+`description:` frontmatter, so omp discovers both with zero `--skill` flags and zero config.yml edits. Both carry `disable-model-invocation: true` → hidden from the system-prompt listing but reachable via `skill://<name>` (omp://skills.md) → the prompt must direct the read explicitly.
3. **Prompt form**: a leading `/skill:implement` is INERT in omp `-p` print mode (falls through as literal text — omp://slash-command-internals.md §4-5, §7) → replace with a unified `Read skill://implement and follow it.` prefix that works in both print and interactive modes (one code path).
4. **Worker isolation**: `--no-extensions` on every omp worker invocation (extensions load even in print mode; `PI_SUBAGENT_CHILD=1` has no omp subprocess equivalent — fusion's `OMP_FUSION_ORCHESTRATOR_SID` is in-process only).
5. **Model unchanged**: `minimax/MiniMax-M3` is omp's built-in catalog id (config.yml modelRoles already use it). Auth = `MINIMAX_API_KEY` env (interactive verified by live probe returning PONG); the systemd path has no key → settled on `EnvironmentFile=-%h/.config/ralph-loop.env` (a machine-local 0600 file); omp has no API-key login and auth-broker migrate only uploads to an already-configured broker, so agent.db seeding is not available here (both probed).
6. **Positional bridge UNCHANGED** — 24/24; no INNER_ARGS or header edits (ADAPTER is arg data, not contract structure).
7. **stdin guard**: append `< /dev/null` to the one-shot omp invocation (probe evidence: `-p` with non-TTY never-EOF stdin switches to piped-prompt read and hangs).

All line anchors are PRE-EDIT (commit e09c287). Re-locate by quoted text if they shift.

## A. ralph-loop.sh — outer script

- `:46` AGENT_PROMPT default: `Follow the loaded Ralph skill/protocol.` → `Read skill://ralph and follow the Ralph skill/protocol.`
- `:65` usage `--agent-cmd` line: `default: Pi with its configured default model` → `default: omp with RALPH_MODEL (minimax/MiniMax-M3)`
- `:77` usage ADAPTER line: `tmux|pi` → `tmux|omp`
- `:199-204` comment above USE_IMPLEMENT_SKILL: rewrite for omp — skill visibility now comes from omp's `~/.claude/skills` discovery instead of `--skill` delivery; keep the conservative rationale (only prefix the prompt when we control the worker command, since a user-supplied command may not be omp and would not resolve `skill://` URLs).
- `:207` `[[ "$ADAPTER" == "pi" ]]` → `"omp"`
- `:214-225` AGENT_CMD build (tmux default): replace the `pi --skill …` construction with `omp --no-extensions` plus `--model $model_q` when RALPH_MODEL is set (no skill args — discovery delivers skills).
- `:227-229` prompt prefix: `AGENT_PROMPT="/skill:implement $AGENT_PROMPT"` → `AGENT_PROMPT="Read skill://implement and follow it. $AGENT_PROMPT"`; extend the skip-guard so the prefix is also skipped when AGENT_PROMPT already starts with `Read skill://implement` (keep the existing `/skill:*` skip for legacy caller input).
- `:230-237` adapter case list: `pi | tmux)` → `omp | tmux)`; error text `(expected pi or tmux)` → `(expected omp or tmux)`
- `:244-247` `command -v pi` guard → `command -v omp`; error text `pi not found in PATH` → `omp not found in PATH`
- `:339-347` SHARED_PROMPT_REMINDER, BOTH variants: `Follow the Ralph skill/protocol` → `Read the Ralph skill via skill://ralph and follow it` (keep everything else in each string unchanged)

## B. ralph-loop.sh — inner LOOP_SCRIPT

- `run_pi_adapter` → `run_omp_adapter` (`:599-625`): delete `skill_args`; command becomes `omp --no-extensions --no-session [--model "$RALPH_MODEL"] -p "$full_prompt"` (keep the existing model-less branch shape); drop the `PI_SUBAGENT_CHILD=1 ` env prefix; append `< /dev/null` to the invocation; `:620` log text `Pi exited 0 but RALPH_RESULT sentinel indicates failure` → `Omp exited 0 but …`.
- Update the caller(s) of `run_pi_adapter` in the main loop (grep-locate; expect one call site in the adapter dispatch).
- tmux adapter branch: remove its `PI_SUBAGENT_CHILD=1` env prefix too (RepoPiRefs confirmed both branches prefix it; grep-locate).
- Readiness regex `:640` (`wait_for_agent_ready`): UNCHANGED unless the §G.7 marker check shows zero current markers match a real omp TUI pane — then add the minimal omp markers observed.

## C. ralph/SKILL.md

- `:25-26` mode list: `pi — fresh non-interactive Pi turn per issue` → `omp — fresh non-interactive omp turn per issue`
- `:31` `normal tmux, default Pi agent (uses minimax/MiniMax-M3)` → `default omp agent (uses minimax/MiniMax-M3)`
- `:35` example: `tralph --agent-cmd 'pi --model minimax/MiniMax-M3' tmux` → `tralph --agent-cmd 'omp --model minimax/MiniMax-M3' tmux  # explicit model override`
- `:36` example: `tralph pi` → `tralph omp` (comment `# Pi non-interactive adapter` → `# omp non-interactive adapter`)
- `:56-58` stall section: `Pi workers sometimes auto-compact` → `Workers sometimes auto-compact` (rest of section unchanged — mechanism is adapter-agnostic)
- `:300-310` §4 spawn examples: `pi --no-session -p "$(cat reviewer-prompt.txt)"` → `omp --no-extensions --no-session -p "$(cat reviewer-prompt.txt)"`; `cd '$PWD' && exec pi` → `cd '$PWD' && exec omp`; comment `# Pi non-interactive reviewer` → `# omp non-interactive reviewer`
- LEAVE every `.pi-lens/` exclusion rule as-is (legacy repos may still carry the dir; flagged as optional future cleanup, not this change)

## D. systemd unit `.config/systemd/user/ralph-loop.service` (repo-tracked)

- `:12` PATH: prepend `/home/james/.bun/bin` (omp binary location — probe B verified it resolves there)
- `:10-11` comment: `the worker \`pi\` binary resolves` → `the worker \`omp\` binary resolves`
- NO API-key Environment line — auth is the machine-local login in §E
- Add `EnvironmentFile=-%h/.config/ralph-loop.env` (dash prefix = optional, unit still boots where the file is absent); the file is machine-local and NOT in the commit.
- After editing: `systemctl --user daemon-reload` (no live supervisor today; stale-load risk nil)

## E. Machine-local setup (NOT in the commit)

1. Create `~/.config/ralph-loop.env` (mode 0600) containing one line `MINIMAX_API_KEY=<value from ~/.zshrc.secrets>`. (Rejected empirically: omp `login` is OAuth-only for subscription providers; `omp auth-broker migrate --from-local --include-env` fails without OMP_AUTH_BROKER_URL — it uploads to a broker, it does not seed local agent.db.)
2. Verify with the clean-env probe (must exit 0, print PONG):
   `env -i HOME=$HOME PATH=/home/james/.bun/bin:/usr/local/bin:/usr/bin:/bin USER=$USER TMPDIR=/tmp omp --no-session --model minimax/MiniMax-M3 -p 'Reply with exactly: PONG' </dev/null`
3. Update managed-skills `ralph-loop-e2e-harness` and `debug-tralph-pickup` pi references → omp (both untracked; local edits only).

## F. docs

- New `docs/adr/0008-ralph-omp-workers.md` (follow the 0007 format): decision = Ralph loop workers migrate from pi to omp in place; evidence = print-mode `/skill:` inertness (prompt directs `skill://` reads instead), default claude-provider discovery of `~/.claude/skills`, `--no-extensions` isolation, `minimax/MiniMax-M3` unchanged id; consequences = skills must stay under `~/.claude/skills` with valid frontmatter, `disable-model-invocation` keeps them out of listings so driver prompts must name them explicitly.
- This plan doc: flip `Status: awaiting approval` → `Status: executed in <commit>` after landing.

## G. Verification (all must pass before commit)

1. `bash -n .claude/skills/ralph/ralph-loop.sh`
2. Bridge count unchanged, both print 24 and are element-for-element equal (header bindings vs INNER_ARGS elements — same commands as the 43ff704 plan §F.2).
3. Dead-symbol sweep in ralph-loop.sh, expect ZERO hits: `run_pi_adapter|PI_SUBAGENT_CHILD|--skill |/skill:implement|"\$ADAPTER" == "pi"`; then `grep -n -w pi .claude/skills/ralph/ralph-loop.sh` — only `.pi-lens` mentions may remain.
4. Doc sweep, expect ZERO hits: `grep -n -w pi .claude/skills/ralph/SKILL.md` (`.pi-lens` allowed).
5. e2e harness with a `bin/omp` shim (fake omp appends `"$(date -Is) $*"` to an argv file and prints `RALPH_RESULT: DONE #1`): three runs — (a) runnable verification `` `true` `` → status done + gate commit; (b) `` `false` `` → blocked + `## Blocker`; (c) prose → done. Assert exactly one worker invocation per run with flags `--no-extensions --no-session --model minimax/MiniMax-M3`, prompt beginning `Read skill://implement and follow it.` and containing `skill://ralph` (via the reminder), and NO `--skill` flag.
6. Live smoke (after §E login): the §E.2 probe exits 0; plus one live skill-read check: `omp --no-session --model minimax/MiniMax-M3 -p 'Read skill://ralph and reply with its level-1 heading verbatim, nothing else' </dev/null` → replies `# Ralph Loop`.
7. tmux readiness markers: launch `omp` in a scratch tmux session, `capture-pane`, confirm the `:640` regex matches; adjust the regex minimally only if zero markers match.
8. Independent reviewer subagent over the full diff (bridge lockstep, no orphaned pi text, guard logic, reminder strings, unit PATH).

## H. Commit

Single commit `refactor(ralph): migrate loop workers from pi to omp` containing: `.claude/skills/ralph/ralph-loop.sh`, `.claude/skills/ralph/SKILL.md`, `.config/systemd/user/ralph-loop.service`, `docs/adr/0008-ralph-omp-workers.md` (new), `plans/ralph-omp-migration.md` (this doc). NEVER stage `.omp/agent/config.yml`, `.omp/agent/models.yml.template`, or touch `.claude/skills/build-dark-factory/`.

## Open decisions for the user

1. **Shape**: in-place rename (recommended) vs new parallel `omp` adapter vs `--agent-cmd`-only.
2. **systemd auth**: RESOLVED — EnvironmentFile (omp login is OAuth-only; broker unconfigured).
