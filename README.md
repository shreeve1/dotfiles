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
- Omarchy on Linux: `~/.config/hypr`, `~/.config/omarchy`,
  `~/.config/chromium-flags.conf`, and `~/.config/mimeapps.list`
  (stored under `omarchy/`; linked only when Omarchy is installed)
- `~/.config/opencode` (retired remnants; the OpenCode binary is gone)
- `~/.agents` (AGENTS-standard lane — the canonical agent context) + `~/.dsh/AGENTS.md` (dsh-only add-on)
- selected Codex config under `~/.codex`
- `~/.pi/agent`
- The Claude Code lane is **retired**; its old snapshot is no longer in the repo.

## Layout

Repo mirrors home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  AGENTS.md        (repo-level agent context; dsh loads this natively)
  .agents/
    AGENTS.md      (canonical global guidance: Agent Notes + always-on rules)
    skills/        (canonical shared skills, plus _shared helpers)
  archive/         (retired scripts, docs and skills, kept for reference)
  .config/
    opencode/
      plugins/     (tokenjuice)
  .pi/
    agent/
      APPEND_SYSTEM.md       (Pi delegation policy, written for pi-fabric)
      fabric.json            (pi-fabric config: role model aliases)
      extensions/            (vendored: pi-lens, rpiv-web-tools, verify-final, ...)
      extensions-archive/    (retired extensions, kept for rollback)
      settings.json.template
  .codex/
  omarchy/             (Linux/Omarchy-only desktop configuration and migration guide)
  install.sh
  install-win.ps1
