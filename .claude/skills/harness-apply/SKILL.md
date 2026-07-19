---
name: harness-apply
description: "Read-write pair to harness-audit: personalize Claude Code's hook harness for a project or global dotfiles, then register the same gate scripts with Pi via the global harness-gates adapter so both runtimes enforce the same gates. Builds a project profile from docs and manifests, optionally researches current stack best practices, runs a gap-driven interview (or consumes a harness-audit gap handoff), then generates idempotent hook scripts and settings merges. Use for edit-time formatters, validators, linters, Bash guardrails, protected-path blockers, pre-git project checks, e2e reminders, post-compact rule reinjection, or Stop-time self-review checkpoints."
argument-hint: "[--no-web] [<empty> = current project | global | <absolute-path>]"
allowed-tools: Agent, Bash, Read, Edit, Write, Grep, Glob, AskUserQuestion
# formerly: personalize-harness
---

# Harness Apply (formerly Personalize Harness)

Personalize the Claude Code hook harness. Two modes:

- **global** — edit dotfiles `settings.json.template` + live `~/.claude/settings.json`, write hook scripts to dotfiles `.claude/hooks/` (symlinked to `~/.claude/hooks/` by `install.sh`). Applies to every project.
- **project** — edit `<project>/.claude/settings.json` (team) or `.claude/settings.local.json` (personal), write hook scripts to `<project>/.claude/hooks/`. Applies to that project only.

Hooks merge across layers; global + project both fire. The skill is **additive** — never replaces prior hooks already wired into `settings.json`.

**Per-call scope**: one call picks ONE scope and (for project) ONE layer (team vs personal). To mix — e.g. team-committed guardrails + personal-only formatters — invoke the skill twice with different answers.

**Multiple projects**: global and project gates compose cleanly (discovery is `global → project`, project overrides by filename; one Pi adapter serves every repo). See `.claude/skills/_shared/harness-gap-handoff.md` → **Scope layering** for the placement heuristic (what belongs global vs project).

## Fowler split (orienting frame)

- **Feedforward (guides)** — SessionStart / UserPromptSubmit injection. Steer the agent before it acts.
- **Feedback sensors, computational** — PostToolUse running formatters/validators/linters. Fast, deterministic.
- **Feedback sensors, inferential** — Stop with `type: prompt`. LLM-graded. Costs tokens. Optional.
- **Guardrails** — PreToolUse with `exit 2` to block. Hard stop on specific Bash patterns.

The skill bias: computational sensors first (cheap, high signal), then feedforward reinjection, then guardrails. Inferential only on request.

## Timing / posture vocabulary

Every sensor has a **timing** (when it fires) and a **posture** (what it does on failure). Claude Code's hook events map onto a shared timing/posture vocabulary that the global Pi `harness-gates` adapter (see issue #030) also maps onto, so the two harnesses stay conceptually aligned:

| Timing | Claude hook event | Can block? | Use for |
|---|---|---|---|
| `afterWrite` | `PostToolUse` `Edit\|Write\|MultiEdit` | yes (`exit 2`) | per-file syntax / format / lint — fast, deterministic |
| `beforeGit` | `PreToolUse` `Bash` (matches `git commit`/`git push`) | yes (`exit 2`) | deferred project checks (typecheck/build/test) + bounded scenario checks |
| `agentEnd` | `Stop` (`decision: block`) | advisory only (re-prompts, never hard-stops) | self-review checkpoint; optional end-of-turn project check |
| `manual` | _(no event)_ | n/a | expensive e2e/scenario suites — surfaced as reminder text, never auto-run |

- **Posture** — `advisory` (report only) or `blocking` (`exit 2` for PostToolUse/PreToolUse, or `decision: block` for Stop). `blocking` is honored at `afterWrite` and `beforeGit`. At `agentEnd` a "blocking" intent degrades to advisory: the Stop hook re-injects the prompt but the model can still stop after addressing it.
- **Why `beforeGit` is the home for project checks.** A typecheck/build/test suite is project-level (not per-file) and too slow to run on every Edit. Claude has no per-turn touched-file memory, so running it on every Stop is unbounded. Gating on `git commit`/`git push` runs it once, when it matters, and can hard-block a bad commit. The Stop hook may *also* run it (advisory, gated on a dirty working tree) when the user opts in.

## Gap categories (gap-driven coverage)

Evaluate **every** universal category below, even when the answer is "not present in this repo". Record skipped/absent categories with a one-line reason in the Step 5 summary — silent omission reads as "covered" when it wasn't. Category 4 is split into 4a (fast changed-files static — the recommended default) and 4b (slow whole-project — opt-in, prefer CI / `dev-test`). Categories map to the hooks the skill can emit:

| # | Category | Hook(s) | Default posture |
|---|---|---|---|
| 1 | touched-file syntax | `validate-syntax.sh` (afterWrite) | blocking |
| 2 | formatter | `format-on-edit.sh` (afterWrite) | fail-open |
| 3 | lint | `lint-on-edit.sh` (afterWrite) | advisory (opt-in) |
| 4a | changed-files static (lint + type) on commit | `staged-static-check.sh` (beforeGit) | beforeGit blocking |
| 4b | project typecheck/build/test | `pre-git-checks.sh` (beforeGit) + optional Stop | beforeGit blocking / Stop advisory |
| 5 | scenario / e2e | `pre-git-checks.sh` (beforeGit, bounded) or reminder text (manual) | manual advisory |
| 6 | architecture / context guidance | `reinject-rules.sh` (compact) + Stop prompt | advisory |
| 7 | operational safety (live service / deploy / destructive shell) | `block-bash-pattern.sh` (PreToolUse Bash) | blocking |
| 8 | secrets / protected paths | `block-path-access.sh` (PreToolUse Edit\|Write\|MultiEdit + Read) | blocking |
| 9 | git / preflight | `pre-git-checks.sh` (beforeGit) | blocking |
| 10 | self-review checkpoint | `stop-quality-check.sh` (Stop) | advisory (opt-in) |

Categories 4a/4b, 5, 8, 9 are the gap-driven additions over the original per-file-only model — they cover project-level validation and protected-path safety that edit-time hooks cannot express.

## Input

`$ARGUMENTS` — one of:

- **empty (default)** — operate on the **current working directory** as a project. No scope question.
- `global` — operate on the dotfiles + live global settings.
- `project` — explicit form of the default.
- `<absolute-path>` — operate on that project path.

A `--no-web` flag may precede or follow any of the above. It skips Step 2.7 (web best-practice research) and relies on local repo/tool evidence only. Web research is on by default in project mode and skipped in global mode (no detected stack to research).

### Handoff-consume input mode (paired with `harness-audit`)

If the user pastes a `## Harness gap handoff` block in the conversation — the machine-readable spec emitted by `harness-audit`, schema v1 (see `.claude/skills/_shared/harness-gap-handoff.md`) — the skill **auto-detects** it on the first turn and switches into consume mode:

- **Pre-fill `recommended_scope`** — the audit's `recommended_scope` (project | global) becomes the default for the scope decision; if the user already passed a scope token in `$ARGUMENTS`, that wins; otherwise the audit's pick is offered (no question asked unless the user wants to override).
- **Pre-fill Step 3 answers** — for every gate category with `coverage: claude-global | claude-project | pi`, the corresponding interview question is **skipped** and the gate is reported in Step 5 as `already covered (<surface>)`. Only categories with `coverage: missing` get asked about. If a gate row is `coverage: pi` but `surfaces_present.pi: false`, treat it as `missing` for interview purposes — `pi` coverage requires the adapter actually being wired (Step 2.4 enforces this; see below).
- **`surfaces_present` short-circuit** — if all three are `false` (nothing wired anywhere), the skill still proceeds normally (the interview is the source of truth), but Step 5 surfaces the "all surfaces missing — every gate in the audit came back `missing`" warning so the user knows the audit ran against an empty install.
- **Honor `recommended_scope` even on first call** — if `$ARGUMENTS` is empty and the audit set `recommended_scope: global`, the skill switches to global mode without asking (global mode defaults to dotfiles anyway).

Detection rule: a fenced block whose first non-comment line is `## Harness gap handoff` AND whose body contains a `recommended_scope:` key. The block is read on the first turn; anything else in the user's first message is treated as prose context.

If the handoff block is malformed (missing `recommended_scope`, unparseable YAML), fall back to the normal flow and print a one-line warning naming the field that couldn't be parsed — do not abort.

## Flow

1. Resolve scope (or pre-fill from handoff) → 2. Probe tools + existing settings → **2.4. Pi adapter wiring (ensure global `harness-gates` is installed + registered)** → **2.5. Project profile (read project docs)** → **2.6. Repair check (heal pre-existing buggy hooks)** → **2.7. Research best-practice posture (web, project mode, optional)** → 3. Profile-driven interview (skip answered-from-handoff questions) → 4. Generate scripts + merge settings → 5. Verify (report Pi coverage)

## Steps

### Step 1: Resolve scope

**Default is project mode targeting cwd.** Do NOT ask a scope question when `$ARGUMENTS` is empty — just set `SCOPE_LABEL=project` and `PROJECT_ROOT="$(pwd)"`. The user only gets a scope question if cwd looks ambiguous (see safety check below).

Emit the following assignments literally — do NOT rely on Claude inferring `DOTFILES_DIR`, `SCOPE_LABEL`, `ARG_PATH`, or `PROJECT_ROOT` from prose. Order matters: `DOTFILES_DIR` must be set before the safety check uses it.

```bash
# 1a. Always set DOTFILES_DIR first — safety check below depends on it.
DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"

# 1a'. Extract optional --no-web flag; ARGS_REST holds the scope token (if any).
WEB_RESEARCH=1
ARGS_REST=""
for tok in ${ARGUMENTS:-}; do
  case "$tok" in
    --no-web) WEB_RESEARCH=0 ;;
    *)        ARGS_REST="${ARGS_REST:+$ARGS_REST }$tok" ;;
  esac
done

# 1b. Dispatch the remaining scope token into SCOPE_LABEL + ARG_PATH.
ARG_PATH=""
case "$ARGS_REST" in
  "")            SCOPE_LABEL=project ;;            # empty → cwd
  global)        SCOPE_LABEL=global ;;
  project)       SCOPE_LABEL=project ;;
  /*)            SCOPE_LABEL=project; ARG_PATH="$ARGS_REST" ;;   # absolute path
  *)             echo "error: unknown argument '$ARGS_REST' (expected empty | global | project | absolute path; optional --no-web)" >&2; exit 1 ;;
esac

# 1c. Resolve PROJECT_ROOT for project mode.
if [ "$SCOPE_LABEL" = "project" ]; then
  if [ -n "$ARG_PATH" ]; then
    PROJECT_ROOT="$ARG_PATH"
  else
    PROJECT_ROOT="$(pwd)"
  fi
fi
```

**Cwd safety check** (only when defaulting — i.e. `ARGS_REST` was empty, ignoring any `--no-web` flag, AND `PROJECT_ROOT` resolved to cwd). If `$(realpath "$PROJECT_ROOT") == $(realpath "$DOTFILES_DIR")`, ask via `AskUserQuestion`:

