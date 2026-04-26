# CreatePlan Workflow


## Contents

- [Variables](#variables)
- [Pre-flight](#pre-flight)
- [Workflow Overview](#workflow-overview)
- [Phase 1: Parse Requirements](#phase-1-parse-requirements)
- [Phase 2: Source Document Discovery](#phase-2-source-document-discovery)
- [Phase 3: Understand Codebase](#phase-3-understand-codebase)
- [Phase 4: Design Solution](#phase-4-design-solution)
- [Phase 5: Plan Phases](#phase-5-plan-phases)
- [Phase 6: Document Plan](#phase-6-document-plan)
- [Phase 7: Generate Filename](#phase-7-generate-filename)
- [Phase 8: Save Plan File](#phase-8-save-plan-file)
- [Phase 9: Validate](#phase-9-validate)
- [Phase 10: Report](#phase-10-report)
- [Instructions](#instructions)
  - [Tag Propagation](#tag-propagation)
- [Plan Format](#plan-format)
- [Report](#report)

Create a detailed implementation plan based on the user's requirements. Analyze the request, think through the implementation approach, and save a comprehensive specification document to `plans/<name-of-plan>.md` that can be used as a blueprint for actual development work.

## Variables

- `USER_PROMPT` — user's planning request
- `PLAN_OUTPUT_DIRECTORY` — `plans/`
- `SOURCE_DIRECTORIES` — search in priority order: `plans/` > `specs/` > `artifacts/plans/` > `artifacts/specs/`
- `TEST_DIR` — `tests/`

## Pre-flight

Ensure `plans/` directory exists. If not, create it:
```bash
mkdir -p plans/
```

## Workflow Overview

Work through these 10 phases in order:

1. **Parse Requirements** — analyze USER_PROMPT to understand core problem and desired outcome
2. **Discover Source Document** — run Source Document Discovery if USER_PROMPT is free text
3. **Understand Codebase** — explore existing patterns, architecture, and relevant files directly
4. **Design Solution** — develop technical approach with architecture decisions and implementation strategy
5. **Plan phases** — structure the implementation into logical phases
6. **Document Plan** — write comprehensive markdown document following Plan Format
7. **Generate filename** — create descriptive kebab-case filename
8. **Save plan file** — write complete plan to PLAN_OUTPUT_DIRECTORY/<filename>.md
9. **Validate** — verify plan completeness and coherence
10. **Report** — present completed plan summary

---

## Phase 1: Parse Requirements

Analyze the USER_PROMPT to understand:
- What is the core problem or desired outcome?
- What type of task is this (feature|fix|refactor|enhancement|chore)?
- What is the complexity level (simple|medium|complex)?
- What constraints or requirements exist?

Ask clarifying questions if intent is not clear.

## Phase 2: Source Document Discovery

If USER_PROMPT is a file path, read that file directly as the source document.

If USER_PROMPT is free text (not a path), check for a source document using the standardized directory search order:

1. List all `.md` files in `plans/`, `specs/`, `artifacts/plans/`, and `artifacts/specs/` sorted by modification date (most recent first)
2. If source documents exist, use `ask the user`: "Found source document: <filename>. Use this as the source for planning and traceability?"
   - Options: "Yes, use this document" / "No, just use my prompt" / "No, let me specify a different file"
3. If user confirms, read the source file and use it alongside USER_PROMPT for requirement tag scanning

## Phase 3: Understand Codebase

Explore the codebase directly to understand:
- Existing patterns and architecture
- Relevant files for the task
- Dependencies and integrations
- Test structure and patterns

Use `read` and `search` tools to gather context. Do not use subagents for this phase.

## Phase 4: Design Solution

Think deeply (think carefully) about the best approach:
- Architecture decisions
- Implementation strategy
- Edge cases and error handling
- Scalability concerns
- Trade-offs and alternatives considered

Document the reasoning behind key decisions.

## Phase 5: Plan Phases

Structure the implementation into logical phases:
- **Phase 1: Foundation** — any foundational work needed
- **Phase 2: Core Implementation** — the main implementation work
- **Phase 3: Integration & Polish** — integration, testing, and final touches

For simple tasks, phases may be combined. For complex tasks, add more phases as needed.

## Phase 6: Document Plan

Follow the Plan Format below to create a comprehensive implementation plan with all required sections.

## Phase 7: Generate Filename

Create a descriptive kebab-case filename based on the plan's main topic, e.g.:
- `feature-auth-jwt.md`
- `fix-session-timeout.md`
- `refactor-api-client.md`

## Phase 8: Save Plan File

Write the complete plan to `plans/<filename>.md`. Ensure:
- Plan is detailed enough that another developer could follow it
- Code examples or pseudo-code included where appropriate
- All edge cases and error handling addressed

## Phase 9: Validate

Verify the plan:
- All required sections present
- Tasks are actionable and have stable [N.M] ID prefixes
- Traceability map correctly links #req-* tags to task IDs
- No missing dependencies between tasks
- Testing strategy is clear and complete

## Phase 10: Report

Present the completed plan summary and remind user to run Build when ready.

---

## Instructions

- **IMPORTANT**: If no USER_PROMPT is provided, stop and ask the user to provide it.
- Determine task type (chore|feature|refactor|fix|enhancement) and complexity (simple|medium|complex)
- Think deeply (think carefully) about the best approach
- Follow the Plan Format below exactly
- Generate descriptive, kebab-case filename

### Tag Propagation

If a source document (PRD, brainstorming output) is found via Source Document Discovery:
1. Scan it for `#req-[id]` patterns (e.g., `#req-user-login`, `#req-data-export`)
2. When generating the `## Step by Step Tasks` section, give each task item a **stable inline ID prefix** `[N.M]` and append the relevant `#req-[id]` tag
3. Format: `- [ ] [1.1] Implement login form #req-user-login`
4. The `[N.M]` prefix serves as a stable anchor for Test to match against when flipping checkboxes
5. Add a `## Traceability Map` section at the end showing `#req-[id]` -> task IDs

If no `#req-[id]` tags exist, skip tag propagation (graceful degradation).

---

## Plan Format

Follow this format exactly:

```md
# Plan: <task name>

## Task Description
<describe the task in detail based on the prompt>

## Objective
<clearly state what will be accomplished when this plan is complete>

<if task_type is feature or complexity is medium/complex, include these sections:>
## Problem Statement
<clearly define the specific problem or opportunity this task addresses>

## Solution Approach
<describe the proposed solution approach and how it addresses the objective>
</if>

## Relevant Files
Use these files to complete the task:

<list files relevant to the task with bullet points explaining why. Include new files to be created under an h3 'New Files' section if needed>

<if complexity is medium/complex, include this section:>
## Implementation Phases
### Phase 1: Foundation
<describe any foundational work needed>

### Phase 2: Core Implementation
<describe the main implementation work>

### Phase 3: Integration & Polish
<describe integration, testing, and final touches>
</if>

## Step by Step Tasks
IMPORTANT: Execute every step in order when running manually. Build will parallelize independent groups automatically.

<list step by step tasks as h3 headers with checkbox bullet points. Start with foundational changes then move to specific changes. Last step should validate the work>

Each task item uses a stable inline ID prefix `[N.M]` where N is the step number and M is the sub-task number. If `#req-[id]` tags were found in the source document, append the relevant tag to each task item.

### 1. <First Task Name>
- [ ] [1.1] <specific action> #req-<relevant-id>
- [ ] [1.2] <specific action> #req-<relevant-id>

### 2. <Second Task Name>
- [ ] [2.1] <specific action> #req-<relevant-id>
- [ ] [2.2] <specific action> #req-<relevant-id>

<continue with additional tasks as needed>

Note: If no #req-[id] tags exist in the source, omit the tag suffix but still use the [N.M] ID prefix and checkbox format.

**Optional parallelism annotations** (append to any `### N.` header when Build's heuristics would be wrong):
- `[parallel-safe]` — explicitly safe to run concurrently with other groups in the same phase, even if files overlap
- `[sequential]` — must run alone in its own wave regardless of other signals

Examples:
### 3. Build API Layer [parallel-safe]
### 5. Run Database Migration [sequential]

If no annotations are present, Build infers parallelism from phase boundaries, dependency language, and file overlap.

<if task_type is feature or complexity is medium/complex, include this section:>
## Testing Strategy
<describe testing approach that will satisfy the Testing Promise, including:
- Unit tests for individual functions and modules in TEST_DIR/unit/
- Integration tests for API endpoints and service interactions in TEST_DIR/integration/
- E2E tests for web-facing features using Playwright MCP tools in TEST_DIR/e2e/
- Edge cases and error scenarios to cover
>
</if>

## Tests
<derive test tasks from Acceptance Criteria. Each test task uses [T.N.M] ID prefix where N is the test category and M is the sub-task>

### T.1. <Test Category>
- [ ] [T.1.1] <specific test case>
- [ ] [T.1.2] <specific test case>

<continue with additional test categories as needed>

## Progress
**Phase Status:**
- Build: `pending`
- Test: `pending`

**Task Counts:**
- Implementation: `0/<N>` tasks complete
- Tests: `0/<M>` tests passing

**Last Updated:** `---`

## Acceptance Criteria
<list specific, measurable criteria that must be met for the task to be considered complete>

## Testing Promise
<clear, single statement of what testing must accomplish - this becomes the completion criteria for Test>
<example: "All unit tests in tests/unit/ and integration tests in tests/integration/ pass with zero failures">
<example: "E2E tests verify all user flows complete successfully with no console errors">

## Validation Commands
Execute these commands to validate the task is complete:

<list specific commands to validate the work. Be precise about what to run>
- Example: `uv run python -m py_compile apps/*.py` - Test to ensure the code compiles

<if #req-[id] tags were found in the source document, include this section:>
## Traceability Map

| Requirement | Tasks |
|-------------|-------|
| #req-<id> | [1.1], [1.2] |
| #req-<id> | [2.1] |

<Maps each #req-[id] tag to the task IDs that implement it. Omit this section entirely if no #req-[id] tags exist.>
</if>

## Notes
<optional additional context, considerations, or dependencies. If new libraries are needed, specify using `uv add`>
```

---

## Report

After creating and saving the implementation plan, provide a concise report:

```
Implementation Plan Created

  File: plans/<filename>.md
  Topic: <brief description of what the plan covers>
  Key Components:
  - <main component 1>
  - <main component 2>
  - <main component 3>

  Next Steps:
  Run Build on plans/<filename>.md when ready to implement.
```
