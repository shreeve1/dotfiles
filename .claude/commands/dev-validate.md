---
name: dev-validate
description: Intelligently validates an implementation plan against the codebase by analyzing what's changing and running only relevant checks (1-6 targeted validations instead of all checks every time)
argument-hint: [plan-file (optional)]
model: sonnet
---

# Validate Plan

Intelligently analyze an implementation plan to determine which validations are needed, then run only relevant checks against the existing codebase. Detects potential breaking changes, database risks, component impacts, dependency issues, and more. When issues are found, automatically rewrite risky steps with safer alternatives while preserving the original as reference.

**Token Efficient**: Uses smart analysis to skip irrelevant validations, typically saving 50-75% of tokens compared to running all checks.

## Variables

PLAN_FILE: $1 — (Optional) Path to specific plan file. If omitted, auto-discovers the most recent plan.
PLAN_DIRECTORIES: `specs/`, `artifacts/plans/`

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Select and parse plan** — locate plan file, parse structure, extract files to modify and code changes
2. **Verify understanding** — use AskUserQuestion to confirm plan intent with 2-3 focused questions about goals, constraints, and expected outcome
3. **Smart analysis** — spawn haiku agent to analyze plan and determine required validations (1-4 agents)
4. **Targeted validation** — spawn only relevant validation agents in parallel based on analysis
5. **Synthesize and rewrite** — collect agent results, assess risks, rewrite risky steps with safer alternatives
6. **Update plan if issues found** — add validation section and save updated plan ONLY if issues detected; otherwise report clean validation without modifying plan

## Instructions

- **VALIDATION ONLY**: Your goal is to analyze and improve an existing plan, not execute it.
- If `PLAN_FILE` is provided, validate that specific plan.
- If `PLAN_FILE` is omitted, use Plan Discovery Protocol to auto-discover the most recent plan from `PLAN_DIRECTORIES`.
- **Smart Validation**: First analyze the plan to determine which validations are needed, then run only relevant checks.
- **Token Efficiency**: Skip validations that don't apply (e.g., don't check database safety for UI-only changes).
- Always run Breaking Changes Analysis (baseline safety), conditionally run 0-5 additional targeted validations.
- Use parallel agents for the selected validations to maximize speed.
- When rewriting risky steps, preserve the original step as a strikethrough comment for context.
- Only modify the plan file if issues are found; otherwise report clean validation without changes.

## Workflow

### Phase 1: Plan Selection

1. **Locate Plan**
   - If `PLAN_FILE` provided: verify it exists and read it
   - If not provided, use the Plan Discovery Protocol:
     1. List all `.md` files in both `PLAN_DIRECTORIES` (`specs/` and `artifacts/plans/`), sorted by modification date (most recent first)
     2. Take the most recent file
     3. Use `AskUserQuestion` to confirm: "Found plan: <filename>. Is this the correct plan?"
        - Options: "Yes, use this plan" / "No, let me specify"
     4. If user says no, ask them to provide the path
     5. Read the confirmed plan file and use it as PLAN_FILE for all subsequent steps

2. **Parse Plan Structure**
   - Extract all sections: Task Description, Objective, Relevant Files, Step by Step Tasks, etc.
   - Identify files that will be modified or created
   - Extract all specific code changes, imports, and dependencies mentioned

### Phase 1.5: Understanding Verification

3. **Verify Understanding with User**
   - Use `AskUserQuestion` to confirm you understand the plan's intent
   - Ask 2-3 vibe-coder-friendly questions focused on goals, not technical details:

   **Question 1: Main Goal**
   - Paraphrase what the plan is trying to accomplish in plain English
   - Format: "Based on this plan, I understand we're: [summary]. Is this correct?"
   - Options: "Yes, exactly right" | "Close, but needs clarification" | "No, the main goal is different"

   **Question 2: Critical Constraints**
   - Identify user flows/features that must keep working (e.g., "login flow", "checkout", "dashboard")
   - Format: "Which existing features must continue working without changes?"
   - Options: List 3-4 key areas from the codebase | "Other/All of them"

   **Question 3: Expected Outcome**
   - Describe what users would see/experience after this change
   - Format: "After this change, users should be able to: [outcome]. Does that match your vision?"
   - Options: "Yes, that's the vision" | "Partially, but also..." | "No, different outcome expected"

   - If user selects clarifying options, incorporate their feedback into your understanding
   - Only proceed to risk analysis after confirmation

