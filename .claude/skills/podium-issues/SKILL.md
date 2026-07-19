---
name: podium-issues
description: "Slice an approved plan directly into Podium Issues for the binding matching cwd. No .kanban scan or mirror; creates issues in dependency order with real blocked_by ids and locks."
---

# Podium Issues

Turn an approved plan into Podium issues directly. This replaces the old
`.kanban` folder mirror: **do not scan or write `.kanban/` files**.

## When to use

Use after `grill-with-docs` / `dev-plan` when the operator wants the plan queued in
Podium instead of Ralph's local kanban.

## Prerequisites

- Run from `/home/james/symphony` or pass `--cwd <binding-repo>` to the CLI.
- cwd must resolve to a `tracker: podium` binding in `bindings.yml` by matching
  the binding `repo_path`.
- No Plane calls. Do not read or print `/home/james/symphony-host.env`.

## Workflow

1. Read the plan from the conversation or the file the operator names.
2. Draft vertical tracer-bullet slices using the `/to-issues` rules:
   - each slice is end-to-end and independently useful;
   - acceptance criteria are objective;
   - verification is a repo-correct runnable command, not prose — must be on a
     single line wrapped in a single pair of single backticks (`), never a fenced
     code block (```); slicer-created issues are stamped `auto_land=true`, and
     the coding-binding review backstop re-runs this command;
     - **Refactor/move slices must use the full test suite**
       (`.venv/bin/python -m pytest -q`).  Relocating a function into a
       different module can silently break monkeypatches or imports in
       *any* test file — scoped per-file verification (e.g. only
       ``tests/test_scheduler.py``) will miss regressions in sibling
       suites (see Symphony issue #258 → slice 6, log_retention
       regression).  Scoped verification is fine for additive slices
       that do not touch existing call-site modules.
   - blockers are explicit;
   - `locks` labels identify resources that must not co-run.
   - **Migration lock (C-0335):** any slice that creates an Alembic
     revision under `web/api/migrations/` MUST carry `locks: [migrations]`.
     Parallel slices branching a new revision from the same parent produce
     two Alembic heads (e.g. #136 + #137 both created `0012_*` from `0011`).
     Use the single coarse `migrations` lock on *every* migration-creating
     slice — not a per-file lock — because two *different* new migrations from
     the same head still collide; Symphony's dispatch lock enforcement then
     serializes them so the second branches from the first's landed head.
3. Show the proposed slices and ask the operator to approve granularity,
   dependencies, locks, and verification commands. This skill is
   authoring-time; do not use it inside unattended dispatch.
4. Write a temporary YAML slice spec, e.g. `/tmp/podium-slices.yml`:

   ```yaml
   slices:
     - key: schema
       title: Add dependency columns
       description: Add the columns and read-path coercion.
       acceptance:
         - issue rows expose blocked_by and locks as typed lists
       verification: uv run pytest web/api/tests/test_alembic_baseline.py -q
       locks: [schema]
     - key: api
       title: Carry dependencies through API
       description: Create/patch accepts blocked_by and locks.
       acceptance:
         - create response includes blocked_by and locks
       verification: uv run pytest web/api/tests/test_issue_create.py -q
       blocked_by: [schema]
       locks: [web-api]
   ```

   Each slice may optionally pin a `model:` (and optionally `agent:`), validated
   against `models.yml` at load time so a bad/ambiguous model fails before any
   issue is inserted (ADR-0030):

   ```yaml
   slices:
     - key: heavy
       title: Run on opus
       description: ...
       acceptance: [...]
       verification: uv run pytest -q
       model: claude-opus-4-8
       agent: claude
   ```

   - `model:` must resolve in `models.yml` for the slice's agent (use `provider/id`
     if the bare id is ambiguous across agents/providers).
   - `agent:` must be a known agent (`pi` or `claude`). If omitted, the binding's
     `default_agent` is used; the model's catalog agent must still match it.
   - Slices without `model:`/`agent:` behave exactly as before.
   - Validation runs in `--dry-run` too.

5. Dry-run:

   ```bash
   cd /home/james/symphony && uv run python -m web.cli.podium issues create-from-plan /tmp/podium-slices.yml --cwd <binding-repo> --dry-run
   ```

6. Live create after approval:

   ```bash
   cd /home/james/symphony && uv run python -m web.cli.podium issues create-from-plan /tmp/podium-slices.yml --cwd <binding-repo>
   ```

7. Spot-check:

   ```bash
   cd /home/james/symphony && uv run python -m web.cli.podium issues list --binding <binding-name>
   ```

## Safety rules

- The live command creates `todo` Podium issues with `auto_land=true` and may make
  them dispatchable on the next scheduler poll. Dry-run first.
- Slice `worktree_active` follows the binding's `worktree_default`: an explicit
  value wins; otherwise coding bindings default true and infra bindings false.
  Coding slices therefore use per-issue worktrees by default, while infra slices
  normally commit directly in the binding checkout.
- Dependencies are created blocker-first; dependent `blocked_by` uses the real
  Podium ids returned by earlier inserts.
- The old `issues import-kanban` mirror is retired. If you need Ralph local
  issues, use `/to-issues`; if you need Podium issues, use this skill.

## Verification

```bash
PATH="$HOME/.local/bin:$PATH" uv run pytest web/cli/tests/test_podium_issues.py -q
```
