# Pi & Claude Extensions — vendoring, repair, and rationale

Reference detail for the vendored extensions in this repo. Moved out of
`CLAUDE.md` to keep auto-loaded agent context lean. `CLAUDE.md` § "Non-obvious
requirements" carries the short must-not-break rules and points here.

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
  delegate) - `.pi/agent/agents/` is intentionally empty (custom agent files
  there would shadow builtins by name). Per-role models are set in
  `.pi/agent/settings.json` `subagents.agentOverrides` (worker →
  `minimax/MiniMax-M3`, reviewer → `deepseek/deepseek-v4-flash`), NOT in agent
  frontmatter — a frontmatter `model:` pin silently shadows settings overrides.
  Vendored at version 0.35.1 (the package `CHANGELOG.md` is the only version
  marker — the vendored `package.json` version field does NOT change on
  re-vendor). Local deviation per ADR 0004: the
  `executeWithSingleDispatchGuard` wrapper in
  `src/runs/foreground/subagent-executor.ts` is removed and the
  `subagentInProgress` state field plus its initializers are deleted, so
  multiple concurrent foreground subagent calls are dispatched (not
  rejected). A future upstream re-vendor MUST re-apply this guard
  removal — delete the wrapper, `duplicateSubagentCallResult`,
  `inferExecutionMode`, and `SubagentState.subagentInProgress` against
  the current fork before committing the new upstream copy, otherwise
  the single-call-per-turn rejection returns.
  Auth split: minimax uses env `MINIMAX_API_KEY` (portable); deepseek uses
  `~/.pi/agent/auth.json` (dir-bound). Vendored deps (`jiti`, `yaml`) install via
  `bash install.sh`. Do not `pi install npm:pi-subagents`; use the repo copy.
  Root Pi delegation policy lives in `.pi/agent/APPEND_SYSTEM.md`.
  `.pi/agent/extensions/pi-subagents/biome.json` (`{"formatter":{"enabled":false}}`)
  is a LOCAL-only file with no upstream counterpart — keep it across re-syncs.
  pi-lens auto-runs `biome format` on every edited file with cwd set to the
  file's own dir; since neither a `biome.json` nor a same-dir `.editorconfig`
  exists for deeply-nested `src/` files, biome fell back to its default 80-col
  wrapping and reflowed the wide-authored upstream files into multi-thousand-line
  diffs on every edit (the repo-root `.editorconfig` is too far up to be seen,
  and `.editorconfig` has no line-width knob anyway). Upstream ships no formatter
  config and enforces none, so disabling the formatter is upstream-faithful and
  keeps edits churn-free. If a re-sync drops it, edits to this extension will
  churn again — re-add it.
