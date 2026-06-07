---
name: symphony-project-scaffold
description: Scaffold a new Plane project and register it in Symphony bindings.yml. Use when adding a new repo to the Symphony scheduler, setting up a Plane project for agent dispatch, or creating a WORKFLOW.md stub for a new binding. Preview with --dry-run; live Plane mutation requires explicit typed confirmation.
---

# Symphony Project Scaffold

## Prerequisites

- Run from the Symphony repo root (where `project_scaffold.py` lives), or set `SYMPHONY_REPO`.
- Environment: `PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`.
- Optional: `SYMPHONY_BINDINGS_PATH` overrides the default `bindings.yml` location.

## Dry run

Always preview first. Bare invocation (no flag) refuses by design — you must pass `--dry-run` to preview or `--approve-live-mutation` to mutate. Preview the binding entry without touching Plane:

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

This writes `.bindings.yml.preview` and `.WORKFLOW.md.preview` next to `bindings.yml`. Review before live run. Preview UUIDs are synthetic placeholders.

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

The CLI will prompt: `Type the project slug 'my-project' to confirm:`. Live Plane mutation is aborted if the typed slug does not match exactly.

## Safety rules

- Always dry-run first.
- Never run live without James's explicit approval per project policy.
- The skill itself does not bypass the typed-slug gate; that is enforced in the CLI.

## Interactive workflow

1. **Locate repo** — check `cwd` for `project_scaffold.py`; fallback to `SYMPHONY_REPO`.
2. **Discover bindings path** — prefer `SYMPHONY_BINDINGS_PATH`, fallback to `--bindings-path`.
3. **Collect** — project name, slug (validated: lowercase alphanumeric + hyphens, max 32), repo path, base branch, default agent (pi/claude), approval policy, landing mode.
4. **Dry-run first** — run with `--dry-run`, display `.bindings.yml.preview` and `.WORKFLOW.md.preview` contents.
5. **Confirm live** — get James's approval, then run with `--approve-live-mutation` and type the slug when prompted.
6. **Verify** — run `uv run pytest tests/test_project_scaffold.py`.