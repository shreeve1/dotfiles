---
name: dev-prd-validate
description: Validate a PRD against the current codebase to catch tech stack mismatches, data model conflicts, feature overlap, missing integrations, and architecture assumptions before planning or chunking. Use when the user wants to check a PRD against their project, validate requirements against existing code, verify a PRD is realistic for their repo, or says things like "validate this PRD", "check the PRD against the codebase", or "is this PRD feasible".
---

# Validate PRD Against Codebase

Use this skill when the user has a PRD (typically produced by `dev-prd`) and wants to validate it against an existing codebase before passing it to `dev-chunk` or `dev-plan`. The skill checks whether the PRD's assumptions about tech stack, data model, integrations, and scope align with what actually exists in the project.

Do NOT use this skill for: validating implementation plans (use `dev-validate`), creating PRDs from scratch (use `dev-prd`), or general code review.

---

## Variables

- `PRD_FILE` — optional path to the PRD file. If omitted, auto-discovers the most recent PRD.
- `PRD_DIRECTORIES` — `artifacts/specs/`

---

## Checklist

Complete these items in order:

1. **Locate and parse PRD** — find the PRD file and extract all sections
2. **Codebase reconnaissance** — scan the project to understand current state
3. **Determine validation scope** — greenfield vs. existing project, which checks apply
4. **Run targeted validations** — parallel subagents for applicable checks
5. **Synthesize findings** — categorize by severity, produce actionable report
6. **Annotate PRD if issues found** — add validation section without modifying original content

---

## Phase 1 — Locate and Parse PRD

### Step 1: Find the PRD

- If `PRD_FILE` is provided, verify it exists with `read`.
- If not provided, use PRD Discovery:
  1. Use `bash` to list `.md` files in `PRD_DIRECTORIES` matching `prd-*.md`, sorted by modification date (most recent first)
  2. Take the most recent file
  3. Use `question` to confirm: "Found PRD: `<filename>`. Validate this one?"
     - Options: "Yes, validate this PRD" / "No, let me specify the path"
  4. If the user declines, ask for the path with `question` using `type: "input"`
  5. Read the confirmed file with `read`

### Step 2: Parse PRD Structure

Extract these sections into working data. Not all PRDs will have every section — track what is present and what is missing:

| Section | Extract | Used By |
|---------|---------|---------|
| Vision | One-sentence statement | Context for all checks |
| Problem Statement | Pain point and current workaround | Scope realism, context |
| Target User / User Context | Persona, technical level, usage frequency | Scope realism |
| Tech Stack | Frontend, Backend, Database, Hosting choices | Tech Stack Alignment |
| Data Model | Entities, relationships | Data Model Feasibility |
| Key Interfaces | Endpoints, screens, commands | Architecture Fit |
| Third-Party Integrations | External services, libraries | Integration Feasibility |
| Project Structure | Proposed file/folder layout | Architecture Fit |
| Must Have Features | Feature names, `#req-*` tags, user stories | Feature Overlap |
| Should Have Features | Feature names, `#req-*` tags | Feature Overlap |
| Out of Scope | Explicit exclusions | Scope context, overlap disambiguation |
| Success Metrics | Measurable outcomes | Internal Consistency |
| Acceptance Criteria (top-level) | Release criteria | Internal Consistency |
| Requirement Tags table | Tag-to-feature-to-priority mapping | Internal Consistency |
| Open Questions | Unresolved items | Risk flagging |
| Scope level | Weekend MVP / Sprint / Multi-week / Ongoing | Scope realism |

If a section is missing entirely, note it as a PRD completeness finding rather than a validation failure.

If the PRD does not follow the `dev-prd` template structure (e.g., manually written, different format), map whatever sections exist to the closest equivalents in the table above. Note any unmappable sections as informational context. The skill works best with `dev-prd` output but should attempt to validate any markdown PRD.

### Step 2.5: Verify Understanding

Use `question` to confirm you understand the PRD's intent before scanning the codebase:

- Paraphrase the PRD in one sentence: "This PRD is about adding/building [X] for [target user] on your existing [project type] project. Correct?"
- Options: "Yes, that's right" / "Not quite — let me clarify"

If the user clarifies, adjust your understanding before proceeding. This prevents wasting time validating against wrong assumptions (e.g., the PRD is for a new standalone project, not the current repo).

---

## Phase 2 — Codebase Reconnaissance

This phase builds a snapshot of the existing project. It determines whether the project is greenfield or established, and what already exists.

### Step 3: Detect Project State

Use `task` to scan the codebase and return a structured project snapshot.

**Monorepo detection:** If the project root contains multiple packages (e.g., `packages/`, `apps/`, workspace config in `package.json` or `pnpm-workspace.yaml`), use `question` to ask the user which package or app the PRD targets before scanning. Scope the reconnaissance to that package while noting shared infrastructure (monorepo root deps, shared libs).

