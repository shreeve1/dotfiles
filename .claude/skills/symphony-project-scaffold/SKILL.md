---
name: symphony-project-scaffold
description: Scaffold a new Plane project and register it in Symphony bindings.yml. Use when adding a new repo to the Symphony scheduler, setting up a Plane project for agent dispatch, or creating a WORKFLOW.md stub for a new binding. Preview with --dry-run; live Plane mutation requires explicit typed confirmation.
---

# Symphony Project Scaffold

## Prerequisites

- Symphony repo at `/home/james/plane/symphony` (host default). If absent, set `SYMPHONY_REPO`.
- Plane env: `PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`. On the aidev host these live in `/home/james/plane/symphony-host.env` (`PLANE_API_KEY`) and on `symphony-host.service` Environment= (`PLANE_API_URL`, `PLANE_WORKSPACE_SLUG`). The skill auto-sources them — see Interactive workflow step 1.
- Optional: `SYMPHONY_BINDINGS_PATH` overrides the default `<symphony-repo>/bindings.yml`.

## Dry run

Always preview first. Bare invocation (no flag) refuses by design — you must pass `--dry-run` to preview or `--approve-live-mutation` to mutate.

```bash
cd <symphony-repo>
python project_scaffold.py \
  --name "My Project" \
  --slug my-project \
  --repo-path /path/to/repo \
  --base-branch main \
  --bindings-path ./bindings.yml \
  --dry-run
```

Writes `.bindings.yml.preview` and `.WORKFLOW.md.preview` next to `bindings.yml`. Review before live run. Preview UUIDs are synthetic placeholders.

## Live run

Requires BOTH flags AND typed confirmation:

```bash
python project_scaffold.py \
  --name "My Project" \
  --slug my-project \
  --repo-path /path/to/repo \
  --base-branch main \
  --bindings-path ./bindings.yml \
  --approve-live-mutation
```

CLI prompts: `Type the project slug 'my-project' to confirm:`. Live Plane mutation aborts if the typed slug does not match exactly.

## Safety rules

- Always dry-run first.
- Never run live without James's explicit approval per project policy.
- The skill itself does not bypass the typed-slug gate; that is enforced in the CLI.

## Interactive workflow

Goal: collect as few inputs from James as possible. Derive everything derivable; only ask to confirm.

### 1. Auto-source Plane env

Check `PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG` in the current shell. If any are missing:

```bash
# Plane API key (and other secrets) live in the host env file
[ -r /home/james/plane/symphony-host.env ] && set -a && . /home/james/plane/symphony-host.env && set +a

# PLANE_API_URL and PLANE_WORKSPACE_SLUG live in the systemd unit's Environment=, not the env file.
# Pull them from there if still unset.
if [ -z "$PLANE_API_URL" ] || [ -z "$PLANE_WORKSPACE_SLUG" ]; then
  eval "$(systemctl show symphony-host.service --property=Environment --no-pager \
    | sed 's/^Environment=//' \
    | tr ' ' '\n' \
    | grep -E '^(PLANE_API_URL|PLANE_WORKSPACE_SLUG)=' \
    | sed 's/^/export /')"
fi
```

If any of the three are still unset after that, stop and ask James where to source them — do not proceed.

Do not print the values. Just confirm "Plane env loaded from symphony-host.env + service unit."

### 2. Locate Symphony repo

- If `cwd` contains `project_scaffold.py`, use cwd.
- Else if `$SYMPHONY_REPO` is set and contains `project_scaffold.py`, use it.
- Else default to `/home/james/plane/symphony`.
- Else stop and ask James.

### 3. Auto-derive project parameters

Target repo = the repo you're scaffolding *into*, not the Symphony repo.

| Param | Derivation |
|---|---|
| `--repo-path` | `cwd` if cwd is a git repo and ≠ symphony repo. Otherwise ask. |
| `--slug` | `basename "$repo_path"` → lowercase, replace non-`[a-z0-9-]` with `-`, collapse repeats, **trim to 12 chars** (Plane's `identifier` field max — derives the ticket prefix e.g. `TRADING-1`). If the basename exceeds 12 chars, surface this and ask James for a short slug rather than auto-truncating. |
| `--name` | Title-case the slug with spaces (`crypto-trading-agents` → `Crypto Trading Agents`). |
| `--base-branch` | `git -C "$repo_path" symbolic-ref --short HEAD` (fallback: `git -C "$repo_path" remote show origin \| awk '/HEAD branch/ {print $NF}'`). |
| `--bindings-path` | `$SYMPHONY_BINDINGS_PATH` else `<symphony-repo>/bindings.yml`. |
| `--default-agent` | `pi` (host default; matches service `PI_BIN`). |
| `--landing-mode` | `local` (script default). |
| approval | Omit `--approval-enabled` (default off). |

### 4. Single confirmation message

Show James all derived values in one block and ask "proceed with dry-run?" — not six separate questions. Example:

```
Derived:
  name         Crypto Trading Agents
  slug         crypto-trading-agents
  repo-path    /home/james/trading/crypto-trading-agents
  base-branch  main
  bindings     /home/james/plane/symphony/bindings.yml
  agent        pi
  landing      local
  approval     off

Proceed with dry-run? (y / edit <field>=<value> / n)
```

Accept `edit <field>=<value>` lines before proceeding.

### 5. Dry-run

Run with `--dry-run`. Display the contents of `.bindings.yml.preview` (just the appended binding entry) and `.WORKFLOW.md.preview` (first ~40 lines) so James can sanity-check.

### 6. Live run

After James approves, re-run with `--approve-live-mutation`. The CLI will prompt for typed slug — pass it through to James; do not type for him.

### 7. Verify

```bash
uv run pytest tests/test_project_scaffold.py
tail -50 <bindings-path>   # confirm real Plane UUIDs, not mock-*-1 placeholders
```

Point James at `.rpiv/artifacts/handoffs/trading-workflow.md` (or equivalent) for authoring the project's real `WORKFLOW.md` — the stub the scaffold drops is intentionally generic.
