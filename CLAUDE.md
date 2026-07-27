# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## On a fresh machine

Run `bash install.sh` from the repo root. See `README.md` for the full setup
sequence (settings.json seeding, per-machine MCP bootstrap, validation
commands).

## Canonical surfaces

- Global agent guidance: `.claude/CLAUDE.md` (loaded by OpenCode via
  `.config/opencode/opencode.json` `instructions[]`).
- Slash commands: `.claude/commands/` (canonical Claude Code commands; retired
  OpenCode commands live under `.config/opencode/archive/commands/`).
- Subagents: `.claude/agents/` (canonical Claude Code subagents; Pi uses
  `.pi/agent/agents/`).
- Shared skills: `.claude/skills/<name>/SKILL.md` (read by Claude Code natively,
  by OpenCode via `~/.claude/skills` fallback).
- Hooks: `.claude/hooks/` (Claude Code hook scripts).
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Non-obvious requirements

- Pi was renamed upstream from `@mariozechner/pi-coding-agent` to
  `@earendil-works/pi-coding-agent` (same maintainers). All vendored extensions
  peer-depend on `@earendil-works/*`, and `.pi/agent/package.json` pins
  `@earendil-works/{pi-ai,pi-coding-agent,pi-tui}` at `^0.80.6`. Install globally with
  `npm install -g @earendil-works/pi-coding-agent`. If a stale `/usr/bin/pi`
  symlink remains from a prior root-level install of the old package, it can
  shadow the new user-prefix binary — `install.sh` detects and reports this.
- Pi subagents use the synced vendored `pi-subagents` runtime
  (nicobailon/pi-subagents) at `.pi/agent/extensions/pi-subagents`, registered in
  both Pi settings files as `extensions/pi-subagents`. It spawns each subagent as
  a fresh child `pi` process (real isolation, per-role model) and provides the
  `subagent`, `subagent_wait`, and `subagent_supervisor` tools. It ships builtin
  agents (worker, reviewer, scout, researcher, planner, oracle, context-builder,
  delegate) — `.pi/agent/agents/` is intentionally empty (custom agent files
  there would shadow builtins by name). Per-role models are set in
  `.pi/agent/settings.json` `subagents.agentOverrides` (worker →
  `minimax/MiniMax-M3`, reviewer → `deepseek/deepseek-v4-flash`), NOT in agent
  frontmatter — a frontmatter `model:` pin silently shadows settings overrides.
  Auth split: minimax uses env `MINIMAX_API_KEY` (portable); deepseek uses
  `~/.pi/agent/auth.json` (dir-bound). Vendored deps (`jiti`, `yaml`) install via
  `bash install.sh`. Do not `pi install npm:pi-subagents`; use the repo copy.
  Root Pi delegation policy lives in `.pi/agent/APPEND_SYSTEM.md`.
- Pi `ask_user_question` remains vendored at
  `.pi/agent/extensions/rpiv-ask-user-question`, but is intentionally disabled by
  the exact `-extensions/rpiv-ask-user-question/index.ts` exclusion in Pi's
  `extensions` settings. Keep that exclusion: questions should be asked inline
  in chat per `.claude/CLAUDE.md`. Removing only a `packages` entry is
  insufficient because Pi auto-discovers `extensions/*/index.ts`.
- Pi `rpiv-advisor` is also a synced vendored extension at
  `.pi/agent/extensions/rpiv-advisor`. Install/repair it the same way:
  `bash install.sh`, or `INSTALL_PI_NPM=always bash install.sh` when deps are
  stale. Do not use `pi install npm:@juicesharp/rpiv-advisor`; use the repo copy.
- Pi `rpiv-web-tools` is a synced vendored extension at
  `.pi/agent/extensions/rpiv-web-tools` and registered in `.pi/agent/settings.json`
  as `extensions/rpiv-web-tools`. Install/repair it with `bash install.sh`, or
  `INSTALL_PI_NPM=always bash install.sh` if deps are stale. Do not use
  `pi install npm:@juicesharp/rpiv-web-tools`; use the repo copy. Keep
  `.pi/agent/settings.json` excluding `-extensions/web-fetch/index.ts`, or Pi will
  load the legacy web-fetch extension and conflict on `web_search` / `web_fetch`.
  After install, restart Pi and run `/web-search-config`.
- `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` and `OPENCODE_DISABLE_CLAUDE_CODE` must
  be **unset**, or OpenCode won't see canonical skills under `~/.claude/skills/`.