- `pi-lens` (real-time code feedback: LSP/linters/formatters/ast-grep) is a
  synced vendored extension at `.pi/agent/extensions/pi-lens/`, registered in
  both Pi settings files as `extensions/pi-lens`. Do not `pi install npm:pi-lens`;
  use the repo copy. Since **3.8.74** it is vendored in upstream's **prebuilt npm
  form** — `pi.extensions: ["./dist/index.js"]` (a single ~2.8 MB bundled
  `dist/index.js`) plus vendored `grammars/*.wasm` — NOT the pre-3.8.74
  from-TS-source form (`./index.ts`, grammars via postinstall). To bump the
  version: `npm pack pi-lens@<ver>`, `tar xzf`, and replace the vendored dir with
  the tarball's `package/` contents (dist, grammars, rules, config, skills, docs,
  scripts, package.json, README/CHANGELOG/banners/LICENSE), then reinstall deps.
  **Footgun:** the manifest's `prepare` script (npm runs it on ANY local
  `npm install`) does `rm -rf dist` then rebuilds from `tsconfig.dist.json` +
  `bundle-dist.mjs` — inputs the prebuilt tarball does NOT ship — so it destroys
  the vendored `dist/` and fails. Always install with `--ignore-scripts`:
  `cd ~/.pi/agent/extensions/pi-lens && npm install --omit=dev --omit=peer
  --ignore-scripts`. `install.sh` special-cases pi-lens to pass `--ignore-scripts`
  (skipped in the generic extension loop). Skills resolve at runtime via the
  package's own `skills/` (`resolvePackagePath`), not the manifest's
  `skills: ["../../skills"]`.
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
  It is currently DISABLED to reduce prompt-token load: removed from `.pi/agent/settings.json{,.template}` `packages` (the `-extensions/rpiv-advisor/index.ts` exclusion alone was insufficient because package resources resolve first) and dropped from Fusion's parent tool surface. Vendored files and the `package.json` pin remain for easy re-enable.
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
  `github-dark-default` theme is vendored under `.pi/agent/themes/`. `summaries` (the session-recap
  renderer) stays vendored but is disabled by the `-extensions/summaries/index.ts`
  exclusion in both Pi settings files (removal from `extensions` alone is
  insufficient — pi auto-discovers `extensions/*/index.ts`). Upstream
  `subagents`, `ask-user`, and `firecrawl-search` are intentionally omitted:
  native `pi-subagents`, inline questions, and `rpiv-web-tools` remain canonical.
  `workflows` accepts either inline `script` or an explicit relative `scriptPath` to a `.js`/`.mjs` file (never a bare-name or implicit `.pi/workflows/` lookup); paths are realpath-contained under launch cwd (including symlinks) and capped at 256 KiB. Completed `agent()` calls are best-effort journaled to append-only `journal.jsonl`, keyed by content + allowlisted execution options + launch context, never call ordinal: `parallel()`'s concurrency window and call-time sandbox request ids make ordinals nondeterministic and index-based replay corrupt; cosmetic `label`/`phase` are deliberately excluded. `resume` creates a new run while keeping the failed/aborted source read-only; successful matches replay outside `RunController` (no budget/semaphore), failed calls retry, and consumed replays seed the new journal. Resume rejects a changed launch cwd (and validates run id/script hash), while model/provider/thinking changes alter keys and safely re-execute; legacy missing metadata is lenient, and a malformed journal line invalidates it and the tail. `/workflows` marks source/replay/script details, but `r` is intentionally degraded: custom dashboard UI cannot invoke the tool, so it only notifies a ready-to-paste `workflow(resume: "wf_...")` call. Three capabilities were added beyond upstream (ported selectively from vekexasia/pi-extensible-workflows, NOT a wholesale swap — our vendoring + Fusion + dashboard integration stays canonical): (1) run `budget` — an optional launch param `{ maxCost, maxTokens, maxDurationMs }` enforced cumulatively in `RunController` (cost/token overage aborts after the offending call; maxDurationMs is a wall-clock run deadline — a timer aborts the run and interrupts in-flight agents via signal propagation, with a supplemental admission check); replayed calls carry empty usage so a resumed run's budget only counts fresh work. (2) `checkpoint({name,prompt,context})` — a BACKGROUND-ONLY human-in-the-loop gate resolving to `"approved"|"rejected"`; it throws in a foreground run because a foreground `workflow` call blocks the turn and could never receive the answer. Answers arrive via a new `workflow_respond({runId,checkpoint,decision})` tool that resolves a promise parked on the active-run entry; decisions are journaled (discriminated `JournalEntry` union, content-hash key) and replay on resume instead of re-asking. (3) `withWorktree(name, cb)` — host-mediated git isolation: the host runs `git worktree add --detach` (execFile argv-only, never a shell; the script `name` is slugified to `[a-z0-9._-]` (unsafe characters sanitized, not just rejected), dot-only names (`.`/`..`) rejected, and the target path is asserted to stay under the run dir), the child callback runs agents against the tree via `cwd:path`, and the host removes it on close with an orphan sweep on run settle (a child killed on abort skips its own finally). Worktree scratch dirs live under the run dir; because `~/.pi` can be symlinked into a trusted tree, agent cwds owned by the worktree manager are FORCE-set untrusted (`WorktreeManager.ownsPath`) so an isolated worktree never loads project extensions with ambient trust. Agent calls and checkpoint decisions are journaled and replay on resume; budget and worktree operations are side effects and are deliberately NOT journaled. All three are gated so they never regress the existing sandbox, budget, or resume invariants. Workflow tests: `cd .pi/agent/extensions/workflows && npm test` (136 tests).
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
- **Claude Fusion** (Claude Code orchestrates, Pi executes — the CC-side port of
  Pi's Fusion; design in `docs/adr/0003-claude-fusion.md`, glossed in
  `CONTEXT.md`). When on, Claude is the brain (intent/spec/diff-review/verify) and
  cannot mutate — all writes/grind are delegated to a fresh `pi -p` role process.
  Surfaces:
  - `bin/pi-delegate` — the delegation wrapper (bash), symlinked onto PATH by
      `install.sh` (`.local/bin/pi-delegate`). `pi-delegate <worker|reviewer|
      planner|researcher> [--async] [--dry-run] "<task>"` launches a flat, fresh
      `pi -p --no-session --no-skills --no-extensions` process. **Sourcing rule
      (correctness-critical):** model + tools come from `.pi/agent/settings.json`
      `subagents.agentOverrides.<role>`, persona body from
      `extensions/pi-subagents/agents/<role>.md` — NEVER the persona frontmatter
      (reviewer frontmatter grants edit/write; settings strips it). `planner` has
      no `tools` key → `--tools` is omitted (never `--tools null`). `--no-extensions`
      is **load-bearing**: it stops the delegated pi from loading Fusion (machine
      default on) and stripping the worker's edit/write tools; `researcher`
      re-adds `rpiv-web-tools` via explicit `--extension` (kept under
      `--no-extensions`). Sync by default (prints the worker's output); `--async`
      returns a poll handle. Reuses the `setsid`-detach + poll mechanics of
      `.claude/skills/_shared/pi-reviewer-engine.md`.
  - `.claude/hooks/claude-fusion-block.sh` — PreToolUse enforcement. Denies
      `Edit|Write|MultiEdit|NotebookEdit` (exit 2) and gates `Bash` to a
      read-only/verification/`pi-delegate` allowlist. The Bash decision **reuses
      Fusion's VERBATIM `isSafeBash`** (`.pi/agent/extensions/fusion/index.ts`)
      via the jiti vendored in `pi-subagents/node_modules` — same policy as Pi's
      Fusion, no divergent regex re-port — plus an injection-safe `pi-delegate`
      carve-out (mirrors `isSafeGitCommit`'s anchored quoted-arg shape). Wired
      into the `Bash` matcher (stacks after `block-bash-pattern.sh`) and a
      dedicated writer matcher, in `settings.json.template` AND live
      `~/.claude/settings.json` (switch-provider retired, so no provider files).
  - `.claude/hooks/claude-fusion-guidance.sh` — SessionStart hook, injects the
      delegation protocol as raw stdout (native-CC context path, like
      `ponytail-activate.js`; no JSON wrapper).
  - `.claude/hooks/tests/claude-fusion-smoke.sh` — offline assert smoke (block
      decisions + `--dry-run` role resolution; no live `pi`).
  - **Switch:** `claude` key in `~/.config/fusion/config.json`
    (`{"claude":"on"|"off"}`), falling back to Pi's `defaultMode` when absent
    (default resolves ON). Read live on every hook call. Toggle with the
    `bin/claude-fusion on|off|status` helper (symlinked onto PATH by `install.sh`;
    flips the `claude` key, leaves `defaultMode` untouched). **Human-driven
    only** — the helper is NOT on the Bash allowlist, so the caged brain cannot
    run it to unblock itself; run it from your shell or `! claude-fusion off`
    inside Claude Code. Per-repo escape hatch: `.claude/.fusion-off`.
  - **Gotcha:** the block hook depends on jiti + `fusion/index.ts` being present
    (both vendored, installed by `bash install.sh`). It fails CLOSED if the
    policy engine can't load — toggle `claude=off` or drop `.claude/.fusion-off`.
