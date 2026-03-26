---
name: cc-dev-workflow
description: Development workflow automation CLI commands for planning, validating, building, testing, and reviewing code changes. Enforces safe sequencing (plan -> validate -> build -> test) for reliable software delivery.
---

# Dev Workflow Skill

A structured development workflow that guides code changes through a safe, sequenced process: plan, validate, build, and test. This skill wraps CLI commands for development workflow automation.

## Activation

Activate this skill by saying any of:
- "dev workflow"
- "start dev workflow"
- "use dev workflow"

Or invoke with: `/cc-dev-workflow`

## Tools Required

This skill requires full tool access:
- **Read, Glob, Grep** - File exploration and analysis
- **Bash** - CLI command execution
- **Write, Edit** - File modifications
- **Task** - Sub-agent spawning for complex workflows

## Critical Notes

### Sequencing Constraints

The development workflow enforces a strict phase order for safety:

```
PLAN --> VALIDATE --> BUILD --> TEST
```

**Why this order matters:**

| Wrong Approach | Risk |
|----------------|------|
| Building before planning | Wasted work on wrong solution |
| Testing before building | No code to test |
| Skipping validation | Missing edge cases, wrong assumptions |
| Building before validating | Implementing incorrect understanding |

**Correct sequence example:**
```
1. /dev-plan "Add user authentication"
2. /dev-validate           # Review the plan
3. /dev-build              # Implement (or /dev-shard for parallel work)
4. /dev-test               # Verify the implementation
5. /cc-dev-review             # Final code review
```

---

## Workflow Lifecycle

### Phase 1: Plan

**Command:** `dev-plan`

**Purpose:** Create a structured implementation plan before writing code.

**When to use:**
- Starting any new feature or significant change
- Before implementing complex logic
- When unsure of the approach

**What it does:**
- Analyzes existing codebase context
- Identifies affected files and dependencies
- Creates step-by-step implementation plan
- Documents assumptions and risks

**Usage:**
```bash
# With a specific task
dev-plan "Add OAuth2 authentication to the API"

# For a general area
dev-plan "Improve error handling in payment module"
```

**Output:** Implementation plan with:
- Scope definition
- Affected components
- Step-by-step tasks
- Risk assessment

---

### Phase 2: Validate

**Command:** `dev-validate`

**Purpose:** Review and validate the plan before implementation begins.

**When to use:**
- After creating a plan with `dev-plan`
- Before starting implementation
- When requirements need clarification

**What it does:**
- Checks plan completeness
- Identifies missing edge cases
- Validates assumptions against codebase
- Suggests improvements

**Usage:**
```bash
dev-validate
```

**Output:** Validation report with:
- Plan quality assessment
- Identified gaps or risks
- Recommendations
- Approval/revision status

---

### Phase 3: Build

**Command:** `dev-build` (or `dev-shard` for parallel work)

**Purpose:** Implement the planned changes.

**When to use:**
- After plan validation passes
- Ready to write code
- Following the implementation plan

**What it does:**
- Executes implementation steps
- Creates/modifies files as planned
- Follows established patterns
- Maintains code quality

**Usage:**
```bash
# Sequential implementation
dev-build

# Parallel implementation for large features
dev-shard
```

**Output:** Implementation results with:
- Files created/modified
- Changes summary
- Any issues encountered

---

### Phase 4: Test

**Command:** `dev-test`

**Purpose:** Verify the implementation works correctly.

**When to use:**
- After building the feature
- Before code review
- When validating changes

**What it does:**
- Runs relevant test suites
- Checks for regressions
- Validates edge cases
- Reports test results

**Usage:**
```bash
dev-test

# With specific test focus
dev-test --focus "authentication"
```

**Output:** Test results with:
- Pass/fail status
- Coverage information
- Any failures with details

---

### Phase 5: Review

**Command:** `dev-review`

**Purpose:** Final code review before committing.

**When to use:**
- After tests pass
- Before committing changes
- When ensuring code quality

**What it does:**
- Reviews code changes
- Checks for best practices
- Identifies potential improvements
- Suggests optimizations

**Usage:**
```bash
dev-review
```

**Output:** Review summary with:
- Code quality assessment
- Suggestions
- Approval status

