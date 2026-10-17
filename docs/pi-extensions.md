# Pi & Claude Extensions — vendoring, repair, and rationale

Reference detail for the vendored extensions in this repo. Moved out of the
repo-level context file to keep auto-loaded agent context lean. `AGENTS.md` §
"Non-obvious requirements" carries the short must-not-break rules and points
here.

- **pi-fabric (2026-10-16): the orchestration runtime, and its rollback.**
  `npm:pi-fabric@0.117.1` replaces the overlapping extensions with one
  package. It is the deliberate exception to vendoring: it is installed with
  `pi install` into `~/.pi/agent/npm` on each machine. Pinned at 0.117.1
  because 0.117.2 depends on `@earendil-works/{pi-durable,chord}` 1.3.0 and
  the machines run Pi 1.2.0; bump the pin together with Pi itself. The
  `packages` entry in `settings.json` and the template is the object form,
  which drops the bundled Coral Bricks provider (its maintainers work there):
  `{"source": "npm:pi-fabric@0.117.1", "extensions": ["!node_modules/pi-coralbricks-provider/**"]}`.
  `pi install` rewrites it as a plain string, so restore the object form
  after any reinstall; check with `pi list` (shows `(filtered)`) and
  `pi --list-models | grep -c coralbricks` (0).
  In full code mode the model sees `fabric_exec` and calls everything inside
  it. Verified 2026-10-16 with the kept extensions loaded: an edit made
  through `pi.edit` inside `fabric_exec` still triggered verify-final's
  post-work-cleanup nudge, so tool lifecycle events still reach other
  extensions. Role models moved from `subagents.agentOverrides` to
  `.pi/agent/fabric.json` `models.aliases`; `APPEND_SYSTEM.md` was rewritten
  for Fabric. Jev (typed judgments, auto-approval classifier) uses a
  TypeSafe key: `/login jev` stores it in `auth.json` (machine-local), or set
  `TYPESAFE_API_KEY`. The key never goes in `fabric.json`.
  **Archived** (plain `git mv`, history intact): extensions `pi-subagents`,
  `fusion`, `pi-advisor-flow`, `rpiv-todo` into
  `.pi/agent/extensions-archive/`; `bin/pi-delegate` and `bin/claude-fusion`
  into `archive/bin/` (both need pi-subagents/fusion, and their
  `~/.local/bin` links were removed); npm packages
  `@trevonistrevon/pi-loop@^0.7.18` and `pi-background-tasks@^2.6.10`
  removed with `pi remove`. **Kept:** pi-lens, rpiv-web-tools,
  rpiv-ask-user-question (still excluded), verify-final.ts, moshi-hooks.ts,
  herdr-agent-state.ts, pi-btw, pi-cc-extensions (TUI rendering; Fabric does
  not replace it), `+codemode` (Fabric hides it in full code mode).
  The pre-Fabric `settings.json` on each machine is at
  `~/.pi/agent/settings.json.bak-pre-fabric` (gitignored).
  **Rollback:** `git mv` each folder from `extensions-archive/` back to
  `extensions/` and both scripts back to `bin/`; `git revert` the migration
  commit for the docs, `install.sh`, `check.sh` and template;
  `pi remove npm:pi-fabric`; `pi install npm:@trevonistrevon/pi-loop` and
  `pi install npm:pi-background-tasks`; copy `settings.json.bak-pre-fabric`
  over `settings.json`; `bash install.sh` (reinstalls pi-subagents deps and
  relinks the scripts); restart Pi. Do the same on every machine.
  **Node 24+ is required** for Fabric's child-agent workers: on Node 22 a
  child fails with "Fabric workers require Node.js 24+" while plain
  `fabric_exec` still works. On 2026-10-16 aidev and itan8n were moved from
  the nodesource `node_22.x` apt repo to `node_24.x` (backup
  `/etc/apt/sources.list.d/nodesource.sources.bak-node22`). itan8n's
  `~/.local/bin/{node,npm,npx,corepack}` had pointed at a user-local
  `~/.local/node-v22.20.0`; they now point at `/usr/bin` (old links kept as
  `*.bak-node22`). omarchy runs Node 26. Leftover untracked copies of
  pi-subagents and rpiv-todo on the servers went to
  `~/pi-extension-leftovers-fabric/`. On the servers, `pi install` rewrites
  the tracked `npm/package-lock.json` with machine-specific paths; discard
  that with `git checkout -- .pi/agent/npm/package-lock.json`.