- "You're in the dotfiles repo. Personalize **globally** (affects every project) or **dotfiles-as-project** (just here)?" — options: `global (Recommended)`, `dotfiles-as-project`, `cancel`.

If user picks `global` → flip `SCOPE_LABEL=global`. If `cancel` → exit 0 cleanly with a one-line message. For any other cwd, no question — proceed with `SCOPE_LABEL=project`.

Then resolve paths:

```bash
HOOK_DIR=<dir>
SETTINGS_FILES=("<file1>" "<file2>")        # 2 for global, 1 for project
```

Concrete values:

- **global**: `HOOK_DIR="$DOTFILES_DIR/.claude/hooks"`, `SETTINGS_FILES=( "$DOTFILES_DIR/.claude/settings.json.template" "$HOME/.claude/settings.json" )`
- **project, team**: `HOOK_DIR="$PROJECT_ROOT/.claude/hooks"`, `SETTINGS_FILES=( "$PROJECT_ROOT/.claude/settings.json" )`
- **project, personal**: `HOOK_DIR="$PROJECT_ROOT/.claude/hooks"`, `SETTINGS_FILES=( "$PROJECT_ROOT/.claude/settings.local.json" )`

For project scope, defer team-vs-personal until after probe — it's an interview question.

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
  shopt -s globstar nullglob 2>/dev/null || true   # enable `**` for shell-file scan

  # Available tools (gate hook offers — never offer a hook for a missing tool)
  for t in prettier eslint shfmt jq ruff black gofmt rustfmt node npx tsc playwright pytest go cargo make just; do
    if command -v "$t" >/dev/null 2>&1; then echo "have:$t"; else echo "miss:$t"; fi
  done

  # Project-local devDeps (many JS repos install these locally, not globally)
  [ -x ./node_modules/.bin/prettier ]   && echo "have-local:prettier"
  [ -x ./node_modules/.bin/eslint ]     && echo "have-local:eslint"
  [ -x ./node_modules/.bin/tsc ]        && echo "have-local:tsc"
  [ -x ./node_modules/.bin/playwright ] && echo "have-local:playwright"

  # Project-check + scenario surfaces (Q for cat 4/5 below).
  [ -f tsconfig.json ]       && echo "has:tsconfig"
  [ -f playwright.config.ts ] || [ -f playwright.config.js ] && echo "has:playwright-config"

  # Protected-path signals (cat 8). An .env template implies a real .env worth guarding.
  for e in .env.example .env.sample .env.template; do [ -f "$e" ] && echo "has:env-template"; done
  { [ -f .env ] || compgen -G '.env.*' >/dev/null 2>&1; } && echo "has:env-file"

  # Project shape
  [ -f package.json ]   && echo "lang:node"
  [ -f pyproject.toml ] && echo "lang:python"
  [ -f go.mod ]         && echo "lang:go"
  [ -f Cargo.toml ]     && echo "lang:rust"
  # Shell-file scan: globstar makes `**/*.sh` recurse. Fallback to find for non-bash shells.
  if compgen -G '*.sh' >/dev/null 2>&1 || compgen -G '**/*.sh' >/dev/null 2>&1; then
    echo "has:shell"
  elif find . -name '*.sh' -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null | head -1 | grep -q .; then
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

# Existing hook config in each target settings file.
# Matcherless events (Stop / Notification / SubagentStop / PreCompact) have no
# .matcher field — emit them on a separate line tagged `nomatcher` so Step 3's
# skip-if-present logic can distinguish them from matchered entries with null.
for f in "${SETTINGS_FILES[@]}"; do
  if [ -f "$f" ]; then
    jq -r '
      .hooks // {} | to_entries[] |
      .key as $event |
      if ($event | IN("Stop","Notification","SubagentStop","PreCompact")) then
        # Matcherless: enumerate commands directly.
        [ .value[] | .hooks[]?.command ] as $cmds |
        "\($event)\tnomatcher\t\($cmds | join(\"|\"))"
      else
        # Matchered: enumerate (matcher, commands) tuples.
        .value[] |
        "\($event)\t\(.matcher // \"\")\t\([.hooks[]?.command] | join(\"|\"))"
      end
    ' "$f" 2>/dev/null | sed "s|^|existing:$f:|"
  fi