```
Scan this project and return a structured snapshot. Do NOT modify any files.

Check for and report:

1. **Project type**: What kind of project is this? (web app, API, CLI, monorepo, library, empty/greenfield). If monorepo, identify which package/app is the validation target.
2. **Tech stack evidence**: Read package.json, requirements.txt, go.mod, Cargo.toml, pyproject.toml, or equivalent. Report actual frameworks, languages, and major dependencies found.
3. **Database/ORM evidence**: Look for schema files (*.prisma, *.sql, migrations/, models/, *.schema), ORM configs, database connection setup.
4. **Existing features**: Scan routes, pages, components, commands, or handlers to identify what the app currently does. List major feature areas.
5. **Integrations in use**: Check for third-party service configs, API keys in .env.example, SDK imports (Stripe, Auth0, SendGrid, etc.).
6. **Project structure**: Report the top-level directory layout and any meaningful nested structure.
7. **File count estimate**: Rough count of source files to gauge project maturity.

Return the snapshot as structured data with these exact keys:
- project_type
- tech_stack (with sub-keys: language, framework, database, hosting, other_deps)
- schema_files (list of paths)
- existing_features (list of feature descriptions)
- integrations (list of service names)
- project_structure (directory tree or description)
- source_file_count
- is_greenfield (true if <10 source files and no real feature code)
```

### Step 4: Greenfield Check

If `is_greenfield` is true:
- Skip Tech Stack Alignment, Data Model Feasibility, Feature Overlap, and Architecture Fit
- Run only: Integration Feasibility (check if proposed deps exist/are compatible) and PRD Internal Consistency
- Report: "Greenfield project detected. Codebase validations skipped — focusing on PRD consistency and integration feasibility."

If the project has real code, proceed to Phase 3 with the full snapshot.

---

## Phase 3 — Smart Analysis

### Step 5: Determine Required Validations

Based on the PRD content and codebase snapshot, decide which checks to run:

| Validation | Run if... |
|-----------|-----------|
| **Tech Stack Alignment** | PRD specifies tech choices AND project has existing stack |
| **Data Model Feasibility** | PRD has a Data Model section AND project has schema files or ORM |
| **Feature Overlap Detection** | PRD has Must Have features AND project has existing features |
| **Integration Feasibility** | PRD references third-party services or libraries |
| **Architecture Fit** | PRD proposes interfaces/structure AND project has established patterns |
| **PRD Internal Consistency** | Always runs |

Report the analysis to the user:

```
Validation Scope
Project: <project_type> (<source_file_count> source files)
Stack: <detected stack summary>
Running: <N> validations: <list>
Skipping: <N> checks: <list with reasons>
```

---

## Phase 4 — Targeted Validation

Use `task` to launch applicable validations in parallel. Each subagent receives the parsed PRD data and the codebase snapshot.

### 6a. Tech Stack Alignment

```
Compare the PRD's tech stack choices against the actual project.

PRD specifies: <tech stack from PRD>
Project uses: <tech stack from snapshot>

Check:
- Language match (e.g., PRD says Python but project is TypeScript)
- Framework match (e.g., PRD says React but project uses Vue)
- Database match (e.g., PRD says PostgreSQL but project uses SQLite)
- Hosting/deployment assumptions
- Major dependency compatibility (version conflicts, deprecated packages)

For each mismatch, classify as:
- conflict: PRD contradicts what exists (e.g., different language)
- gap: PRD assumes something not yet present but addable (e.g., new ORM)
- suggestion: PRD could better align with existing choices

Return: list of findings with severity, description, and recommendation.
```

### 6b. Data Model Feasibility

```
Compare the PRD's proposed data model against existing schemas.

PRD proposes: <data model from PRD>
Existing schemas: <schema files from snapshot>

Check:
- Entity name collisions with existing tables/models
- Relationship conflicts (e.g., PRD assumes one-to-many where many-to-many exists)
- Field type incompatibilities
- Missing migration path (would this require breaking schema changes?)
- Index and constraint implications

Read the actual schema files to do precise comparison.

For each issue, classify as:
- conflict: PRD model contradicts existing schema
- overlap: PRD proposes an entity that already exists (possibly reusable)
- gap: PRD assumes schema features not present (e.g., soft deletes, audit fields)
- risk: feasible but requires careful migration

Return: list of findings with severity, entity names, and recommendation.
```

### 6c. Feature Overlap Detection

