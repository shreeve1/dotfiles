---
name: personalize-harness
description: Personalize Claude Code's hook harness — formatters, validators, linters, guardrails, reinjection — for either the user's global dotfiles (all projects) or a specific project. Interviews one question at a time after probing for installed tools and existing hooks, then writes idempotent hook scripts and merges hook entries into the matching settings.json without clobbering prior hooks. Use when the user wants to add per-Edit Prettier, ESLint, JSON/Node syntax validation, Bash guardrails, or post-compact rule reinjection. Names the Fowler split — feedforward (guides) vs feedback sensors (computational + inferential).
argument-hint: "[global | project | <project-path>]"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, AskUserQuestion
---

# Personalize Harness

Personalize the Claude Code hook harness. Two modes:

- **global** — edit dotfiles `settings.json.template` + live `~/.claude/settings.json`, write hook scripts to dotfiles `.claude/hooks/` (symlinked to `~/.claude/hooks/` by `install.sh`). Applies to every project.
- **project** — edit `<project>/.claude/settings.json` (team) or `.claude/settings.local.json` (personal), write hook scripts to `<project>/.claude/hooks/`. Applies to that project only.

Hooks merge across layers; global + project both fire. The skill is **additive** — never replaces prior hooks already wired into `settings.json`.

**Per-call scope**: one call picks ONE scope and (for project) ONE layer (team vs personal). To mix — e.g. team-committed guardrails + personal-only formatters — invoke the skill twice with different answers.

## Fowler split (orienting frame)

- **Feedforward (guides)** — SessionStart / UserPromptSubmit injection. Steer the agent before it acts.
- **Feedback sensors, computational** — PostToolUse running formatters/validators/linters. Fast, deterministic.
- **Feedback sensors, inferential** — Stop with `type: prompt`. LLM-graded. Costs tokens. Optional.
- **Guardrails** — PreToolUse with `exit 2` to block. Hard stop on specific Bash patterns.

The skill bias: computational sensors first (cheap, high signal), then feedforward reinjection, then guardrails. Inferential only on request.

## Input

`$ARGUMENTS` — one of:

- `global` — operate on the dotfiles + live global settings
- `project` — operate on the current working directory
- `<absolute-path>` — operate on that project path
- empty — ask via AskUserQuestion

## Flow

1. Resolve scope → 2. Probe tools + existing settings → 3. Interview → 4. Generate scripts + merge settings → 5. Verify

## Steps

### Step 1: Resolve scope

If `$ARGUMENTS` empty, ask one question via `AskUserQuestion`:

- **global** (Recommended for first-time install) — dotfiles template + live `~/.claude/settings.json`
- **project** — current working directory's `.claude/settings*.json`
- **other path** — let user paste an absolute project root

Resolve into bash arrays (avoids word-split bugs on paths with spaces):

```bash
SCOPE_LABEL=global|project
PROJECT_ROOT=<absolute-path>          # set only for project mode

HOOK_DIR=<dir>
SETTINGS_FILES=("<file1>" "<file2>")   # 2 for global, 1 for project
```

Concrete values:

- **global**: `HOOK_DIR="$DOTFILES_DIR/.claude/hooks"`, `SETTINGS_FILES=( "$DOTFILES_DIR/.claude/settings.json.template" "$HOME/.claude/settings.json" )`
- **project, team**: `HOOK_DIR="$PROJECT_ROOT/.claude/hooks"`, `SETTINGS_FILES=( "$PROJECT_ROOT/.claude/settings.json" )`
- **project, personal**: `HOOK_DIR="$PROJECT_ROOT/.claude/hooks"`, `SETTINGS_FILES=( "$PROJECT_ROOT/.claude/settings.local.json" )`

For project scope, defer team-vs-personal until after probe — it's an interview question.

Dotfiles root: read `$DOTFILES_DIR` env; if unset, default `$HOME/dotfiles`.

**Global mode — symlink sanity check** (warn-only; writes still land in dotfiles):

```bash
if [ "$SCOPE_LABEL" = "global" ]; then
  live="$HOME/.claude/hooks"
  src="$DOTFILES_DIR/.claude/hooks"
  if [ ! -L "$live" ] || [ "$(readlink -f "$live" 2>/dev/null)" != "$(readlink -f "$src" 2>/dev/null)" ]; then
    echo "warn: ~/.claude/hooks is not a symlink to dotfiles. Run 'bash install.sh' from $DOTFILES_DIR or hooks won't fire live."
  fi
fi
```