- **2026-10-12 archive sweep:** every extension not in the enabled set moved
  from `.pi/agent/extensions/` to `.pi/agent/extensions-archive/` (outside
  Pi's discovery tree; plain move, git history intact):
  @juicesharp/{rpiv-args,rpiv-i18n}, background-terminals, cross-agent.ts,
  fusion, gap-review, graphify-guard, harness-gates, hub-kit, model-info,
  ponytail, pi-retry, rtk.ts, session-log, shared, subagent-bridge,
  summaries, ui-customization, web-fetch, workflows (fusion was restored to
  `extensions/` the same day at user request; it boots with mode OFF — the
  knob is `~/.config/fusion/config.json` `defaultMode`, `--fusion`, or
  `/fusion on` in-session; patched the same day for pi-subagents 0.77.0:
  parent surface `subagent_wait`→`bg_wait` plus the archived
  background-terminals `bg_*` entries and its dead handler dropped, read and
  mutation action sets re-synced to 0.77.0's `SUBAGENT_ACTIONS` /
  `MUTATING_MANAGEMENT_ACTIONS` vocabulary (re-sync on re-vendor), and
  workflow-script subagent calls BLOCKED under Fusion because script runs
  bypass the parent's one-writer attribution. Smoke suite updated to the new
  surface. CLI note: `pi -p --fusion <prompt>` silently swallows the prompt
  (empty output, exit 0); use `--fusion=true` — measured). All `extensions`
  exclusion refs were cleared from `settings.json{,.template}` (both arrays
  now empty) and the dead install.sh case entries removed. Enabled set:
  pi-subagents, pi-lens, moshi-hooks.ts, herdr-agent-state.ts, and the rpiv
  family (advisor, ask-user-question, todo, web-tools). `shared/` and
  `hub-kit/` moved with their consumers (subagent-bridge, ui-customization,
  workflows, model-info). To restore one: move its folder back into
  `extensions/` and restart Pi — no settings change needed. Pi-side
  `gap-review`, `graphify-guard` etc. remain archived; restore the same way
  if needed (`.pi/fusion.json` was left in place; it is only a stale
  allowedCommands list; the ADR 0002/0003 docs describe the design).
- **Sync gotcha (learned 2026-10-12):** enablement lives in the machine-local,
  gitignored `settings.json` — the template only seeds fresh machines. On pull,
  each machine still needs its local `settings.json` fixed by hand: clear the
  stale `extensions` exclusion array, clear any pre-migration `packages` array
  (aidev carried one naming archived dirs → load errors), and drop a stale
  `skills: ["~/.claude/skills"]` entry. Remotes may also lag on the pi CLI
  itself; 2026-10-13 both were brought to 1.2.0 via
  `npm install -g @earendil-works/pi-coding-agent` (aidev lands in
  `~/.npm-global/bin`, on interactive PATH via `.zshrc`; itan8n in
  `~/.local/bin`), and both run the enabled set cleanly (`pi -p` boot probes
  OK).
- **Untracked extension leftovers (found 2026-10-13):** pre-sync servers
  accumulated untracked dirs under `.pi/agent/extensions/` that Pi
  auto-discovers and loads on every start — aidev carried 15, itan8n 17
  (incl. `gap-review`, `web-fetch`, `summaries`, `workflows`, `ponytail`,
  `pi-moa`, `@tintinweb`, `@juicesharp`). Two were actively harmful:
  `gap-review` writes `<project>/.gap-reviews/` (would dirty an Offload
  worktree and break the return/freeze clean-tree gate) and `web-fetch`
  collides with `rpiv-web-tools` on `web_search`/`web_fetch`. All were
  quarantined to `~/pi-extension-leftovers-20261013/` (outside discovery;
  NOT into `extensions-archive/` — that would collide with the tracked
  archived copies on pull). An `install.sh` warn-on-untracked-`extensions/*`
  check is a wanted follow-up so this surfaces as a warning, not a manual
  audit.
- Known open items: aidev's `defaultModel: claude-opus-4-8` still 400s
  (pre-existing; `--model gpt-5.6-sol` works — aidev is not a pi Offload
  target until this is fixed); itan8n's machine-local `enabledModels` still
  names `deepseek/deepseek-v4-flash`, which no available provider matches
  (cosmetic boot warning).
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
  agents (0.77.0 roster: worker, reviewer, scout, researcher, oracle, delegate,
  evidence-auditor, claude-code(-writer), codex-exec(-writer),
  cursor-agent(-writer); plus LOCAL-only `planner.md` and `context-builder.md`
  carried from the 0.35.x fork because 0.77.0 dropped them and `bin/pi-delegate`
  reads `agents/planner.md` directly) - `.pi/agent/agents/` is intentionally
  empty (custom agent files there would shadow builtins by name). Per-role
  models are set in `.pi/agent/settings.json` `subagents.agentOverrides`
  (scout/worker/delegate/evidence-auditor/context-builder →
  `minimax/MiniMax-M3`, researcher → `cliproxy/claude-sonnet-5-5`, reviewer →
  `cliproxy/claude-opus-5-5`, oracle → `openai-codex/gpt-6.1-sol`, planner →
  `cliproxy/claude-opus-5-5`; the CLI-adapter agents claude-code/codex-exec/
  cursor-agent stay unpinned — they use their CLI's own model ids, not Pi
  child models), NOT in agent frontmatter. In 0.77.0 a settings override
  replaces the frontmatter `model` field (verified in `applyBuiltinOverride`),
  so frontmatter can no longer shadow settings; the settings-only rule stands
  because `bin/pi-delegate` sources model+tools from settings exclusively and
  every role should resolve identically on all three surfaces. 2026-10-12:
  replaced planner's dead `cliproxy/claude-opus-4-8` pin (400 unknown model on
  cliproxy), aligned template scout/worker to MiniMax-M3 (was
  openrouter/deepseek-v4.1-flash), and pinned the four formerly-inheriting
  utility roles (oracle, delegate, evidence-auditor, context-builder); every
  pin probe-verified with `pi -p --no-tools --model <id>` (openai-codex needed
  a fresh login first — `pi auth` / `/login`). The full 9-role block was
  synced to aidev + itan8n the same day (aidev had THREE dead opus-4-8 pins;
  itan8n planner was on the imprecise `claude-opus-5`) — all pins probe-verified
  on all three machines; per-machine backups at
  `settings.json.bak-subagent-models`. 2026-10-13: swapped reviewer from
  `cliproxy/gpt-6-luna` to `cliproxy/claude-opus-5-5` (user request; gpt-6-luna
  stays in `enabledModels`) — pin probe-verified, template + all three
  machines updated same day.
  Vendored at version 0.77.0 (2026-10-12 fresh swap from the 0.35.1 fork;
  enabled the same day by removing the `-extensions/pi-subagents/index.ts`
  exclusion from `settings.json{,.template}`). 0.77.0 ships prebuilt JS +
  .d.ts (no TS sources) — patches are edited into the `.js`. It is a
  near-rewrite (missions/intercom/fleet/profiles/policy subsystems, external
  CLI adapters); the fork-only features (`expand.filter/join/sort/top`,
  per-call `completionGuard` override, per-step salvage, researcher
  tool-shape and reviewer-format fixes) were NOT upstreamed and were DROPPED
  in the swap — no active consumers; recoverable from git history. Local
  deviation per ADR 0004 (0.77.0 form): in
  `src/runs/foreground/subagent-executor.js` the single-dispatch rejection is
  stripped — the wrapper is renamed `executeWithUsageAggregation` (it keeps
  action normalization, the `checkSubagentDepth` call, and
  `withAggregatedToolUsage`), `duplicateSubagentCallResult` is deleted, and
  `inferExecutionMode` is KEPT (still used by an error path). The
  `subagentInProgress` state field is removed from `subagent-executor.js`
  (state init + the `hasActiveSubagentChildren` read),
  `src/extension/index.js`, `src/extension/fanout-child.js`, and
  `src/shared/types.d.ts`. A future upstream re-vendor MUST re-apply this
  strip and re-carry `biome.json` + `agents/{planner,context-builder}.md`,
  otherwise the single-call-per-turn rejection returns and `pi-delegate
  planner` breaks.
  Auth split: minimax uses env `MINIMAX_API_KEY` (portable); deepseek uses
  `~/.pi/agent/auth.json` (dir-bound). Runtime deps (`jiti`, `yaml`, `acorn`,
  `undici`, `@js-temporal/polyfill`) install via `bash install.sh`; peers
  (incl. the new `@earendil-works/pi-agent-core` and `pi-ai >= 0.86.1`)
  resolve against the pi release runtime — pi 1.2.0 ships pi-ai/pi-agent-core
  1.2.0, so no root pin bump is needed. Do not `pi install npm:pi-subagents`;
  use the repo copy.
  **Local patch (2026-10-13), re-apply on re-vendor:** pi 1.2.0 removed
  `@earendil-works/chord`, but 0.77.0's `resolveHostPeerAliases`
  (`src/runs/background/runner-aliases.js`) requires the chord aliases for
  every host except stable 0.x < 0.85, so every `async: true` child failed with
  "does not provide @earendil-works/chord…". The patch requires chord only
  when the host manifest declares it (`chordDeclared`). Foreground children
  are unaffected; Fusion is not involved. Drop the patch once upstream fixes it.
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
  synced vendored extension at `.pi/agent/extensions/pi-lens/` (re-enabled
  2026-10-12 at 4.4.3, via auto-discovery). Do not `pi install npm:pi-lens`;
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
  `extensions` settings, to keep Pi's prompt-token load down — Pi asks inline in
  chat instead. This is a Pi-only choice and says nothing about dsh, where
  `ask_user_question` IS mounted and used (see `docs/deepseek-harness.md`).
  Removing only a `packages` entry is insufficient because Pi auto-discovers
  `extensions/*/index.ts`.