```
Check whether features proposed in the PRD already exist in the codebase.

PRD features: <must-have and should-have feature list with #req tags>
Existing features: <features from snapshot>

Check:
- Does any proposed feature already exist (fully or partially)?
- Are there existing implementations the PRD could build on instead of starting fresh?
- Are there naming conflicts between proposed and existing features?

Search the codebase for evidence: route definitions, component names, handler functions,
command registrations, or test files that suggest existing functionality.

Important: check the PRD's Out of Scope section and any contextual notes before flagging overlap.
If the PRD explicitly acknowledges existing functionality and states it will replace, extend, or
wrap it, that is intentional — classify as suggestion (not overlap). Only flag as overlap when the
PRD appears unaware of existing code that does the same thing.

For each match, classify as:
- overlap: feature already exists and PRD doesn't acknowledge it
- partial: feature partially exists — PRD should reference what's there
- suggestion: existing code could be reused or extended (including intentional replacements)

Return: list of findings with severity, affected #req tag, existing file paths, and recommendation.
```

### 6d. Integration Feasibility

```
Verify that third-party integrations referenced in the PRD are realistic.

PRD references: <integrations from PRD>
Project currently uses: <integrations from snapshot>

Check:
- Are referenced services/SDKs compatible with the project's language and framework?
- Are there version conflicts with existing dependencies?
- Do referenced APIs still exist and have current documentation?
- Are there auth/credential requirements not mentioned in the PRD?
- Does the PRD assume free tiers that may not cover the use case?

Use `google_search` if needed to verify current API availability or pricing changes.

For each issue, classify as:
- conflict: integration incompatible with existing stack
- gap: integration is feasible but PRD omits setup requirements
- risk: integration available but has known limitations
- suggestion: alternative integration might fit better

Return: list of findings with severity, service name, and recommendation.
```

### 6e. Architecture Fit

```
Check whether the PRD's proposed interfaces and structure fit the existing architecture.

PRD proposes: <key interfaces and project structure from PRD>
Project currently: <structure and patterns from snapshot>

Check:
- API style consistency (REST vs GraphQL vs RPC vs mixed)
- Routing patterns (file-based vs config-based, existing URL conventions)
- Component/module organization (where do new files belong?)
- State management approach (PRD assumes Redux but project uses Zustand, etc.)
- Auth patterns (PRD assumes middleware-based but project uses route guards, etc.)
- Deployment model fit (PRD assumes serverless but project is traditional server, etc.)

For each mismatch, classify as:
- conflict: PRD assumes patterns that contradict established architecture
- gap: PRD introduces new patterns without acknowledging the transition
- suggestion: PRD could align more closely with existing conventions

Return: list of findings with severity, pattern description, existing examples, and recommendation.
```

### 6f. PRD Internal Consistency (always runs)

```
Check the PRD for internal consistency and completeness.

PRD content: <full PRD text>

Check:
- Every Must Have feature has at least one user story and acceptance criteria
- Requirement tags are unique and consistently used
- Requirement Tags table matches the features listed in the document
- Features referenced in acceptance criteria exist in the feature list
- Tech stack choices are internally consistent (e.g., not listing both REST and GraphQL endpoints without explanation)
- Scope level matches feature count. Use these rough thresholds:
  - Weekend MVP: 2-4 must-have features
  - Sprint (1-2 weeks): 3-7 must-have features
  - Multi-week: 5-15 must-have features
  - Ongoing: no upper limit, but v1 slice should still be bounded
  Flag a risk if the feature count exceeds the upper bound for the stated scope.
- Open Questions don't contain items that would block implementation
- Out of Scope items don't contradict Must Have features
- Success metrics are measurable, not vague
- Data model covers entities implied by the features

For each issue, classify as:
- gap: missing required content
- conflict: internal contradiction
- risk: ambiguity that would force implementer to guess
- suggestion: improvement that would make the PRD more buildable

Return: list of findings with severity, section reference, and recommendation.
```

---

## Phase 5 — Synthesize Findings

### Step 7: Collect and Categorize

Aggregate results from all validation subagents. Categorize each finding by severity:

| Severity | Meaning | Action |
|----------|---------|--------|
| `conflict` | PRD contradicts the existing codebase | Must resolve before planning |
| `overlap` | PRD proposes something that already exists | Decide: reuse, extend, or replace |
| `gap` | PRD assumes something absent without acknowledging it | Add prerequisite or adjust scope |
| `risk` | Feasible but needs attention during planning | Carry forward as planning constraint |
| `suggestion` | Improvement opportunity | Optional but recommended |

### Step 8: Determine Overall Status

Based on findings:

- **`valid`** — No conflicts, gaps, or overlaps. PRD is ready for chunking/planning.
- **`valid-with-findings`** — No conflicts. Has overlaps, gaps, risks, or suggestions, but none that would block planning. PRD is usable but would benefit from updates.
- **`needs-revision`** — Has any of: conflicts with the codebase, gaps where the PRD assumes major infrastructure that doesn't exist (e.g., entire auth system, microservices layer, message queue), or overlaps where the PRD would duplicate significant existing functionality without acknowledging it. PRD should be revised before proceeding.