---

## Additional Commands

### Investigation

**Command:** `dev-investigate`

**Purpose:** Explore and understand existing code before planning.

**When to use:**
- Exploring unfamiliar code
- Understanding how a feature works
- Finding root causes of issues

**Usage:**
```bash
dev-investigate "How does the payment flow work?"
dev-investigate "Where is user session management?"
```

---

### User Stories

**Command:** `dev-stories`

**Purpose:** Generate or manage user stories for features.

**When to use:**
- Breaking down features into stories
- Planning sprint work
- Documenting requirements

**Usage:**
```bash
dev-stories "User authentication feature"
```

---

### Tool Check

**Command:** `dev-tool_check`

**Purpose:** Verify development environment and tools are ready.

**When to use:**
- Before starting work
- Troubleshooting environment issues
- Onboarding to a new project

**Usage:**
```bash
dev-tool_check
```

---

### Special Agent Creation

**Command:** `dev-create_special_agent`

**Purpose:** Create specialized agents for specific tasks.

**When to use:**
- Need a dedicated agent for a workflow
- Parallel task execution
- Specialized analysis required

**Usage:**
```bash
dev-create_special_agent --type "analyzer"
```

---

### Team Planning

**Command:** `dev-plan_w_team`

**Purpose:** Collaborative planning with team coordination.

**When to use:**
- Planning multi-person features
- Coordinating across workstreams
- Breaking down large initiatives

**Usage:**
```bash
dev-plan_w_team "Q2 API overhaul"
```

---

## Interactive Workflow

When activated without arguments, use AskUserQuestion to present a menu:

**Step 1: Mode Selection**

Use AskUserQuestion:
- Question: "What would you like to do?"
- Header: "Dev Workflow"
- Options:
  - "Start new feature" - Begin with planning phase
  - "Investigate code" - Explore existing code
  - "Run tests" - Execute test phase
  - "Review changes" - Run code review
  - "Check environment" - Verify tools/setup

**Step 2: Phase-Specific Actions**

Based on selection, guide through appropriate phases.

---

## Usage Patterns

### Pattern 1: New Feature

```
1. /dev-plan "Feature description"
2. Review plan output
3. /dev-validate
4. Address any validation issues
5. /dev-build
6. /dev-test
7. /cc-dev-review
8. Commit if all passes
```

### Pattern 2: Bug Fix

```
1. /cc-dev-investigate "Bug description"
2. Understand root cause
3. /dev-plan "Fix for [bug]"
4. /dev-validate
5. /dev-build
6. /dev-test
7. /cc-dev-review
```

### Pattern 3: Large Feature

```
1. /dev-plan_w_team "Large feature description"
2. /dev-stories "Break into stories"
3. /dev-shard "Implement in parallel"
4. /dev-test
5. /cc-dev-review
```

### Pattern 4: Quick Check

```
1. /cc-dev-tool_check
2. Verify environment ready
3. Proceed with development
```

---

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Command not found | Verify command is installed, suggest installation |
| Plan validation fails | Return to planning phase, address issues |
| Tests fail | Block review, return to build phase |
| Review has blockers | Address feedback before committing |
| Environment issues | Run `dev-tool_check` to diagnose |

---

## Best Practices

1. **Always follow the sequence** - Plan -> Validate -> Build -> Test
2. **Investigate before planning** - Understand the codebase first
3. **Validate thoroughly** - Catch issues before implementation
4. **Test incrementally** - Don't wait until the end to test
5. **Review before committing** - Fresh eyes catch issues

---

## Quick Reference

| Command | Phase | Purpose |
|---------|-------|---------|
| `dev-plan` | Plan | Create implementation plan |
| `dev-validate` | Validate | Review plan quality |
| `dev-build` | Build | Implement changes |
| `dev-shard` | Build | Parallel implementation |
| `dev-test` | Test | Verify implementation |
| `dev-review` | Review | Code quality check |
| `dev-investigate` | Any | Explore codebase |
| `dev-stories` | Plan | Generate user stories |
| `dev-tool_check` | Setup | Verify environment |
| `dev-create_special_agent` | Any | Create specialized agent |
| `dev-plan_w_team` | Plan | Team collaboration |