done
```

`jq` is mandatory — if `miss:jq` appears, abort with: "install jq (`brew install jq` / `apt install jq`) and re-run."

Record sets: `TOOLS_HAVE` (incl. `have-local:*`), `LANGS_DETECTED`, `EXISTING_HOOKS` (per file, per event, per matcher, plus matcherless-event lines tagged `nomatcher`).

### Step 2.4: Pi adapter wiring (ensure global `harness-gates` is installed + registered)

The project hook scripts this skill writes must ALSO fire inside Pi — otherwise a Pi session in this project has zero gate coverage. The bridge is a single global Pi extension (`harness-gates`) that maps Pi tool-lifecycle events onto the same `.claude/hooks/*.sh` scripts and runs them. It is a dotfiles-level concern (one install per machine), not a per-project concern. **Never generate a per-project Pi extension** — that was the 2026-06-17 failure mode (duplicated wiring, drift, the user re-installed the same logic into every repo).

This step is a **one-time machine setup check**, not per-call overhead:

1. Detect the global Pi adapter location:
   ```bash
   PI_HOME="${PI_HOME:-$HOME/.pi/agent}"
   ADAPTER_DIR="$PI_HOME/extensions/harness-gates"
   PI_SETTINGS="$PI_HOME/settings.json"
   ```
2. Run three checks and record `PI_ADAPTER_STATE ∈ {wired, missing-extension, missing-settings-entry, both-missing}`:
   - **adapter installed?** — `[ -f "$ADAPTER_DIR/package.json" ] && [ -f "$ADAPTER_DIR/index.js" ]`
   - **settings entry present?** — `jq -e '.extensions // [] | map(select(. == "extensions/harness-gates")) | length > 0' "$PI_SETTINGS" 2>/dev/null` (positive entry, no `-` prefix; a `-extensions/harness-gates/...` negation does NOT count as wired)
   - **dependency installed?** — `[ -d "$ADAPTER_DIR/node_modules" ]` (only relevant when the adapter is on disk; skip when it isn't)
3. If `wired` — no action; print `Pi adapter: wired (extensions/harness-gates in $PI_HOME/settings.json)`. Set `PI_COVERAGE_REPORT=1` for Step 5.
4. If any check fails — print the exact remediation and offer to apply it. **Always offer; never auto-install.** The offer is a single `AskUserQuestion` with lead `install + register (Recommended)`:
   - **install + register** — `mkdir -p "$ADAPTER_DIR" && cp` from `${DOTFILES_DIR}/.pi/agent/extensions/harness-gates/{package.json,index.js,tests}` (the dotfiles repo is the source of truth for the adapter; symlinks into `~/.pi/agent/extensions/` are made by `install.sh`), then `jq '.extensions = ((.extensions // []) + ["extensions/harness-gates"] | unique)' "$PI_SETTINGS" > "$PI_SETTINGS.tmp" && mv "$PI_SETTINGS.tmp" "$PI_SETTINGS"`. Skip arms whose source file is absent in dotfiles.
   - **register only** — adapter files already exist on disk; only edit `settings.json`.
   - **skip** — user is in a Pi-less environment or explicitly opts out. `PI_COVERAGE_REPORT=0`; Step 5 prints `Pi adapter: not wired (opted out)`.
5. If `$PI_HOME` itself is missing (`$PI_HOME/extensions` doesn't exist) — print `Pi not installed on this machine (no $PI_HOME). Skipping Pi adapter wiring.` and set `PI_COVERAGE_REPORT=0`. Don't try to install Pi.

Record: `PI_ADAPTER_STATE` (for Step 2.6 repair scan), `PI_COVERAGE_REPORT` (for Step 5).

**This step is ALWAYS run, even in project mode.** A project-mode call writes `.claude/hooks/*.sh` that the user will reasonably expect to fire in Pi too — the wiring check is the only place that guarantees that.

### Step 2.5: Project profile (project mode only)

Project mode personalizes hooks against the actual project's tooling, invariants, and domain. Build a compact profile by **reading bounded slices of anchor docs** — never the whole repo.

**Skip Step 2.5 entirely in global mode** — global hooks must stay project-agnostic.

#### Anchor files (read top 200 lines max each via `Read`)

Priority order — read what exists, stop after 6 files:

```bash
profile_candidates=(
  "$PROJECT_ROOT/CLAUDE.md"                  # explicit agent invariants (highest value)
  "$PROJECT_ROOT/.claude/CLAUDE.md"          # alt location
  "$PROJECT_ROOT/AGENTS.md"                  # OpenCode/Cursor invariants
  "$PROJECT_ROOT/CONTRIBUTING.md"            # human-facing rules
  "$PROJECT_ROOT/README.md"                  # domain + entrypoint hints
  "$PROJECT_ROOT/pyproject.toml"             # Python build/tool config
  "$PROJECT_ROOT/package.json"               # Node scripts + deps
  "$PROJECT_ROOT/Makefile"                   # test/build commands
  "$PROJECT_ROOT/justfile"                   # test/build commands
  "$PROJECT_ROOT/go.mod"                     # Go module
  "$PROJECT_ROOT/Cargo.toml"                 # Rust manifest
)
existing_profile=()
for f in "${profile_candidates[@]}"; do
  [ -f "$f" ] && existing_profile+=("$f")
done
# Also list CI workflow files — cap at 3 to bound the profile read.
workflow_files=()
if [ -d "$PROJECT_ROOT/.github/workflows" ]; then
  while IFS= read -r w; do
    [ -f "$w" ] && workflow_files+=("$w")
    [ "${#workflow_files[@]}" -ge 3 ] && break
  done < <(find "$PROJECT_ROOT/.github/workflows" -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null | sort)
fi
printf 'profile-candidate: %s\n' "${existing_profile[@]}" "${workflow_files[@]}"
```

#### Synthesize into a structured profile

For each existing anchor, read the top section and extract. Emit a compact `PROFILE` block to the user **before the interview** so they see what the skill picked up:

```
PROFILE
  Build tool:      uv | poetry | pip | npm | pnpm | yarn | cargo | go | make | unknown
  Test command:    <exact command from package.json scripts.test, pyproject [tool.pytest], Makefile, or "unknown">
  Build command:   <exact build/compile command — e.g. `npm run build`, `cargo build`, `go build ./...`, or "none-detected">
  Type checker:    mypy | pyright | tsc | none-detected
  Linter:          ruff | flake8 | eslint | golangci-lint | none-detected
  Formatter:       ruff format | black | prettier | gofmt | rustfmt | none-detected
  Scenario check:  <e2e/integration command — e.g. `npx playwright test`, `npm run e2e`, or "none-detected">
  CI checks:       <workflow filenames (basenames only, max 3) — e.g. ci.yml, lint.yml, test.yml>
  Domain hint:     <first sentence of README intro or pyproject description, capped at 80 chars>
  Stated invariants (from CLAUDE.md / CONTRIBUTING.md):
    - <bullet 1>
    - <bullet 2>
    ...
  Forbidden tools (inferred):
    - <e.g. "pip" if uv.lock present>
    - <e.g. "npm" if pnpm-lock.yaml present>
  Protected paths (cat 8 — inferred, see rules below):
    - <e.g. ".env, .env.*" if has:env-file / has:env-template>
    - <e.g. secret/key globs if README/CONTRIBUTING name them>
```

#### Inference rules (deterministic — don't ad-lib)

**Build tool + forbidden tools** (from lockfiles):

- `uv.lock` exists → BUILD_TOOL=uv; FORBIDDEN: `pip install`, `pipenv install`, `poetry add`.
- `poetry.lock` exists → BUILD_TOOL=poetry; FORBIDDEN: `pip install`, `pipenv install`.
- `pnpm-lock.yaml` exists → BUILD_TOOL=pnpm; FORBIDDEN: `npm install`, `yarn add`.
- `yarn.lock` exists → BUILD_TOOL=yarn; FORBIDDEN: `npm install`, `pnpm add`.
- `package-lock.json` exists (and no pnpm/yarn lock) → BUILD_TOOL=npm; no FORBIDDEN (npm is the default).
- `Cargo.lock` exists → BUILD_TOOL=cargo; no FORBIDDEN.
- `go.sum` exists → BUILD_TOOL=go; no FORBIDDEN.

**Note:** If no FORBIDDEN tools, Project Q4 (build-tool guardrail) is auto-skipped — no guardrail to draft.

**Test command** (first match wins):

- `Makefile` defines `test:` target → TEST_CMD=`make test`.
- `package.json` has `scripts.test` → TEST_CMD=`<npm|pnpm|yarn> test` (match BUILD_TOOL).
- `pyproject.toml` has `[tool.pytest.ini_options]` → TEST_CMD=`<uv|poetry> run pytest` (match BUILD_TOOL) or bare `pytest` if neither.
- `go.mod` exists → TEST_CMD=`go test ./...`.
- `Cargo.toml` exists → TEST_CMD=`cargo test`.

**Build command** (cat 4b — first match wins; `none-detected` if no match):

- `package.json` has `scripts.build` → BUILD_CMD=`<npm|pnpm|yarn> run build` (match BUILD_TOOL).
- `Makefile` defines `build:` → BUILD_CMD=`make build`.
- `go.mod` exists → BUILD_CMD=`go build ./...`.
- `Cargo.toml` exists → BUILD_CMD=`cargo build`.

**Project check** (cat 4b — the command `pre-git-checks.sh` runs at `beforeGit`; compose in priority order, fastest first): TYPE_CHECK (if not `none-detected`) → BUILD_CMD (if not `none-detected`) → TEST_CMD (if not `unknown`). The interview (Q below) decides which of these the user wants gated pre-git, and whether the Stop hook also runs the cheapest one (typecheck) as an advisory end-of-turn pass.

**Baseline verification + runner resolution** (cat 4b — run BEFORE the interview offers any check as blocking). Inference picks a *candidate* command; it is NOT trusted until it actually runs. A gate wired to a command that cannot execute in the project's environment blocks every commit (or passes vacuously). For each candidate (TYPE_CHECK, BUILD_CMD, TEST_CMD, and any `beforeGit` SCENARIO_CMD) the skill MUST verify the baseline and resolve the correct runner:

1. **Dry-run the candidate**, time-boxed (`timeout 280`), from `PROJECT_ROOT`. Capture exit code + output tail.
2. **On success (exit 0):** record it as the verified command. Done.
3. **On a missing-interpreter / missing-dependency failure** — output matches `ModuleNotFoundError|No module named|ImportError|command not found|is not recognized|cannot find module|ts-node: not found|ERR_MODULE_NOT_FOUND` — the bare command is using the wrong environment. Retry with the BUILD_TOOL-scoped runner prefix before giving up:
   - `uv.lock` → prefix `uv run ` (`pytest` → `uv run pytest`); missing deps fixed by `uv sync` (or `uv sync --extra dev` / `uv pip install -e '.[dev]'`).
   - `poetry.lock` → prefix `poetry run `; install with `poetry install`.
   - `Pipfile.lock` → prefix `pipenv run `; install with `pipenv install --dev`.
   - `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` → ensure `node_modules` exists; install with `<pnpm|yarn|npm> install` (`npm ci` when a lockfile is present).
   - `go.mod` → `go mod download`. `Cargo.toml` → `cargo fetch`.
   Re-run the runner-prefixed candidate. If it now passes, record THAT as the verified command. (This is exactly how a documented `python3 -m pytest` becomes `uv run pytest` when `uv.lock` is present and the system interpreter lacks the deps.)
4. **If it still fails on missing deps after the runner prefix**, the managed environment isn't installed. Ask via `AskUserQuestion`: "Project deps missing — `<runner candidate>` fails with `<first missing module>`. Install with `<install cmd>` now?" — options `install + re-verify (Recommended)`, `offer the check anyway (warn it's red)`, `skip the check`. On `install`, run the install command (time-boxed), then re-run the candidate. **NEVER install into the system interpreter when a lockfile names a managed environment** — always install through the build tool so the lockfile stays authoritative (installing `alembic` into `/usr/bin/python3` to make `python3 -m pytest` pass is the wrong fix; `uv run pytest` + `uv sync` is right).
5. **If it fails for a non-dependency reason** (genuine test/type failures), record the command as verified-but-red and carry that into Q7b's clean-baseline warning — do NOT attempt to fix the failures.

Record per component: `VERIFIED_CMD` (the command that actually runs — possibly runner-prefixed) and `BASELINE` ∈ {green, red-failures, red-deps-declined}. The interview, the generated `pre-git-checks.sh`, and the Stop hook all use `VERIFIED_CMD`, never the unverified inference. Update the PROFILE block's `Test command` / `Build command` fields to the verified form and annotate `(verified green)` / `(verified — currently RED)`.

**Scenario check** (cat 5 — `none-detected` if no match):

- `has:playwright-config` + (`have:playwright`/`have-local:playwright`) → SCENARIO_CMD=`npx playwright test`.
- `package.json` has `scripts.e2e` (or a script whose name matches `e2e`/`integration`) → SCENARIO_CMD=`<npm|pnpm|yarn> run <name>`.

**Protected paths** (cat 8 — universal defaults plus inferred):

- Always include universal write blocks unless the user opts out: `.env`, `.env.*` (but allow the `.env.example` / `.env.sample` / `.env.template` variants), `*.pem`, `id_rsa`, `*.key`, `*.keystore`.
- Always include universal read blocks for the same secret material when the user enables read protection.
- Add a path/glob if a STATED_INVARIANT or README/CONTRIBUTING line names a file as secret, generated, or vendored ("do not edit", "generated — do not modify", "secrets live in X").
- `has:env-file` or `has:env-template` strengthens the recommendation to enable `.env` write protection (lead = yes).

**TOOLS_HAVE → PROFILE fields** (Step 2's probe feeds these directly — no separate inference):

| PROFILE field | Source rule (first match wins) |
|---|---|
| `Formatter` | `lang:python` + `have:ruff` → `ruff format`; else `lang:python` + `have:black` → `black`; `lang:node` + `have:prettier`/`have-local:prettier` → `prettier`; `lang:go` + `have:gofmt` → `gofmt`; `lang:rust` + `have:rustfmt` → `rustfmt`; else `none-detected` |
| `Linter` | `lang:python` + `have:ruff` → `ruff check`; `lang:node` + `have:eslint`/`have-local:eslint` → `eslint`; else `none-detected` |
| `Type checker` | `pyproject.toml` references `mypy` or has `[tool.mypy]` → `mypy`; `pyproject.toml` references `pyright` → `pyright`; `tsconfig.json` exists → `tsc --noEmit`; else `none-detected` |

**Stated invariants** (broadened — old "must/do not heading only" rule missed too many real-world docs):

A line is a STATED_INVARIANT if **any** of these holds:

1. Bullet line (`- ` / `* ` / `1. `) under any heading containing `must`, `do not`, `invariant`, `rule`, `requirement`, `convention`, `style`.
2. Imperative-mood bullet under any heading — starts with a verb: `Use`, `Run`, `Do`, `Don't`, `Never`, `Always`, `Prefer`, `Avoid`, `Keep`, `Drop`, `Match`.
3. Bullet under a domain heading whose body uses MUST/SHOULD/NEVER/ALWAYS (case-insensitive).

Cap at 8 invariants total — pick the strongest signals (rule 1 > rule 2 > rule 3 ordering).

**Domain hint**: first sentence of README intro paragraph OR `pyproject.toml` `description = "…"` value, whichever exists. Truncate at 80 chars (cut at last word boundary).

**CI checks**: workflow filenames only (basenames, no parsing). E.g. `ci.yml, lint.yml, test.yml`. Stop at 3.

#### Profile sanity gate

If profile is sparse (no anchor files OR BUILD_TOOL=unknown AND no STATED_INVARIANTS), state which fields are empty, then ask via `AskUserQuestion`:

- "Project profile is sparse — fall back to generic interview?" — options: `yes (Recommended)`, `no — abort`.

If `no`: print `aborted — profile insufficient for project-tailored hooks. Re-run after adding CLAUDE.md / pyproject.toml / package.json with usable signals.` then `exit 0` cleanly. Do NOT write partial scripts or settings.

Record the profile as `PROFILE` for use in Step 3.

### Step 2.6: Repair check (heal pre-existing buggy hooks)

Step 3's Q-gating skips hooks already wired in settings. Without this step, a pre-existing **buggy** hook stays buggy forever — the skill would silently leave it alone. Step 2.6 closes that loop: validate every existing hook + settings entry against the current template contract; if anything fails, offer repair before Step 3 runs.

Runs in **both** scopes (global + project). Settings-file checks always run; script-file checks run for any `.sh` in `$HOOK_DIR` referenced by `EXISTING_HOOKS`.

#### Validate

```bash
violations=()

# A. Settings: matcherless events must NOT carry a matcher field.
for f in "${SETTINGS_FILES[@]}"; do
  [ -f "$f" ] || continue
  n=$(jq '[(.hooks.Stop // []), (.hooks.Notification // []),
          (.hooks.SubagentStop // []), (.hooks.PreCompact // [])]
         | flatten | map(select(has("matcher"))) | length' "$f" 2>/dev/null)
  [ "${n:-0}" -gt 0 ] && violations+=("settings|$f|matcherless-event-has-matcher-field|$n")
done

# B. Stop hook: must use jq -n --arg pattern, not inline `cat <<'JSON'`.
for s in "$HOOK_DIR"/stop-quality-check.sh; do
  [ -f "$s" ] || continue
  grep -qE "cat <<'JSON'" "$s" && violations+=("script|$s|inline-json-heredoc")
done

# C. Reinject hook: must use unique sentinel, not naked `<<'EOF'`.
for s in "$HOOK_DIR"/reinject-rules.sh; do
  [ -f "$s" ] || continue
  grep -qE "^cat <<'EOF'\$" "$s" && violations+=("script|$s|naked-eof-heredoc")
done

# D. Every script must bash -n clean.
for s in "$HOOK_DIR"/*.sh; do
  [ -f "$s" ] || continue
  bash -n "$s" 2>/dev/null || violations+=("script|$s|syntax-error")
done
```

If `violations` is empty → proceed to Step 3 normally; skip the rest of this step.

#### Decide

Print a compact table — one row per violation — then ask via `AskUserQuestion`:

- "Found `<N>` quality issues in pre-existing hooks. Repair? (Recommended — originals are backed up as `<name>.sh-bak-<UTC-stamp>`)"
- Options: `repair (Recommended)`, `skip — leave as-is`, `cancel run`.

#### Apply repairs

**On `skip`**: print `warn: leaving <N> pre-existing-hook issues unrepaired. Re-run with --force-repair to revisit.` Continue to Step 3.

**On `cancel`**: print `aborted before changes — no writes.` and `exit 0`.

**On `repair`**: for each violation:

1. **`settings|<file>|matcherless-event-has-matcher-field`** — surgical jq edit, no full rewrite:

   ```bash
   tmp=$(mktemp)
   jq '
     if .hooks.Stop          then .hooks.Stop          |= map(del(.matcher)) else . end |
     if .hooks.Notification  then .hooks.Notification  |= map(del(.matcher)) else . end |
     if .hooks.SubagentStop  then .hooks.SubagentStop  |= map(del(.matcher)) else . end |
     if .hooks.PreCompact    then .hooks.PreCompact    |= map(del(.matcher)) else . end
   ' "$f" > "$tmp" && jq -e . "$tmp" >/dev/null && mv "$tmp" "$f"
   ```

2. **`script|<path>|inline-json-heredoc`** (stop-quality-check.sh, Bug 1) — back up, then rewrite from the current `stop-quality-check.sh` template (Step 4). The buggy form's prompt body cannot be safely extracted (it's JSON-escaped inside an inline literal); the new body uses the current PROFILE-aware auto-draft. The backup preserves the original verbatim.

   ```bash
   ts=$(date -u +%Y%m%dT%H%M%SZ)
   cp "$s" "${s}-bak-${ts}"
   # Write new from Step 4 template with current PROFILE substitutions.
   ```

3. **`script|<path>|naked-eof-heredoc`** (reinject-rules.sh) — body IS safely extractable from the old heredoc. Preserve it:

   ```bash
   ts=$(date -u +%Y%m%dT%H%M%SZ)
   tmp=$(mktemp)
   awk "/^cat <<'EOF'\$/{p=1;next} /^EOF\$/{p=0} p" "$s" > "$tmp"
   cp "$s" "${s}-bak-${ts}"
   # Write new script with cat <<'REINJECT_EOF_SENTINEL' wrapping $tmp body.
   rm -f "$tmp"
   ```

4. **`script|<path>|syntax-error`** — back up and re-write from the current canonical template for whichever hook this is (look up by basename). If the hook role can't be identified (third-party script), do NOT touch — print `skip: <path> is not a harness-gate-owned script; manual repair needed.`

#### Re-validate

After applying repairs, re-run the violation scan. If any remain, **hard error** — repair pipeline is broken; do not proceed to Step 3:

```bash
echo "error: repair did not clear all violations — aborting before Step 3." >&2
exit 1
```

After successful repair, the repaired entries remain in `EXISTING_HOOKS`. Step 3 still skips Qs for them (no double-prompt). Continue to Step 2.7.

### Step 2.7: Research best-practice posture (web, optional)

Local evidence already decided **what** the repo can run (Step 2/2.5). Web research decides nothing concrete — it only informs the **recommended posture and timing** the interview leads with, for the detected stack. The PROFILE remains authoritative for commands and paths.

**Skip this step entirely when any of these hold** (record the skip reason for the Step 5 summary):

- `WEB_RESEARCH=0` (`--no-web`).
- `SCOPE_LABEL=global` — no detected stack, nothing stack-specific to research.
- The profile sanity gate fell back to generic (sparse profile) — there is no stack to inform.

Otherwise dispatch **one** `web-search-researcher` agent (read-only; it returns findings, makes no edits). Pass the PROFILE's detected languages/tools so the research is stack-specific:

```text
Research current (2026) best practices for AI-coding-agent edit/commit harnesses for this stack: <PROFILE.Build tool>, <languages from LANGS_DETECTED>, formatter=<PROFILE.Formatter>, linter=<PROFILE.Linter>, type checker=<PROFILE.Type checker>, test=<PROFILE.Test command>, scenario=<PROFILE.Scenario check>.

For each check type below, recommend a TIMING and POSTURE and one-line rationale, citing primary docs (URLs) where possible:
- per-file syntax check (edit-time) — blocking vs advisory;
- formatter on edit — run vs skip, fail-open expected;
- lint on edit — blocking vs advisory (note mid-refactor cost);
- project typecheck/build/test — WHEN it should run (edit-time / end-of-turn / pre-git / CI-only) and why, given cost vs signal;
- e2e/scenario (Playwright, integration) — almost always manual or pre-git, never per-write;
- destructive shell / secret-file / deploy safety — what to block.

Map recommendations to this vocabulary: TIMING ∈ {afterWrite, beforeGit, agentEnd, manual}, POSTURE ∈ {advisory, blocking}.
Web research may PROPOSE command families and posture, but it must NOT assert a specific command exists in this repo — local manifests/scripts/installed tools decide that. Return a compact table: check type | recommended timing | recommended posture | one-line rationale | source URL.
```

Record the returned table as `WEB_POSTURE`. **Reconcile against local evidence**: if research recommends a check whose tool is absent from `TOOLS_HAVE` / PROFILE, drop it — do not let web research re-introduce a command the repo cannot run. If research and the skill's built-in defaults disagree on posture (e.g. research says "lint blocking" but the skill defaults lint to advisory), surface both in the relevant interview lead so the user chooses — do not silently override the conservative default.

If the agent fails or returns nothing usable, record `web_posture: unavailable` and proceed with the skill's built-in defaults. Web research is advisory to the interview, never a hard dependency.

### Step 3: Interview

One question at a time via `AskUserQuestion`. Lead option carries `(Recommended)` where there's a clear default.

**Q-gating rule** (both must hold to offer a hook):

1. The hook's tool is present (`TOOLS_HAVE` from Step 2 includes it — either system-wide or as `have-local:*`).
2. AND the relevant `PROFILE` field is not `none-detected` (for project mode; global mode skips PROFILE check).

**Additionally**, skip Qs whose hook is already wired in the target settings file (per `EXISTING_HOOKS` from Step 2) — surface those as "already configured" in the Step 5 summary, don't re-prompt.

**Additionally, when handoff-consume mode is active (see `## Input` → `### Handoff-consume input mode`):** build a `HANDOFF_COVERED` set from the parsed `## Harness gap handoff` block — the `category` field of every gate row with `coverage ∈ {claude-global, claude-project, pi}` joins the set. **Skip** every interview question whose hook category is in `HANDOFF_COVERED` AND whose corresponding surface row is actually wired:

- `coverage: claude-global` — require `EXISTING_HOOKS` to confirm the script is wired in `$DOTFILES_DIR/.claude/settings.json.template` (or the live `~/.claude/settings.json`). If NOT wired, demote to `missing` and ask.
- `coverage: claude-project` — require `EXISTING_HOOKS` to confirm the script is wired in the project's settings file (`.claude/settings.json` or `.claude/settings.local.json`). If NOT wired, demote to `missing` and ask.
- `coverage: pi` — require `PI_ADAPTER_STATE == wired` from Step 2.4. If the adapter isn't actually wired, demote to `missing` and ask (the audit assumed it was; we verify on the ground).

The net effect: a clean audit short-circuits the interview down to only the `coverage: missing` categories. The Step 5 summary lists every skipped gate with the surface the audit claimed, plus the verification it ran (EXISTING_HOOKS match / PI_ADAPTER_STATE == wired).

**Global mode** — auto-include Tier 1 + Tier 3, but confirm specifics:

- **Q1 (only if multiple formatters detected)** — Which extensions to format on Edit/Write/MultiEdit? Default = union of detected formatters. Lead = "all detected (Recommended)".
  - **Steer.** If a stack-specific formatter/linter is detected (e.g. `ruff`, `prettier`, `eslint`, `gofmt`) but NOT wired here because it's not a safe global default, print one line: `<tool> detected but not wired globally (stack-specific — would no-op in other repos). Run \`/harness-apply project <repo>\` inside the repo to enable format/lint-on-edit there.` Global mode wires only universal gates; format/lint-on-edit live at project scope (see `.claude/skills/_shared/harness-gap-handoff.md` → Scope layering).
- **Q2** — Compact-reinject content. Use the **three-option pattern** below (Skip / Auto-draft / Custom). Auto-draft reads `~/.claude/CLAUDE.md`.
- **Q3** — Add Bash guardrails? If yes, ask for patterns (default examples: `git commit --no-verify`, `git push --force`, `rm -rf /`). Lead = "yes (Recommended)".
- **Q4** — Validate JSON / Python / Node / Bash syntax on write (`validate-syntax.sh`, exit-2 on parse errors)? Lead = "yes (Recommended)".
- **Q5** — Add lint-on-edit (ESLint for JS/TS, Ruff for Python; exit-2 on errors)? Lead = "skip (Recommended)" — mid-refactor lint errors are common; blocking is invasive.
- **Q6** — Protected-path safety (`block-path-access.sh`, cat 8)? Block universal `.env*`/key writes globally, but allow ordinary writes outside the current project (agents may need `/tmp`, sibling repos, or user-requested absolute paths). Lead = "writes only (Recommended)"; offer "writes + reads" and "skip". Symlink/traversal escape blocking remains project-scope only. (Project checks (cat 4) and scenario checks (cat 5) are NOT offered in global mode — they need project-specific commands.)

**Project mode** — profile-driven interview. Every question must reference the `PROFILE` block produced in Step 2.5, by name. Generic "format on edit?" is forbidden — frame it as "Detected `ruff format` (pyproject `[tool.ruff]`). Run it on Edit/Write/MultiEdit?".

**When `WEB_POSTURE` exists (Step 2.7 ran):** let it tune the recommended lead and cite it in one clause — e.g. "Detected `tsc` (tsconfig.json). 2026 practice leans toward typecheck as a pre-git gate, not per-edit (cost). Gate it before `git commit`?". The recommended option still respects the skill's safety bias (blocking only at `afterWrite`/`beforeGit`; `agentEnd` advisory); where research and the built-in default disagree on posture, present both and let the user pick. `WEB_POSTURE` never changes which commands are offered — only the recommendation framing.

Order is fixed; skip Qs that don't apply per profile. Lead bullets carry `(Recommended)`. Each question names its timing/posture so the user knows when the hook fires and whether it blocks.

- **Q1 — Layer.** Team-committed (`.claude/settings.json`) or personal (`.claude/settings.local.json`)? Lead = `team (Recommended)` for guardrails + invariants the whole team benefits from; `personal` for opinionated formatting / your-machine-only blocks. **Picks ONE layer for the whole call** — re-invoke for the other.
- **Q2 — Format on Edit** _(afterWrite, fail-open)_. Phrase as: "Detected `<FORMATTER>` (from `<source>`). Run on Edit/Write/MultiEdit for `<extensions>`?" Skip entirely if profile says `Formatter: none-detected`. Lead = yes.
- **Q3 — Syntax validation** _(afterWrite, blocking)_. Phrase as: "Validate `<languages-detected>` files (parse-check only, blocks on syntax errors)?" Languages derived from profile + `LANGS_DETECTED`. Lead = yes if any apply.
- **Q4 — Build-tool guardrail** _(PreToolUse Bash, blocking)_. Only ask if profile lists `Forbidden tools` (auto-skip if empty). Phrase as: "Detected build tool `<BUILD_TOOL>`. Block Bash commands matching `<forbidden patterns>` (prevents agent from drifting to wrong package manager)?" Lead = yes.
- **Q5 — Project-specific Bash guardrails** _(PreToolUse Bash, blocking)_. "Any additional Bash patterns to block? (one per line; treated as POSIX regex)" Skip optional.

> **Q4 + Q5 merge into ONE `block-bash-pattern.sh`.** Patterns from both questions union into the same `patterns=( … )` array — write the script once. Do NOT create two scripts. This is the **command** guardrail; the **path** guardrail (Q6) is a separate script.
- **Q6 — Protected-path safety** _(PreToolUse `Edit|Write|MultiEdit` + `Read`, blocking)_ (cat 8). Always ask. Phrase as: "Block writes to protected paths (`<protected-write-globs>`) and symlink escapes outside the project root? `has:env-file`/`has:env-template`: lead = yes." Then a follow-up sub-choice (single `AskUserQuestion`):
  - **Writes only (Recommended)** — block `Edit|Write|MultiEdit` to `.env*` (excluding `.env.example`/`.sample`/`.template`), key/secret globs, and any inferred vendored/generated paths, plus any write whose realpath escapes the project root.
  - **Writes + reads** — also block `Read` of the secret globs (prevents the agent surfacing secrets into context). Heavier; only when the repo genuinely holds secrets.
  - **Skip** — no path guardrail.
  Echo the exact write/read glob lists before writing. All patterns feed ONE `block-path-access.sh`.
- **Q7 — Static check + whole-project checks before git** _(beforeGit, blocking)_ (cat **4a/4b**). Split into TWO sub-questions, in this fixed order:
  - **Q7a — Changed-files static check (cat 4a).** Always ask when any of `ruff`/`mypy`/`eslint`/`tsc` is present in `TOOLS_HAVE` (or `have-local:`). Phrase as: "Run changed-files static checks on staged files (`git diff --cached`) before `git commit`/`git push` and block the commit on lint/type errors? Detected: ruff, mypy, eslint, tsc." Lead = `yes (Recommended)` — fast (sub-second to a few seconds per file), high signal, gates every commit. The script (`staged-static-check.sh`) automatically selects `ruff check` + `mypy` (Python) / `eslint` + `tsc --noEmit` (JS/TS) based on detected tools and dropped-when-absent behavior; runs ONLY on staged paths (plus tracked-but-unstaged files when `git commit -a`/`-am` is used).
  - **Q7b — Whole-project typecheck/build/test (cat 4b)** _(slow — opt-in)_. Only ask if PROJECT_CHECK has at least one component (TYPE_CHECK / BUILD_CMD / TEST_CMD). When asked, surface the explicit warning: "Whole-project checks are slow (full `cargo test` / `npm test` / `uv run pytest` can take minutes) and better suited to CI or `/dev-test`. Enable pre-git anyway?" Lead = `skip (Recommended)` — defer to CI for the slow lane. If accepted, sub-choice (multiSelect) for which components to gate; lead with `skip`. Each component carries its `VERIFIED_CMD` and `BASELINE` from Step 2.5's baseline verification — e.g. "test=`uv run pytest` (verified green, 53s)" or "test=`uv run pytest` (verified — currently RED, N failures)". **Clean-baseline note:** the skill has already dry-run each candidate (Step 2.5), so the verified command and its green/red status are known — surface them here, do not re-ask the user to confirm. If a component is `red-failures`, warn that gating it blocks every commit until the baseline is fixed and lead toward leaving it ungated.
- **Q8 — Scenario / e2e checks** _(manual advisory, or beforeGit if bounded)_ (cat 5). Only ask if profile's `Scenario check` is not `none-detected`. Phrase as: "Detected e2e command `<SCENARIO_CMD>`. e2e is expensive — surface it as a manual pre-commit reminder, or run it pre-git (blocking)?" Lead = `manual reminder (Recommended)` — never auto-run expensive suites on every commit unless the user insists and CI already treats it as normal pre-merge validation.
  - **`beforeGit`** = the command is appended (last, after project checks) to `pre-git-checks.sh` and blocks the commit on failure.
  - **`manual`** = no command is ever auto-run. The reminder line `Before committing, consider running the e2e suite: \`<SCENARIO_CMD>\`` is folded into whichever advisory surface the user already enabled, in this preference order: the Q11 Stop prompt body → else the Q9 reinject text. If neither Q9 nor Q11 is enabled, there is **no runtime hook** for it — report it in the Step 5 summary as a manual to-do and say so plainly (do not pretend it is enforced).
- **Q9 — Reinject invariants on compact** _(SessionStart compact, advisory)_. Only ask if profile's `Stated invariants` block is non-empty. Three-option pattern, **but auto-draft now means "use the invariants list verbatim"** — no LLM rewriting. Echo the exact bullets the skill will inject. Lead = `auto-draft (Recommended)`.
- **Q10 — Lint on Edit** _(afterWrite, **fail-open with --fix by default**; `--strict` opt-in for blocking)_. Phrase as: "Detected linter `<LINTER>`. Run `lint-on-edit.sh` on every Edit? Default is autofix (`ruff check --fix` / `eslint --fix`) — safe fixes are applied automatically, exits 0; on Stop the workflow catches anything that couldn't autofix. Opt in to blocking mode (`lint-on-edit.sh --strict`, exits 2 on any remaining lint error) if you want edits to fail on lint." Lead = `autofix (fail-open, Recommended)` — silent autofix is the common 2026 default. Skip entirely if profile says `Linter: none-detected`.
- **Q11 — Stop self-review checkpoint** _(agentEnd, advisory)_. Always ask. Phrase as: "Run a self-review checkpoint on every Stop? Fires every reply, costs tokens, but enforces a final discipline pass." Lead = `skip (Recommended)`. If accepted, use three-option pattern:
  - **Auto-draft (project-tailored)** — body lists profile's `Stated invariants`, `Test command`, `Type checker`, and the generic 5-point pass. Echo it inline before writing.
  - **Custom** — drop to plain chat for body.
  - **Skip** — bail.
  - **Optional end-of-turn project check.** If Q7 selected a project check, additionally offer: "Also run the cheapest selected project check (`<cheapest of TYPE_CHECK / BUILD_CMD / TEST_CMD>`) on Stop as an advisory pass (only when the working tree is dirty)?" Lead = `skip (Recommended)` — per-Stop cost. If yes, `stop-quality-check.sh` runs it (time-boxed) and re-injects failures (advisory; `agentEnd` cannot hard-block).

**Three-option reinject pattern** (used by Global Q2, Project Q9, and Project Q11 auto-draft) — avoids the awkward AskUserQuestion → chat → AskUserQuestion dance:

1. Single `AskUserQuestion` with three options:
   - **Skip** — no reinject hook.
   - **Auto-draft from repo (Recommended)** — read `<repo>/CLAUDE.md` if present (else `README.md` top section); draft repo-specific invariants; echo the draft inline; write the hook with it.
   - **Custom text** — drop to plain chat with: "Paste the reinject text now (multi-line OK). Reply `cancel` to skip."
2. If "Custom text" selected, ask one plain-chat question for the body. Do NOT use AskUserQuestion's Other slot for multi-line text — its input is single-line.
3. If "Auto-draft" selected, generate the draft FIRST and **echo it inline** before writing, so the user sees what's being injected.

Apply this same pattern to any other multi-line free-text prompts the skill grows.

### Step 4: Generate scripts + merge settings

**Substitution convention**: placeholders in `<ANGLE_BRACKETS>` are filled by Claude at write time from one of two sources — **interview answers** (Step 3) OR **PROFILE fields** (Step 2.5, named like `<PROFILE.TEST_CMD>`). `$VARS` are bash variables resolved at hook runtime. Don't confuse the three.

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

**`lint-on-edit.sh`** — PostToolUse, matcher `Edit|Write|MultiEdit`. **Fail-open by default** — runs `ruff check --fix` / `eslint --fix` (auto-fixes safe lint issues and exits 0 when only auto-fixable issues remain). Switch to blocking mode by wiring `lint-on-edit.sh --strict` (then it runs without `--fix` and `exit 2`s on any leftover lint error). Polyglot: ESLint for JS/TS, Ruff for Python:

```bash
#!/usr/bin/env bash
# lint-on-edit — autofix safe lint issues on the edited file. Fail-open by default.
# Pass --strict to block (exit 2) on remaining lint errors after autofix.
set -u
path=$(jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0
[ -f "$path" ] || exit 0

strict=0
[ "$1" = "--strict" ] && strict=1

case "$path" in
  *.js|*.jsx|*.ts|*.tsx)
    bin=""
    if [ -x ./node_modules/.bin/eslint ]; then
      bin=./node_modules/.bin/eslint
    elif command -v eslint >/dev/null 2>&1; then
      bin=eslint
    fi
    [ -z "$bin" ] && exit 0
    # Default: --fix (autofix safe). Strict: --no-fix (block on any error).
    if [ "$strict" -eq 1 ]; then
      if ! out=$("$bin" --no-fix "$path" 2>&1); then
        echo "$out" >&2
        exit 2
      fi
    else
      "$bin" --fix "$path" >/dev/null 2>&1 || true
    fi ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      if [ "$strict" -eq 1 ]; then
        if ! out=$(ruff check "$path" 2>&1); then
          echo "$out" >&2
          exit 2
        fi
      else
        # --fix is the recommended default; fail-open.
        ruff check --fix "$path" >/dev/null 2>&1 || true
      fi
    fi ;;
esac
exit 0
```

Drop `case` arms whose lint tool is absent during generation (per `TOOLS_HAVE` + `have-local:` + `LANGS_DETECTED`). E.g. pure-Python repo with no `ruff` installed → don't register the hook at all.

**`reinject-rules.sh`** — SessionStart, matcher `compact`:

```bash
#!/usr/bin/env bash
# reinject-rules — print the post-compact reinject text to stdout.
# Single-quoted heredoc with a unique sentinel — prevents shell expansion AND
# prevents early termination if the injected text contains a line starting
# with "EOF". Pick a tag unlikely to appear at start-of-line in the body.
cat <<'REINJECT_EOF_SENTINEL'
<REINJECT_TEXT_FROM_INTERVIEW>
REINJECT_EOF_SENTINEL
```

Same heredoc-bomb risk as `stop-quality-check.sh`: a naked `EOF` tag can be terminated by user text containing `EOF` at the start of a line. The unique sentinel `REINJECT_EOF_SENTINEL` makes accidental collision negligible. If reinject text plausibly contains that sentinel (rare — long underscored caps), pick a fresh tag at write time.

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
    echo "Blocked by harness-gate: matches /$pat/" >&2
    exit 2
  fi
done
exit 0
```

**`block-path-access.sh`** — PreToolUse, registered on BOTH matcher `Edit|Write|MultiEdit` AND matcher `Read` (cat 8). Branches on `tool_name` from stdin. Fail-closed (exit 2) on protected-path writes/reads. In **project scope only**, also fail-closed on writes whose realpath escapes the project root; in **global scope**, ordinary out-of-tree writes must pass. Write globs and read globs substituted at write time as one quoted entry per line; **drop the `Read` registration entirely if the user chose "writes only"** (don't write an inert read arm). When generating globally, omit `root`, `rootreal`, `resolve_real`, `real`, `rel`, and the outside-root `case`; match protected globs against `base` only. When generating for a project, retain the full template below:

```bash
#!/usr/bin/env bash
# block-path-access — block writes to protected paths + symlink escapes, and
# (optionally) reads of secret material. Deterministic; no model calls.
set -u
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[ -z "$path" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rootreal=$(cd "$root" 2>/dev/null && pwd -P) || rootreal="$root"

# Realpath of the deepest existing ancestor, then re-append the missing tail —
# catches new-file writes through a symlinked parent directory.
resolve_real() {
  local t cur tail base
  t="$1"; case "$t" in /*) ;; *) t="$root/$t" ;; esac
  cur="$t"; tail=""
  while [ ! -e "$cur" ] && [ "$cur" != "/" ]; do
    base=$(basename "$cur"); cur=$(dirname "$cur"); tail="$base${tail:+/$tail}"
  done
  if [ -d "$cur" ]; then cur=$(cd "$cur" 2>/dev/null && pwd -P); fi
  printf '%s' "${cur%/}${tail:+/$tail}"
}
real=$(resolve_real "$path")
rel="${real#"$rootreal"/}"
base=$(basename "$path")

# Protected-write globs (universal + inferred). .env.example/.sample/.template are allowed.
write_block=(
  <WRITE_PATTERNS_AS_QUOTED_LINES>
)
write_allow=( ".env.example" ".env.sample" ".env.template" )
# Read globs (only present when user chose writes+reads).
read_block=(
  <READ_PATTERNS_AS_QUOTED_LINES>
)

matches() { local cand="$1"; shift; local p; for p in "$@"; do case "$cand" in $p) return 0;; esac; done; return 1; }

case "$tool" in
  Edit|Write|MultiEdit)
    # Symlink / traversal escape: a write resolving outside the project root is blocked.
    case "$real" in
      "$rootreal"|"$rootreal"/*) ;;
      *) echo "Blocked by harness-gate: write resolves outside project root ($real)." >&2; exit 2 ;;
    esac
    if matches "$base" "${write_allow[@]}"; then exit 0; fi
    if matches "$base" "${write_block[@]}" || matches "$rel" "${write_block[@]}"; then
      echo "Blocked by harness-gate: writes to protected path '$rel' are blocked." >&2
      exit 2
    fi ;;
  Read)
    if matches "$base" "${read_block[@]}" || matches "$rel" "${read_block[@]}"; then
      echo "Blocked by harness-gate: reads of secret path '$rel' are blocked." >&2
      exit 2
    fi ;;
esac
exit 0
```

**`pre-git-checks.sh`** — PreToolUse, matcher `Bash` (cat **4b**/5/9, `beforeGit` timing). **Create this script if Q7b selected ≥1 project-check component OR Q8 chose `beforeGit` scenario** — not only Q7b. Fires only when the command is a `git commit`/`git push`; runs the composed checks from the project root and `exit 2` blocks the commit on failure. Order the `checks=()` array fastest-first: typecheck → build → test → bounded scenario (the Q8 `beforeGit` scenario command goes **last**). Each check is wrapped in a timeout so a hanging test cannot wedge the commit. Commands are skill-authored (trusted), so `eval` honors their args:

