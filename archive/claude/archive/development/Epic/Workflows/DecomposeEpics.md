# DecomposeEpics Workflow

Decompose a large multi-epic PRD into self-contained per-epic mini-PRDs.

**Voice notification:** Already sent by SKILL.md on invocation.

## Variables

- `PRD_FILE` — Path to a specific PRD file, if provided
- `PRD_DIRECTORY` — `artifacts/specs/`
- `FEATURE_THRESHOLD` — `8`
- `FORCE_FLAG` — accept `--force` arg to bypass the scope-gate

---

## Phase 1 — Load PRD

1. **Locate PRD**
   - If `PRD_FILE` is a path: verify it exists, read it
   - If not provided: list `.md` files in `PRD_DIRECTORY` sorted by modification time (newest first), present via `AskUserQuestion`
   - Wait for user selection before proceeding

2. **Parse PRD Structure**
   - Extract `Scope:` line from frontmatter/header
   - Extract all `#req-[id]` tags (sum across Must Have + Should Have)
   - Extract each feature block with its `#req-[id]`, User Story, and Acceptance Criteria
   - Extract shared sections: Vision, Problem Statement, Target User, Competitive Landscape, Technical Requirements, Success Metrics, Open Questions
   - Count features

---

## Phase 2 — Scope Gate

**Trigger decomposition when ANY of these are true:**
1. `Scope:` line contains `Multi-week`, `Ongoing`, or similar multi-feature language
2. Total distinct `#req-[id]` tags exceeds `FEATURE_THRESHOLD`
3. PRD explicitly lists 3+ epics, phases, or major workstreams
4. User passed `--force`

**If NONE are true:**
- Report that the PRD is single-epic and `/dev-plan` can handle it directly
- Exit without writing any files — see Report Format A

---

## Phase 3 — Propose Epic Groupings

1. **Analyze natural seams**
   - Look at Must-Have features for dependency clusters
   - Look at Technical Requirements for subsystem boundaries
   - Group features that share the same domain boundary or file cluster

2. **Propose groupings via AskUserQuestion**
   ```
   question: "Proposed epic groupings — which do you want?"
   multiSelect: true
   options: [
     "Epic 1: <name> — <features by #req-id>",
     "Epic 2: <name> — <features by #req-id>",
     ...,
     "Let me regroup freely"
   ]
   ```

3. **If user selects "regroup freely"** — ask for groupings as free-text, re-present structured version for confirmation

4. **Verify coverage** — every Must-Have and Should-Have `#req-[id]` must belong to exactly one epic

---

## Phase 4 — Determine Sequencing

1. **Infer dependencies** — data-layer epics first, integration epics depend on core, cutover epics last

2. **Propose sequencing via AskUserQuestion**
   ```
   question: "Execution order — recommended sequence (reorder if needed)"
   options: [
     "Accept recommended order: Epic 1 → Epic 2 → ...",
     "Let me reorder"
   ]
   ```

3. **Record Depends On** per epic

---

## Phase 5 — Generate Mini-PRDs

For each epic, produce a mini-PRD following the Mini-PRD Format below.

Key rules:
- Copy Vision, Target User, Technical Requirements, Open Questions verbatim
- OWN its Must-Have and Should-Have features (subset from parent)
- DECLARE `Depends On: [epic-IDs]` and `Enables: [epic-IDs]`
- INCLUDE `Parent PRD:` pointer
- INCLUDE `## Requirement Tags` subset this epic covers

### Mini-PRD Format

```md
# PRD: <Parent Product Name> — Epic <N>: <Epic Name>

**Date:** <date>
**Parent PRD:** [original-prd.md](original-prd.md)
**Epic:** <N> of <total>
**Depends On:** <list of epic IDs, or "None — foundation epic">
**Enables:** <list of epic IDs that depend on this one, or "None — leaf epic">
**Status:** Draft
**Scope:** <inherited from parent>

## Epic Objective

<2-3 sentences: what this epic accomplishes and how it fits the parent vision>

## Vision
<copied verbatim>

## Problem Statement
<copied verbatim, or scoped if composite>

## Target User
<copied verbatim>

## Competitive Landscape
<copied verbatim, or filtered to this epic's scope>

## User Stories & Features

### Must Have (this epic)
<only Must-Have features belonging to this epic, with #req-[id] tags>

### Should Have (this epic)
<only Should-Have features belonging to this epic>

### Out of Scope (this epic)
- <features in OTHER epics — list with pointer "See Epic N">

## Technical Requirements
<copied verbatim — full Tech Stack, Data Model, Key Interfaces, Third-Party Integrations, Project Structure>

## Success Metrics
<derived metrics specific to this epic>

## Acceptance Criteria
<only criteria involving this epic's #req-[id] tags>

## Open Questions
<filtered to questions relevant to this epic>

## Requirement Tags

| Tag | Feature | Priority |
|-----|---------|----------|
| <only tags covered by this epic> | ... | ... |

## Next Step

Run `/dev-plan artifacts/specs/<parent>/epic-<N>-<slug>.md` to create an implementation plan for this epic.
```

---

## Phase 6 — Write Output Files

Create directory: `artifacts/specs/<parent-prd-basename>/`

Write:
```
artifacts/specs/<parent-prd-basename>/
├── README.md
├── epic-1-<slug>.md
├── epic-2-<slug>.md
├── ...
└── original-prd.md   ← unchanged copy of parent
```

### README.md Format

```md
# <Parent Product Name> — Decomposed into Epics

Parent PRD: [original-prd.md](original-prd.md)
Total Epics: <N>
Total Features: <sum of #req tags>

## Why this was sharded

<one line from scope-gate trigger>

## Execution Order

| Order | Epic | Depends On | Features | Run Command |
|-------|------|-----------|----------|-------------|
| 1 | [Epic 1](epic-1-<slug>.md) | None | <count> | `/dev-plan artifacts/specs/<parent>/epic-1-<slug>.md` |
| 2 | [Epic 2](epic-2-<slug>.md) | Epic 1 | <count> | `/dev-plan artifacts/specs/<parent>/epic-2-<slug>.md` |

## Requirement Coverage Map

| #req-[id] | Epic | Priority |
|-----------|------|----------|

Total coverage: <N>/<N> parent #req tags (100%).
```

---

## Phase 7 — Report

### Report Format A: No-op

```
Dev Epic Analysis — No Decomposition Needed

PRD: <path>
Scope: <scope line>
Features: <N> (below threshold, single-epic)

Verdict: This PRD is single-epic and fits a single plan+build cycle.
Next step: /dev-plan <PRD path>
```

### Report Format B: Decomposed

```
Dev Epic Decomposition Complete

Parent PRD: <path>
Decomposed into <N> epics:

  artifacts/specs/<parent>/
  ├── README.md
  ├── epic-1-<slug>.md   <N> features
  ├── epic-2-<slug>.md   <N> features
  └── original-prd.md

Execution Order:
  1. /dev-plan artifacts/specs/<parent>/epic-1-<slug>.md
  2. /dev-plan artifacts/specs/<parent>/epic-2-<slug>.md  (depends on Epic 1)

Requirement coverage: <N>/<N> parent #req tags assigned (100%).
```

---

## Error Handling

- **No PRDs in `PRD_DIRECTORY`:** report, suggest running `/dev-prd` first
- **No `#req-[id]` tags:** warn traceability will be weak; proceed using feature headers
- **Fewer than 2 proposed epics:** fall through to Report Format A (no-op)
- **User rejects all groupings with no alternatives:** abort, no files written
