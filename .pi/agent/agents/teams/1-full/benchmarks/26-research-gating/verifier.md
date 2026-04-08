# Verifier: Research Gating

## Target Agent
planner (from agents/planner.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Knowledge Gap Identification (weight: 3)
- 5: Explicitly identifies at least 4 of the 5 unknowns: (a) which CRDT library integrates with ProseMirror, (b) performance at scale, (c) transport protocol choice, (d) server-side storage strategy, (e) `ws` library compatibility. Treats these as blocking decisions, not minor notes.
- 3: Identifies 2-3 unknowns but treats them as FYIs rather than blocking research needs.
- 1: Mentions "we should look into CRDTs" without specific unknowns.
- 0: Doesn't acknowledge any knowledge gaps — plans as if all decisions are made.

### Criterion 2: Research Section (weight: 3)
- 5: Includes a `## Research Needed` section with specific, answerable research questions. Each question is targeted (not "learn about CRDTs" but "which CRDT library has a maintained ProseMirror binding?"). At least 3 distinct research questions.
- 3: Has a research section but questions are too broad ("research CRDT options") or too few (<3).
- 1: Mentions research in passing within task descriptions but no dedicated section.
- 0: No research section. Plans proceed as if all information is available.

### Criterion 3: Conditional Task Marking (weight: 2)
- 5: Implementation tasks that depend on research outcomes are explicitly marked as conditional. E.g., "Task [2.1] — Install CRDT library (conditional on Research Q1 outcome)" or blocked-by annotations. The plan makes clear which tasks can proceed NOW vs. which are blocked on research.
- 3: Some tasks mention research but dependency isn't explicit — unclear which tasks are blocked.
- 1: Tasks are listed as a flat sequence with no conditional markers.
- 0: Full plan with specific library choices as if research is already done.

### Criterion 4: Codebase Grounding (weight: 2)
- 5: Plan references actual files (Editor.tsx, ws.ts, documents.ts, schema.prisma) with specific integration points. Identifies what needs to change in each file and what's uncertain pending research.
- 3: References some files but misses key integration points (e.g., forgets the database schema change or the WebSocket server).
- 1: Generic plan that could apply to any project, not grounded in this codebase.
- 0: No file references.

## Required Elements
- [ ] `## Research Needed` section with at least 3 specific research questions
- [ ] Does NOT commit to a specific CRDT library without research
- [ ] Implementation tasks dependent on research are marked as conditional/blocked
- [ ] References Editor.tsx, ws.ts, and the database schema as integration points
- [ ] Distinguishes what can be done now (e.g., refactor PUT to support patches) from what's blocked on research

## Anti-Patterns
- Picks a specific CRDT library (e.g., "Use Yjs") without research justification
- Creates a complete, fully-sequenced plan as if all decisions are made
- No `## Research Needed` section — treats unfamiliar technology as known
- Generic plan that doesn't reference actual project files or current architecture
- Treats all tasks as ready to execute when key decisions are unresolved
