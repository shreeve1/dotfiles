# Validation Types Reference

This document defines the 7 conditional validation types used by the Validate workflow. Load this during Phase 2 (Smart Analysis) to determine which validations to run based on the plan's content.

---

## Validation Type 1: Breaking Changes Analysis

**Priority:** ALWAYS REQUIRED (baseline safety)

**Run condition:** Always runs for every plan.

**What it checks:**
- Function signature changes (parameters added/removed/reordered)
- Return type modifications
- Endpoint URL or method changes
- Interface/type definition changes
- Public method visibility changes

**How it works:**
Search the codebase for all callers of affected functions/endpoints. Report a list of breaking changes with affected call sites.

**Output:** List of breaking changes with affected call sites.

---

## Validation Type 2: Database Safety Validation

**Priority:** CONDITIONAL — runs only when database changes are detected.

**Trigger patterns:** `*.prisma`, `*.sql`, `migrations/`, `models/`, database-related keywords (schema, migration, table, column, index, foreign key, ORM, query).

**What it checks:**
- Schema migration risks (breaking changes, data loss)
- ORM model consistency
- Migration rollback strategy
- Data integrity constraints
- Index and performance impacts

**How it works:**
Check existing schema and migrations for conflicts with planned changes.

**Output:** Database risks and migration safety recommendations.

---

## Validation Type 3: Component Impact Analysis

**Priority:** CONDITIONAL — runs only when UI changes are detected.

**Trigger patterns:** `*.tsx`, `*.jsx`, `*.vue`, `components/`, UI-related keywords (component, prop, render, style, theme, layout, page, screen).

**What it checks:**
- React/Vue component prop type changes
- Component usage patterns in codebase
- Breaking changes to component APIs
- Theme/style consistency
- Accessibility considerations

**How it works:**
Find all usages of affected components across the codebase.

**Output:** Component impact and consistency issues.

---

## Validation Type 4: Dependency Graph Validation

**Priority:** CONDITIONAL — runs only when dependency changes are detected.

**Trigger patterns:** `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, import/export changes, `from ... import`, `require(`, `import ... from`.

**What it checks:**
- Module import/export changes
- Renamed or moved files
- Circular dependency risks
- Package version conflicts
- Breaking changes in upgraded dependencies

**How it works:**
Map the dependency graph for affected modules and check for conflicts.

**Output:** Dependency risks with affected downstream modules.

---

## Validation Type 5: Test Coverage Validation

**Priority:** CONDITIONAL — runs when new features or critical path changes are present.

**Trigger patterns:** New features, critical path changes, missing test coverage, any plan that adds or modifies core business logic.

**What it checks:**
- Tests that would fail due to planned changes
- Test fixtures that need updating
- Missing test coverage for new functionality
- Integration test impacts
- Baseline provenance risk: test files named in Validation Commands missing from current workspace

**How it works:**
Find all tests that touch affected files/functions. If any Validation Command references missing files, report whether this is a missing-file issue.

**Output:** Tests that will break, coverage gaps, and provenance findings.

---

## Validation Type 6: Infrastructure Safety

**Priority:** CONDITIONAL — runs only when config/deployment changes are detected.

**Trigger patterns:** `Dockerfile`, `*.yml`, `*.yaml`, `.env*`, `terraform/`, `kubernetes/`, `k8s/`, `docker-compose`, deployment config, CI/CD pipeline files.

**What it checks:**
- Configuration file consistency
- Environment variable changes
- Deployment risk assessment
- Docker/container impacts
- CI/CD pipeline changes

**How it works:**
Check existing infrastructure setup for conflicts with planned changes.

**Output:** Infrastructure risks and deployment recommendations.

---

## Validation Type 7: Traceability Validation

**Priority:** CONDITIONAL — runs only when `#req-` tags exist in the plan.

**Trigger patterns:** `#req-[id]` tags found in plan's task list, or a source PRD/spec is referenced.

**What it checks:**
- Scan the plan's Step by Step Tasks section for all #req-[id] tags
- If a source PRD or spec is referenced, read it and extract all #req-[id] tags from the source
- Cross-reference: flag any #req-[id] from the source that has no corresponding task in the plan
- Cross-reference: flag any orphan #req-[id] in the plan that doesn't exist in the source
- Verify each task with a [N.M] ID prefix has a checkbox (- [ ] or - [x])
- Check that the Traceability Map section (if present) is consistent with task-level tags

**How it works:**
Parse both the plan and the source document for tag consistency.

**Output:** Traceability gaps, orphan tags, and coverage status.

---

## Analysis Output Format

When the analysis subagent determines required validations, it returns:

```json
{
  "feasibility_status": "feasible-with-risks",
  "detected_changes": ["API", "Database"],
  "required_validations": [
    {"type": "breaking_changes", "reason": "...", "priority": "always"},
    {"type": "database_safety", "reason": "...", "priority": "high"}
  ],
  "skipped_validations": [
    {"type": "component_impact", "reason": "No UI changes detected"}
  ],
  "do_not_run_yet": ["infrastructure_safety"],
  "estimated_agents": 2
}
```

## Reporting to User

After analysis completes, report:

```
Validation Analysis
Feasibility: [status]
Detected: [change types]
Running: [N] validations: [list]
Skipping: [N] irrelevant checks
Deferred due to feasibility blockers: [list or none]
```