### Step 2: Probe tools + existing settings

Probe inside the resolved scope's root so detection sees the right repo:

```bash
probe_root="${PROJECT_ROOT:-$DOTFILES_DIR}"
(
  cd "$probe_root"

  # Available tools (gate hook offers — never offer a hook for a missing tool)
  for t in prettier eslint shfmt jq ruff black gofmt rustfmt node npx; do
    if command -v "$t" >/dev/null 2>&1; then echo "have:$t"; else echo "miss:$t"; fi
  done

  # Project-local devDeps (many JS repos install these locally, not globally)
  [ -x ./node_modules/.bin/prettier ] && echo "have-local:prettier"
  [ -x ./node_modules/.bin/eslint ]   && echo "have-local:eslint"

  # Project shape
  [ -f package.json ]   && echo "lang:node"
  [ -f pyproject.toml ] && echo "lang:python"
  [ -f go.mod ]         && echo "lang:go"
  [ -f Cargo.toml ]     && echo "lang:rust"
  if compgen -G '*.sh' >/dev/null 2>&1 || compgen -G '**/*.sh' >/dev/null 2>&1; then
    echo "has:shell"
  fi

  # JSON-heaviness — used by interview Q3. Try git first (cheap), fall back to find.
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git ls-files '*.json' | head -1 | grep -q . && echo "has:json"
  else
    find . -maxdepth 3 -name '*.json' -not -path './node_modules/*' 2>/dev/null \
      | head -1 | grep -q . && echo "has:json"
  fi
)

# Existing hook config in each target settings file (per file, per event, per matcher)
for f in "${SETTINGS_FILES[@]}"; do
  if [ -f "$f" ]; then
    jq -r '.hooks // {} | to_entries[] | "\(.key)\t\([.value[].matcher] | join(","))"' "$f" 2>/dev/null \
      | sed "s|^|existing:$f:|"
  fi
done
```

`jq` is mandatory — if `miss:jq` appears, abort with: "install jq (`brew install jq` / `apt install jq`) and re-run."

Record sets: `TOOLS_HAVE` (incl. `have-local:*`), `LANGS_DETECTED`, `EXISTING_HOOKS` (per file, per event, per matcher).

### Step 3: Interview

One question at a time via `AskUserQuestion`. Only offer hooks whose tools are present. Lead option carries `(Recommended)` where there's a clear default. **Skip questions for hooks already present** in the target settings — surface those as "already configured" in the Step 5 summary.

**Global mode** — auto-include Tier 1 + Tier 3, but confirm specifics:

- **Q1 (only if multiple formatters detected)** — Which extensions to format on Edit/Write/MultiEdit? Default = union of detected formatters. Lead = "all detected (Recommended)".
- **Q2** — Compact-reinject content. Use the **three-option pattern** below (Skip / Auto-draft / Custom). Auto-draft reads `~/.claude/CLAUDE.md`.
- **Q3** — Add Bash guardrails? If yes, ask for patterns (default examples: `git commit --no-verify`, `git push --force`, `rm -rf /`). Lead = "yes (Recommended)".
- **Q4** — Validate JSON / Python / Node / Bash syntax on write (`validate-syntax.sh`, exit-2 on parse errors)? Lead = "yes (Recommended)".
- **Q5** — Add lint-on-edit (ESLint for JS/TS, Ruff for Python; exit-2 on errors)? Lead = "skip (Recommended)" — mid-refactor lint errors are common; blocking is invasive.

**Project mode** — full interview:

- **Q1** — Team-committed (`.claude/settings.json`) or personal (`.claude/settings.local.json`)? Lead = team (Recommended) for guardrails; personal for opinionated formatting. **Picks ONE layer for the whole call** — re-invoke the skill for the other layer.
- **Q2** — Format on Edit/Write/MultiEdit? Show detected formatter + matching extensions. Skip if no formatter detected.
- **Q3** — Validate JSON / Python / Node / Bash syntax? Lead = "yes (Recommended)" if relevant language detected (`lang:python`, `has:json`, `lang:node`, `has:shell`).
- **Q4** — Block Bash patterns? Free-text list (one pattern per line), or skip.
- **Q5** — Reinject context on SessionStart=compact? Use the **three-option pattern** below (auto-draft reads `<project>/CLAUDE.md` or README.md).
- **Q6** — Lint on Edit? Offer only if at least one supported lint tool is detected (`have:eslint` / `have-local:eslint` / `have:ruff`). Lead = "skip (Recommended)".
- **Q7** — Stop-hook quality checkpoint (`type: prompt`)? Lead = "skip (Recommended)" — costs tokens, low ROI. **Always ask** even when the lead is skip — the user must make this call explicitly. Don't drop the question because the recommendation is skip.

