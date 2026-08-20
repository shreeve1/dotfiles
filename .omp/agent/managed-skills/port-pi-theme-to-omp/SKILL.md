---
name: port-pi-theme-to-omp
description: "Port a pi-mono coding-agent theme (dotfiles/.pi/agent/themes/*.json) to an OMP (Oh My Pi) custom theme (~/.omp/agent/themes/*.json) and validate it through the real loader. Use when the user asks for an omp version of a theme, wants a theme ported, or mentions omp themes."
---

# Port a pi-mono theme to OMP

"omp" = Oh My Pi coding agent (NOT oh-my-posh — if in doubt, ask).

## Locations
- Source pi themes: `~/.pi/agent/themes/<name>.json` (schema: `badlogic/pi-mono/.../modes/interactive/theme/theme-schema.json`)
- OMP custom themes: `~/.omp/agent/themes/<name>.json` (on this machine a symlink into dotfiles repo: `dotfiles/.omp/agent/themes/`). Create the dir if missing.
- OMP package: `~/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent` (src is shipped; `src/modes/theme/` has loader.ts, schema, dark.json/light.json references)

## Why a plain copy fails
OMP's loader (`src/modes/theme/loader.ts` → `loadThemeJson`) validates with `@oh-my-pi/omptype` against its schema: `name` + `colors` with ~66 REQUIRED keys, `additionalProperties: false`. Older pi themes are missing 15 keys OMP added:
- `pythonMode`
- `statusLineBg`, `statusLineSep`, `statusLineModel`, `statusLinePath`, `statusLineGitClean`, `statusLineGitDirty`, `statusLineContext`, `statusLineSpend`, `statusLineStaged`, `statusLineDirty`, `statusLineUntracked`, `statusLineOutput`, `statusLineCost`, `statusLineSubagents`

Missing keys → loadThemeJson throws "Missing required color tokens".

## Steps
1. Read source theme; keep `vars`, `colors` (existing keys map 1:1), and `export` verbatim.
2. Append the 15 missing keys, referencing existing vars (palette-consistent). Reference `dark.json` in `src/modes/theme/` for sensible semantics (e.g. statusLineModel pink-ish, statusLinePath cyan-ish, GitClean green, GitDirty yellow).
3. Update `$schema` to `https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/theme-schema.json` (same as dark.json).
4. Write to `~/.omp/agent/themes/<name>.json`.
5. Validate through the REAL loader, not just jq. Temp script in the package dir (resolution needs the global node_modules tree):
   ```ts
   // validate.ts at ~/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/
   import { loadThemeJson, getAvailableThemes } from "@oh-my-pi/pi-coding-agent/modes/theme/loader";
   const themes = await getAvailableThemes();
   console.log("listed:", themes.includes("<name>"));
   const t = await loadThemeJson("<name>");
   console.log("loaded OK:", t.name, Object.keys(t.colors).length);
   ```
   Run `bun run validate.ts` from the package dir, then delete it.

## Activation (user's choice — don't flip without asking)
- In-app: `/theme <name>` or the settings picker (custom themes auto-discovered).
- Config: `theme.dark: <name>` in `~/.omp/agent/config.yml` (agent data dir; on this machine symlinked from `~/.omp/agent` → `dotfiles/.omp/agent`).

## Pitfalls
- Color values: hex `#RRGGBB`, var reference, empty string (terminal default), or int 0–255.
- Don't confuse with oh-my-posh: `~/.config/oh-my-posh/kali.omp.json` is a different theme engine entirely (shell prompt, JSON schema v4); that dir is NOT tracked in the dotfiles repo.
- The pi source themes stay untouched; omp themes are separate files.
