---
name: refactor
description: Improve code structure while keeping tests green - refactor safely with continuous test validation
argument-hint: [path-to-file or path-to-plan]
model: opus
---

# Refactor

Improve code structure, readability, and maintainability while ensuring all tests remain green. This is the REFACTOR phase of the RED/GREEN/REFACTOR TDD cycle, but can also work standalone on existing code with test coverage. Never changes behavior - only structure.

## Variables

TARGET: $ARGUMENTS
TEST_DIR: `tests/`
MAX_ITERATIONS: 5

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Validate inputs** - confirm TARGET exists, determine if file or plan
2. **Run initial tests** - establish baseline (all tests must be GREEN before refactoring)
3. **Analyze code quality** - detect code smells, duplication, complexity
4. **Propose improvements** - identify refactoring opportunities
5. **Get user approval** - present refactorings and let user choose
6. **Apply refactorings** - make improvements incrementally
7. **Run tests after each change** - ensure tests stay GREEN
8. **Verify final state** - confirm all tests still pass
9. **Report improvements** - summarize changes made

## Instructions

### When to Use This Command

**Use for:**
- After /cc-tdd: Complete the RED/GREEN/REFACTOR cycle
- Standalone: Improve existing code with test coverage
- Code cleanup: Remove duplication, improve naming, reduce complexity
- Technical debt: Address code smells safely

**NOT for:**
- Code without tests (too risky - write tests first)
- Adding new features (use /plan then /dev-build or /cc-tdd)
- Fixing bugs (use /dev-build with specific bug fix plan)

### Phase 1: Validate Inputs and Establish Baseline

1. If no TARGET provided, use AskUserQuestion to ask for it
2. Determine TARGET type:
   - **File path** (e.g., `src/auth.py`) - refactor that specific file
   - **Plan path** (e.g., `artifacts/plans/user-auth.md`) - refactor files in plan's "Relevant Files"
3. Read TARGET:
   - If file: Read the file directly
   - If plan: Read plan, extract "Relevant Files", read those files
4. Discover test runner:
   - Use Glob and Grep to detect test framework and runner command
   - Look for package.json scripts, Makefile targets, pyproject.toml, Cargo.toml, etc.
5. Run full test suite BEFORE making any changes:
   - All tests MUST pass before refactoring
   - If tests fail, STOP: "Tests must pass before refactoring. Fix failing tests first."
   - Record baseline: test count, pass count, execution time
6. Initialize TodoWrite checklist

### Phase 2: Analyze Code Quality

For each file in scope, detect these code smells:

**Code Smells:**
1. **Duplication** - Similar/identical code blocks repeated
2. **Long functions** - Functions > 50 lines (language-dependent)
3. **Complex conditionals** - Nested if/else > 3 levels deep
4. **Magic numbers/strings** - Hardcoded values without named constants
5. **Poor naming** - Single-letter vars (except i, j, k), unclear names
6. **Large classes/modules** - Classes > 10 public methods or modules > 300 lines
7. **Long parameter lists** - Functions > 4 parameters
8. **Dead code** - Unused imports, unreachable branches, commented code
9. **Comments explaining "what"** - Code is unclear, needs comments
10. **Primitive obsession** - Overuse of primitives vs dedicated types
11. **Feature envy** - Function references other module's data more than its own
12. **Inconsistent error handling** - Mixed error patterns

Use Grep for patterns, Bash for linting tools (pylint, eslint, clippy).

Generate code quality report:
- **Location**: file:line
- **Severity**: HIGH/MEDIUM/LOW
- **Smell**: name of code smell
- **Description**: what's wrong and why
- **Suggested refactoring**: specific fix

### Phase 3: Propose Improvements

Group smells into refactoring opportunities:

**Refactoring Techniques:**
1. **Extract function** - Break long functions into smaller ones
2. **Extract constant** - Replace magic numbers with named constants
3. **Rename** - Improve variable/function/class names
4. **Simplify conditionals** - Guard clauses, extract conditions to named booleans
5. **Remove duplication** - Create shared functions/methods
6. **Remove dead code** - Delete unused imports/functions/variables
7. **Add type annotations** - Type hints (Python), TypeScript types
8. **Consolidate parameters** - Group related params into objects/dataclasses
9. **Extract class/module** - Split large classes into focused components
10. **Introduce guard clauses** - Replace nesting with early returns

Prioritize by:
- **Safety first**: Low-risk (renaming, constants, dead code)
- **High impact second**: Duplication removal, conditional simplification
- **Dependencies last**: Foundational refactorings before dependent ones

### Phase 4: Get User Approval

Use AskUserQuestion to present refactoring options:

```typescript
AskUserQuestion({
  questions: [{
    question: "I found these refactoring opportunities. Which would you like to apply?",
    header: "Refactorings",
    multiSelect: true,
    options: [
      {
        label: "Extract constants (5 magic numbers)",
        description: "Replace hardcoded values with named constants"
      },
      {
        label: "Simplify auth logic (3 nested conditionals)",
        description: "Use guard clauses to reduce nesting from 4 to 2 levels"
      },
      {
        label: "Remove duplication (2 similar functions)",
        description: "Consolidate validateUser and validateAdmin"
      },
      {
        label: "Improve naming (8 unclear variables)",
        description: "Rename x, tmp, data to descriptive names"
      }
    ]
  }]
})
```

If user selects "Other", ask for specific instructions.
If user declines all, exit cleanly.

### Phase 5: Apply Refactorings Incrementally

For each approved refactoring:

1. **Make ONE small change at a time** using Edit
   - Don't batch multiple refactorings
   - Each change must be reversible

2. **Run test suite after EACH change**:
   - Tests pass: Mark complete in TodoWrite, proceed
   - Tests fail: IMMEDIATELY revert change, report failure, continue

3. **Track progress**: Update TodoWrite after each refactoring

4. **Iteration limit**: Stop after MAX_ITERATIONS (5) passes
   - Inform user they can run again for more refactorings

5. **Preserve style**: Match existing formatting, conventions, imports

### Phase 6: Verify Final State

1. Run complete test suite one final time
2. Confirm:
   - All tests still pass (same count as baseline or more)
   - No tests skipped that weren't skipped before
   - Test execution time comparable to baseline
3. Compare before/after:
   - Lines of code (should decrease or stay same)
   - Function count
   - Max function length
   - Max nesting depth

### Phase 7: Report Improvements

Provide final report in format below.

## Best Practices

- **Never refactor without tests** - tests are your safety net
- **One change at a time** - small incremental improvements
- **Run tests after EVERY change** - catch regressions immediately
- **Revert failed changes** - if tests break, undo immediately
- **Preserve behavior** - refactoring changes structure, not functionality
- **Improve readability** - code should be clearer after
- **Prefer deletion** - refactoring often means removing code
- **Respect conventions** - maintain existing style and patterns
- **Don't over-engineer** - simplify, don't complicate
- **When in doubt, ask** - use AskUserQuestion if unsure

## Error Handling

- **TARGET doesn't exist**: Ask for correct path
- **No tests found**: Stop - "No tests found. Refactoring without tests is too risky."
- **Tests fail before refactoring**: Stop - "Tests must pass before refactoring."
- **Tests fail after change**: Revert immediately, report failure, continue
- **No code smells**: Inform user code is already clean
- **User cancels**: Save progress, report what completed, confirm tests pass

## Workflow Integration

**After /cc-tdd (complete RED/GREEN/REFACTOR cycle):**
1. `/plan` "Add user authentication"
2. `/validate` artifacts/plans/user-authentication.md
3. `/cc-tdd` artifacts/plans/user-authentication.md (RED/GREEN)
4. `/cc-refactor` artifacts/plans/user-authentication.md (REFACTOR)

**Standalone on existing code:**
1. `/cc-refactor` src/services/auth.py

**Multiple files via plan:**
1. Create plan listing files to refactor
2. `/cc-refactor` artifacts/plans/cleanup-auth-module.md

## Report

After successful completion:

```
✅ Refactoring Complete

Target: <TARGET path>
Files Refactored: <count>

Baseline:
- Tests before: <count> (all passing)
- Execution time: <duration>

Refactorings Applied:
1. <refactoring name> - <file:line> - <description>
2. <refactoring name> - <file:line> - <description>
3. <refactoring name> - <file:line> - <description>

Final State:
- Tests after: <count> (all passing) ✓
- No regressions ✓
- Code quality improved ✓

Improvements:
- Lines of code: <before> → <after> (<change>)
- Functions: <before> → <after>
- Max function length: <before> → <after> lines
- Max nesting depth: <before> → <after> levels

Changes Made:
- Extracted <N> constants
- Simplified <N> conditionals
- Removed <N> lines of duplicate code
- Improved <N> variable/function names
- Deleted <N> lines of dead code
- Extracted <N> functions
```

If no refactoring needed:

```
✅ Code Quality Check Complete

Target: <TARGET path>
Files Analyzed: <count>

Baseline:
- Tests: <count> (all passing)

Analysis Result:
Code is already well-structured. No refactoring opportunities detected.

Metrics:
- Average function length: <N> lines (good)
- Maximum nesting depth: <N> levels (acceptable)
- No code duplication found
- Naming conventions followed
- No dead code detected
```

If partially complete:

```
⚠️ Refactoring Partially Complete

Target: <TARGET path>
Files Refactored: <count>

Completed Refactorings:
1. <refactoring name> - <status>
2. <refactoring name> - <status>

Stopped At:
- <refactoring name> - <reason>
- Test failure: <test name and error>

Current State:
- Tests: <count> (all passing) ✓
- Failed change was reverted (code is safe) ✓

Recommendation:
<Specific guidance for next steps>
```
