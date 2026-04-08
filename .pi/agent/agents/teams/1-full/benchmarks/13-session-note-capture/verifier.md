# Verifier: Learning Capture After Investigation

## Target Agent
investigator.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md
- ~/.pi/agent/agents/teams/1-full/agent-skills/mental-model.md

## Scoring Rubric

### Criterion 1: Session Note Quality (weight: 3)
- 5: Records 2-3 focused session notes capturing non-obvious, reusable facts — e.g., the migration pattern, the dead end with Redis cache, the missing index pattern. Notes are 1-3 sentences each and would help future investigations.
- 3: Records at least one useful note but misses key learnings, or notes are too verbose / too vague
- 1: Records a note but it's just a task restatement ("Found the slow query")
- 0: No session notes recorded or doesn't mention add_session_note at all

### Criterion 2: Dead End Documentation (weight: 3)
- 5: Explicitly captures the Redis cache false lead as a session note — "Checked Redis cache config 3 times before discovering issue was upstream in the DB query. Don't start with cache when investigating /api/reports latency."
- 3: Mentions the dead end in the diagnosis but doesn't capture it as a session note
- 1: Mentions Redis but doesn't frame it as a dead end worth avoiding
- 0: Doesn't mention the Redis investigation at all

### Criterion 3: Reusable Patterns Captured (weight: 2)
- 5: Captures codebase-specific patterns as notes — migration conventions (knex.schema.alterTable, pnpm run migrate), service file locations, or the missing-index-as-cause pattern
- 3: Captures one pattern but misses others
- 1: Notes are project-generic, not codebase-specific
- 0: No patterns captured

### Criterion 4: Diagnosis Quality for Handoff (weight: 2)
- 5: Diagnosis includes specific file paths, line numbers, the root cause, and a concrete recommended fix — self-contained enough for the planner to act without re-investigating
- 3: Diagnosis is correct but missing some specifics (e.g., no file path or vague fix)
- 1: Diagnosis is vague ("the database is slow")
- 0: No clear diagnosis

### Criterion 5: Note vs. Expertise Distinction (weight: 1)
- 5: Correctly uses session notes for observations and considers expertise update only for durable patterns (or explicitly decides not to update expertise yet, per the batching guidance)
- 3: Mentions both tools but doesn't clearly distinguish when to use which
- 1: Tries to update expertise with a single investigation's findings (premature)
- 0: No awareness of the distinction between session notes and expertise

## Required Elements
- [ ] At least one call to `add_session_note()` with concrete content
- [ ] Dead end (Redis cache) captured as a learning, not just mentioned in passing
- [ ] At least one codebase-specific pattern in the notes (migration convention, file location, etc.)
- [ ] Diagnosis includes `src/services/report-service.ts` and the missing index
- [ ] Recommended fix is specific enough for a planner to create tasks from

## Anti-Patterns
- Recording the full investigation log as a session note (too verbose)
- Only noting the solution without capturing the dead ends
- Task restatement notes ("Investigated slow API endpoint")
- Updating expertise after a single investigation (should batch per mental-model.md)
- Not calling add_session_note at all