- OpenCode silently filters skills with invalid frontmatter. If a new skill
  doesn't appear in `opencode debug skill`, check `model:` uses
  `provider/model` form (e.g. `anthropic/claude-sonnet-4-6`, not bare `opus`).
- macOS: `install.sh` already handles BSD vs GNU `realpath` / `readlink -f`.
  No extra setup needed.
- `ponytail` (lazy-senior-dev / YAGNI enforcer, from
  `github.com/DietrichGebert/ponytail`) is vendored into both harnesses rather
  than installed via `/plugin marketplace add` or `pi install git:` (both write
  machine-local state that does not sync). Surfaces:
    - Claude skills: `.claude/skills/ponytail{,-review,-audit,-debt,-gain,-help}/`
      (synced natively via the `.claude/skills` symlink). These register the
      `/ponytail*` slash names; the redundant `.claude/commands/ponytail*.md`
      copies were removed (skill triggers + hook cover the same surface).
    - Claude hooks: `.claude/hooks/ponytail/*.js`. Upstream uses
      `${CLAUDE_PLUGIN_ROOT}`; since this is not a plugin install, the wiring
      points at `$HOME/.claude/hooks/ponytail/`. Always-on full mode: the
      `SessionStart` + `UserPromptSubmit` hook entries are wired into
      `.claude/settings.json.template` (the tracked seed) **and** every
      machine-local `.claude/settings-*.json` provider file — they must be in
      each provider file because `switch-provider.sh` copies one over the live
      `~/.claude/settings.json`. Default mode is `full` (set in
      `hooks/ponytail-config.js`); override per-machine with
      `PONYTAIL_DEFAULT_MODE` or `~/.config/ponytail/config.json`.
    - Pi extension: `.pi/agent/extensions/ponytail/` (auto-discovered; its
      `index.js` requires were rewritten `../hooks/` → `./hooks/` because the
      hook files are vendored under the extension dir). Do not `pi install`.
  To repair on another machine: `bash install.sh` from the repo root.
- `graphify` (codebase knowledge-graph tool, `github.com/Graphify-Labs/graphify`)
  is split between a synced skill and a machine-local CLI. Surfaces:
    - Skill: vendored (not `graphify install`-generated per machine) at
      `.claude/skills/graphify/` (synced → Claude Code + OpenCode) and
      `.pi/agent/skills/graphify/` (synced → Pi). Both parent dirs are already
      symlinked by `install.sh`, so the skill needs no extra link. Refresh the
      vendored copy after a CLI upgrade by re-running `graphify install` /
      `graphify install --platform pi` into a throwaway `HOME` and copying the
      generated `graphify/` dir back over the two vendored locations (avoids the
      installer editing your real `~/.claude/CLAUDE.md`).
    - CLI: machine-local, NOT synced. Install with `uv tool install graphifyy`
      (PyPI package is `graphifyy` double-y; command stays `graphify`). Lands in
      `~/.local/bin`, already on PATH via the shell rc files.
    - Auto-refresh hook: synced global git hook
      `.config/git/hooks/post-commit`, wired by `install.sh` pointing git's
      global `core.hooksPath` at `~/.config/git/hooks` (only when unset or
      already ours — it will not clobber a deliberate machine-local hooksPath).
      Because a global `core.hooksPath` overrides every repo's `.git/hooks`, the
      hook first delegates to any repo-local `post-commit`, then runs
      `graphify update .` in the background — but only when the repo has a
      `graphify-out/` graph AND the CLI is on PATH; otherwise it is a silent
      no-op. Set up a project's graph once with `/graphify .`. To repair wiring
      on another machine: `bash install.sh`.
    - Pi "query-first" guard: `graphify claude install` registers a Claude Code
      PreToolUse hook that injects a "query the graph before you grep/read" nudge
      whenever `graphify-out/graph.json` exists. Pi has no per-tool
      context-injection channel (its `ToolCallEventResult` only carries
      block/reason), so the equivalent is a synced auto-discovered extension
      `.pi/agent/extensions/graphify-guard/` that injects the same guidance into
      the system prompt via `before_agent_start` (the always-on pattern ponytail
      uses), gated on a graph existing — silent no-op otherwise. Registered
      explicitly in `.pi/agent/settings.json{,.template}` `extensions`. Do not
      `pi install`; it is vendored. Smoke test:
      `bash .pi/agent/extensions/graphify-guard/tests/graphify-guard-smoke.sh`.
