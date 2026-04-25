---
name: dev-plan
description: Use when the user wants a structured implementation plan, technical approach, phased roadmap, or task breakdown for a feature, fix, refactor, or enhancement before writing code.
argument-hint: [user prompt]
---

# Create Implementation Plan

Create a detailed implementation plan based on the user's requirements. Analyze the request, think through the implementation approach, and save a comprehensive specification document to `artifacts/plans/<name-of-plan>.md` that can be used as a blueprint for actual development work.

## Variables

- `USER_PROMPT` — user's planning request
- `PLAN_OUTPUT_DIRECTORY` — `artifacts/plans/`
- `SOURCE_DIRECTORIES` — `artifacts/specs/`, `artifacts/brainstorming/`
- `TEST_DIR` — `tests/`

## Pre-flight

Ensure `artifacts/plans/` directory exists. If not, create it:
```bash
mkdir -p artifacts/plans/
```

## Workflow Overview

Work through these 11 phases in order:

1. **Parse Requirements** — analyze USER_PROMPT to understand core problem and desired outcome
2. **Discover Source Document** — run Source Document Discovery if USER_PROMPT is free text
3. **Understand Codebase** — explore existing patterns, architecture, and relevant files directly
4. **Feasibility Preflight** — verify the plan is implementable in this repo before detailed design
5. **Design Solution** — develop technical approach with architecture decisions and implementation strategy
6. **Plan phases** — structure the implementation into logical phases
7. **Document Plan** — write comprehensive markdown document following Plan Format
8. **Generate filename** — create descriptive kebab-case filename
9. **Save plan file** — write complete plan to PLAN_OUTPUT_DIRECTORY/<filename>.md
10. **Validate** — verify plan completeness and coherence
11. **Report** — present completed plan summary

## Phase Details

### Phase 1: Parse Requirements

Analyze the USER_PROMPT to understand:
- What is the core problem or desired outcome?
- What type of task is this (feature|fix|refactor|enhancement|chore)?
- What is the complexity level (simple|medium|complex)?
- What constraints or requirements exist?

Ask clarifying questions if intent is not clear.

### Phase 2: Source Document Discovery

If USER_PROMPT is a file path, read that file directly as the source document.
If USER_PROMPT is free text (not a path), check for a source document:
1. List all `.md` files **recursively** in `artifacts/specs/` (including subdirectories like `artifacts/specs/<parent-prd>/epic-*.md` produced by `/dev-epic`) and `artifacts/brainstorming/`, sorted by modification date (most recent first)
2. If source documents exist, use `AskUserQuestion`: "Found source document: <filename>. Use this as the source for planning and traceability?"
   - Options: "Yes, use this document" / "No, just use my prompt" / "No, let me specify a different file"
3. If user confirms, read the source file and use it alongside USER_PROMPT for requirement tag scanning
4. If the source is a mini-PRD produced by `/dev-epic`, treat it exactly like any other PRD — each mini-PRD is self-contained

### Phase 3: Understand Codebase

Explore the codebase directly to understand:
- Existing patterns and architecture
- Relevant files for the task
- Dependencies and integrations
- Test structure and patterns

Use `Read` and `Grep` tools to gather context. Do not use subagents for this phase.

### Phase 3.5: Feasibility Preflight

Before investing in detailed design, verify the plan is implementable in this repo as written. This is a lightweight feasibility pass — `/dev-validate` handles the deeper risk analysis later.

Answer: `Can this plan realistically be executed in this repository as written, without hidden prerequisite work?`

Check at minimum:
1. **Referenced files exist or are clearly intended as new files** — if you plan to edit/refactor/migrate a file that does not exist, explicitly mark it as new in `## Relevant Files`.
2. **Dependencies and platforms exist or will be added explicitly** — if the plan assumes a library/service/framework (Clerk, Stripe, Prisma, Docker, Terraform, etc.) verify evidence in the repo (`package.json`, lockfiles, config, imports, env examples, infrastructure files). If absent, the plan must include adding and integrating that prerequisite as an early task.
3. **Architecture assumptions are grounded** — if you reference systems that do not appear to exist yet (billing portal, role system, background jobs, design system, API layer), call out the mismatch and include prerequisite tasks.
4. **Scope is execution-sized** — if the work bundles multiple major initiatives, recommend running `/dev-epic` on the source PRD first to decompose.
5. **Sequence is viable** — tasks should not depend on unfinished prerequisite work; tests should not validate features before the supporting implementation exists.

