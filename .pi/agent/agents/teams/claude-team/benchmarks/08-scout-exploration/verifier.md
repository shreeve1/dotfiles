# Verifier: Codebase Exploration for Unfamiliar Feature

## Target Agent
scout.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Structure Mapping (weight: 3)
- 5: Report maps the full notification architecture — entry points, data flow, storage, delivery channels — with exact file paths for each component
- 3: Covers most components but misses a layer (e.g., mentions the service but not the worker) or lacks file paths
- 1: Lists files found but doesn't explain how they connect
- 0: No structural overview

### Criterion 2: Relationship Tracing (weight: 3)
- 5: Traces the notification flow from creation through delivery — identifies which service calls the worker, how email/push channels are selected, what the data model looks like
- 3: Identifies some relationships but misses key connections (e.g., doesn't connect the worker to the delivery channels)
- 1: Treats each file as independent without tracing flows
- 0: No relationship analysis

### Criterion 3: Downstream Actionability (weight: 2)
- 5: Report is structured so the planner can immediately identify which files to modify, what patterns to follow, and what risks exist — includes specific recommendations
- 3: Report is informative but the planner would need to re-read files to plan
- 1: Report is a raw dump of what was found without synthesis
- 0: Report is too vague to act on

### Criterion 4: Report Format Compliance (weight: 1)
- 5: Uses the structured scout report format (Explored, Structure, Key Findings with file:line, Relationships, Recommendations)
- 3: Has some structure but doesn't follow the defined format
- 1: Unstructured narrative
- 0: No recognizable format

## Required Elements
- [ ] Every listed file is referenced with its path
- [ ] The notification creation → storage → delivery flow is described
- [ ] At least 2 specific file:line references for key definitions
- [ ] A Recommendations section identifying what to explore further or watch out for
- [ ] The report identifies both delivery channels (email and push)

## Anti-Patterns
- Listing files without explaining what they do or how they connect
- Missing the worker/async delivery pattern entirely
- Report that only describes one file in detail and ignores the rest
- No file paths in findings (just "the notification service does X")
- Recommending changes instead of just mapping the codebase (scout is READ-ONLY)