- Pi `pi-advisor-flow` (npm `pi-advisor-flow@0.13.1`, by philipbrembeck;
  `https://pi.dev/packages/pi-advisor-flow`) is a synced vendored extension
  at `.pi/agent/extensions/pi-advisor-flow`. It replaces the archived
  `rpiv-advisor` (see below). Install/repair it the same way as other
  vendored extensions: `bash install.sh`. Do not use
  `pi install npm:pi-advisor-flow`; use the repo copy. The npm tarball
  ships a prebuilt `dist/index.js` (manifest: `extensions: ["./dist/index.js"]`)
  and has 0 runtime dependencies, so no install step is required and peers
  resolve from `~/.pi/agent/node_modules`. `install.sh` SKIPS it in the
  generic npm-install loop because the manifest's `prepare: husky` lifecycle
  script would write `.husky/` into the vendored tree on a local `npm install`.
  Config persists machine-locally at `~/.pi/agent/advisor.json` (NOT
  `~/.config/rpiv-advisor/advisor.json` — that path was rpiv-advisor's and
  is now stale; safe to delete). `~/.pi/agent/advisor.json` is added to
  `.gitignore` because the guided setup may store provider API keys there.
  Configure via the interactive `/advisor` command (Executor + Advisor +
  optional Fallback model picker); also exposes `/advisor-manual`,
  `/advisor-models`, `/advisor-settings`, `/advisor-stats`, `/advisor-off`.
  Registers the `ask_advisor` tool — NOT `advisor` (different name from
  rpiv-advisor, by design to avoid collisions on intermediate syncs).
  Behavior difference (why this replaces rpiv-advisor): pi-advisor-flow
  includes **automatic review gates** (before plans, after repeated
  failures, before declaring completion) and **loop detection** that can
  stop a tool action or session under its failure policy — the executor
  model no longer has to remember to call the tool. Manual `ask_advisor`
  calls still work. This is what rpiv-advisor lacked: rpiv-advisor was
  strictly model-initiated ("Nothing is injected into your transcript") and
  the executor models historically never called it, which is why "I never
  saw advice" was the observed behavior.
  **Peer/runtime version risk (open follow-up, 2026-10-13):** pi-advisor-flow
  declares peers `@earendil-works/{pi-ai,pi-coding-agent,pi-tui}` at
  `^1.0.0`; the root pin in `~/.pi/agent/package.json` is `^0.82.0`
  (installed `0.82.1` on aidev). The global pi CLI is `1.2.0`, but Node
  resolves the extension's `@earendil-works/*` imports from
  `~/.pi/agent/node_modules` (0.82.1), so the extension imports 0.82.1
  packages at runtime despite being built against 1.x. The module loads
  (verified by `pi -p` boot probe and `node --check` on `dist/index.js`),
  but 1.x-specific API surfaces in `ask_advisor` may error at first call
  until the root pin is bumped to `^1.0.0`. Bumping the root pin is a
  multi-extension change (rpiv family, pi-lens, pi-subagents all share
  those peers) and is tracked as a separate decision — do not bump
  silently. Verify on a real `ask_advisor` call after the user restarts
  Pi and configures models with `/advisor`.
  Security skim (2026-10-13): 0 runtime deps; the only `node:child_process`
  use is `execFileSync` (no shell, exact argv, used for git ops); all
  network endpoints in `dist/index.js` are documented Jev/Decisions
  providers (`api.openai.com/v1/decisions`, `api.typesafe.ai/v1/systemone`,
  `openrouter.ai/api/alpha/decisions`, `api.codiv.ai`). No exfil
  patterns observed.
