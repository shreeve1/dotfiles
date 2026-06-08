---
name: symphony-plane-recover
description: Recover Plane projects left in a half-built state by a failed scaffold or other partial mutation. Two subcommands — archive (typed-slug-gated project archive) and state-fill (idempotent Todo/In Review/Running/Blocked/Done + standard label set). Use when scaffold Bug 1 fired, when adopting a legacy Plane project into Symphony, or when stranded state needs cleanup. Bindings.yml ownership stays with symphony-project-scaffold.
---

# Symphony Plane Recover

Escape hatch for half-built Plane projects. On 2026-06-08, scaffold Bug 1 left James cleaning up by hand — this skill codifies the two cleanup paths he used:

- `archive` — archive a Plane project (reversible from the Plane UI but visually disruptive). Typed-slug confirmation required.
- `state-fill` — idempotently add the standard Symphony state set and label set to a project. Safe to re-run; skips anything present by name.

## Prerequisites

- Plane env sourced (`PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`) — same sourcing block as the other symphony-* skills.
- The Plane project exists in the workspace. Lookup by UUID or slug:
  ```bash
  curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
    "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/?search=$ARG" \
    | jq -r '.results[] | {id, identifier, name}'
  ```

## Safety rules

- Both subcommands require **typed-slug confirmation** at the CLI (mirrors `symphony-project-scaffold`). Refuse to proceed if the typed value does not match exactly.
- `archive` is destructive in the UX sense (project disappears from the active list). Reversible from Plane's UI under archived projects, but treat as an intentional, visible action — never automate it across a list.
- `state-fill` is idempotent by name. If a state or label with the same name already exists, skip it. Do not rename, recolor, or reorder existing entries.
- Never print `PLANE_API_KEY`.
- Never touch `bindings.yml` — that's owned by `symphony-project-scaffold`. If the recovered project was registered in bindings.yml, surface the binding entry to James and ask whether to leave or delete it; do not edit.
- Do not restart Symphony from this skill.

## Out of scope

- Creating new Plane projects (see `symphony-project-scaffold`).
- Editing `bindings.yml` (see `symphony-project-scaffold`).
- Restarting `symphony-host.service` (see `symphony-restart`).

## Subcommand: `archive`

### Usage

```
symphony-plane-recover archive <project-id-or-slug>
```

### Workflow

1. Resolve the project. Show its `id`, `identifier`, `name`, and current state (active vs already archived) to James.
2. If already archived, stop — nothing to do.
3. Show the archive command and prompt for typed-slug confirmation:
   ```
   About to archive Plane project:
     id:         <uuid>
     identifier: <PREFIX>
     name:       <Project Name>

   Archiving removes the project from the active list. Reversible from the
   Plane UI under archived projects.

   Type the project identifier '<PREFIX>' to confirm:
   ```
4. After typed approval, archive:
   ```bash
   curl -sS -X POST -H "X-Api-Key: $PLANE_API_KEY" \
     "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/archive/"
   ```
   (Endpoint shape may differ across Plane versions; confirm against the workspace's API docs if it 404s, and surface the response body to James.)
5. Verify the project is now in the archived list:
   ```bash
   curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
     "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/" \
     | jq '{id, name, archived_at}'
   ```
6. If the archived project was registered in `bindings.yml`, surface that entry and remind James the binding will keep producing `reconcile_startup_failed` until removed — but do not edit `bindings.yml` from this skill.

## Subcommand: `state-fill`

### Usage

```
symphony-plane-recover state-fill <project-id-or-slug>
```

### Workflow

1. Resolve the project (same as archive).
2. Fetch existing states and labels:
   ```bash
   curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
     "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/states/" \
     | jq -r '.results[] | "\(.name)\t\(.group)\t\(.id)"'
   curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
     "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/labels/" \
     | jq -r '.results[] | "\(.name)\t\(.id)"'
   ```
3. Compute the diff against the standard sets:

   **States** (Symphony-required set, with Plane `group`):
   - `Todo` — `unstarted`
   - `In Review` — `unstarted`
   - `Running` — `started`
   - `Blocked` — `started`
   - `Done` — `completed`

   **Labels** (Symphony-required set):
   - `mode:plan`
   - `mode:build`
   - `approval-required`
   - `agent:claude`
   - `agent:pi`

4. Show James the diff — what's already present, what would be created — and prompt for typed-slug confirmation:
   ```
   Plane project <identifier> — state-fill plan:

     States to create:
       Todo, Running, Blocked       (In Review and Done already exist)
     Labels to create:
       mode:build, agent:pi          (mode:plan, approval-required, agent:claude already exist)

   Type the project identifier '<PREFIX>' to confirm:
   ```
   If everything already exists, report "nothing to do" and exit clean.
5. After typed approval, POST each missing state and label:
   ```bash
   curl -sS -X POST -H "X-Api-Key: $PLANE_API_KEY" -H "Content-Type: application/json" \
     "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/states/" \
     -d '{"name":"Todo","group":"unstarted"}'
   curl -sS -X POST -H "X-Api-Key: $PLANE_API_KEY" -H "Content-Type: application/json" \
     "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/labels/" \
     -d '{"name":"mode:build"}'
   ```
   (Match `symphony-project-scaffold`'s payloads; if `project_scaffold.py` evolves, this skill should mirror.)
6. Re-fetch states and labels and confirm every required entry is now present. Report what was created vs skipped.

## Verdict / hand off

- `archive` — report the archive succeeded and surface any orphaned `bindings.yml` entry. Recommend James remove the binding and restart Symphony (`symphony-restart`) only if the binding is still bound.
- `state-fill` — report what was created. If the project is intended to be bound, point James at `symphony-project-scaffold` (which appends to `bindings.yml`) or `symphony-workflow-author` if the binding already exists.
