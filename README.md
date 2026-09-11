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
- `~/.config/opencode` (retired remnants; the OpenCode binary is gone)
- `~/.agents` + `~/.dsh/AGENTS.md` (AGENTS-standard lane — the canonical agent context)
- selected Codex config under `~/.codex`
- `~/.pi/agent`
- The Claude Code lane is **retired**; `archive/claude/` is preserved as a historical snapshot only.

## Layout

Repo mirrors home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  AGENTS.md        (repo-level agent context; dsh loads this natively)
  .agents/
    AGENTS.md      (canonical global guidance: Agent Notes + always-on rules)
    skills/        (canonical shared skills, 82 entries + _shared helpers)
  archive/
    claude/        (retired Claude Code lane, preserved as a historical snapshot: CLAUDE.md, skills/,
                    commands/, agents/, hooks/, rules/, settings templates, scripts)
  .config/
    opencode/
      plugins/     (tokenjuice)
      archive/     (retired OpenCode commands/agents/skills)
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
| Global agent guidance | `~/.agents/AGENTS.md` (→ `~/.dsh/AGENTS.md` for dsh) | The AGENTS standard is read natively by dsh, codex (bridged), and pi. |
| Reusable skills | `~/.agents/skills/` | dsh loads them natively (rank-500 `user-agents`); codex via per-skill links. Skills with `disable-model-invocation: true` are user-invocable only and never enter the model catalog — that is deliberate. |
| Repo-level context | `AGENTS.md` at repo root | dsh loads `AGENTS.md`/`CLAUDE.md` from project root down to cwd; Claude Code (2.1.220) reads only `CLAUDE.md`, so Claude-flavored repos keep that name. |
| Slash commands / subagents / hooks | retired (`archive/claude/`) | Claude Code lane, dark since 2026-09-10; preserved only as a historical snapshot. |
| Claude Code config | machine-local `~/.claude/settings*.json` | Never tracked; the retired seed lives at `archive/claude/settings.json.template`. |
| Provider/model config | tool-specific | Pi `~/.pi/agent/settings*.json`; OpenCode retired (config `.bak`'d). |
| MCP servers | tool-specific | Pi owns this lane under omp; no Claude-Code MCP wiring now that the lane is retired. |

## New Machine Setup

1. Clone repo to `~/dotfiles`.
2. Install local runtime prerequisites you want on this machine.
3. Run installer.
4. Seed Pi settings: `cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json` then edit provider/model per machine if needed.
5. Install the graphify CLI (machine-local, needed for the codebase knowledge-graph skill + auto-refresh hook): `uv tool install graphifyy` (the command stays `graphify`). Then `uv tool update-shell` if `~/.local/bin` is not yet on PATH.

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
- links the AGENTS-standard lane (`~/.agents/AGENTS.md` + `~/.agents/skills` + `~/.dsh/AGENTS.md`) and the codex per-skill bridge
- links the synced global git hooks dir (`~/.config/git/hooks`) and points git's global `core.hooksPath` at it (only when unset or already ours) so the graphify commit hook fires in every repo
- keeps auth, history, sessions, logs, caches, and secrets machine-local

## Notes

- graphify (codebase knowledge graph): the skill is synced (`~/.agents/skills/graphify`); the CLI is machine-local (`uv tool install graphifyy`). The synced global git hook `~/.config/git/hooks/post-commit` runs `graphify update .` in the background after each commit, but **only** in repos that already have a `graphify-out/` graph and only when the CLI is on PATH — it is a silent no-op everywhere else. Set up a project's graph once with `/graphify .` in your assistant. Verify wiring with `git config --global core.hooksPath` and `command -v graphify`.
- Machine-local or sensitive files should stay out of repo unless explicitly managed here.
- `~/.codex` should be real directory; managed config inside it should point back to this repo.

## Validation

After install, verify the lanes are live:

```bash
# AGENTS-standard lane (dsh + codex)
readlink ~/.dsh/AGENTS.md ~/.agents/AGENTS.md ~/.agents/skills ~/.codex/AGENTS.md
ls ~/.agents/skills | wc -l                  # 82 skills + _shared

# Pi delegation setup
pi --version
grep -F '## Delegate Non-Trivial Work' ~/.pi/agent/APPEND_SYSTEM.md
test -f ~/.pi/agent/extensions/pi-subagents/package.json
grep -F '"extensions/pi-subagents"' ~/.pi/agent/settings.json ~/.pi/agent/settings.json.template
npm --prefix ~/.pi/agent/extensions/pi-subagents ls --depth=0
```

In a fresh dsh session the context banner should show `~/.dsh/AGENTS.md` plus the
repo-level `AGENTS.md` chain, and the skill catalog should list the ~31
model-visible lane skills (the rest are `disable-model-invocation: true` by
design). In Pi: run `/reload`, then `/agents` and confirm the custom agent list
appears. The Claude Code lane is retired; the historical snapshot under
`archive/claude/` should not be restored without an explicit revisit.