Record findings and fold them into the plan:
- Missing prerequisites → add as early tasks in `## Step by Step Tasks`
- Architecture gaps → document in `## Solution Approach` with explicit prerequisite steps
- Scope too broad → stop and recommend `/dev-epic` before continuing

If the plan is fundamentally not feasible (relies on missing foundations, nonexistent edit targets, impossible sequencing): stop here, summarize blockers to the user, and recommend `/brainstorm` for re-planning. Do not produce a plan document.

### Phase 4: Design Solution

Think deeply (ultrathink) about the best approach:
- Architecture decisions
- Implementation strategy
- Edge cases and error handling
- Scalability concerns
- Trade-offs and alternatives considered

Document the reasoning behind key decisions.

### Phase 5: Plan Phases

Structure the implementation into logical phases:
- **Phase 1: Foundation** — any foundational work needed
- **Phase 2: Core Implementation** — the main implementation work
- **Phase 3: Integration & Polish** — integration, testing, and final touches

For simple tasks, phases may be combined. For complex tasks, add more phases as needed.

### Phase 6: Document Plan

Follow the Plan Format below to create a comprehensive implementation plan with all required sections.

### Phase 7: Generate Filename

Create a descriptive kebab-case filename based on the plan's main topic, e.g.:
- `feature-auth-jwt.md`
- `fix-session-timeout.md`
- `refactor-api-client.md`

### Phase 8: Save Plan File

Write the complete plan to `artifacts/plans/<filename>.md`. Ensure:
- Plan is detailed enough that another developer could follow it
- Code examples or pseudo-code included where appropriate
- All edge cases and error handling addressed

### Phase 9: Validate

Verify the plan:
- All required sections present
- Tasks are actionable and have stable [N.M] ID prefixes
- Traceability map correctly links #req-* tags to task IDs
- No missing dependencies between tasks
- Testing strategy is clear and complete

### Phase 10: Report

Present the completed plan summary and remind user to run `/dev-build` when ready.

## Instructions

- **IMPORTANT**: If no USER_PROMPT is provided, stop and ask the user to provide it.
- Determine task type (chore|feature|refactor|fix|enhancement) and complexity (simple|medium|complex)
- Think deeply (ultrathink) about the best approach
- Follow the Plan Format below exactly
- Generate descriptive, kebab-case filename

### Tag Propagation

If a source document (PRD, brainstorming output) is found via Source Document Discovery:
1. Scan it for `#req-[id]` patterns (e.g., `#req-user-login`, `#req-data-export`)
2. When generating the `## Step by Step Tasks` section, give each task item a **stable inline ID prefix** `[N.M]` and append the relevant `#req-[id]` tag
3. Format: `- [ ] [1.1] Implement login form #req-user-login`
4. The `[N.M]` prefix serves as a stable anchor for `/dev-test` to match against when flipping checkboxes
5. Add a `## Traceability Map` section at the end showing `#req-[id]` -> Task IDs

If no `#req-[id]` tags exist, skip tag propagation (graceful degradation).

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
IMPORTANT: Execute every step in order when running manually. `/dev-build` will parallelize independent groups automatically.

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

**Optional parallelism annotations** (append to any `### N.` header when `/dev-build`'s heuristics would be wrong):
- `[parallel-safe]` — explicitly safe to run concurrently with other groups in the same phase, even if files overlap
- `[sequential]` — must run alone in its own wave regardless of other signals

Examples:
### 3. Build API Layer [parallel-safe]
### 5. Run Database Migration [sequential]

If no annotations are present, `/dev-build` infers parallelism from phase boundaries, dependency language, and file overlap.

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
<clear, single statement of what testing must accomplish - this becomes the completion criteria for /dev-test>
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

## Report

After creating and saving the implementation plan, provide a concise report:

```
✅ Implementation Plan Created

File: artifacts/plans/<filename>.md
Topic: <brief description of what the plan covers>
Key Components:
- <main component 1>
- <main component 2>
- <main component 3>

Next Steps:
1. Run `/dev-shard artifacts/plans/<filename>.md` if the plan is large — it will analyze token budget and split if needed.
2. Run `/dev-validate artifacts/plans/<filename>.md` to catch feasibility issues before building.
3. Run `/dev-build artifacts/plans/<filename>.md` when ready to implement.
4. After build: `/dev-test` then `/dev-review` for independent Codex review.
```