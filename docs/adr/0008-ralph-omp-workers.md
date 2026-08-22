# 0008 — Ralph: omp workers

**Status:** Accepted (2026-08-22)

## Context

`ralph-loop.sh` workers were `pi` one-shot processes invoked as:

```bash
pi --no-session --model <id> --skill <dir> -p "<prompt>"
```

with `PI_SUBAGENT_CHILD=1` isolation forcing the worker into a non-interactive
turn. The skill directory and prompt payload were passed on the command line
— `--skill <dir>` injected one named skill at a time, so prompts that
needed both `implement` and `ralph` carried two `--skill` flags (positional
indices 27–28 in the heredoc header, 28 in the outer `INNER_ARGS` list).

The dotfiles stack moves from the Pi coding agent to **omp** (package
`@oh-my-pi/pi-coding-agent`, binary at `~/.bun/bin/omp`). omp and Pi are
independent CLIs: omp does **not** read `~/.pi/agent/auth.json`, has
**no `--skill` flag**, and prints its result to stdout when run in `-p`
print mode. Several properties of omp forced the adapter to change shape
during this migration:

- **No `--skill` flag.** omp discovers skills via its own provider
  configuration. The previous `--skill <dir>` plumbing has no
  counterpart; passing it would have left the skill un-injected.
- **`/skill:<name>` is inert under `-p`.** A leading `/skill:` directive
  inside the `-p` payload is not parsed in print mode and falls through
  to the model as literal text — never reaching the skill loader. Any
  direct skill invocation must travel over `skill://<name>`, which omp
  resolves when present in the prompt's environment.
- **`~/.claude/skills` is loaded by default.** omp's claude provider
  (`skills.enableClaudeUser` defaults true) auto-discovers skills from
  `~/.claude/skills`. Both `ralph` and `implement` ship with
  `disable-model-invocation: true` frontmatter, so they stay out of the
  system-prompt listing but remain reachable on demand via `skill://`.
- **omp extensions still load in print mode.** `--no-extensions` is
  required to keep the worker surface minimal and reproducible across
  adapters, matching the `--no-session` isolation of the previous setup.

## Decision

**Migrate `ralph-loop.sh` workers from `pi` to `omp` in place.** The
adapter is renamed `pi` → `omp`; the new `run_omp_adapter` invokes:

```bash
omp --no-extensions --no-session --model "$RALPH_MODEL" -p "$full_prompt"
```

with stdin redirected from `</dev/null` and no `PI_SUBAGENT_CHILD=1`
prefix (omp has no equivalent env gate). When `RALPH_MODEL` is empty
the `--model` flag is omitted entirely.

The five other changes ride along:

- **Skill delivery** stops using `--skill <dir>` flags. Skills come from
  omp's default discovery of `~/.claude/skills`, so no skill flags
  remain anywhere in the repo.
- **Driver prompts name skills explicitly.** Because
  `disable-model-invocation: true` keeps both skills out of the
  listings, the one-shot prompt prefix prepends
  `Read skill://implement and follow it. ` and the `SHARED_PROMPT_REMINDER`
  variant tells the worker `Read the Ralph skill via skill://ralph and
  follow it`. Either form forces the skill loader to materialize the
  skill before the model acts.
- **`AGENT_CMD` for tmux** becomes `omp --no-extensions` plus
  `--model <id>` (printed `%q`) when `RALPH_MODEL` is non-empty.
- **Positional bridge is unchanged at 24.** The outer `INNER_ARGS` list
  and the inner heredoc positional header still match element-for-element.
  The model id `minimax/MiniMax-M3` is unchanged.
- **Readiness probe accepts omp's prompt marker.** `wait_for_agent_ready`
  adds `▶` to the pane-marker pattern: the live marker check showed none of
  the previous pi-era markers match a real omp TUI idle pane (omp renders
  `▶` in the input-box header).

## Consequences

- **`~/.claude/skills` becomes load-bearing.** Both `ralph/` and
  `implement/` must keep their `disable-model-invocation: true`
  frontmatter plus valid `name` and `description` fields, or workers
  will see an empty skill listing and fail to load anything.
- **Systemd path authenticates differently.** The repo-tracked
  `ralph-loop.service` authenticates via
  `EnvironmentFile=-%h/.config/ralph-loop.env` (machine-local, 0600) — omp's
  login is OAuth-only and no auth broker is configured, so env-file is the
  deterministic bridge.
- **Prompts must name skills explicitly.** A worker that omits
  `Read skill://…` from its prompt cannot recover the skill afterwards;
  the artifact is too central for omp to inject silently. Anyone editing
  the prompt builder must preserve one `Read skill://<name>` per skill
  the worker is expected to use.
- **Interactive `/skill:<name>` still works in tmux.** Humans driving
  Ralph interactively (`tralph tmux`) retain the TUI shortcut — only the
  print-mode worker loses `/skill:` because of how `-p` works, not
  because omp forbids it.
- **`PI_SUBAGENT_CHILD` is gone.** omp has no analogue. Worker isolation
  in omp is `--no-session` plus `--no-extensions`; nothing in the
  driver depended on the Pi-specific env probe.
- **`AUTH_JSON` paths diverge.** Operators used to copying
  `~/.pi/agent/auth.json` keys to the systemd unit will now find the
  unit has no such env lines; omp reads its own db.

## Trade-offs

- **Skill discovery becomes implicit.** Operators no longer see *which*
  skills a worker is using on the command line; they must trust the
  filesystem layout under `~/.claude/skills`. The trade is symmetric
  with Pi's reverse pain (`--skill` drift, mismatched directories).
- **Print-mode behavior shifts.** Worker's failures now surface as
  unrecognized flags inside `omp` rather than inside `pi`. The driver
  treats both as a non-zero exit and recovers the same way, but
  log-line content changes.
- **Loading the skill via `skill://<name>` mid-prompt costs a few
  extra tokens per issue.** Trivial in absolute terms; charged honestly
  here so a future reviewer doesn't think the prefix is dead weight.
