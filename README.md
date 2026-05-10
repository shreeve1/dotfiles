# Dotfiles

This repo stores the config files and folders you want to keep synced across machines.

## Managed Config

- `~/.zshrc`
- `~/.config/starship.toml`
- `~/.config/tmux`
- `~/.config/ghostty`
- `~/.config/nushell`
- `~/.config/nvim`
- `~/.config/yazi`
- `~/.config/zellij`
- `~/.config/opencode`
- shared PAI runtime tree at `~/.pai/PAI` (used by OpenCode without requiring Claude Code)
- selected Claude/PAI config under `~/.claude` (only relevant if Claude Code is installed)
- selected Codex config under `~/.codex`
- `~/.pi/agent`
- `~/.pi/agent-sessions`
- PiPerspective OpenCode skill at `~/.config/opencode/skills/PiPerspective`
- PiPerspective OpenCode plugin at `~/.config/opencode/plugins/pai-pi-perspective`

OpenCode reads its instructions and PAI content from `~/.pai/PAI/...`; the
`~/.claude/PAI/...` tree is for Claude Code. Both point at the same source
files in this repo, so installing one does not require the other.

## Layout

The repo mirrors the home-directory structure so symlink targets stay obvious:

```text
~/dotfiles/
  .config/
    ghostty/
      config
    opencode/
      opencode.json
      tui.json
      skills/
      agents/
      ...
  install.sh
```

## New Machine Setup

1. Clone the repo to `~/dotfiles`
2. Install local runtime prerequisites you want on this machine:

```bash
# Required for OpenCode helpers and PiPerspective TypeScript tools.
# Install via your OS package manager or https://bun.sh/docs/installation,
# then confirm:
bun --version

# Required for PiPerspective reviews
npm install -g @mariozechner/pi-coding-agent
```

3. Run the install script:

```bash
~/dotfiles/install.sh
```

If the repo lives somewhere else, set `DOTFILES_DIR` first:

```bash
DOTFILES_DIR=/path/to/dotfiles /path/to/dotfiles/install.sh
```

4. Install Pi config dependencies if you use Pi or PiPerspective:

```bash
cd ~/.pi/agent && npm install
```

5. Add provider credentials to your local Pi auth file. Do **not** commit this file.

```bash
$EDITOR ~/.pi/agent/auth.json
```

Minimal shape:

```json
{
  "openai": { "type": "api_key", "key": "sk-..." }
}
```

## What the Install Script Does

- creates parent directories when needed
- creates symlinks from your home directory back to this repo
- preserves conflicting live files or symlinks with timestamped `-bak-YYYYMMDDTHHMMSSZ` names
- leaves correct symlinks alone
- links app-level directories under `~/.config` instead of replacing the entire `~/.config` directory, so unrelated app config can remain machine-local
- links selected files and directories under `~/.codex` instead of replacing the entire directory, so Codex auth, history, sessions, logs, and caches stay machine-local
- links tracked Claude and Codex PAI system files individually and skips personal/runtime PAI paths such as `USER`, `MEMORY`, `templates/USER`, `State`, `Scratchpad`, logs, JSONL, local config, and secrets
- links `~/.config/opencode`, including PiPerspective skill/plugin files and plugin registration in `opencode.json`
- links Pi config under `~/.pi/agent` but does not install global npm packages or write API keys
- warns if `pi`, `bun`, or `~/.pi/agent/node_modules` are missing; the installer does not auto-install dependencies

## Notes

- machine-local or sensitive files should stay out of the repo unless you explicitly want to manage them here
- your current OpenCode setup intentionally leaves runtime and account-specific files outside dotfiles
- `~/.codex` should be a real directory; managed Codex config inside it should point back to this repo
- personal PAI context belongs under local ignored paths like `~/.pai/PAI/USER`, `~/.codex/pai/USER`, or `~/.claude/PAI/USER`, not in the synced system PAI files

## OpenCode-only install (no Claude Code)

OpenCode is fully usable without Claude Code installed. The install script
links the PAI source tree to `~/.pai/PAI/` and `~/.config/opencode/` reads
instructions, modes, and Algorithm content from `~/.pai/PAI/...`. All
OpenCode plugins write runtime state under `~/.pai/` and never require
`~/.claude/` to exist.

Minimum sequence on a fresh machine:

```bash
git clone <dotfiles> ~/dotfiles
INSTALL_CLAUDE_CODE=0 ~/dotfiles/install.sh
# OpenCode now has ~/.pai/PAI/{Algorithm,AISTEERINGRULES.md,USER,...}
# and no ~/.claude/* clutter.
```

