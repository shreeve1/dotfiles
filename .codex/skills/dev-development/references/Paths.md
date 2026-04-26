# Development Pipeline — Canonical Output Paths (Codex)

**Single source of truth.** Every `dev-*` Codex skill reads/writes artifacts under
`artifacts/{kind}/{slug}/`. There is exactly one valid location per artifact type.
Top-level `plans/`, `specs/`, `investigations/` are deprecated.

This mirrors the Claude Code / PAI Development pipeline so Codex sessions and
Claude Code sessions can collaborate on the same project's artifacts without
fighting over directory layout.

## Layout

```
artifacts/
├── specs/{feature-slug}/
│   ├── PRD.md                  ← dev-prd output
│   ├── original-prd.md         (optional preserved original)
│   ├── README.md               (epic index, when PRD is epic-decomposed)
│   └── epic-N-{epic-slug}.md   (one per epic — dev-epic output)
├── plans/{plan-slug}/          ← dev-plan / dev-shard / dev-stories outputs
│   ├── plan.md                 ← dev-plan (or original-plan.md if sharded)
│   ├── original-plan.md        (only after sharding)
│   ├── README.md               (shard index)
│   ├── shard-N.md              ← dev-shard
│   └── stories.md              ← dev-stories
├── investigations/{slug}/
│   └── investigation.md        ← dev-investigate
├── reviews/{slug}/
│   └── review-{timestamp}.md   ← dev-review (when persisted)
├── notes/{slug}/               ← dev-prd input scratchpads
└── brainstorming/{slug}/       ← dev-prd input session outputs
```

## Slug rules

- **Format:** `kebab-case` feature name. Example: `paperclip-replacement`, `epic-4-github-issues`.
- **No date suffix.** Date-versioning belongs in git history, not the path.
- **Epic plans:** `epic-N-{epic-slug}` keeps ordering visible at a glance.
- **Investigations without a clear name:** fall back to a timestamp slug (`YYYYMMDD-HHMMSS`).

## Constants

```
SPECS_DIR              = artifacts/specs/
PLANS_DIR              = artifacts/plans/
INVESTIGATIONS_DIR     = artifacts/investigations/
REVIEWS_DIR            = artifacts/reviews/
NOTES_DIR              = artifacts/notes/
BRAINSTORMING_DIR      = artifacts/brainstorming/

PRD_PATH(slug)         = artifacts/specs/{slug}/PRD.md
PLAN_PATH(slug)        = artifacts/plans/{slug}/plan.md
SHARD_PATH(slug, N)    = artifacts/plans/{slug}/shard-{N}.md
STORIES_PATH(slug)     = artifacts/plans/{slug}/stories.md
INVESTIGATION_PATH(s)  = artifacts/investigations/{slug}/investigation.md
```

## Discovery

When a skill needs to find an existing artifact and the slug isn't supplied:

1. Search the canonical directory only: `artifacts/{kind}/`.
2. List subdirectories sorted by mtime descending — or recurse with
   `find artifacts/plans -name 'plan.md' -o -name 'shard-*.md'` for plan files.
3. Ask the user to pick one.

**Do not** fall back to top-level `plans/`, `specs/`, or `investigations/`. If
those exist they are pre-migration leftovers; surface them in the error message
so the user knows to run a migration.

## Co-location guarantee

For a feature `paperclip-replacement`, every artifact is reachable from two
directories:

- `artifacts/specs/paperclip-replacement/` — what we're building, why, scope, epics
- `artifacts/plans/{epic-slug}/` — how each epic is implemented (one per epic)

`ls artifacts/specs/paperclip-replacement/ artifacts/plans/epic-*/` answers
"what's the state of this feature?" in one glance.