### Phase 2: Smart Validation Analysis

4. **Determine Required Validations** (Haiku Agent - runs first)

   Spawn a single lightweight analysis agent (model: haiku) to analyze the plan and determine which validations are needed:

   ```
   Analyze this implementation plan to determine required validations.

   Plan: [plan content]

   Instructions:
   1. Analyze the "Relevant Files" section for file patterns
   2. Scan "Step by Step Tasks" for types of changes being made
   3. Identify risk categories based on semantic understanding

   Determine which validations are needed from:
   - Breaking Changes Analysis (ALWAYS REQUIRED - baseline safety)
   - Database Safety Validation (run if: *.prisma, *.sql, migrations/, models/, database-related keywords)
   - Component Impact Analysis (run if: *.tsx, *.jsx, *.vue, components/, UI-related changes)
   - Dependency Graph Validation (run if: package.json, requirements.txt, import/export changes)
   - Test Coverage Validation (run if: new features, critical path changes, missing test coverage)
   - Infrastructure Safety (run if: Dockerfile, *.yml, .env*, terraform/, deployment config)
   - Traceability Validation (run if: #req- tags found in plan's task list or a source PRD/spec is referenced)

   Return structured output:
   {
     "detected_changes": ["API", "Database"],
     "required_validations": [
       {"type": "breaking_changes", "reason": "...", "priority": "always"},
       {"type": "database_safety", "reason": "...", "priority": "high"}
     ],
     "skipped_validations": [
       {"type": "component_impact", "reason": "No UI changes detected"}
     ],
     "estimated_agents": 2
   }
   ```

   After analysis completes, report to user:
   ```
   📊 Validation Analysis
   Detected: [change types]
   Running: [N] validations: [list]
   Skipping: [N] irrelevant checks
   ```

### Phase 3: Targeted Parallel Validation

Launch only the required validation agents identified in Phase 2, running them simultaneously using `Task` tool:

5. **Breaking Changes Analysis** (ALWAYS RUNS)
   ```
   Analyze the plan for API breaking changes:
   - Function signature changes (parameters added/removed/reordered)
   - Return type modifications
   - Endpoint URL or method changes
   - Interface/type definition changes
   - Public method visibility changes

   Search the codebase for all callers of affected functions/endpoints.
   Report: list of breaking changes with affected call sites.
   ```

6. **Database Safety Validation** (CONDITIONAL - runs if DB changes detected)
   ```
   Analyze the plan for database safety:
   - Schema migration risks (breaking changes, data loss)
   - ORM model consistency
   - Migration rollback strategy
   - Data integrity constraints
   - Index and performance impacts

   Check existing schema and migrations.
   Report: database risks and migration safety recommendations.
   ```

7. **Component Impact Analysis** (CONDITIONAL - runs if UI changes detected)
   ```
   Analyze the plan for UI component impacts:
   - React/Vue component prop type changes
   - Component usage patterns in codebase
   - Breaking changes to component APIs
   - Theme/style consistency
   - Accessibility considerations

   Find all usages of affected components.
   Report: component impact and consistency issues.
   ```

8. **Dependency Graph Validation** (CONDITIONAL - runs if dependency changes detected)
   ```
   Analyze the plan for dependency/import impacts:
   - Module import/export changes
   - Renamed or moved files
   - Circular dependency risks
   - Package version conflicts
   - Breaking changes in upgraded dependencies

   Map the dependency graph for affected modules.
   Report: dependency risks with affected downstream modules.
   ```

9. **Test Coverage Validation** (CONDITIONAL - runs if new features or critical changes)
   ```
   Analyze the plan for test coverage:
   - Tests that would fail due to planned changes
   - Test fixtures that need updating
   - Missing test coverage for new functionality
   - Integration test impacts

   Find all tests that touch affected files/functions.
   Report: tests that will break and coverage gaps.
   ```

10. **Infrastructure Safety** (CONDITIONAL - runs if config/deployment changes detected)
    ```
    Analyze the plan for infrastructure impacts:
    - Configuration file consistency
    - Environment variable changes
    - Deployment risk assessment
    - Docker/container impacts
    - CI/CD pipeline changes

    Check existing infrastructure setup.
    Report: infrastructure risks and deployment recommendations.
    ```

