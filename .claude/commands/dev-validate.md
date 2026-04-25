---
name: dev-validate
description: Use when validating an implementation plan against the current codebase before execution, especially to catch infeasible steps, missing prerequisites, breaking changes, database risks, or poor plan-to-repo fit
argument-hint: <plan-file>
---

# Validate Plan

Use this skill when validating implementation plans before execution—specifically when the user asks to validate a plan, check a plan for risks, verify a plan is safe to build, or mentions validation of a spec or plan file.

Do NOT use this skill for: creating plans from scratch, executing/implementing plans, general coding tasks, or when no plan file exists.

---

Intelligently analyze an implementation plan in two passes: first determine whether the plan is fundamentally feasible for the current codebase, then run only the validations that actually apply. Detects missing prerequisites, nonexistent file references, architecture mismatches, breaking changes, database risks, component impacts, dependency issues, and more. If the plan is not feasible, stop validation and hand off to brainstorming/re-planning instead of trying to salvage the plan inside this skill. When issues are found in otherwise feasible plans, automatically rewrite risky steps with safer alternatives while preserving the original as reference.

**Token Efficient**: Uses smart analysis to skip irrelevant validations, typically saving 50-75% of tokens compared to running all checks every time.

## Variables

PLAN_FILE: $1 — (Optional) Path to specific plan file. If omitted, auto-discovers the most recent plan.
PLAN_DIRECTORIES: `artifacts/plans/`, `artifacts/specs/`

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Select and parse plan** — locate plan file, parse structure, extract files to modify and code changes
2. **Verify understanding** — use `AskUserQuestion` to confirm plan intent with 2-3 focused questions about goals, constraints, and expected outcome
3. **Baseline provenance preflight** — validate `Validation Commands` file references exist in the current workspace
4. **Smart analysis** — spawn analysis subagent to analyze plan and determine required validations
5. **Targeted validation** — spawn only relevant validation subagents in parallel based on analysis
6. **Synthesize and rewrite** — collect subagent results, assess risks, rewrite risky steps with safer alternatives
7. **Update plan if issues found** — add validation section and save updated plan ONLY if issues detected; otherwise report clean validation without modifying plan

## Instructions

- **VALIDATION ONLY**: Your goal is to analyze and improve an existing plan, not execute it.
- If `PLAN_FILE` is provided, validate that specific plan.
- If `PLAN_FILE` is omitted, use Plan Discovery Protocol to auto-discover the most recent plan from `PLAN_DIRECTORIES`.
- **Feasibility is already covered**: `/dev-plan` performs a feasibility preflight before producing the plan. This skill assumes plans reaching it are feasible and focuses on risk analysis and rewriting.
- **Smart Validation**: Analyze which validations are needed and run only relevant checks.
- **Token Efficiency**: Skip validations that don't apply (e.g., don't check database safety for UI-only changes).
- Always run Breaking Changes Analysis (baseline safety) and conditionally run 0-6 additional targeted validations.
- Treat missing prerequisites, nonexistent referenced files, unsupported architectural assumptions, or multi-epic scope crammed into one plan as first-class validation issues even if no specific validator would otherwise catch them. If these show up, it means `/dev-plan`'s feasibility preflight missed something — surface it as a critical finding.
- Use parallel subagents for the selected validations to maximize speed.
- When rewriting risky steps, preserve the original step as a strikethrough comment for context.
- Only modify the plan file if issues are found; otherwise report clean validation without changes.
- Validation normally happens in the current working directory. If the user explicitly wants plan edits isolated on a branch, write the validated plan in that same branch context rather than creating a separate plan-only branch by default.
- **Baseline provenance check required**: validate that files referenced in `Validation Commands` (especially test files) actually exist in the current workspace. If missing, flag this as a plan execution risk.

## Workflow

### Phase 1: Plan Selection

1. **Locate Plan**
   - If `PLAN_FILE` provided: verify it exists and read it with `Read`
   - If not provided, use the Plan Discovery Protocol:
     1. Use `Bash` to list all `.md` files recursively in both `PLAN_DIRECTORIES` (`artifacts/plans/` and `artifacts/specs/`, including subdirectories like `artifacts/plans/<plan>/shard-*.md` from `/dev-shard` and `artifacts/specs/<parent>/epic-*.md` from `/dev-epic`), sorted by modification date (most recent first)
     2. Take the most recent file
     3. Use `AskUserQuestion` with type: select to confirm: "Found plan: <filename>. Is this the correct plan?"
        - Options: "Yes, use this plan" / "No, let me specify"
     4. If user says no, ask them to provide the path
     5. Read the confirmed plan file with `Read` and use it as PLAN_FILE for all subsequent steps