Threshold guidance for `needs-revision`:
- A gap that requires adding a small dependency (e.g., a new npm package) is `valid-with-findings`
- A gap that requires building or adopting a major subsystem (e.g., auth, billing, job queue) not mentioned in the PRD is `needs-revision`
- An overlap where one component name collides is `valid-with-findings`
- An overlap where an entire feature already exists is `needs-revision`

**Handoff for `needs-revision`:**
When the status is `needs-revision`, include specific guidance in the report:
- If conflicts are resolvable by updating PRD sections (e.g., wrong tech stack listed), recommend the user edit the PRD directly and re-validate
- If the PRD needs fundamental rework (e.g., scope assumes infrastructure that would require its own PRD), recommend running `dev-prd` again with the validation findings as input context
- Always end with: "After revisions, re-run this validation to confirm the PRD is ready for planning."

---

## Phase 6 — Annotate and Report

### Step 9: If Issues Found — Annotate the PRD

First, check whether the PRD already contains a `## Validation Results` section from a prior validation run. If it does, replace that entire section (from `## Validation Results` to the next `##` heading or end of file) with the new results. This keeps the PRD clean across re-validations.

Insert (or replace) the section before `## Next Step` (or at the end if no Next Step section exists):

```md
## Validation Results

**Validated:** <date>
**Status:** <valid-with-findings | needs-revision>
**Checks Run:** <list of validation types>
**Project Context:** <project_type>, <source_file_count> source files, <detected stack summary>

### Conflicts
<list each conflict with description and recommendation, or "None">

### Overlaps
<list each overlap with existing file paths and recommendation, or "None">

### Gaps
<list each gap with description and what's needed, or "None">

### Risks
<list each risk with description and mitigation suggestion, or "None">

### Suggestions
<list each suggestion, or "None">

### Recommended PRD Changes
<numbered list of specific edits the user should consider making to the PRD>
```

Use `edit` to insert this section into the PRD file. Do not modify any existing PRD content — the validation section is additive only.

**Downstream note:** The `## Validation Results` section is metadata, not feature content. Downstream skills (`dev-chunk`, `dev-plan`) should skip this section when parsing features, user stories, or requirements. It exists purely for traceability and to inform the user's revision decisions.

### Step 10: If No Issues Found — Report Clean

Do NOT modify the PRD file. Report success directly.

---

## Report

After validation, output one of these formats:

### Report Format A: Issues Found

```
PRD Validated

File: <path to PRD>
Status: <valid-with-findings | needs-revision>

Validation Summary:
Project: <project_type> (<source_file_count> files)
Checks Run: <N> (<list types>)
Checks Skipped: <N> (<list types with reasons>)

Findings:
- Conflicts: <N>
- Overlaps: <N>
- Gaps: <N>
- Risks: <N>
- Suggestions: <N>

Key Issues:
- <top 3-5 most important findings, one line each>

Validation results have been added to the PRD.

Next Steps:
- If needs-revision: address the conflicts and gaps listed, then re-validate
- If valid-with-findings: review the findings, optionally update the PRD, then proceed to dev-chunk or dev-plan
```

### Report Format B: No Issues Found

```
PRD Validated — No Issues

File: <path to PRD>
Status: valid

Validation Summary:
Project: <project_type> (<source_file_count> files)
Checks Run: <N> (<list types>)
Checks Skipped: <N> (<list types with reasons>)

All checks passed. The PRD aligns with the current codebase.

Next Step: dev-chunk or dev-plan
```

---

## Error Handling

- If no PRDs exist in `PRD_DIRECTORIES`: inform user and suggest creating one with `dev-prd`
- If selected PRD file doesn't exist: report error and re-prompt
- If codebase reconnaissance fails: report which scans failed, proceed with available data
- If a validation subagent fails: report the failure, continue with remaining results
- If the PRD is missing critical sections (no features, no tech stack): flag as PRD completeness issues under Internal Consistency rather than skipping validations
- If the project has no detectable tech stack (e.g., only markdown files): treat as greenfield

---

## Guardrails

- Do NOT modify existing PRD content. The validation section is additive only.
- Do NOT create implementation plans. This skill validates requirements, not implementations.
- Do NOT execute code or run tests. All analysis is read-only.
- Do NOT assume the PRD needs to match the existing codebase perfectly — a PRD for a new feature will naturally introduce new things. Flag genuine conflicts, not normal additions.
- Do NOT validate PRD writing quality or style. Focus on codebase alignment and internal consistency.