- Pi `rpiv-advisor` (archived 2026-10-13): moved from
  `.pi/agent/extensions/rpiv-advisor` to
  `.pi/agent/extensions-archive/rpiv-advisor` (history intact). Replaced
  by `pi-advisor-flow` above because rpiv-advisor was strictly
  model-initiated — the executor model had to call the zero-param
  `advisor` tool on its own, and historical sessions never did, so the
  user never saw advice. The `@juicesharp/rpiv-advisor` pin was removed
  from root `~/.pi/agent/package.json`; `@juicesharp/rpiv-config` is
  kept (still used by rpiv-ask-user-question, rpiv-todo, rpiv-web-tools).
  To restore: `git mv .pi/agent/extensions-archive/rpiv-advisor
  .pi/agent/extensions/` and re-add the pin — but prefer pi-advisor-flow
  going forward.
- Pi `rpiv-web-tools` is a synced vendored extension at
  `.pi/agent/extensions/rpiv-web-tools` (fresh 2.13.8, 2026-10-12).
  Install/repair it with `bash install.sh`, or
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
      `.claude/skills/graphify/` (synced → Claude Code + OpenCode). The parent
      dir is already symlinked by `install.sh`, so the skill needs no extra
      link. Refresh the vendored copy after a CLI upgrade by re-running
      `graphify install` into a throwaway `HOME` and copying the generated
      `graphify/` dir back over the vendored location (avoids the installer
      editing your real `~/.claude/CLAUDE.md`).
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
  Two flavors share the engine (completeness + grounding); the COMPLETENESS
  flavor's fire condition is unchanged (repo mutation required), and the
  GROUNDING flavor is a SECOND reviewer that fires on every substantive
  terminal turn (≥ `PI_GAP_MIN_CHARS`) regardless of repo change — reviving
  the auto-grounding layer pi-duo used to provide (which was removed). Grounding
  writes `GROUNDING: <count> issues` / `GROUNDING: clean` to
  `<project>/.gap-reviews/<turn>-<ts>-g.md` (the `-g` suffix disambiguates
  from completeness `…-c.md`); on a repo-changing turn both flavors fire and
  produce both `…-c.*` and `…-g.*` artifacts. Per-flavor config: completeness
  uses `PI_GAP_MODEL` (default `deepseek/deepseek-v4-flash`) for an omission
  scan; grounding uses `PI_GAP_GROUNDING_MODEL` (default
  `deepseek/deepseek-v4-flash`) for a claim-grounding scan, matching the
  claim-verifier / grill-with-docs / verify-claims grounding checker. Both
  flavors share `PI_GAP_REVIEW` (master kill switch), `PI_GAP_THINKING`,
  reaper, prune, and the `MAX_PENDING=3` backpressure budget; grounding
  adds `PI_GAP_GROUNDING=0` (disable the grounding flavor only — default on).
  `pendingCount` / `pruneOldReviews` / `reapStaleReviews` / the notify sweep
  all glob on `.input.md` / `.done` / `.notified` / `.md`, which sit AFTER
  the flavor suffix, so the new `-g` artifacts slot into the existing scheme
  unchanged. Manual `/gap-review` stays completeness-only (replays
  `lastCandidate` with `kind: "completeness"` via the default). See
  `docs/adr/0001-verification-two-layers.md` for why this does NOT contradict
  the "augment pi-duo's in-band verifier" rejection.
