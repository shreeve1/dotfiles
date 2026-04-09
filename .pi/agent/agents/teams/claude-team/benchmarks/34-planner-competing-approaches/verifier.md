# Verifier: Planner Competing Approaches

## Target Agent
planner (from agents/planner.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Trade-off Analysis (weight: 3)
- 5: Explicitly analyzes both SSE and Socket.IO with concrete pros/cons tied to THIS project (not generic). References specific constraints: single server now, multi-server next quarter, 500 DAU growing to 1-1.5K, one-directional need. Neither approach is dismissed without reasoning.
- 3: Discusses both approaches but analysis is generic (not tied to project constraints) or dismisses one without adequate reasoning.
- 1: Mentions alternatives exist but doesn't compare them meaningfully.
- 0: Picks an approach without mentioning alternatives.

### Criterion 2: Decision Reasoning (weight: 3)
- 5: Makes a clear recommendation with explicit reasoning connecting the choice to specific project constraints (single server now, multi-server next quarter, 500 DAU, one-directional need). The logic chain is traceable — e.g., "Socket.IO because multi-server is confirmed for next quarter and Redis adapter avoids a migration" or "SSE because it's simpler now and we can migrate when multi-server is actually needed — YAGNI." Either choice is valid IF the reasoning ties back to project facts, not just general preference.
- 3: Makes a recommendation but reasoning is vague ("it's better") or doesn't connect to project constraints.
- 1: Recommends both without committing ("use SSE now, switch to Socket.IO later" without planning the migration).
- 0: Refuses to commit or flags this as purely a research question when all facts are provided.

### Criterion 3: Acknowledges Trade-off (weight: 2)
- 5: Explicitly states what is being sacrificed with the chosen approach. If SSE: "will need migration or Redis pub/sub layer when we go multi-server." If Socket.IO: "more complex setup for a feature that only needs one-directional communication." Shows awareness that choosing one option means accepting its downsides.
- 3: Mentions some downsides but doesn't connect them to concrete consequences for this project.
- 1: Presents chosen approach as all-upside.
- 0: No acknowledgment of trade-offs.

### Criterion 4: Migration/Scaling Path (weight: 2)
- 5: Addresses the known future change (multi-server next quarter). If SSE: includes a concrete note on how to add multi-server support later (Redis pub/sub, or migration to Socket.IO). If Socket.IO: justifies the upfront complexity against avoiding migration. Plan doesn't ignore the confirmed roadmap.
- 3: Mentions scalability but no concrete plan for the multi-server transition.
- 1: Ignores the multi-server migration entirely.
- 0: Plan locks the project into a corner with no escape path.

## Required Elements
- [ ] Discusses BOTH approaches explicitly with project-specific pros/cons
- [ ] Makes a clear recommendation with reasoning tied to project facts
- [ ] States what is being sacrificed with the chosen approach
- [ ] Addresses the confirmed multi-server migration next quarter
- [ ] Plan is implementable (not just an analysis — includes tasks, files, validation)

## Anti-Patterns
- Picks an approach without discussing the alternative ("We'll use Socket.IO")
- Refuses to commit and flags as needing research (all information is provided)
- Generic analysis not grounded in this project's constraints (500 DAU, single server, next quarter)
- Ignores the multi-server migration entirely
- Recommends both simultaneously without a clear phased plan