```bash
#!/usr/bin/env bash
# pre-git-checks — deferred project/scenario checks gated to git commit/push.
# Runs once, at commit time; blocks the commit if any check fails.
set -u
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0
# Only act on git commit / push (word-boundary, allows leading env/&&/; prefixes).
echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+(commit|push)([[:space:]]|$)' || exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0

# Per-check wall-clock cap (seconds). A hung check must never wedge the commit.
TIMEOUT_S=180
run_to() {  # run_to <cmd>; honors `timeout`/`gtimeout` when present, else runs bare.
  if command -v timeout >/dev/null 2>&1; then timeout "$TIMEOUT_S" bash -c "$1"
  elif command -v gtimeout >/dev/null 2>&1; then gtimeout "$TIMEOUT_S" bash -c "$1"
  else bash -c "$1"; fi
}

# Composed checks, fastest first (typecheck → build → test → bounded scenario).
checks=(
  <PROJECT_CHECK_COMMANDS_AS_QUOTED_LINES>
)
for c in "${checks[@]}"; do
  out=$(run_to "$c" 2>&1); rc=$?
  if [ "$rc" -ne 0 ]; then
    [ "$rc" = 124 ] && note=" (timed out after ${TIMEOUT_S}s)" || note=""
    echo "Blocked by harness-gate pre-git check: \`$c\` failed${note}. Fix before committing." >&2
    printf '%s\n' "$out" | tail -40 >&2
    exit 2
  fi
done
exit 0
```

