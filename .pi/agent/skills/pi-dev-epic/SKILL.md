---
name: pi-dev-epic
description: Decompose a multi-epic PRD into per-epic mini-PRDs that can feed pi-dev-plan independently. Use AFTER dev-prd when a PRD is too large or covers too many features for a single plan-and-build pass. Runs BEFORE pi-dev-plan, not after.
---

# Dev Epic

Decompose a large, multi-feature PRD into a set of self-contained per-epic mini-PRDs. Each mini-PRD is a complete, stand-alone PRD that `pi-dev-plan` can consume without reading the parent. This is the PRD-layer counterpart to plan-layer sharding (which PI does not currently automate — manual decomposition applies there too).

**When to use:** the PRD covers multiple epics, its `Scope:` is `Multi-week` or `Ongoing`, or it has more than ~8 distinct features. If the PRD is small and single-epic, this skill is a no-op and will tell you so.

**When NOT to use:** single-feature PRDs, bug-fix PRDs, weekend-MVP scope. Run `pi-dev-plan` directly on those.

---

## Variables

- `PRD_FILE` — (Optional) Path to the PRD file. If omitted, auto-discovers the most recent PRD.
- `PRD_DIRECTORY` — `artifacts/specs/`
- `FEATURE_THRESHOLD` — `8` (feature count above which decomposition is suggested even if Scope line isn't Multi-week)
- `FORCE_FLAG` — accept `--force` arg to bypass the scope-gate (useful when user explicitly wants decomposition for a smaller PRD)

---

## Instructions

- **DECOMPOSITION ONLY**: Do NOT write code, do NOT build, do NOT run `pi-dev-plan`. Your output is either a no-op report OR a set of mini-PRD files.
- If no `PRD_FILE` is provided, list recent `.md` files in `PRD_DIRECTORY` and ask the user to select via `ask_user` (type: select).
- Read the PRD thoroughly before proposing groupings.
- Respect the scope gate — do not force decomposition on small PRDs without `--force`.
- Each mini-PRD must be a complete, self-contained PRD that `pi-dev-plan` can consume without reading the parent.
- Preserve `#req-[id]` tags exactly — they are traceability anchors used by every downstream skill.
- Never split a feature across two mini-PRDs. If features are tightly coupled, group them in the same mini-PRD.

---

## Scope Gate

Before proposing any decomposition, check whether this PRD actually needs it.

**Trigger decomposition when ANY of these are true:**
1. `Scope:` line contains `Multi-week`, `Ongoing`, or similar multi-feature language
2. Total distinct `#req-[id]` tags (sum across Must-Have + Should-Have) exceeds `FEATURE_THRESHOLD`
3. PRD explicitly lists 3+ epics, phases, or major workstreams
4. User passed `--force`

**If NONE are true:**
- Report that the PRD is single-epic and `pi-dev-plan` can handle it directly
- Exit without writing any files
- See Report Format A

---

## Workflow

### Phase 1: Load PRD

1. **Locate PRD**
   - If `PRD_FILE` is a path: verify it exists using `read`
   - If not provided: use `bash` to list `.md` files in `PRD_DIRECTORY` sorted by modification time (newest first), then present via `ask_user` (type: select)
   - Wait for user selection before proceeding

2. **Parse PRD Structure**
   - Extract `Scope:` line from frontmatter/header
   - Extract all `#req-[id]` tags (sum across Must Have + Should Have) using `rg`
   - Extract each feature block with its `#req-[id]`, User Story, and Acceptance Criteria
   - Extract shared sections: Vision, Problem Statement, Target User, Competitive Landscape, Technical Requirements (Tech Stack, Data Model, Key Interfaces, Third-Party Integrations, Project Structure), Success Metrics, Open Questions
   - Count features

### Phase 2: Scope Gate

1. Apply scope-gate rules above
2. If gate does not trigger: report no-op (Report Format A) and stop
3. If gate triggers: continue to Phase 3

### Phase 3: Propose Epic Groupings

1. **Analyze natural seams**
   - Look at Must-Have features for dependency clusters (e.g., "schema + memory — memory reads schema")
   - Look at Technical Requirements for subsystem boundaries (e.g., "decision agent + tools" is one subsystem)
   - Look at Project Structure for hint directories (e.g., `webhooks/` implies a webhooks epic)
   - Group features that would naturally land in the same file cluster, share the same domain boundary, or be cut together

2. **Propose groupings via `ask_user`**

   Present the proposed groupings as a confirmation prompt:

   ```yaml
   ask_user:
     type: select
     question: |
       Proposed epic groupings:
       - Epic 1: <name> — <features by #req-id>
       - Epic 2: <name> — <features by #req-id>
       - Epic 3: <name> — <features by #req-id>
       ...

       Accept these groupings?
     options:
       - "Yes, use these groupings"
       - "Let me regroup freely"
       - "Cancel"
   ```

3. **If user selects "Let me regroup freely"**
   - Use `ask_user` (type: input) to request their desired groupings as free-text
   - Parse the free-text into structured groupings
   - Re-present the structured version via `ask_user` (type: select) for confirmation

4. **Verify coverage**
   - Every Must-Have and Should-Have `#req-[id]` must belong to exactly one epic
   - If any feature is uncovered, prompt the user to assign it via `ask_user`
   - If any feature appears in two epics, error and re-prompt

### Phase 4: Determine Sequencing

1. **Infer dependencies from Technical Requirements**
   - Data-layer epics (schema, memory) almost always come first
   - Integration epics depend on the core they integrate with
   - Cutover/migration epics come last

2. **Propose sequencing via `ask_user`**

   ```yaml
   ask_user:
     type: select
     question: |
       Recommended execution order:
       1. Epic 1 → 2. Epic 2 → 3. Epic 3 → ...

       Accept this order?
     options:
       - "Accept recommended order"
       - "Let me reorder"
   ```

   If the user selects "Let me reorder", use `ask_user` (type: input) to capture the desired order as a comma-separated list of epic numbers.

3. **Record Depends On** per epic — each non-first epic declares which prior epics must complete before it starts

### Phase 5: Generate Mini-PRDs

For each epic, produce a mini-PRD file following the **Mini-PRD Format** below.

Key rules:
- Copy Vision verbatim
- Copy Target User verbatim
- Copy Technical Requirements verbatim (same stack, same data model — every mini-PRD must be stack-coherent with siblings)
- Copy Open Questions verbatim (or filter to ones relevant to this epic)
- OWN its Must-Have Features (subset from parent)
- OWN its Should-Have Features (subset from parent)
- OWN its Acceptance Criteria (only the #req-ids in this epic)
- OWN its Success Metrics (derived — e.g., "schema migrations applied cleanly" for epic 1 vs "2AM pages reduced" for the cutover epic)
- DECLARE `Depends On: [epic-IDs]`
- INCLUDE a `Parent PRD:` pointer to `original-prd.md`
- INCLUDE the `## Requirement Tags` subset this epic covers

### Phase 6: Write Output Files

Use `bash` to create the directory: `artifacts/specs/<parent-prd-basename>/` (strip `.md`, use kebab-case).

Use `write` to create:

```
artifacts/specs/<parent-prd-basename>/
├── README.md              ← index, sequencing, coverage map
├── epic-1-<slug>.md       ← first mini-PRD
├── epic-2-<slug>.md
├── ...
├── epic-N-<slug>.md
└── original-prd.md        ← unchanged copy of parent
```

Epic file-name slugs should be short kebab-case derived from the epic name (e.g., `epic-1-schema-memory.md`).

### Phase 7: Report

Present Report Format B.

---

## Mini-PRD Format

Each mini-PRD is a full PRD, stand-alone, that `pi-dev-plan` can consume. Use this template:

```md
# PRD: <Parent Product Name> — Epic <N>: <Epic Name>

**Date:** <date>
**Parent PRD:** [original-prd.md](original-prd.md)
**Epic:** <N> of <total>
**Depends On:** <list of epic IDs, or "None — foundation epic">
**Enables:** <list of epic IDs that depend on this one, or "None — leaf epic">
**Status:** Draft
**Scope:** <inherited from parent — typically a subset; e.g., "1-2 week sprint">

## Epic Objective

<2-3 sentences: what this epic accomplishes, why it's scoped this way, how it fits into the parent product vision>

## Vision

<copied verbatim from parent PRD>

## Problem Statement

<copied verbatim from parent PRD — or scoped if the parent problem is composite and only part applies>

## Target User

<copied verbatim from parent PRD, including User Context subsection>

## Competitive Landscape

<copied verbatim from parent PRD — or filtered to competitors relevant to this epic's scope>

## User Stories & Features

### Must Have (this epic)

<only the Must-Have features from the parent PRD that belong to this epic, preserving #req-[id] tags and full acceptance criteria>

### Should Have (this epic)

<only the Should-Have features that belong to this epic>

### Out of Scope (this epic)

- <features that belong to OTHER epics — list them explicitly with a pointer like "See Epic 3">
- <any parent-level out-of-scope items that still apply>

## Technical Requirements

<copied verbatim from parent PRD — every mini-PRD carries the full Tech Stack, Data Model, Key Interfaces, Third-Party Integrations, and Project Structure sections unchanged, because pi-dev-plan needs them to generate a coherent plan>

## Success Metrics

<derived metrics specific to this epic — e.g., for a schema epic: "all migrations apply cleanly and can be rolled back"; for a cutover epic: inherited headline metric from parent>

## Acceptance Criteria

<only the parent-level Acceptance Criteria entries that involve this epic's #req-[id] tags>

## Open Questions

<filtered to questions relevant to this epic — copy verbatim the ones that apply>

## Requirement Tags

| Tag | Feature | Priority |
|-----|---------|----------|
| <only the tags covered by this epic> | ... | ... |

## Next Step

Hand off to `pi-dev-plan` with this file path to create an implementation plan for this epic.

After this epic completes, continue to Epic <N+1>: <name> (if any).
```

---

## README.md Format

```md
# <Parent Product Name> — Decomposed into Epics

Parent PRD: [original-prd.md](original-prd.md)
Total Epics: <N>
Total Features: <sum of #req tags across all epics>

## Why this was decomposed

<one line from scope-gate trigger: "Scope: Multi-week with 13 features exceeds single-plan budget">

## Execution Order

Run these epics in sequence. Each must complete (plan + build + test) before the next begins, except where `Depends On` allows parallel.

| Order | Epic | Depends On | Features | Next Step |
|-------|------|-----------|----------|-----------|
| 1 | [Epic 1: <name>](epic-1-<slug>.md) | None | <count> (<comma list of #req-ids>) | `pi-dev-plan artifacts/specs/<parent>/epic-1-<slug>.md` |
| 2 | [Epic 2: <name>](epic-2-<slug>.md) | Epic 1 | <count> | `pi-dev-plan artifacts/specs/<parent>/epic-2-<slug>.md` |
| ... | ... | ... | ... | ... |

## Requirement Coverage Map

| #req-[id] | Epic | Priority |
|-----------|------|----------|
| #req-<id-1> | Epic 1 | Must Have |
| #req-<id-2> | Epic 1 | Must Have |
| #req-<id-3> | Epic 2 | Must Have |
| ... | ... | ... |

Total coverage: <N>/<N> parent #req tags (100% — every parent feature is assigned to exactly one epic).

## Out of Scope (parent-level)

<copied from parent PRD's Out of Scope section — these remain out of scope across all epics>

## Original PRD

See [original-prd.md](original-prd.md) for the full un-decomposed PRD.
```

---

## Report Format A: No-op (PRD is single-epic)

```
Dev Epic Analysis — No Decomposition Needed

PRD: <path>
Scope: <scope line>
Features: <N> (below threshold of 8, and scope is single-epic)

Verdict: This PRD is single-epic and fits a single plan+build cycle.

Next step:
  Hand off to pi-dev-plan with <PRD path>
```

## Report Format B: Decomposed

```
Dev Epic Decomposition Complete

Parent PRD: <path>
Scope: <scope line>
Features: <N> (exceeded threshold, decomposition warranted)

Decomposed into <N> epics:

  artifacts/specs/<parent>/
  ├── README.md              (index + coverage map)
  ├── epic-1-<slug>.md       <feature count> features — <summary>
  ├── epic-2-<slug>.md       <feature count> features — <summary>
  ├── ...
  └── original-prd.md        (reference)

Execution Order (with dependencies):
  1. pi-dev-plan artifacts/specs/<parent>/epic-1-<slug>.md
  2. pi-dev-plan artifacts/specs/<parent>/epic-2-<slug>.md   (depends on Epic 1)
  3. pi-dev-plan artifacts/specs/<parent>/epic-3-<slug>.md   (depends on Epic 1)
  ...

Requirement coverage: <N>/<N> parent #req tags assigned (100%).

Run each pi-dev-plan in sequence as written, or parallelize where Depends On allows.
```

---

## Error Handling

- **No PRDs in `PRD_DIRECTORY`:** report and suggest running `dev-prd` first
- **PRD file doesn't exist:** report error, re-prompt using `ask_user`
- **No `## Requirement Tags` section in PRD:** warn that traceability will be weak; proceed using feature headers as identifiers but skip the coverage-map table
- **No `#req-[id]` tags anywhere:** scope gate still fires on feature count or Scope line; mini-PRDs reference features by header name instead of tag
- **Fewer than 2 proposed epics:** fall through to Report Format A (no-op) — you don't need to decompose a PRD that only produces one epic
- **User rejects all proposed groupings and provides no alternatives:** abort with a clear message, no files written

---

## Integration with the Pipeline

```
dev-prd           → artifacts/specs/prd-<name>-<date>.md
                         │
                         ▼
pi-dev-epic  ◄── this skill
                         │
                         ▼
artifacts/specs/prd-<name>-<date>/
  ├── README.md
  ├── epic-1-<slug>.md ─────► pi-dev-plan ─► pi-dev-validate ─► pi-dev-build ─► pi-dev-test
  ├── epic-2-<slug>.md ─────► (same sequence, depends on Epic 1)
  └── ...
```

`pi-dev-epic` sits cleanly between `dev-prd` and `pi-dev-plan`. Every other skill's contract is unchanged.

---

## Notes

- **Do not auto-run `pi-dev-plan` per epic.** The user should run each explicitly so they can review the generated plan between epics and adjust scope if needed.
- **Mini-PRDs are self-contained intentionally.** `pi-dev-plan` is allowed to ignore the parent PRD entirely — this prevents context bloat and keeps each plan generation under budget.
- **The parent PRD remains the source of truth** for the vision and overall roadmap. If the vision changes, regenerate mini-PRDs.
- **If a mini-PRD is itself too large** (unlikely but possible for a very complex epic), decompose the generated plan manually at the plan layer — PI has no automated plan sharding skill.
