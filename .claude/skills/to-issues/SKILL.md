---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable GitHub issues using tracer-bullet vertical slices. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
---

# To Issues

Break a plan into independently-grabbable GitHub issues using vertical slices (tracer bullets).

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a GitHub issue number or URL as an argument, fetch it with `gh issue view <number>` (with comments).

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<HITL-safety-policy>
These task types are ALWAYS HITL, never AFK:
- Authentication or authorization changes
- Billing or payment logic
- Database migrations (destructive)
- File deletions
- Security-sensitive code (keys, tokens, secrets)
- Dependency version upgrades (major/minor)
- Production configuration changes
</HITL-safety-policy>

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Create the issues

**Output target — check in this order:**
1. If `.kanban/` exists in the project root → write issues as local kanban files (see below)
2. If `gh` is available and the project has a GitHub remote → create GitHub issues with `gh issue create`
3. Otherwise → ask the user which format they prefer

Create issues in dependency order (blockers first) so you can reference real issue numbers in the "Blocked by" field.

#### Local kanban output

When writing to `.kanban/`, create files at `.kanban/issues/{NNN}-{slug}.md`:

```markdown
---
id: {NNN}
title: {title}
status: pending
type: {HITL|AFK}
blocked_by: [{ids}]
parent: {parent issue number or null}
created: {YYYY-MM-DD}
---

## What to build

{description}

## Acceptance criteria

- [ ] {criterion 1}
- [ ] {criterion 2}

## Blocked by

{#issue-number or "None — can start immediately"}
```

Auto-assign IDs sequentially (scan existing files for highest ID, start from +1).

<issue-template>
## Parent

#<parent-issue-number> (if the source was a GitHub issue, otherwise omit this section)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- Blocked by #<issue-number> (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

Do NOT close or modify any parent issue.