- `session-log` (Pi human-readable session transcript) is a synced, zero-dependency vendored extension at `.pi/agent/extensions/session-log/`, auto-discovered by Pi — no `settings.json{,.template}` entry is needed to enable it (it would only be *disabled* by a `-extensions/session-log/index.ts` exclusion). On each completed interactive (`tui`) turn (`agent_settled`) it appends that turn's user prompt plus the assistant's final markdown answer to `<git-project-root>/.sessions/<YYYY-MM-DD>_<slug>-<hash6>.md`. The `<slug>` is a short human-readable title generated ONCE per session (first turn) by a small `deepseek/deepseek-v4-flash` call over the first prompt+response; any model/auth/timeout/empty failure falls back to `<YYYY-MM-DD>_<sessionId>.md`, and the markdown append NEVER fails due to slug generation. Restart-safe: an interrupted/resumed session re-finds its existing file by the stable `hash6`/sessionId filename suffix (no second model call). Output dir `.sessions/` is `.gitignore`d. No `install.sh` change is required — the whole `.pi/agent` directory is symlinked by `install.sh` and the extension ships no `package.json`.
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
- **Don't fight pi-lens autoformat.** pi-lens formats on edit, but only surfaces the repo declares (shfmt with `.editorconfig`, ruff with `ruff.toml`, biome with a `biome.json` and lockfile), and it takes the formatter from PATH. The repo's config files are the style contract every caller shares; run `style-check` rather than a formatter by hand (`docs/adr/0022-one-style-contract.md`). Whole-file churn on edit means the file disagrees with the formatter — resolve it, don't commit around it. **First-party** files: conform the file (`style-check --fix`). **Vendored/upstream** files: exclude them (`.styleignore` plus the matching `ruff.toml` `extend-exclude` / `biome.json` `files.includes`, or a local `biome.json` with the formatter off) so re-syncs stay clean — never reflow vendored code for "uniformity."
