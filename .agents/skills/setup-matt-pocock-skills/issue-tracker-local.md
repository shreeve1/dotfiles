# Issue tracker: Local Markdown (`.kanban/`)

Issues and specs (you may know a spec as a PRD) for this repo live as markdown files in `.kanban/`. This is the board `tralph`, `gralph` and `ralph` execute. The full ticket schema, the status/label model and the eligibility rule are defined in the `kanban` skill; this file says how each tracker operation maps onto the board.

## Layout

```text
.kanban/
  issues/NNN-<slug>.md     one runnable ticket per file (YAML frontmatter + body)
  archive/<date>/          done / cancelled tickets (still searched for dependencies)
  specs/<spec-slug>.md     one spec per file
  maps/<effort>/map.md     wayfinder maps; their decision tickets live beside the map
  progress.md              inter-iteration notes
```

- Ticket ids are **numbers, unique across `issues/` and `archive/`, never reused**. The next id is the highest id in either directory plus one. File name: `NNN-<slug>.md`, zero-padded to three digits.
- A ticket belongs to a spec through its `spec: <spec-slug>` frontmatter field, **not** through a folder. The board stays flat so a commit reference `(#N)` always names exactly one ticket.
- `issues/` holds runnable tickets only. Specs, wayfinder maps and decision tickets never go there: the loop and `gralph` read every `*.md` in `issues/` as a ticket and reject files without frontmatter.
- Triage state is a **label** in the ticket's `labels:` field (see `triage-labels.md`). Execution state is `status:`. They are separate; see below.

## A ticket file

```markdown
---
id: 63
title: Add the thing
status: pending
labels: [ready-for-agent]
blocked_by: [61, 62]
parent: null
spec: my-spec
priority: 0
files: [src/thing/, tests/thing/]
created: 2026-10-14
---

## What to build

...

## Acceptance criteria

- [ ] ...

## Verification

`one repo-correct command`
```

Keep the frontmatter contiguous (no blank line inside it) and put `## Verification` as exactly one backticked command.

## Conventions for conversation

- Comments and conversation history append to the bottom of the ticket under a `## Comments` heading (never into frontmatter).
- A ticket that hit a runtime problem carries a `## Blocker` section; `status: blocked`.

## When a skill says "publish to the issue tracker"

- **A ticket** (`/to-tickets`): create `.kanban/issues/NNN-<slug>.md` in the schema above, in dependency order (blockers first), with `status: pending`, `created: <today>`, `spec: <spec-slug>` when it belongs to a spec, and `labels: [ready-for-agent]` unless told otherwise. Allocate each id as the highest id across `issues/` and `archive/` plus one.
- **A spec** (`/to-spec`): create `.kanban/specs/<spec-slug>.md`. A spec is **not** a ticket: it has no frontmatter requirements, never goes in `issues/`, and is not itself run by the loop. Choose a short kebab-case slug (`[a-z0-9][a-z0-9-]*`) that is not already a file in `specs/`; the same slug goes in each child ticket's `spec:` field and is what you pass to `tralph --spec`.

Create directories if they do not exist (`mkdir -p .kanban/issues .kanban/archive .kanban/specs .kanban/maps`).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass a path or a ticket number (`63` → the `issues/063-*.md` file, else the same id under `archive/`). For a spec, read `.kanban/specs/<slug>.md`.

## When a skill says "list the issues" / "query the tracker"

Use `board.sh` (in the `kanban` skill directory) instead of grepping:

```bash
board.sh --board .kanban counts                 # how many in each state
board.sh --board .kanban eligible               # workable tickets (id + path)
board.sh --board .kanban json                   # every ticket as JSON (id, status, labels, blockedBy, spec, ...)
board.sh --board .kanban --spec my-spec json    # one spec's tickets
```

## When a skill says "apply / change a triage label" (`/triage`)

Edit the ticket's `labels:` list: replace the current **state** label with the new one. Keep exactly one state label (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); leave category labels (`bug`, `enhancement`) alone. **Do not edit `status:`** — that is the loop's. A ticket with no state label, or two, is a conflict: flag it and ask the maintainer before changing anything. An unlabeled ticket is treated as `needs-triage`.

## When a skill says "close the issue"

Set `status: done` (work finished) or `status: cancelled` (abandoned), update `updated:`, and let `/kanban archive` move it later. `wontfix` is a **label** (triage decision), not a closing status: a `wontfix` ticket that will never be worked should also be set `cancelled`.

## Wayfinding operations

Used by `/wayfinder`. A wayfinder effort is **not** a set of runnable tickets, so it lives outside `issues/`.

- **Map**: `.kanban/maps/<effort>/map.md` — the Destination / Notes / Decisions-so-far / Not-yet-specified body.
- **Child ticket**: `.kanban/maps/<effort>/NN-<slug>.md`, numbered from `01` *within the effort*, with the question in the body. Frontmatter:

  ```yaml
  ---
  type: research        # research | prototype | grilling | task
  status: open          # open | claimed | resolved
  blocked_by: []        # NN of other tickets in this effort
  ---
  ```

  These ids are local to the effort and are never referenced by commits, so they do not need to be globally unique — and they must never be copied into `.kanban/issues/` as-is.
- **Blocking**: `blocked_by` in the ticket frontmatter. A ticket is unblocked when every ticket it lists is `resolved`.
- **Frontier**: scan `.kanban/maps/<effort>/` for tickets that are `open`, unblocked and unclaimed; first by number wins.
- **Claim**: set `status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
- When the effort ends in a spec, `/to-spec` writes it to `.kanban/specs/<spec-slug>.md`; the map's Destination links to it.