**`staged-static-check.sh`** — PreToolUse, matcher `Bash` (cat **4a**, `beforeGit` timing). **Changed-files static check** — runs `ruff check` + `mypy` (Python) / `eslint` + `tsc --noEmit` (JS/TS) on ONLY the files in `git diff --cached --diff-filter=ACM` (plus tracked-but-unstaged files when the user passes `-a`/`-am` to `git commit`). Fast (sub-second to a few seconds per file) and high signal; the recommended default for cat 4a. `exit 2` blocks the commit. Drops arms whose tool is absent. Read command from stdin as JSON `{tool_input:{command}}`. Fires only on `git commit` / `git push`; other bash commands pass through unchanged (exit 0). See Step 5 dry-check 4c for the gating guarantee.

```bash
#!/usr/bin/env bash
# staged-static-check — fast lint+type check on staged files. exit 2 blocks.
# Reads {tool_input:{command}} on stdin. Only acts on git commit/push; otherwise exits 0.
# Resolves paths via git diff --cached (plus tracked-but-unstaged on -a/-am).
set -u
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Only act on git commit / push (word-boundary, allows leading env/&&/; prefixes).
echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+(commit|push)([[:space:]]|$)' || exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" 2>/dev/null || exit 0

# Detect -a / -am so tracked-but-unstaged files are also caught.
extra_args=""
if echo "$cmd" | grep -qE '(^|[[:space:]])(-a|-am)([[:space:]]|$)'; then
  extra_args="--untracked-files"
fi

# Collect changed paths (cached + unstaged when -a/-am).
mapfile -t files < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)
if [ -n "$extra_args" ]; then
  mapfile -t unstaged < <(git diff --name-only --diff-filter=ACM 2>/dev/null)
  files+=( "${unstaged[@]}" )
fi
# Dedup.
if [ "${#files[@]}" -gt 0 ]; then
  tmp=$(mktemp)
  printf '%s\n' "${files[@]}" | sort -u > "$tmp"
  mapfile -t files < "$tmp"
  rm -f "$tmp"
fi

[ "${#files[@]}" -eq 0 ] && exit 0

# Per-check timeout (seconds). Stays tiny — this script should be sub-second
# on most repos; a 60s cap is generous.
TIMEOUT_S=60
run_to() {
  if command -v timeout >/dev/null 2>&1; then timeout "$TIMEOUT_S" bash -c "$1"
  elif command -v gtimeout >/dev/null 2>&1; then gtimeout "$TIMEOUT_S" bash -c "$1"
  else bash -c "$1"; fi
}

failed=0
failure_msg=""
for f in "${files[@]}"; do
  [ -e "$f" ] || continue
  case "$f" in
    *.py)
      # Python: ruff (lint+autofix-aware) -> mypy (type).
      if command -v ruff >/dev/null 2>&1; then
        if ! out=$(run_to "ruff check '$f'" 2>&1); then
          failed=1; failure_msg="${failure_msg}ruff on $f:\n${out}\n"
        fi
      fi
      if command -v mypy >/dev/null 2>&1; then
        if ! out=$(run_to "mypy '$f'" 2>&1); then
          failed=1; failure_msg="${failure_msg}mypy on $f:\n${out}\n"
        fi
      fi
      ;;
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
      # JS/TS: eslint (lint) -> tsc --noEmit (type).
      bin=""
      if [ -x ./node_modules/.bin/eslint ]; then
        bin=./node_modules/.bin/eslint
      elif command -v eslint >/dev/null 2>&1; then
        bin=eslint
      fi
      if [ -n "$bin" ]; then
        if ! out=$(run_to "$bin '$f'" 2>&1); then
          failed=1; failure_msg="${failure_msg}eslint on $f:\n${out}\n"
        fi
      fi
      if command -v tsc >/dev/null 2>&1; then
        if ! out=$(run_to "tsc --noEmit '$f'" 2>&1); then
          failed=1; failure_msg="${failure_msg}tsc on $f:\n${out}\n"
        fi
      fi
      ;;
  esac
done

if [ "$failed" -ne 0 ]; then
  printf 'Blocked by harness-gate staged-static-check:\n%b' "$failure_msg" >&2
  exit 2
fi
exit 0
```

