# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## Primary agent: DeepSeek Harness (dsh)

The self-hosted DeepSeek Harness (dsh) web UI on `aidev` is the user's main agent
surface; the other tool configs here support it and legacy workflows. See
`docs/deepseek-harness.md` for access, architecture, and recovery.

**Building or installing dsh plugins?** Load the `dsh-plugin-build` skill
first (`.agents/skills/dsh-plugin-build/SKILL.md`) — a dispatcher to the
`dsh-plugin-guide` skill (the plugin contract) and to `docs/deepseek-harness.md`
(the deployment's install/audit rules). Always install via `dsh plugin
--profile web add <spec>`; never hand-stage packages into `node_modules`.
One plugin per restart, and only packages that declare `dsh.bundle` go in
`dsh.profile.bundles` — client-only plugins mount via `- insert:` rows.
See that doc's "Install best practices" for the full list.

## On a fresh machine

Run `bash install.sh` from the repo root. See `README.md` for the full setup
sequence (settings.json seeding, per-machine MCP bootstrap, validation
commands).

## Canonical surfaces

- **AGENTS standard lane (canonical):** `.agents/AGENTS.md` (merged guidance:
  Agent Notes + always-on rules) and `.agents/skills/<name>/SKILL.md` — the
  canonical lane consumed by dsh (natively via `~/.dsh/AGENTS.md` →
  `dotfiles/.agents/AGENTS.md`, rank 500 `user-agents` for skills), codex
  (bridged via `~/.codex/AGENTS.md` and per-skill links), and pi (deferred).
  This is the only lane that applies without the model choosing to load
  anything: a skill contributes just its one-line description to context until
  something calls the `skill` tool, which on plain coding tasks it does not do.
  Keep the lane small — it is paid on every turn. Of the 82 skills, 51 carry
  `disable-model-invocation: true` (user-invocable only, never in the catalog) —
  that is deliberate, do not "fix" it.
- **Repo-level context:** this file (`AGENTS.md`). dsh's chain is
  `~/.dsh/AGENTS.md` plus `AGENTS.md`/`CLAUDE.md` from project root down to
  cwd; dsh does **not** read `~/.claude/CLAUDE.md`.
- **Claude Code lane (archived 2026-09-10):** `archive/claude/` holds
  CLAUDE.md, skills/, commands/, agents/, hooks/, rules/, settings templates,
  and scripts. Nothing links it (`install.sh` skips those rows); restore with
  `mv archive/claude .claude`. Machine-local `~/.claude` state (settings.json,
  history) still works untouched. Note: Claude Code 2.1.220 reads only
  `CLAUDE.md` as its project doc — it does not auto-load `AGENTS.md` — which is
  why Claude-flavored repos keep the `CLAUDE.md` name.
- **OpenCode (retired):** binary removed, live config `.bak`'d; retired
  commands live under `.config/opencode/archive/`. The old
  `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` guidance no longer applies.
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Non-obvious requirements

**Before touching, upgrading, or re-syncing any vendored Pi/Claude extension, read
`docs/pi-extensions.md`** — it holds the full per-extension repair/rationale lore
and the exact commands. The Pi-extension mechanics that silently break things
(don't `pi install` vendored extensions; pi-lens needs `--ignore-scripts`;
disabling needs a `-extensions/<name>/index.ts` exclusion *and* the `packages`
entry removed; per-role subagent models go in `.pi/agent/settings.json`
`subagents.agentOverrides`, not frontmatter; keep the pi-subagents `biome.json`;
don't fight pi-lens autoformat) all live there with rationale.

Environment facts that aren't in that doc:

- **graphify CLI is machine-local** (`uv tool install graphifyy`, double-y), not
  synced; only its skill + guard extension sync.
- **Fusion is on by default on this machine.** Claude Code writes/bash are gated to
  a delegation allowlist; mutations go through `bin/pi-delegate`. Toggle with
  `claude-fusion on|off|status` from your shell (not runnable by the agent), or drop
  `.claude/.fusion-off` per-repo.
- **Browser automation uses the real Chrome `ai` profile** through
  `@caob23/dsh-browser-control` and its unpacked extension at
  `~/.dsh/browser-control-extension`. Use the `browser_*` tools whenever browser
  interaction is needed; they operate the user's logged-in desktop Chrome tabs.
  `dsh-pilot` and its headless `pilot_*` tools were removed 2026-09-15. See
  `docs/deepseek-harness.md` for install, translation, and recovery details.

## Editing rules

- `.agents/AGENTS.md` is the canonical global guidance; edit it directly.
  The repo-level context file is this file (`AGENTS.md` at the repo root).
- Claude `settings-*.json` live machine-local in `~/.claude` (gitignored);
  the archived seed is `archive/claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