Walk sequentially. Skip Qs whose hook is already present (record as `existing` for Step 5).

**Three-option reinject pattern** (used by Global Q2 and Project Q5) — avoids the awkward AskUserQuestion → chat → AskUserQuestion dance:

1. Single `AskUserQuestion` with three options:
   - **Skip** — no reinject hook.
   - **Auto-draft from repo (Recommended)** — read `<repo>/CLAUDE.md` if present (else `README.md` top section); draft repo-specific invariants; echo the draft inline; write the hook with it.
   - **Custom text** — drop to plain chat with: "Paste the reinject text now (multi-line OK). Reply `cancel` to skip."
2. If "Custom text" selected, ask one plain-chat question for the body. Do NOT use AskUserQuestion's Other slot for multi-line text — its input is single-line.
3. If "Auto-draft" selected, generate the draft FIRST and **echo it inline** before writing, so the user sees what's being injected.

Apply this same pattern to any other multi-line free-text prompts the skill grows.

### Step 4: Generate scripts + merge settings

**Substitution convention**: placeholders in `<ANGLE_BRACKETS>` are filled by Claude at write time using interview answers; `$VARS` are bash variables resolved at hook runtime. Don't confuse the two.

**Prelude**:

```bash
mkdir -p "$HOOK_DIR"          # idempotent; creates .claude/hooks if missing
```

For each script write: if the target script file already exists with different content, save a backup `<name>.sh-bak-<UTC-stamp>` next to it, then overwrite. Re-runs may legitimately change patterns/extensions.

#### Script templates

Drop `case` arms whose tool is absent (per `TOOLS_HAVE` + `have-local:`).

**`format-on-edit.sh`** — PostToolUse, matcher `Edit|Write|MultiEdit`. Fail-open:

```bash
#!/usr/bin/env bash
# format-on-edit — runs the matching formatter for the edited file's extension.
# Fail-open: missing tool = no-op, never blocks.
set -u

path=$(jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0
[ -f "$path" ] || exit 0

# Resolve prettier: project-local > global > npx fallback.
resolve_prettier() {
  if [ -x ./node_modules/.bin/prettier ]; then
    printf '%s' './node_modules/.bin/prettier'
  elif command -v prettier >/dev/null 2>&1; then
    printf '%s' 'prettier'
  elif command -v npx >/dev/null 2>&1; then
    printf '%s' 'npx --no prettier'
  fi
}

case "$path" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.md|*.yml|*.yaml|*.css|*.html)
    bin=$(resolve_prettier)
    [ -n "$bin" ] && $bin --write --log-level=silent "$path" >/dev/null 2>&1 ;;
  *.sh|*.bash)
    command -v shfmt >/dev/null 2>&1 && shfmt -w "$path" >/dev/null 2>&1 ;;
  *.py)
    command -v ruff >/dev/null 2>&1 && ruff format --quiet "$path" >/dev/null 2>&1 \
      || (command -v black >/dev/null 2>&1 && black --quiet "$path" >/dev/null 2>&1) ;;
  *.go)
    command -v gofmt >/dev/null 2>&1 && gofmt -w "$path" >/dev/null 2>&1 ;;
  *.rs)
    command -v rustfmt >/dev/null 2>&1 && rustfmt --quiet "$path" >/dev/null 2>&1 ;;
esac
exit 0
```

**`validate-syntax.sh`** — PostToolUse, matcher `Edit|Write|MultiEdit`. Fail-closed (exit 2) on parse errors:

```bash
#!/usr/bin/env bash
set -u
path=$(jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0
[ -f "$path" ] || exit 0

case "$path" in
  *.json)
    if ! jq . "$path" >/dev/null 2>&1; then
      echo "Invalid JSON in $path — fix before continuing." >&2
      exit 2
    fi ;;
  *.cjs|*.mjs|*.js)
    if command -v node >/dev/null 2>&1 && ! node --check "$path" 2>/dev/null; then
      echo "Node syntax error in $path." >&2
      exit 2
    fi ;;
  *.py)
    if command -v python3 >/dev/null 2>&1; then
      if ! python3 -m py_compile "$path" 2>/dev/null; then
        echo "Python syntax error in $path." >&2
        exit 2
      fi
    elif command -v python >/dev/null 2>&1; then
      if ! python -m py_compile "$path" 2>/dev/null; then
        echo "Python syntax error in $path." >&2
        exit 2
      fi
    fi ;;
  *.sh|*.bash)
    if ! bash -n "$path" 2>/dev/null; then
      echo "Bash syntax error in $path." >&2
      exit 2
    fi ;;
esac
exit 0
```

**`lint-on-edit.sh`** — PostToolUse, matcher `Edit|Write|MultiEdit`. Fail-closed on lint errors (opt-in). Polyglot: ESLint for JS/TS, Ruff for Python:

```bash
#!/usr/bin/env bash
set -u
path=$(jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0
[ -f "$path" ] || exit 0

case "$path" in
  *.js|*.jsx|*.ts|*.tsx)
    bin=""
    if [ -x ./node_modules/.bin/eslint ]; then
      bin=./node_modules/.bin/eslint
    elif command -v eslint >/dev/null 2>&1; then
      bin=eslint
    fi
    [ -z "$bin" ] && exit 0
    if ! out=$("$bin" --no-fix "$path" 2>&1); then
      echo "$out" >&2
      exit 2
    fi ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      if ! out=$(ruff check "$path" 2>&1); then
        echo "$out" >&2
        exit 2
      fi
    fi ;;
esac
exit 0
```

Drop `case` arms whose lint tool is absent during generation (per `TOOLS_HAVE` + `have-local:` + `LANGS_DETECTED`). E.g. pure-Python repo with no `ruff` installed → don't register the hook at all.

**`reinject-rules.sh`** — SessionStart, matcher `compact`:

```bash
#!/usr/bin/env bash
cat <<'EOF'
<REINJECT_TEXT_FROM_INTERVIEW>
EOF
```

Single-quoted heredoc — prevents shell expansion of the injected text.

**`block-bash-pattern.sh`** — PreToolUse, matcher `Bash`. Array-safe pattern list (substituted at write time as one quoted entry per line):

```bash
#!/usr/bin/env bash
set -u
cmd=$(jq -r '.tool_input.command // empty')

patterns=(
  <PATTERNS_AS_QUOTED_LINES>
)

for pat in "${patterns[@]}"; do
  if echo "$cmd" | grep -qE "$pat"; then
    echo "Blocked by personalize-harness: matches /$pat/" >&2
    exit 2
  fi
done
exit 0
```

After writing each script: `chmod +x` it.

#### Settings merge (jq)

Idempotent merge — wraps `.hooks[]?.command` collection in an array before `index` so dedup actually fires (a raw stream is never matched by `index`):

```bash
merge_hook() {
  local file="$1" event="$2" matcher="$3" command="$4"
  local tmp; tmp=$(mktemp)
  if [ ! -f "$file" ]; then echo '{}' > "$file"; fi
  jq --arg event "$event" --arg matcher "$matcher" --arg cmd "$command" '
    .hooks //= {} |
    .hooks[$event] //= [] |
    ([ .hooks[$event][] | select(.matcher == $matcher) | .hooks[]?.command ]) as $existing |
    if ($existing | index($cmd)) then
      .
    else
      .hooks[$event] += [{
        matcher: $matcher,
        hooks: [{ type: "command", command: $cmd }]
      }]
    end
  ' "$file" > "$tmp"
  if jq -e . "$tmp" >/dev/null 2>&1; then
    mv "$tmp" "$file"
  else
    rm -f "$tmp"
    echo "error: merge produced invalid JSON for $file — aborting" >&2
    return 1
  fi
}
```

Command-path conventions:

- **Global**: `~/.claude/hooks/format-on-edit.sh` (tilde — Claude Code expands)
- **Project**: `$CLAUDE_PROJECT_DIR/.claude/hooks/format-on-edit.sh`

#### Map of which hook goes where