> **Note on python-vs-ruff ordering and `tsc --noEmit` per-file.** `tsc --noEmit <single-file>` requires a `tsconfig.json` to apply project compiler options; if `tsc --noEmit` per-file is too noisy in a given repo, drop the `tsc` arm at write time and rely on the whole-project check (cat 4b) to catch type errors. `ruff check <file>` works without project config; `mypy <file>` works without project config but flags missing imports more aggressively — both are reasonable defaults and dropped automatically when the tool is absent.

**`stop-quality-check.sh`** — Stop, no matcher (cat 4/10, `agentEnd` timing). Inferential checkpoint via `decision: block` JSON output. Fires on every Stop; gated by `stop_hook_active` to prevent infinite loops. When Q11 enabled the optional end-of-turn project check, it also runs the cheapest project command (only when the working tree is dirty) and folds any failure into the re-injected reason — advisory, since `agentEnd` cannot hard-block.

> **WRITE THIS FILE EXACTLY AS SHOWN. DO NOT INLINE THE JSON. DO NOT USE `cat <<'JSON'`.**
> The capture-then-`jq -n --arg` pattern is mandatory because (a) the prompt body
> may contain `"`, newlines, or the literal heredoc tag, (b) `jq -n --arg`
> guarantees JSON-safe escaping. Inline JSON has produced live bugs.

