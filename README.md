# Dotfiles

This repo stores config files and folders synced across machines.

## Managed Config

- `~/.zshrc`
- `~/.config/starship.toml`
- `~/.config/tmux`
- `~/.config/ghostty`
- `~/.config/nvim`
- `~/.config/yazi`
- `~/.config/zellij`
- `~/.config/opencode`
- selected Claude Code config under `~/.claude`
- selected Codex config under `~/.codex`
- `~/.pi/agent`

## Layout

Repo mirrors home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  .config/
    opencode/
      opencode.json
      plugins/       (tokenjuice)
      archive/       (retired OpenCode commands/agents/skills)
  .claude/
    CLAUDE.md        (canonical agent guidance for Claude Code AND OpenCode)
    commands/        (canonical slash commands)
    agents/          (canonical Claude Code subagents)
    skills/          (canonical shared skills, discovered by both tools)
    hooks/           (Claude Code hook scripts)
    settings.json.template
    switch-provider.sh
  .pi/
    agent/
      APPEND_SYSTEM.md       (Pi delegation policy)
      agents/                (empty; builtins ship in pi-subagents)
      extensions/
        pi-subagents/        (vendored nicobailon subagent runtime)
        session-log/         (per-turn transcripts -> <repo>/.sessions/*.md)
      settings.json.template
  .codex/
  install.sh
  install-win.ps1
```

### Canonical vs tool-specific

| Concern | Canonical Home | Why |
| --- | --- | --- |
| Global agent guidance | `~/.claude/CLAUDE.md` | Claude Code reads natively; OpenCode reads via `opencode.json` `instructions[]`. |
| Slash commands | `~/.claude/commands/` | Claude Code is canonical. Retired OpenCode commands live under `~/.config/opencode/archive/commands/`. |
| Subagents | Tool-specific | Claude Code uses `~/.claude/agents/`; Pi uses the vendored `pi-subagents` (nicobailon) runtime with its builtin agents. |
| Reusable skills | `~/.claude/skills/` | Claude reads natively, OpenCode falls back to `~/.claude/skills/`. |
| Hook scripts | `~/.claude/hooks/` | Claude-specific runtime. |
| Provider/model config | tool-specific | Claude `~/.claude/settings*.json`; OpenCode `~/.config/opencode/opencode.json`. Schemas differ — no shared format. |
| MCP servers | tool-specific | Claude: `~/.claude.json` (machine-local) or `claude mcp add`; OpenCode: `opencode.json`. |

## New Machine Setup

1. Clone repo to `~/dotfiles`.
2. Install local runtime prerequisites you want on this machine.
3. Run installer.
4. Seed Claude settings: `cp ~/.claude/settings.json.template ~/.claude/settings.json` then fill in API keys.
5. Seed Pi settings: `cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json` then edit provider/model per machine if needed.
6. Install the graphify CLI (machine-local, needed for the codebase knowledge-graph skill + auto-refresh hook): `uv tool install graphifyy` (the command stays `graphify`). Then `uv tool update-shell` if `~/.local/bin` is not yet on PATH.

```bash
git clone <dotfiles> ~/dotfiles
~/dotfiles/install.sh
```

On Windows PowerShell:

```powershell
git clone <dotfiles> $HOME\dotfiles
Set-ExecutionPolicy -Scope Process Bypass -Force
& "$HOME\dotfiles\install-win.ps1"
```

Windows symlinks require Developer Mode or an elevated PowerShell.

If repo lives somewhere else, set `DOTFILES_DIR` first:

```bash
DOTFILES_DIR=/path/to/dotfiles /path/to/dotfiles/install.sh
```

```powershell
$env:DOTFILES_DIR = "C:\path\to\dotfiles"
& "$env:DOTFILES_DIR\install-win.ps1"
```

### Pi subagents on another system

The repo already contains the Pi subagent runtime, agent definitions, and
delegation policy. Install them together; do not install a second runtime:

```bash
git clone <dotfiles> ~/dotfiles
cd ~/dotfiles
INSTALL_PI_CLI=1 bash install.sh   # omit INSTALL_PI_CLI=1 when Pi already exists
cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json
# edit provider/model settings, then restart Pi or run /reload
```

Use `/agents` in Pi to inspect the available agent types. To repair stale npm
dependencies after a pull, run `INSTALL_PI_NPM=always bash install.sh`.

This setup uses the vendored `pi-subagents` (nicobailon) runtime, which spawns
each subagent as a fresh child `pi` process with its own model (worker →
`minimax/MiniMax-M3`, reviewer → `deepseek/deepseek-v4-flash`; set in
`settings.json` `subagents.agentOverrides`). Do **not** `pi install
npm:pi-subagents`; use the repo copy so it syncs.

## What Install Scripts Do

- creates parent directories when needed
- creates symlinks from home directory back to this repo
- preserves conflicting live files or symlinks with timestamped `-bak-YYYYMMDDTHHMMSSZ` names
- leaves correct symlinks alone
- links app-level directories under `~/.config` instead of replacing entire `~/.config`
- links selected files and directories under `~/.codex` instead of replacing entire `~/.codex`
- links selected Claude Code files under `~/.claude` when `INSTALL_CLAUDE_CODE=1` (or not `0` on Windows)
- links `~/.pi/agent`, installs the vendored `pi-subagents` dependencies, and checks its runtime, policy, and settings registration
- links the synced global git hooks dir (`~/.config/git/hooks`) and points git's global `core.hooksPath` at it (only when unset or already ours) so the graphify commit hook fires in every repo
- keeps auth, history, sessions, logs, caches, and secrets machine-local

## Notes

- graphify (codebase knowledge graph): the skill is synced (`~/.claude/skills/graphify`); the CLI is machine-local (`uv tool install graphifyy`). The synced global git hook `~/.config/git/hooks/post-commit` runs `graphify update .` in the background after each commit, but **only** in repos that already have a `graphify-out/` graph and only when the CLI is on PATH — it is a silent no-op everywhere else. Set up a project's graph once with `/graphify .` in your assistant. Verify wiring with `git config --global core.hooksPath` and `command -v graphify`.
- Machine-local or sensitive files should stay out of repo unless explicitly managed here.
- `~/.codex` should be real directory; managed config inside it should point back to this repo.

## Validation

After install, verify both tools see canonical content:

```bash
claude --version                       # Claude Code installed
opencode --version                     # OpenCode installed
opencode debug skill                   # OpenCode discovers canonical skills
node -e "const c=require(process.env.HOME+'/.config/opencode/opencode.json'); console.log(c.instructions.includes('~/.claude/CLAUDE.md'))"

# Pi delegation setup
pi --version
grep -F '## Delegate Non-Trivial Work' ~/.pi/agent/APPEND_SYSTEM.md
test -f ~/.pi/agent/extensions/pi-subagents/package.json
grep -F '"extensions/pi-subagents"' ~/.pi/agent/settings.json ~/.pi/agent/settings.json.template
npm --prefix ~/.pi/agent/extensions/pi-subagents ls --depth=0
```

In an interactive Claude Code session: `/memory`, `/skills`, `/hooks`, `/mcp`, `/doctor`.
In Pi: run `/reload`, then `/agents` and confirm the custom agent list appears.

If `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` or `OPENCODE_DISABLE_CLAUDE_CODE=1` is set, OpenCode will not see canonical skills. Unset to restore shared discovery.