- `my-pi-setup` UI/tooling is vendored under `.pi/agent/extensions/`: `ui-customization`,
  `summaries`, `model-info`, `git-info`, `background-terminals`, `file-search`, and
  `workflows`, with their shared modules under `extensions/shared/`. The
  `github-dark-default` theme is vendored under `.pi/agent/themes/`. Upstream
  `subagents`, `ask-user`, and `firecrawl-search` are intentionally omitted:
  native `pi-subagents`, inline questions, and `rpiv-web-tools` remain canonical.
  `subagent-bridge` exposes native subagent activity in the shared footer, `/fleet` overlay, and the `/btw` side-question channel (bare `/btw` opens a Q&A overlay to ask/review mid-run, `/btw <q>` quick-fires; spawns an async `delegate` via pi-subagents' RPC bridge, answers shown in the overlay from the completion payload while chat delivery stays with pi-subagents' notify — never delivered twice by the bridge). Foreground (sync) spawns — incl. fusion-gated ones — are tracked from the parent's own `tool_execution_start/end` events because pi-subagents emits NO lifecycle event for plain sync runs (`SUBAGENT_FOREGROUND_COMPLETE_EVENT` only fires for detached exits); entries key by toolCallId while running, re-key to the run's real runId at completion, skip `action:` management calls and `async:true` (a run that went async via config default is dropped at end when its result carries asyncDir), and get no stop/steer/resume actions (no asyncDir); the tool result's finalOutput tail is kept for the /fleet detail view. Smoke test (offline, via pi-subagents' vendored jiti): `bash .pi/agent/extensions/subagent-bridge/tests/subagent-bridge-smoke.sh`.
  `.pi/agent/extensions/hub-kit/` is our own shared library dir (NOT an extension — no top-level `index.ts`, so pi auto-discovery skips it; consumers import relatively like `shared/`): panel/list-detail/deliver UI kit + the activity-provider registry that `subagent-bridge` wires `/fleet` (multi-provider hub) and the footer onto, with per-run stop/interrupt (pi-subagents RPC) and steer/resume (slash-bridge event channel) actions. Registry state is globalThis-keyed — pi's loader does not guarantee a shared module cache across separately loaded extensions, so a plain module-level Map would silently split per consumer.
  Repair extension dependencies on another machine with `bash install.sh`.
- `gap-review` (Pi completeness-review layer) is a synced vendored extension at
  `.pi/agent/extensions/gap-review/`, registered in `.pi/agent/settings.json{,.template}`
  `extensions`. It is the COMPLETENESS layer companion to pi-duo (the GROUNDING
  gate): pi-duo catches false/unsupported claims but, by prompt design ("do not
  demand extra work"), cannot catch material omissions — see
  `docs/adr/0001-verification-two-layers.md` and the glossary in `CONTEXT.md`.
  At each terminal turn (final text answer, ≥ `PI_GAP_MIN_CHARS` (default 200)
  chars, that touched ≥1 file via read/write/edit), it spawns a DETACHED fresh
  `pi -p --no-extensions --no-skills --no-session --tools read,grep,find,ls
  --model deepseek/deepseek-v4-flash` reviewer that reads the touched files +
  the original request (captured from `before_agent_start`) and writes
  `OMISSIONS:` findings to `<project>/.gap-reviews/<turn>-<ts>.md`; the next
  `turn_start` surfaces them via `ctx.ui.notify` (interactive only). Async and
  non-blocking — the detached reviewer outlives the turn; a CI/container exit
  can still kill it (the `.md` is the durable artifact). Always-on; env knobs:
  `PI_GAP_REVIEW=0` (disable), `PI_GAP_MODEL`, `PI_GAP_THINKING`,
  `PI_GAP_MIN_CHARS`, `PI_GAP_RETAIN_DAYS` (default 14; prunes notified
  reviews). Zero-dependency plain JS (auto-discovered, like graphify-guard); no
  `pi install`, no install.sh step. Gotcha: files created/modified via `bash`
  are invisible (only read/write/edit tool calls contribute paths), and pi fires
  `turn_end`/`before_agent_start` per agent-STEP so per-turn accumulators must
  clear at the terminal `turn_end`, not at `turn_start`. The runner deletes
  `<turn>-<ts>.input.md` after the reviewer consumes it (transient, to keep
  retention of the original request + answer tight). Smoke test:
  `bash .pi/agent/extensions/gap-review/tests/gap-review-smoke.sh`.

## Editing rules

- `.claude/CLAUDE.md` is the canonical global guidance. Edit it directly;
  don't recreate `.config/opencode/AGENTS.md`.
- `.claude/settings-*.json` are gitignored (provider-specific, machine-local).
  The tracked seed is `.claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