```bash
#!/usr/bin/env bash
# stop-quality-check — self-review checkpoint before stop.
# Emits decision:block JSON so the model gets the prompt as next-turn context
# and must continue. Bails on stop_hook_active to avoid infinite loops.
set -u

input=$(cat)
if printf '%s' "$input" | jq -e '.stop_hook_active // false' >/dev/null 2>&1; then
  exit 0
fi

reason=$(cat <<'STOP_PROMPT_EOF'
<STOP_PROMPT_FROM_INTERVIEW>
STOP_PROMPT_EOF
)

# --- Optional end-of-turn project check (agentEnd, advisory) ---------------
# Included ONLY when Q11 enabled it. <STOP_PROJECT_CHECK_CMD> is the CHEAPEST
# component the user selected in Q7 (typecheck if selected, else build, else
# test) — not necessarily typecheck. Gated on a dirty working tree so trivial
# Q&A turns pay nothing, and time-boxed so it cannot stall the turn. Failures
# fold into `reason` (advisory — Stop cannot hard-block). Omit this whole block
# when the optional check was not enabled.
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STOP_TIMEOUT_S=90
stop_run_to() {
  if command -v timeout >/dev/null 2>&1; then timeout "$STOP_TIMEOUT_S" bash -c "$1"
  elif command -v gtimeout >/dev/null 2>&1; then gtimeout "$STOP_TIMEOUT_S" bash -c "$1"
  else bash -c "$1"; fi
}
if [ -n "$(cd "$root" 2>/dev/null && git status --porcelain 2>/dev/null)" ]; then
  out=$(cd "$root" && stop_run_to "<STOP_PROJECT_CHECK_CMD>" 2>&1); rc=$?
  if [ "$rc" -ne 0 ]; then
    [ "$rc" = 124 ] && tnote=" (timed out after ${STOP_TIMEOUT_S}s)" || tnote=""
    reason="${reason}

End-of-turn project check FAILED${tnote}: \`<STOP_PROJECT_CHECK_CMD>\`
$(printf '%s' "$out" | tail -20)
Fix this before stopping."
  fi
fi
# ---------------------------------------------------------------------------

jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
```

The sentinel `STOP_PROMPT_EOF` is intentionally unlikely to appear in user-supplied text. If the auto-drafted body genuinely contains that string at start-of-line (rare — long underscored caps), pick a fresh sentinel at write time.

**Default auto-draft for `<STOP_PROMPT_FROM_INTERVIEW>`** (project mode, profile-aware). Compose from profile, keep to ONE line per check.