11. **Traceability Validation** (CONDITIONAL - runs if `#req-` tags exist in the plan)
    ```
    Analyze the plan for traceability completeness:
    - Scan the plan's Step by Step Tasks section for all #req-[id] tags
    - If a source PRD or spec is referenced in the plan, read it and extract all #req-[id] tags from the source
    - Cross-reference: flag any #req-[id] from the source that has no corresponding task in the plan
    - Cross-reference: flag any orphan #req-[id] in the plan that doesn't exist in the source
    - Verify each task with a [N.M] ID prefix has a checkbox (- [ ] or - [x])
    - Check that the Traceability Map section (if present) is consistent with task-level tags

    Report: traceability gaps, orphan tags, and coverage status.
    ```

### Phase 4: Synthesize & Rewrite

12. **Collect Agent Results**
    - Wait for all validation agents to complete using `TaskOutput`
    - Aggregate findings from all executed validations (1-7 depending on what ran)

13. **Risk Assessment**
    - Categorize each finding by severity: `critical` | `warning` | `info`
    - Critical: Will definitely break existing functionality
    - Warning: May cause issues, needs attention
    - Info: Suggestion for improvement

14. **Rewrite Risky Steps** (ONLY if issues found)
    For each step with `critical` or `warning` findings:
    - Preserve original step as strikethrough: `~~Original step text~~`
    - Write new safer version below with explanation
    - Include specific mitigations for identified risks
    - Add explicit validation checkpoints

15. **Pattern Alignment**
     - For any pattern deviations, suggest how to align with existing conventions
     - Reference specific files in the codebase as examples to follow

### Phase 5: Conditional Plan Update

16. **If Issues Found**: Add Validation Section and Save
    Insert a new section after "Step by Step Tasks":
    ```md
    ## Risk Analysis

    Validations Run: [list of validation types executed]

    ### Critical Issues
    <list critical issues that were addressed>

    ### Warnings
    <list warnings that were addressed>

    ### Pattern Recommendations
    <list pattern alignment suggestions>

    ### Validation Checkpoints
    <list checkpoints to verify during implementation>
    ```

    Then overwrite the original plan file with the validated version.
    Ensure all original content is preserved (with risky steps shown as strikethrough).

17. **If No Issues Found**: Report Clean Validation
    - Do NOT modify the plan file
    - Report validation success to user with summary of checks performed

## Rewrite Format

When rewriting a risky step, use this format:

```md
### N. <Step Name>
<!-- VALIDATION: Risk detected - see explanation below -->

**Original Step (superseded):**
> ~~<original step content>~~

**Risk Identified:**
- <specific risk from analysis>
- <affected files/callers/tests>

**Validated Step:**
- <safer action that mitigates the risk>
- <additional safeguard>
- **Checkpoint**: <how to verify this step didn't break anything>
```

IMPORTANT: When rewriting task lines that contain `[N.M]` ID prefixes, preserve the existing checkbox state. If a task line is `- [x] [1.1] ...`, the rewritten version must keep `[x]`, not reset to `[ ]`. Checkbox state is managed by `/dev-test` and must not be reset by validation rewrites.

## Report

After validation, provide one of two report formats:

### Report Format A: Issues Found

```
✅ Plan Validated

File: <path to updated plan>

📊 Validation Summary:
Validations Run: <N> (<list types>)
Validations Skipped: <N> (<list types>)

Risk Summary:
- Critical issues found: <N> (all addressed)
- Warnings found: <N> (all addressed)
- Pattern recommendations: <N>

Key Changes Made:
- Step <N>: <brief description of change>
- Step <N>: <brief description of change>

Validation Checkpoints Added: <N>

The plan has been updated in place. Original risky steps preserved as strikethrough.

Ready to build? Run:
/dev-build <path to plan>
```

### Report Format B: No Issues Found

```
✅ Plan Validated - No Issues Found

File: <path to plan>

📊 Validation Summary:
Validations Run: <N> (<list types>)
Validations Skipped: <N> (<list types>)

All checks passed:
✓ <Validation Type 1>: No issues detected
✓ <Validation Type 2>: No issues detected

The plan is ready to build as-is. No modifications were made.

Ready to build? Run:
/dev-build <path to plan>
```

## Error Handling

- If no plans exist in either of the `PLAN_DIRECTORIES`: inform user and suggest running `/dev-plan` first
- If selected plan file doesn't exist: report error and re-prompt for selection
- If agent analysis fails: report which analysis failed and continue with available results
- If plan has no risky steps: report clean validation with no changes needed