2. **Parse Plan Structure**
   - Extract all sections: Task Description, Objective, Relevant Files, Step by Step Tasks, etc.
   - Identify files that will be modified or created
   - Extract all specific code changes, imports, and dependencies mentioned

### Phase 1.5: Understanding Verification

3. **Verify Understanding with User**
   Use `AskUserQuestion` with type: select to confirm you understand the plan's intent. Ask 2-3 vibe-coder-friendly questions focused on goals, not technical details:

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

### Phase 1.6: Baseline Provenance Preflight

3.5 **Validate Validation Commands Against Workspace**
- Parse `## Validation Commands` and extract referenced file paths (for example `tests/...`, `src/...`, scripts).
- Path extraction method (deterministic):
  1. collect command strings under `## Validation Commands`
  2. tokenize by whitespace, preserving quoted strings
  3. keep tokens that look like repo-relative paths (contain `/` or end with known file extensions like `.js`, `.ts`, `.tsx`, `.json`, `.sh`)
  4. normalize by stripping quotes, trailing punctuation, and shell operators
  5. de-duplicate and ignore obvious command names (`npm`, `pnpm`, `yarn`, `vitest`, `node`, `bash`, `cd`, flags like `--`)
- Use `Bash` to verify each referenced path exists in the current workspace.
- If one or more are missing, flag the issue:
  - check whether missing files are uncommitted, on a different branch, or simply not yet created
  - detect likely case: files referenced in the plan do not yet exist in the current workspace
- Severity rules (deterministic):
  - **critical**: a missing path is referenced by validation commands and is required for baseline verification to succeed
  - **warning**: a missing path is referenced by validation commands, but provenance cannot be proven (non-git repo, unavailable sibling checkout, or insufficient evidence)
  - **info**: path extraction uncertain but no missing required paths detected
- If this risk is detected, recommend one of:
  - promote prerequisite baseline changes into branch history first
  - run build in-place intentionally
  - copy prerequisite files explicitly into the execution workspace
- If provenance check cannot be completed, explicitly mark baseline provenance status as `unknown` and require user confirmation before build execution.

Add findings to Risk Analysis under either `Critical Issues` or `Warnings` as appropriate.

### Phase 2: Smart Validation Analysis

4. **Determine Required Validations**

   Spawn a single analysis Task to analyze the plan and determine which validations are needed:

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

   After analysis completes, report to user:
   Validation Analysis
   Detected: [change types]
   Running: [N] validations: [list]
   Skipping: [N] irrelevant checks

### Phase 3: Targeted Parallel Validation

Use `Task` with parallel execution to launch only the required validation subagents identified in Phase 2:

5. **Breaking Changes Analysis** (ALWAYS RUNS)
   Analyze the plan for API breaking changes:
   - Function signature changes (parameters added/removed/reordered)
   - Return type modifications
   - Endpoint URL or method changes
   - Interface/type definition changes
   - Public method visibility changes

   Search the codebase for all callers of affected functions/endpoints.
   Report: list of breaking changes with affected call sites.

6. **Database Safety Validation** (CONDITIONAL - runs if DB changes detected)
   Analyze the plan for database safety:
   - Schema migration risks (breaking changes, data loss)
   - ORM model consistency
   - Migration rollback strategy
   - Data integrity constraints
   - Index and performance impacts

   Check existing schema and migrations.
   Report: database risks and migration safety recommendations.

7. **Component Impact Analysis** (CONDITIONAL - runs if UI changes detected)
   Analyze the plan for UI component impacts:
   - React/Vue component prop type changes
   - Component usage patterns in codebase
   - Breaking changes to component APIs
   - Theme/style consistency
   - Accessibility considerations

   Find all usages of affected components.
   Report: component impact and consistency issues.

8. **Dependency Graph Validation** (CONDITIONAL - runs if dependency changes detected)
   Analyze the plan for dependency/import impacts:
   - Module import/export changes
   - Renamed or moved files
   - Circular dependency risks
   - Package version conflicts
   - Breaking changes in upgraded dependencies

   Map the dependency graph for affected modules.
   Report: dependency risks with affected downstream modules.

9. **Test Coverage Validation** (CONDITIONAL - runs if new features or critical changes)
   Analyze the plan for test coverage:
   - Tests that would fail due to planned changes
   - Test fixtures that need updating
   - Missing test coverage for new functionality
   - Integration test impacts
   - Baseline provenance risk: test files named in Validation Commands missing from current workspace

   Find all tests that touch affected files/functions.
   If any Validation Command references missing files, report whether this appears to be a missing-file issue (not yet created, on a different branch, etc.).
   Report: tests that will break, coverage gaps, and provenance findings.