**Composition rule — drop empty lines.** Before writing, evaluate each numbered line. If its `<PROFILE.X>` substitution would be empty / `unknown` / `none-detected`, **omit the entire line** (don't write a line with empty backticks). Renumber the survivors so the prompt stays clean. Lines 1 and 5 below are profile-independent and always survive.

```
Self-review checkpoint before stopping:
1. Every change traces to the user's request — no scope creep, no unrequested refactors.
2. Tests pass — ran `<PROFILE.TEST_CMD>` for touched code.            (omit if TEST_CMD=unknown)
3. Type check passes — ran `<PROFILE.TYPE_CHECK>` if relevant.        (omit if TYPE_CHECK=none-detected)
4. Project invariants honored: <PROFILE.STATED_INVARIANTS_FIRST_TWO>  (omit if STATED_INVARIANTS empty)
5. No dead code, debug prints, or stale imports left behind.
State explicitly: what works, what's incomplete, what's untested. If all pass, stop.
```

If profile fields are ALL empty (sparse-project fallback), use the **generic one-line** version:

```
Self-review: every change traces to the request, tests pass, no dead code/debug prints. If yes, stop.
```

After writing each script: `chmod +x` it.

#### Settings merge (jq)

> **MANDATORY: Use the `merge_hook` function below for every settings edit.** Do NOT hand-write JSON into settings files. Hand-writing is what produces the `"matcher": ""` bug for matcherless events. The function dispatches by event name and omits the field automatically.

Idempotent merge — wraps `.hooks[]?.command` collection in an array before `index` so dedup actually fires (a raw stream is never matched by `index`).

**Matcherless events** (`Stop`, `Notification`, `SubagentStop`, `PreCompact`) have no matcher concept in Claude Code; the `matcher` field MUST be omitted from those entries (writing `"matcher": ""` is misleading noise AND the file fails Step 5's assertion). Dispatched by event name:

```bash
merge_hook() {
  local file="$1" event="$2" matcher="$3" command="$4"
  local tmp; tmp=$(mktemp)
  [ -f "$file" ] || echo '{}' > "$file"

  case "$event" in
    Stop|Notification|SubagentStop|PreCompact)
      # Matcherless: omit matcher field; dedup by (event, command).
      jq --arg event "$event" --arg cmd "$command" '
        .hooks //= {} |
        .hooks[$event] //= [] |
        ([ .hooks[$event][] | .hooks[]?.command ]) as $existing |
        if ($existing | index($cmd)) then
          .
        else
          .hooks[$event] += [{ hooks: [{ type: "command", command: $cmd }] }]
        end
      ' "$file" > "$tmp"
      ;;
    *)
      # Matchered: dedup by (event, matcher, command).
      jq --arg event "$event" --arg matcher "$matcher" --arg cmd "$command" '
        .hooks //= {} |
        .hooks[$event] //= [] |
        ([ .hooks[$event][] | select(.matcher == $matcher) | .hooks[]?.command ]) as $existing |
        if ($existing | index($cmd)) then
          .
        else
          .hooks[$event] += [{ matcher: $matcher, hooks: [{ type: "command", command: $cmd }] }]
        end
      ' "$file" > "$tmp"
      ;;
  esac

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
| `block-path-access.sh` | `PreToolUse` | `Edit\|Write\|MultiEdit` (always) + `Read` (only if writes+reads chosen) |
| `pre-git-checks.sh` | `PreToolUse` | `Bash` |
| `staged-static-check.sh` | `PreToolUse` | `Bash` |
| `stop-quality-check.sh` | `Stop` | _(none — matcherless event)_ |

`block-path-access.sh` and `pre-git-checks.sh` both register on `PreToolUse`/`Bash` alongside `block-bash-pattern.sh` — multiple matchered entries on the same event/matcher are fine (they run in parallel; each is its own array entry). `block-path-access.sh` registers twice when reads are protected: once for `Edit|Write|MultiEdit`, once for `Read` (call `merge_hook` once per matcher).

### Step 5: Verify

1. `bash -n "$HOOK_DIR/<each-script>.sh"` — syntax check every generated script.
2. `jq . "$file" >/dev/null` each settings file post-merge — belt-and-suspenders over the in-merge check.
3. **Matcherless-event assertion** — fail loud if any matcherless event has a `matcher` key (catches Bug 2 regressions):

   ```bash
   for f in "${SETTINGS_FILES[@]}"; do
     [ -f "$f" ] || continue
     if ! jq -e '
       [(.hooks.Stop // []), (.hooks.Notification // []),
        (.hooks.SubagentStop // []), (.hooks.PreCompact // [])]
       | flatten | all(has("matcher") | not)
     ' "$f" >/dev/null 2>&1; then
       echo "error: $f has a matcher field on a matcherless event (Stop/Notification/SubagentStop/PreCompact). Re-run merge_hook for that event." >&2
       exit 1
     fi
   done
   ```

4. **Stop-hook shape assertion** — for any `stop-quality-check.sh` generated, grep for the anti-pattern that produces Bug 1:

   ```bash
   if [ -f "$HOOK_DIR/stop-quality-check.sh" ] && \
      grep -qE "cat <<'JSON'" "$HOOK_DIR/stop-quality-check.sh"; then
     echo "error: stop-quality-check.sh uses inline-JSON heredoc — rewrite with jq -n --arg per template." >&2
     exit 1
   fi
   ```

4a. **Path-block dry check** — if `block-path-access.sh` was generated, confirm it blocks a protected write and PASSES a benign write. Project scope must block a symlink escape; global scope must allow it. Never touch a real secret; use temp paths:

   ```bash
   s="$HOOK_DIR/block-path-access.sh"
   if [ -f "$s" ]; then
     tmp=$(mktemp -d); ln -s /etc "$tmp/escape" 2>/dev/null || true
     run() { CLAUDE_PROJECT_DIR="$tmp" bash "$s"; }   # feed stdin per case
     # protected write → expect exit 2
     printf '{"tool_name":"Write","tool_input":{"file_path":"%s/.env"}}' "$tmp" | run; [ $? -eq 2 ] || echo "warn: .env write not blocked"
     # symlink escape → project blocks; global allows out-of-tree writes
     printf '{"tool_name":"Write","tool_input":{"file_path":"%s/escape/x"}}' "$tmp" | run; rc=$?
     if [ "$SCOPE_LABEL" = "project" ]; then
       [ "$rc" -eq 2 ] || echo "warn: project symlink escape not blocked"
     else
       [ "$rc" -eq 0 ] || echo "warn: global out-of-tree write wrongly blocked"
     fi
     # benign write → expect exit 0
     printf '{"tool_name":"Write","tool_input":{"file_path":"%s/src.txt"}}' "$tmp" | run; [ $? -eq 0 ] || echo "warn: benign write wrongly blocked"
     # template variant → expect exit 0
     printf '{"tool_name":"Write","tool_input":{"file_path":"%s/.env.example"}}' "$tmp" | run; [ $? -eq 0 ] || echo "warn: .env.example wrongly blocked"
     rm -rf "$tmp"
   fi
   ```

4b. **Pre-git-check dry check** — if `pre-git-checks.sh` was generated, confirm the git-detector fires on `git commit` and ignores a non-git command (use a trivially-passing check or expect no early exit-2):

   ```bash
   s="$HOOK_DIR/pre-git-checks.sh"
   if [ -f "$s" ]; then
     # non-git command must pass through untouched (exit 0)
     printf '{"tool_input":{"command":"ls -la"}}' | bash "$s"; [ $? -eq 0 ] || echo "warn: non-git command not ignored"
     # git commit triggers the check pipeline (exit 0 if baseline clean, 2 if a check fails — both prove the detector fired)
     printf '{"tool_input":{"command":"git commit -m wip"}}' | bash "$s"; rc=$?; [ "$rc" = 0 ] || [ "$rc" = 2 ] || echo "warn: git detector did not fire (rc=$rc)"
   fi
   ```

4c. **Staged-static-check dry check** — if `staged-static-check.sh` was generated, confirm the gate passes non-git commands, blocks a dirty staged file, and accepts a clean staged file. Never run the real linter against a real repo — the throwaway fixture below uses `mktemp -d` and is self-contained:

   ```bash
   s="$HOOK_DIR/staged-static-check.sh"
   if [ -f "$s" ]; then
     tmp=$(mktemp -d); cd "$tmp" || exit 0
     git init -q -b main 2>/dev/null || git init -q
     git config user.email t@t && git config user.name t
     git commit --allow-empty -q -m init
     # Clean baseline: a clean .py staged, then `git commit -m wip` MUST pass.
     printf 'x = 1\n' > clean.py
     # Non-git command MUST exit 0 (not gated).
     (cd "$tmp" && CLAUDE_PROJECT_DIR="$tmp" bash "$s" <<< '{"tool_input":{"command":"ls"}}')
     [ $? -eq 0 ] || echo "warn: non-git command not ignored by staged-static-check.sh"
     # Stash a lint-dirty staged file by mocking ruff — the smoke test in
     # .claude/skills/harness-apply/tests/staged-static-check-smoke.sh does
     # the full fidelity pass (with optional ruff + mypy). This Step 5 check
     # only asserts git-detection + diff-scoping when tools are available.
     echo "staged-static-check smoke: run tests/staged-static-check-smoke.sh for the T.1 cases."
   fi
   ```

5. **Hygiene hints** based on layer chosen:
   - **Team layer** (`.claude/settings.json` written) — print: "Team layer chosen. Commit with: `git add .claude/ && git commit -m 'add Claude Code hooks'`. Hook scripts in `.claude/hooks/` will be shared."
   - **Personal layer** (`.claude/settings.local.json` written) — print: "Personal layer. Add `.claude/settings.local.json` to project `.gitignore` if not already covered."
   - **Global layer** — remind: "Run `bash install.sh` from `$DOTFILES_DIR` to symlink hooks live (line 371 of install.sh handles `.claude/hooks`)."

   **Pi coverage report** — always print, regardless of layer. Reflects Step 2.4's `PI_ADAPTER_STATE` + `PI_COVERAGE_REPORT`:
   - `wired` — print: `Pi coverage: scripts in $HOOK_DIR also fire in Pi via the global harness-gates adapter (extensions/harness-gates wired in $PI_HOME/settings.json). One install per machine; no per-project Pi extension needed.`
   - `missing-extension` / `missing-settings-entry` / `both-missing` — print: `Pi coverage: NOT wired (state=<PI_ADAPTER_STATE>). Scripts in $HOOK_DIR will NOT fire in Pi until the global harness-gates adapter is installed + registered. Run harness-apply again with scope=global, or: bash install.sh (dotfiles ships the adapter).`
   - opted-out — print: `Pi coverage: not wired (opted out in Step 2.4). Re-run with the install + register option to enable Pi enforcement.`
   - Pi not on machine — print: `Pi coverage: skipped (no $PI_HOME on this machine). Claude Code hooks fire normally; Pi is unrelated here.`
   - `PI_COVERAGE_REPORT` was set in Step 2.4; if `0` (any non-wired state), the report line is preceded by `warn:` so the user can grep for it. The **dual-target reality** is always stated: one skill, one set of `.claude/hooks/*.sh` scripts, two thin adapters (Claude `settings.json` + the global Pi `harness-gates` extension). Never claim per-project Pi coverage — the adapter is dotfiles-global by design.

6. Pretty-print the diff (added vs already-present) per settings file. Also print `jq '.hooks | keys' "$file"` so the final event set is visible.

7. Print:
   ```
   Harness-apply done.

   Scope: <global|project>
   Layer: <template+live | team | personal>
   Web research: <used (N posture recs) | skipped: --no-web | skipped: global mode | skipped: sparse profile | unavailable>
   Hook scripts written:
     - <path> (new) | (updated; backup <path>-bak-<UTC-stamp>) | (unchanged)
   Settings updated:
     - <path>: +<N> hook entries, <M> already present
   Gap coverage (all 10 categories — enabled or why not; 4 split into 4a/4b):
     - 1 touched-file syntax:    <enabled afterWrite blocking | skipped: reason>
     - 2 formatter:              <enabled afterWrite fail-open | skipped: reason>
     - 3 lint:                   <enabled afterWrite fail-open (autofix) or blocking (--strict) | skipped: reason>
     - 4a changed-files static:  <enabled beforeGit blocking | skipped: reason>
     - 4b whole-project check:   <enabled beforeGit blocking (<components>) | skipped: reason>
     - 5 scenario/e2e:        <manual reminder | beforeGit | not-detected: reason>
     - 6 arch/context guidance: <reinject enabled | skipped: reason>
     - 7 operational safety (bash): <enabled | skipped: reason>
     - 8 secrets/protected paths:   <writes | writes+reads | skipped: reason>
     - 9 git preflight:       <enabled | skipped: reason>
     - 10 self-review (Stop): <enabled advisory | skipped: reason>
   Skipped (tool missing):
     - <hook> needs <tool>

   To verify: restart Claude Code in this directory and run `/hooks`.
   To remove a hook: edit the settings file's `.hooks.<event>` array and delete the matching entry; delete the script if no other entry references it.
   ```
8. Do NOT execute hooks against fake stdin — too brittle. The user verifies live via `/hooks`.

## Important Notes

- **Idempotent.** Re-running with the same answers does not duplicate hook entries — the jq merge dedupes against a wrapped array of existing commands (not a stream, which would never match). Script files ARE rewritten on re-run; differing prior content is backed up as `<name>.sh-bak-<UTC-stamp>`.
- **Fail-open formatters / fail-closed validators.** `format-on-edit.sh` ends `exit 0` after `command -v X || exit 0` guards. `validate-syntax.sh`, `lint-on-edit.sh`, and `block-bash-pattern.sh` use `exit 2` to block — those are intentional gates.
- **Only `exit 2` blocks.** Any other non-zero is silent (per the guide). Don't ad-lib `exit 1` for guardrails.
- **Hooks run in parallel** on the same event — don't write hooks that depend on each other's order.
- **`$CLAUDE_PROJECT_DIR` for project, `~` for global** (matches Claude Code's path-resolution conventions for hook commands).
- **Matcher includes `MultiEdit`.** Claude Code uses MultiEdit constantly; omitting it silently skips most multi-line edits.
- **Matcherless events omit the `matcher` field.** `Stop`, `Notification`, `SubagentStop`, and `PreCompact` have no matcher concept — the merge function dispatches by event name to drop the field, since writing `"matcher": ""` is misleading noise.
- **Stop hook fires every Stop.** The `decision: block` JSON output injects the self-review prompt as next-turn context every time the model tries to stop. The `stop_hook_active` guard prevents infinite loops, but the first Stop of every reply still pays the cost. Default is skip — enable only when post-edit self-review is worth the per-turn token overhead.
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
- **`permissions.ask` overlap.** Bash guardrails (Q4/Q5) may overlap with patterns already in `permissions.ask` (e.g. `git push --force`, `rm -rf /`). The hook is a hard block (`exit 2`); the permission is an interactive prompt. They coexist — both fire. Step 5 summary should flag overlapping patterns when detected so the user knows the coverage is doubled, not redundant.
- **Timing/posture vocabulary.** Every sensor is `afterWrite` (PostToolUse), `beforeGit` (PreToolUse Bash git-detector), `agentEnd` (Stop, advisory only), or `manual` (reminder text). `blocking` is honored at `afterWrite`/`beforeGit`; `agentEnd` always degrades to advisory because Stop cannot hard-stop the model. The global Pi `harness-gates` adapter uses the same vocabulary so both harnesses stay aligned (issue #030 covers the adapter itself).
- **Web research is advisory, never authoritative.** Step 2.7 dispatches one `web-search-researcher` agent (project mode only, on by default, `--no-web` to skip) to recommend posture/timing for the detected stack. Local repo evidence still decides which commands are offered — research that names a tool the repo lacks is dropped, and where research and the skill's conservative defaults disagree the user is shown both. The skill works fully with `--no-web`; research is a lead-tuning input, not a dependency.
- **Gap-driven coverage.** Evaluate all 10 categories even when absent (cat 4 splits into 4a + 4b). Categories with no hook get a one-line skip reason in the Step 5 summary — silent omission reads as "covered". The four gap-driven additions over the original per-file model are: changed-files static (cat 4a), project checks (cat 4b), scenario checks (cat 5), protected paths (cat 8), git preflight (cat 9).
- **Protected-path safety (`block-path-access.sh`).** Blocks `Edit|Write|MultiEdit` to `.env*` (excluding `.example`/`.sample`/`.template`) and key/secret globs; project scope can also include inferred vendored/generated paths and blocks writes whose realpath escapes the project root (symlink-escape hardening via deepest-existing-ancestor resolution). Global scope deliberately allows ordinary writes outside cwd while retaining secret protection. Optionally blocks `Read` of secret globs. Distinct from the **command** guardrail (`block-bash-pattern.sh`) — one guards paths, the other guards Bash strings.
- **Project checks run pre-git, not per-edit (`pre-git-checks.sh`).** Typecheck/build/test are project-level and too slow for every Edit, and Claude has no per-turn touched-file memory, so they are gated to `git commit`/`git push` where they run once and can hard-block a bad commit. Recommend a clean baseline before enabling a component as blocking — a red baseline blocks every commit. The skill verifies this for you: Step 2.5's **baseline verification + runner resolution** dry-runs each candidate, resolves the correct runner (e.g. bare `pytest`/`python3 -m pytest` → `uv run pytest` when `uv.lock` is present and the system interpreter lacks deps), offers to install missing deps through the build tool (never the system interpreter), and records the `VERIFIED_CMD` the gate actually uses. Compose fastest-first (typecheck → build → test), each time-boxed (`TIMEOUT_S`, default 180s) so a hung check cannot wedge the commit. **Coverage limit:** the gate only sees `git commit`/`git push` run through the **Bash tool** — a commit made another way (MCP git server, IDE, a pre-existing alias that doesn't match the regex) is not caught. It is a strong default, not an airtight gate; CI remains the backstop.
- **Scenario/e2e checks default to manual.** Expensive suites surface as a reminder line, never auto-run on every commit. Promote to `beforeGit` only when the suite is bounded and CI already treats it as normal pre-merge validation.
- **Stop hook can run a real check now.** When opted in (Q11), `stop-quality-check.sh` runs the cheapest project command (gated on a dirty working tree) and folds failures into the re-injected self-review prompt — advisory, since `agentEnd` cannot block. Default still skip: per-Stop cost.
- **Repair mode heals pre-existing buggy hooks.** Step 2.6 validates every existing hook + settings entry against the current template contract. If any fail (`"matcher": ""` on matcherless events, `cat <<'JSON'` in stop-quality-check.sh, naked `<<'EOF'` in reinject-rules.sh, or `bash -n` failures), the skill offers to repair before Step 3. Without this step, Step 3's "skip already-configured hooks" rule would leave inherited bugs in place forever. Repair backs up originals as `<name>.sh-bak-<UTC-stamp>` and re-runs the violation scan to confirm.
- **Dual-target reality, one skill.** Claude Code and Pi share ONE source of hook truth (`.claude/hooks/*.sh`), wired into Claude via `settings.json(.template|.local.json)` and into Pi via the global `harness-gates` extension (issue #030). Two thin adapters, identical scripts. Step 2.4 enforces that the Pi adapter is installed + registered on this machine; Step 5 reports Pi coverage alongside Claude coverage so the user can see both targets landed.
- **Never generate a per-project Pi extension.** The Pi adapter is dotfiles-global by design: one install per machine (`install.sh` ships it), every project on the machine inherits it. Generating a per-project extension was the 2026-06-17 failure mode (duplicated wiring, drift between repos, the user re-installed the same logic N times). The handoff-consume input mode + Step 5 Pi-coverage report exist precisely so the audit/apply pair can SEE and ENFORCE Pi coverage without re-creating it. If a future need arises (e.g. project-only gates that should not fire globally), solve it by per-project Claude settings (`team` layer) — Pi still uses the global adapter for whatever scripts the project makes available.
