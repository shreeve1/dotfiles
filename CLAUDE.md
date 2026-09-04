# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## Primary agent: DeepSeek Harness (dsh)

The self-hosted DeepSeek Harness (dsh) web UI on `aidev` is the user's main agent
surface; the other tool configs here support it and legacy workflows. See
`docs/deepseek-harness.md` for access, architecture, and recovery.

**Building or installing dsh plugins?** Load the `dsh-plugin-build` skill
first (`.claude/skills/dsh-plugin-build/SKILL.md`) — a dispatcher to the
`dsh-plugin-guide` skill (the plugin contract) and to `docs/deepseek-harness.md`
(the deployment's install/audit rules). Always install via `dsh plugin
--profile web add <spec>`; never hand-stage packages into `node_modules`.
One plugin per restart, and only packages that declare `dsh.bundle` go in
`dsh.profile.bundles` — client-only plugins mount via `- insert:` rows.
See that doc's "Install best practices" for the full list.

**Unattended build board.** Six per-stage cron ticks walk a spec from `Spec` to
`Archive` in this repo fully autonomously — `Merge` now does the
`git merge --ff-only` itself (no human gate), but ONLY as a strict fast-forward:
a diverged lane bounces to Build, and git's own `--ff-only`/dirty-tree refusals
mean the board can never create a merge commit, force, or overwrite uncommitted
work on `main`.
Read `dsh-board/INSTALL.md` before touching it — install order, how to use it,
and the failure modes that have actually bitten. Stage contracts live in
`dsh-board/HANDLERS.md` (symlinked to `~/.dsh-boards/dotfiles/`); write specs
with the `dsh-spec` skill.

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
- Always-on agent rules: `.claude/rules/*.md` — injected into **every dsh
  session and every delegated subagent** by `dsh-cc-skills` (needs the
  `~/.claude/rules -> dotfiles/.claude/rules` symlink that `install.sh`
  creates). This is the only lane that applies without the model choosing
  to load anything: a skill contributes just its one-line description to context
  until something calls the `skill` tool, which on plain coding tasks it does
  not do (verified 2026-09-02). Keep the lane small (currently ~1.9 KB) — it is
  paid on every turn. Note dsh does **not** read `~/.claude/CLAUDE.md`; its
  native chain is `~/.dsh/AGENTS.md` plus `AGENTS.md`/`CLAUDE.md` from project
  root down to cwd.
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

- **OpenCode:** `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` and `OPENCODE_DISABLE_CLAUDE_CODE`
  must stay **unset**, or canonical `~/.claude/skills/` are invisible. OpenCode
  silently drops skills whose `model:` isn't `provider/model` form.
- **graphify CLI is machine-local** (`uv tool install graphifyy`, double-y), not
  synced; only its skill + guard extension sync.
- **Fusion is on by default on this machine.** Claude Code writes/bash are gated to
  a delegation allowlist; mutations go through `bin/pi-delegate`. Toggle with
  `claude-fusion on|off|status` from your shell (not runnable by the agent), or drop
  `.claude/.fusion-off` per-repo.
- **Browser automation is available via `dsh-pilot`** (`pilot_*` tools — headless
  Chrome, text-first page snapshots; the ✈️ cockpit panel is the web surface).
  Tools auto-register into the catalog, so sessions discover them with no prompt
  mention — but Fusion withholds `pilot_*` from the orchestrator (same allowlist
  as `bash`/`web_search`), so delegate to a worker to drive the browser, or turn
  Fusion off. See `docs/deepseek-harness.md` (inventory row 7 + "Pilot tool
  discovery") for details.

## Editing rules

- `.claude/CLAUDE.md` is the canonical global guidance. Edit it directly;
  don't recreate `.config/opencode/AGENTS.md`.
- `.claude/settings-*.json` are gitignored (provider-specific, machine-local).
  The tracked seed is `.claude/settings.json.template`.
- Plans under `plans/` are gitignored (machine-local scratch).
