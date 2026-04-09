# Verifier: Right-Sized Planning

## Target Agent
planner.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Plan Proportionality (weight: 3)
- 5: Plan has 2–4 tasks total (create route file, mount in app.ts, add test, optionally verify). No multi-wave structure, no dependency diagrams, no phased rollout. The plan matches the size of a trivial endpoint addition.
- 3: Plan has 5–7 tasks — correct actions but padded with unnecessary steps (separate tasks for "create directory", "verify TypeScript config", "run linter")
- 1: Plan has 8+ tasks or introduces waves/phases for a single endpoint
- 0: Plan includes architectural decisions, research steps, or reviewer consultation for a trivial health endpoint

### Criterion 2: Actionability Without Ambiguity (weight: 3)
- 5: Every task names the exact file to create/modify and the specific action. The builder could execute each task without asking clarifying questions. Code snippets or pseudocode included where helpful.
- 3: Tasks name files but actions are vague ("add the health route" without specifying the response shape or status code)
- 1: Tasks are general ("set up the endpoint") without file paths or specific actions
- 0: Plan reads like a design doc rather than a task list

### Criterion 3: No Unnecessary Exploration (weight: 2)
- 5: Plan does NOT include steps to "first explore the codebase" or "verify the project structure" — the scout already provided this information and the plan trusts it
- 3: Plan includes one exploration step that re-verifies scout findings
- 1: Plan starts with a full exploration phase despite having scout findings
- 0: Plan ignores scout findings and designs its own exploration strategy

### Criterion 4: Validation Command Specificity (weight: 2)
- 5: Validation section includes exact commands that would prove the endpoint works (e.g., `curl localhost:3000/api/health`, `npm test -- tests/routes/health.test.ts`) — commands the tester can run verbatim
- 3: Validation mentions testing but commands are generic (`npm test`)
- 1: Validation says "verify the endpoint works" without commands
- 0: No validation section

## Required Elements
- [ ] Plan creates `src/routes/health.ts` (or similar following existing pattern)
- [ ] Plan modifies `src/app.ts` to mount the new router
- [ ] Plan includes a test file
- [ ] Total task count is ≤6 (proportional to the work)
- [ ] No exploration or research steps (scout already provided context)

## Anti-Patterns
- Multi-wave plan for a single endpoint (over-structuring)
- Including "Phase 0: Discovery" when discovery is already done
- Acceptance criteria longer than the implementation tasks
- Planning for error handling, rate limiting, or auth on a health endpoint
- Tasks that could be combined into one (e.g., separate tasks for "create file" and "add export")
- Including web-searcher research step for a basic Express route