10. **Infrastructure Safety** (CONDITIONAL - runs if config/deployment changes detected)
    Analyze the plan for infrastructure impacts:
    - Configuration file consistency
    - Environment variable changes
    - Deployment risk assessment
    - Docker/container impacts
    - CI/CD pipeline changes

    Check existing infrastructure setup.
    Report: infrastructure risks and deployment recommendations.

11. **Traceability Validation** (CONDITIONAL - runs if `#req-` tags exist in the plan)
    Analyze the plan for traceability completeness:
    - Scan the plan's Step by Step Tasks section for all #req-[id] tags
    - If a source PRD or spec is referenced in the plan, read it and extract all #req-[id] tags from the source
    - Cross-reference: flag any #req-[id] from the source that has no corresponding task in the plan
    - Cross-reference: flag any orphan #req-[id] in the plan that doesn't exist in the source
    - Verify each task with a [N.M] ID prefix has a checkbox (- [ ] or - [x])
    - Check that the Traceability Map section (if present) is consistent with task-level tags

    Report: traceability gaps, orphan tags, and coverage status.

### Phase 4: Synthesize & Rewrite

12. **Collect Subagent Results**
    - Subagents return results directly (no separate output fetch needed)
    - Aggregate findings from all executed validations (1-7 depending on what ran)

13. **Risk Assessment**
    - Categorize each finding by severity: `critical` | `warning` | `info`
    - Critical: Will definitely break existing functionality, or reveals a feasibility issue `/dev-plan` missed
    - Warning: May cause issues, needs attention, or should be split/resequenced before build
    - Info: Suggestion for improvement

14. **Rewrite Risky Steps** (ONLY if issues found)
    For each step with `critical` or `warning` findings:
    - Preserve original step as strikethrough: `~~Original step text~~`
    - Write new safer version below with explanation
    - Include specific mitigations for identified risks
    - Add explicit validation checkpoints
    - For baseline provenance findings, explicitly rewrite relevant validation commands/tasks to either:
      - require baseline promotion first, or
      - replace missing-path commands with verified existing equivalents, and note the original as superseded

15. **Pattern Alignment**
     - For any pattern deviations, suggest how to align with existing conventions
     - Reference specific files in the codebase as examples to follow

### Phase 5: Conditional Plan Update

16. **If Issues Found**: Add Validation Section and Save
    - Before writing, confirm the target workspace path. Write the validated plan in the current working directory so later build/test steps read the updated plan from the same context.
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

    Then use `Write` to overwrite the original plan file with the validated version.
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

IMPORTANT: When rewriting task lines that contain `[N.M]` ID prefixes, preserve the existing checkbox state. If a task line is `- [x] [1.1] ...`, the rewritten version must keep `[x]`, not reset to `[ ]`. Checkbox state is managed by plan execution and must not be reset by validation rewrites.

## Report

After validation, provide one of two report formats:

### Report Format A: Issues Found

```
✅ Plan Validated

File: <path to updated plan>

📊 Validation Summary:
Validations Run: <N> (<list types>)
Validations Skipped: <N> (<list types>)
Baseline Provenance: <✓ clean | ⚠ mismatch | ? unknown>

Risk Summary:
- Critical issues found: <N> (all addressed)
- Warnings found: <N> (all addressed)
- Pattern recommendations: <N>

Key Changes Made:
- Step <N>: <brief description of change>
- Step <N>: <brief description of change>

Validation Checkpoints Added: <N>

The plan has been updated in place. Original risky steps preserved as strikethrough.
```

### Report Format B: No Issues Found

```
✅ Plan Validated - No Issues Found

File: <path to plan>

📊 Validation Summary:
Validations Run: <N> (<list types>)
Validations Skipped: <N> (<list types>)
Baseline Provenance: <✓ clean | ? unknown>

All checks passed:
✓ <Validation Type 1>: No issues detected
✓ <Validation Type 2>: No issues detected

The plan is ready to build as-is. No modifications were made.
```

## Error Handling

- If no plans exist in either of the `PLAN_DIRECTORIES`: inform user and suggest creating a plan first
- If selected plan file doesn't exist: report error and re-prompt for selection
- If validation surfaces critical feasibility issues `/dev-plan` missed (nonexistent edit targets, missing foundations, impossible sequencing): report them as critical findings and recommend the user return to `/dev-plan` or `/brainstorm` rather than proceeding to build
- If subagent analysis fails: report which analysis failed and continue with available results
- If validation command path extraction is ambiguous or partially fails: report which commands could not be parsed, mark provenance status as `unknown`, and continue with conservative warnings
- If provenance comparison cannot run (not a git repo or insufficient context): mark provenance as `unknown` and require explicit user confirmation before recommending build execution
- If plan has no risky steps: report clean validation with no changes needed
