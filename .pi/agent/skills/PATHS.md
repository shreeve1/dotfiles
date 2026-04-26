# Pi Dev Pipeline — Canonical Output Paths

**Single source of truth.** Every `pi-dev-*` skill that reads or writes a
pipeline artifact MUST follow this layout. No exceptions.

---

## Layout

```
artifacts/
├── specs/{feature-slug}/
│   ├── PRD.md                  ← pi-dev-prd output
│   ├── original-prd.md         (preserved original; only after pi-dev-epic decomposes a parent)
│   ├── README.md               (epic index; only after pi-dev-epic)
│   └── epic-N-{epic-slug}.md   (one per epic; only after pi-dev-epic)
├── plans/{plan-slug}/          ← pi-dev-plan / pi-dev-shard / pi-dev-stories outputs
│   ├── plan.md                 ← pi-dev-plan output (canonical filename)
│   ├── original-plan.md        (preserved original; only after pi-dev-shard splits)
│   ├── README.md               (shard index; only after pi-dev-shard)
│   ├── shard-N.md              ← pi-dev-shard output
│   └── stories.md              ← pi-dev-stories output
├── investigations/{slug}/
│   └── investigation.md        ← pi-dev-investigate output
├── reviews/{slug}/
│   └── review-{ts}.md          ← pi-dev-review output (when persisted)
├── notes/{slug}/               ← pi-dev-prd input scratchpads
└── brainstorming/{slug}/       ← pi-dev-prd / pi-brainstorm input session outputs
```

---

## Slug rules

- **Format:** `kebab-case` feature name. Examples: `paperclip-replacement`,
  `epic-4-github-issues`, `add-dark-mode`.
- **No date suffix.** Date-versioning belongs in git history, not the path.
- **Epic plan slugs:** `epic-N-{epic-slug}` keeps ordering visible at a glance.
- **PRD parent dir = feature slug**, not `prd-{name}-{date}`. The `prd-...-{date}`
  filename pattern is **deprecated**.
- **Investigation slugs:** prefer a short kebab-case issue name (e.g.,
  `login-500-odd-hours`); fall back to a `YYYYMMDD-HHMMSS` timestamp slug if no
  human-readable name is available.

---

## Path constants (use these names verbatim in every pi-dev-* SKILL.md)

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
REVIEW_PATH(slug, ts)  = artifacts/reviews/{slug}/review-{ts}.md
```

---

## Discovery (when a skill needs to find an existing artifact)

When the slug isn't supplied, the skill should:

1. Search the canonical directory **recursively** for the canonical filenames:
   - Plans: `find artifacts/plans -name 'plan.md' -o -name 'shard-*.md'`
   - PRDs: `find artifacts/specs -name 'PRD.md' -o -name 'epic-*.md'`
   - Investigations: `find artifacts/investigations -name 'investigation.md'`
2. Sort by mtime descending.
3. Use `ask_user` (type: select) to confirm the target.

**Do not** fall back to top-level `plans/`, `specs/`, or `investigations/`
directories. Those are pre-migration leftovers; if the skill encounters them
it should surface them in the report so the user knows to migrate.

**Do not** look for a file literally named `plan.md` at the project root or in
flat `artifacts/plans/<feature>.md` form — those are deprecated layouts.

---

## Pre-flight (before any artifact write)

Every skill that writes an artifact MUST:

1. **Derive `SLUG`** before constructing any path. Sources, in priority order:
   - explicit user argument
   - frontmatter `slug:` field of an upstream artifact (e.g., a PRD's slug)
   - kebab-case derivation from the feature name in the user's request
   - timestamp `YYYYMMDD-HHMMSS` (only as last-resort default for investigations)
2. **Create the slug directory** with `mkdir -p "artifacts/{kind}/${SLUG}"`.
3. **Write to the canonical filename** inside that directory (`PRD.md`,
   `plan.md`, `shard-N.md`, `stories.md`, `investigation.md`).

---

## Co-location guarantee

For a feature `paperclip-replacement`, every artifact is reachable from two
directories:

- `artifacts/specs/paperclip-replacement/` — what we're building, why, scope, epics
- `artifacts/plans/{epic-slug}/` — how each epic is implemented (one per epic)

`ls artifacts/specs/paperclip-replacement/ artifacts/plans/epic-*/` answers
"what's the state of this feature?" in one glance.

---

## Enforcement

Every `pi-dev-*` SKILL.md begins with this prelude:

```
> **Canonical paths (MANDATORY):** Read `~/.pi/agent/skills/PATHS.md` before
> any file output. All artifact paths in this skill resolve through that
> reference. Deviation is a bug — surface it instead of working around it.
```

If a skill writes a file that doesn't conform to this layout, that's a defect.
Fix the skill, don't paper over it in the artifact.