Setting `INSTALL_CLAUDE_CODE=0` skips the `~/.claude/{CLAUDE.md,PAI,skills,
hooks,commands,agents,lib,MEMORY}` link block. Default is `1` (install both
trees) for users who run Claude Code alongside OpenCode. Either way, OpenCode
reads only from `~/.pai/...` and `~/.config/opencode/...`.

### After install: identity setup

`install.sh` seeds `~/.pai/PAI/USER/AISTEERINGRULES.md`,
`~/.pai/PAI/USER/PRINCIPAL_IDENTITY.md`, and
`~/.pai/PAI/USER/DA_IDENTITY.md` from the in-repo defaults (copy, not
symlink) so they stay machine-local. The `AGENTS.md` "refer to the user by
name" rule reads from these files — edit them with your real identity
content before relying on the directive. Anything else under `~/.pai/PAI/USER/`
is not seeded; create it as needed.

### After install: PiPerspective setup

PiPerspective is the OpenCode second-mind review system that invokes the
external `pi` CLI at Algorithm phase boundaries (THINK, PLAN, VERIFY). The
dotfiles installer links the skill and plugin, but the external CLI, npm
dependencies, and provider credentials are intentionally machine-local.

Installed files:

| Path | Purpose |
| --- | --- |
| `~/.config/opencode/skills/PiPerspective/` | Operator docs, workflows, tools, fixtures |
| `~/.config/opencode/plugins/pai-pi-perspective/` | Auto-invocation plugin |
| `~/.config/opencode/opencode.json` | Plugin registration |
| `~/.pi/agent/` | Pi agent config and dependencies |
| `~/.pai/skills` | Symlink to `~/.config/opencode/skills` |

Fresh-machine checklist:

```bash
# 1. Confirm the external pi CLI is available
pi --version

# 2. Confirm bun is available for TypeScript tools
bun --version

# 3. Install Pi agent config dependencies, if not already present
cd ~/.pi/agent && npm install

# 4. Add local provider credentials, never committed
$EDITOR ~/.pi/agent/auth.json

# 5. Smoke-test the PiPerspective wrapper
bun run ~/.config/opencode/skills/PiPerspective/Tools/InvokePi.ts --help
```

Optional config lives in `~/.pai/settings.json`:

```jsonc
{
  "pi_perspective": {
    "enabled": true,
    "model": "openai/gpt-5-codex:high",
    "min_pi_version": "0.73.1",
    "auto_invoke": {
      "Standard": [],
      "Extended": ["VERIFY"],
      "Advanced": ["PLAN", "VERIFY"],
      "Deep": ["THINK", "PLAN", "VERIFY"],
      "Comprehensive": ["THINK", "PLAN", "VERIFY"]
    },
    "verify_thinking": "minimal"
  }
}
```

If you use `openai-codex/...` model ids through a local proxy or custom Pi
provider config, make sure the corresponding provider exists in your local Pi
configuration before enabling auto-invocation. If not, set `model` to a provider
you have authenticated, such as an OpenAI, Anthropic, Google, OpenRouter, or
Ollama model supported by your Pi install.

Kill switch:

```jsonc
{
  "pi_perspective": {
    "enabled": false
  }
}
```

Memory boundary: PiPerspective does **not** inject shared PAI memory into pi.
THINK sees only ISA content, PLAN sees ISA + plan, and VERIFY has no automatic
memory injection. If pi needs memory context, copy exact excerpts into the ISA
or plan explicitly.

More detail: `~/.config/opencode/skills/PiPerspective/SKILL.md`.

### Migration from `~/.claude/...` runtime state

Plugins now write under `~/.pai/...`:

| Old path | New path | Behavior |
| --- | --- | --- |
| `~/.claude/checkpoint-repos.txt` | `~/.pai/checkpoint-repos.txt` | install.sh copies it on first run |
| `~/.claude/MEMORY/OBSERVABILITY/config-changes.jsonl` | `~/.pai/memory/OBSERVABILITY/config-changes.jsonl` | not migrated; old data is orphaned by design |
| `~/.claude/MEMORY/LEARNING/REFLECTIONS/` | `~/.pai/memory/LEARNING/REFLECTIONS/` | not migrated; old data is orphaned by design |

The audit and reflection logs are append-only operational history; we keep
the move forward-only rather than touching old files. If you want continuity,
copy the directories manually before running OpenCode.

### `PAI_RUNTIME_HOME` scope

`PAI_RUNTIME_HOME` is honored at runtime by OpenCode plugins (controls where
they read patterns and write logs). It does **not** retarget `install.sh`,
`opencode.json` `instructions[]`, AGENTS.md, or `modes/*.md` — those all
reference `~/.pai` directly. Setting `PAI_RUNTIME_HOME` to a non-default
path therefore only relocates plugin runtime state. If you want a fully
relocated runtime, also edit those references and re-link the PAI source
tree to your custom path.