```

### Canonical vs tool-specific

| Concern | Canonical Home | Why |
| --- | --- | --- |
| Global agent guidance | `~/.agents/AGENTS.md`, plus `~/.dsh/AGENTS.md` (from `.dsh/AGENTS.md`) as a dsh-only add-on | The AGENTS standard is read natively by dsh, codex (bridged), and pi. |
| Reusable skills | `~/.agents/skills/` | dsh loads them natively (rank-500 `user-agents`); codex via per-skill links. Skills with `disable-model-invocation: true` are user-invocable only and never enter the model catalog — that is deliberate. |
| Repo-level context | `AGENTS.md` at repo root | dsh loads `AGENTS.md`/`CLAUDE.md` from project root down to cwd; Claude Code (2.1.220) reads only `CLAUDE.md`, so Claude-flavored repos keep that name. |
| Slash commands / subagents / hooks | retired | Claude Code lane, dark since 2026-09-10; no longer in the repo. |
| Claude Code config | machine-local `~/.claude/settings*.json` | Never tracked; the retired seed is no longer in the repo. |
| Provider/model config | tool-specific | Pi `~/.pi/agent/settings*.json`; OpenCode retired (config `.bak`'d). |
| MCP servers | tool-specific | Pi owns this lane under omp; no Claude-Code MCP wiring now that the lane is retired. |

## New Machine Setup

1. Clone repo to `~/dotfiles`.
2. Install local runtime prerequisites you want on this machine.
3. Run installer.
4. Seed Pi settings: `cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json` then edit provider/model per machine if needed.
5. herdr's config and its saved remote machine list both come from the repo on install; if you add or remove machines, copy the live list back over `herdr/endpoints.json`. SSH aliases and keys stay machine-local. See [`docs/herdr.md`](docs/herdr.md).

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

The full Windows standard (WSL2 agent host, PowerShell and Terminal look,
PowerToys, what is safe to commit) lives in [`windows/`](windows/README.md);
`install-win.ps1` is one step of it.

If repo lives somewhere else, set `DOTFILES_DIR` first:

```bash
DOTFILES_DIR=/path/to/dotfiles /path/to/dotfiles/install.sh
```

```powershell
$env:DOTFILES_DIR = "C:\path\to\dotfiles"
& "$env:DOTFILES_DIR\install-win.ps1"
```

### Pi on another system (pi-fabric)

Agents, workflows and delegation come from the `pi-fabric` npm package; role
models are aliases in `~/.pi/agent/fabric.json`:

```bash
git clone <dotfiles> ~/dotfiles
cd ~/dotfiles
INSTALL_PI_CLI=1 bash install.sh   # omit INSTALL_PI_CLI=1 when Pi already exists
cp ~/.pi/agent/settings.json.template ~/.pi/agent/settings.json
# edit provider/model settings, then install the packages the template lists:
pi install npm:pi-cc-extensions && pi install npm:pi-btw
pi install npm:pi-fabric@0.131.4   # then restore the filtered entry (below)
```

`pi install` rewrites the `packages` entry as a plain string, so afterwards
put back the template's object form, which keeps the Coral Bricks provider out:
`{"source": "npm:pi-fabric@0.131.4", "extensions": ["!node_modules/pi-coralbricks-provider/**"]}`.
See `docs/pi-extensions.md` § pi-fabric.

## What Install Scripts Do

- creates parent directories when needed
- creates symlinks from home directory back to this repo
- preserves conflicting live files or symlinks with timestamped `-bak-YYYYMMDDTHHMMSSZ` names
- leaves correct symlinks alone
- links app-level directories under `~/.config` instead of replacing entire `~/.config`
- links selected files and directories under `~/.codex` instead of replacing entire `~/.codex`
- links the AGENTS-standard lane (`~/.agents/AGENTS.md` + `~/.agents/skills` + `~/.dsh/AGENTS.md`) and the codex per-skill bridge
- links the synced global git hooks dir (`~/.config/git/hooks`) and points git's global `core.hooksPath` at it (only when unset or already ours) so the repo check hook fires in every repo
- keeps auth, history, sessions, logs, caches, and secrets machine-local

## Notes

- graphify (codebase knowledge graph): removed fleet-wide on 2026-10-31 — the synced skill, the machine-local CLI (`uv tool install graphifyy`) and the global `post-commit` refresh hook are gone, together with the archived Pi `graphify-guard` extension. Nothing to install or wire up; see `docs/pi-extensions.md`.
- Machine-local or sensitive files should stay out of repo unless explicitly managed here.
- `~/.codex` should be real directory; managed config inside it should point back to this repo.

## Checking changes

Run these commands from the repository root. These check repository changes;
for post-install checks, see “Verify installation” below.

| Check | Command | When to use it |
| --- | --- | --- |
| Structural checks | `bash check.sh` | Check install sources, shell/Python/JSON syntax, and installed symlinks without writing files. |
| One test file | `bash tests/sync-starter-skills.test.sh` | Example: replace this with the test file relevant to your change. |
| Style checks | `bin/style-check README.md` | Example: pass the changed file paths to check formatting and lint; add `--fix` to apply formatting and safe fixes. |
| Fast pre-push checks | `bash tests/run-all.sh --fast` | Run formatting and tracked-test guards plus test files changed on this branch or in the working tree. |
| Full verification | `bash tests/run-all.sh` | Run every test file and the formatting guard; required before pushing. |

**`--fast` selects changed test files, not tests matched to changed source code.**
If you changed only source files, it may run just the guards. Run the relevant
test file explicitly during iteration, then the full suite before pushing.
The pre-push hook runs only `--fast`; it is not a substitute for the full suite.

Use `bin/style-check --doctor` to verify the installed style tools match the
pinned versions. Without file arguments, `style-check` checks all tracked files;
pass explicit paths for a small change. The test runner's formatting guard does
not replace the separate lint check.

See `AGENTS.md` for agent-specific working rules and `docs/adr/0022-one-style-contract.md`
for the shared style contract.

## Verify installation

After install, verify the lanes are live:

```bash
# AGENTS-standard lane (dsh + codex)
readlink ~/.dsh/AGENTS.md ~/.agents/AGENTS.md ~/.agents/skills ~/.codex/AGENTS.md
ls ~/.agents/skills                          # skill folders, plus _shared

# Pi + pi-fabric
pi --version
pi list                                      # pi-fabric@0.131.4 (filtered)
grep -F '# Delegation guidance (pi-fabric)' ~/.pi/agent/APPEND_SYSTEM.md
pi --list-models | grep -c coralbricks       # 0
```

In a fresh dsh session the context banner should show `~/.dsh/AGENTS.md` plus the
repo-level `AGENTS.md` chain, and the skill catalog should list the
model-visible lane skills (those without `disable-model-invocation: true`, which is deliberate). In Pi: run `/reload`, then `/fabric` and confirm the dashboard opens. The Claude Code lane is retired and should not be restored without an explicit revisit.