| Hook | Event | Matcher |
|---|---|---|
| `format-on-edit.sh` | `PostToolUse` | `Edit\|Write\|MultiEdit` |
| `validate-syntax.sh` | `PostToolUse` | `Edit\|Write\|MultiEdit` |
| `lint-on-edit.sh` | `PostToolUse` | `Edit\|Write\|MultiEdit` |
| `reinject-rules.sh` | `SessionStart` | `compact` |
| `block-bash-pattern.sh` | `PreToolUse` | `Bash` |

### Step 5: Verify

1. `bash -n "$HOOK_DIR/<each-script>.sh"` — syntax check every generated script.
2. `jq . "$file" >/dev/null` each settings file post-merge — belt-and-suspenders over the in-merge check.
3. Pretty-print the diff (added vs already-present) per settings file.
4. Print:
   ```
   Personalize-harness done.

   Scope: <global|project>
   Layer: <template+live | team | personal>
   Hook scripts written:
     - <path> (new) | (updated; backup <path>-bak-<UTC-stamp>) | (unchanged)
   Settings updated:
     - <path>: +<N> hook entries, <M> already present
   Skipped (tool missing):
     - <hook> needs <tool>

   To verify: restart Claude Code in this directory and run `/hooks`.
   To remove a hook: edit the settings file's `.hooks.<event>` array and delete the matching entry; delete the script if no other entry references it.
   ```
5. Do NOT execute hooks against fake stdin — too brittle. The user verifies live via `/hooks`.

## Important Notes

- **Idempotent.** Re-running with the same answers does not duplicate hook entries — the jq merge dedupes against a wrapped array of existing commands (not a stream, which would never match). Script files ARE rewritten on re-run; differing prior content is backed up as `<name>.sh-bak-<UTC-stamp>`.
- **Fail-open formatters / fail-closed validators.** `format-on-edit.sh` ends `exit 0` after `command -v X || exit 0` guards. `validate-syntax.sh`, `lint-on-edit.sh`, and `block-bash-pattern.sh` use `exit 2` to block — those are intentional gates.
- **Only `exit 2` blocks.** Any other non-zero is silent (per the guide). Don't ad-lib `exit 1` for guardrails.
- **Hooks run in parallel** on the same event — don't write hooks that depend on each other's order.
- **`$CLAUDE_PROJECT_DIR` for project, `~` for global** (matches Claude Code's path-resolution conventions for hook commands).
- **Matcher includes `MultiEdit`.** Claude Code uses MultiEdit constantly; omitting it silently skips most multi-line edits.
- **Don't replace existing hooks.** Any prior hooks already wired into `settings.json` must stay intact. The merge appends; never overwrites.
- **Global = two files.** `dotfiles/.claude/settings.json.template` (committed; new machines) AND live `~/.claude/settings.json` (effective now). Hook scripts go to the dotfiles repo (symlinked live by `install.sh`).
- **Global symlink check.** Step 1 warns if `~/.claude/hooks` doesn't resolve to `dotfiles/.claude/hooks`. Writes still land in dotfiles; user must run `install.sh` to make them live.
- **`jq` is required** for the merge AND for hook stdin parsing. Abort early if missing.
- **Per-call scope.** One call = one scope (global OR project) and one layer (team OR personal). Re-run for the other layer to mix concerns (e.g. team guardrails + personal formatters).
- **No undo built in.** To remove a hook, edit the settings file's `.hooks.<event>` array and delete the entry; delete the script if no other entry references it. The Step 5 output prints exact paths.
- **Script overwrite on re-run.** Patterns / reinject text / extension set may legitimately change between calls. The skill backs up prior content as `<name>.sh-bak-<UTC-stamp>` instead of silently overwriting.
- **Lint hook is opt-in.** Default skip — mid-refactor lint errors are common; blocking is invasive. Enable only when the project's lint config is stable.
- **Prettier resolution order.** project-local (`node_modules/.bin/prettier`) → global → `npx --no prettier`. Matches what `npm` would do.
- **No project guardrails baked in.** This skill is generic. Don't hardcode repo-specific patterns (skill-frontmatter validation, vendored-extension enforcement, etc.) — those belong in per-project invocations.
- **Inferential (Stop-prompt) hooks are off by default.** They cost tokens every Stop. Only add if the user explicitly asks.
- **Already-configured hooks aren't re-prompted.** Step 3 skips Qs whose entry is detected by Step 2; Step 5 reports them as "already present".
