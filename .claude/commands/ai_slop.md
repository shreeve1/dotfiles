---
name: ai_slop
description: Audit project using agent team with parallel quality auditors
argument-hint: [project-path]
model: opus
---

# Best Practices Audit (Agent Team)

Audit a codebase using an agent team where specialized quality auditors investigate different dimensions in parallel, then debate priorities to converge on an actionable improvement plan.

## Variables

PROJECT_PATH: $1 — Path to the project to audit (default: current directory)
AUDIT_OUTPUT: `artifacts/plans/best-practices-audit.md`

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Resolve project path** — use $1 or current directory, verify it exists
2. **Quick project discovery** — scan structure, languages, tooling
3. **Spawn audit team** — create 5 specialist auditors with correct model assignments
4. **Monitor parallel investigation** — track auditor progress
5. **Facilitate debate** — ensure auditors challenge each other's findings
6. **Synthesize consensus** — compile agreed findings into report
7. **Write audit report** — output to AUDIT_OUTPUT
8. **Cleanup team** — shut down auditors and release resources

## Instructions

- **PARALLEL EXPLORATION + DEBATE PATTERN**: 5 specialist auditors investigate different quality dimensions, then debate to prioritize improvements.
- Each auditor brings expertise in their domain and research findings.
- Auditors message each other to debate what constitutes "AI slop" and which fixes are most critical.
- Lead synthesizes the consensus into an actionable improvement plan.

## Workflow

### Phase 1: Initial Codebase Scan

1. **Quick Project Discovery**
   - If `PROJECT_PATH` provided, use it; otherwise use current directory
   - Use Explore agent (single quick scan) to get basic structure:
     - Primary languages and frameworks
     - Project layout and organization
     - Existing tooling (linters, formatters, CI/CD)
   - This provides context for the audit team

2. **Brief Project Summary**
   - Document project type, tech stack, and apparent purpose
   - Note any obvious areas of concern for the team to investigate
   - This becomes context for spawning the audit team

### Phase 2: Spawn Quality Audit Team

3. **Create Agent Team with 5 Specialist Auditors**
   Tell Claude to create an audit team with parallel exploration:

   ```
   Create an agent team to audit this project's code quality using the parallel exploration + debate pattern.

   Project Context:
   - Path: <PROJECT_PATH>
   - Tech Stack: <languages/frameworks from discovery>
   - Project Type: <web app, CLI, library, etc.>

   Spawn 5 specialist auditor teammates:

   1. Code Style Auditor (use Opus)
      - Investigates: Style consistency, formatting, naming conventions
      - Researches: "[language] code style best practices 2025"
      - Audits codebase for: Inconsistent patterns, style violations
      - Reports: Compliance score and specific style issues with file:line refs

   2. Architecture Auditor (use Opus)
      - Investigates: Project structure, module organization, separation of concerns
      - Researches: "[framework] project structure best practices"
      - Audits codebase for: Poor organization, tight coupling, architectural smells
      - Reports: Architecture score and structural improvement opportunities

   3. Maintainability Auditor (use Opus)
      - Investigates: Code complexity, readability, SOLID principles
      - Researches: "reducing code complexity metrics maintainability"
      - Audits codebase for: High cyclomatic complexity, cognitive complexity issues
      - Reports: Maintainability score and complexity hotspots

   4. Anti-Pattern Detective (use Opus)
      - Investigates: Code smells, common mistakes, language-specific anti-patterns
      - Researches: "code review checklist [language] anti-patterns"
      - Audits codebase for: Known bad patterns, security issues, performance problems
      - Reports: Anti-patterns found with severity ratings

   5. AI Slop Detective (use Opus)
      - Investigates: Signs of over-engineered AI-generated code
      - Researches: "AI generated code cleanup refactoring patterns"
      - Audits codebase for:
        * Excessive defensive coding (try/catch everywhere)
        * Over-engineered abstractions for simple operations
        * Verbose comments explaining obvious code
        * Unnecessary type annotations on trivial code
        * Helper functions used exactly once
        * Dead code/unused exports
        * Backwards compatibility code with nothing to be compatible with
      - Reports: AI slop patterns with specific examples and cleanup strategies

   Team Rules:
   - Each auditor works independently first: research + codebase audit
   - After initial findings, auditors message each other to:
     * Debate which issues are most critical
     * Challenge severity ratings: "You marked X as critical, but it's cosmetic"
     * Discuss trade-offs: "Fixing Y improves maintainability but increases complexity"
     * Converge on prioritized improvement plan
   - No auditor's findings are final until the team has debated them
   - Goal: consensus on what matters most for THIS specific project

   Each auditor should deliver:
   1. Research findings (best practices for their domain)
   2. Compliance score (1-5) with justification
   3. Specific issues found with file:line references
   4. Recommended fixes prioritized by impact vs. effort
   ```

4. **Monitor Parallel Investigation**
   - Use Task tool to check on each auditor's progress
   - Watch for research completion and codebase scanning
   - Auditors should be exploring the codebase in parallel

### Phase 3: Facilitate Debate & Convergence

5. **Encourage Cross-Auditor Discussion**
   - Once auditors have initial findings, prompt them to debate:
     ```
     Auditors: please message each other to discuss your findings.
     Challenge each other's severity ratings and priorities.
     What issues are genuinely critical vs. nice-to-have?
     Which quick wins would have the biggest impact?
     ```

6. **Watch for Debate Patterns**
   Good debates include:
   - "AI Slop Detective: The excessive error handling you found is defensive programming, not slop"
   - "Maintainability Auditor: Architecture's coupling issues are more critical than style inconsistencies"
   - "Anti-Pattern Detective: That pattern is actually idiomatic in this framework"
   - Auditors should cite evidence from their research to support positions

7. **Guide Consensus Building**
   - If debate reaches impasse, ask auditors to focus on:
     * Impact on maintainability
     * Risk of introducing bugs
     * Developer experience
     * Alignment with industry standards
   - The goal is a prioritized list everyone agrees on

### Phase 4: Synthesize Audit Report

8. **Collect Team Consensus**
   - Gather findings that survived the debate
   - Compile compliance scores from each auditor
   - Extract prioritized improvement items
   - Note interesting disagreements that were resolved

9. **Generate Improvement Plan**
   - Organize by priority based on team consensus:
     * Critical Issues (team agrees these are urgent)
     * Important Improvements (high impact, medium effort)
     * Nice-to-Have (polish when time permits)
   - Group related changes together
   - Include specific file:line references from auditors
   - Estimate complexity: Small / Medium / Large

10. **Write Audit Report to AUDIT_OUTPUT**
    Use the format below, incorporating team consensus.

### Phase 5: Cleanup

11. **Shut Down Audit Team**
    ```
    Shut down all teammates and clean up the team resources.
    ```

## Output Format

Write to `AUDIT_OUTPUT`:

```markdown
# Best Practices Audit Report (Agent Team)

**Project:** <project name>
**Audited:** <date>
**Audit Team:** 5 specialist auditors (parallel exploration + debate)

## Executive Summary

<2-3 sentence overview of project health and key findings>

### Compliance Scores

| Category | Score | Notes |
|----------|-------|-------|
| Code Style | <1-5>/5 | <note> |
| Architecture | <1-5>/5 | <note> |
| Maintainability | <1-5>/5 | <note> |
| Anti-Patterns | <1-5>/5 | <note> |
| AI Slop | <1-5>/5 | <note> |

**Overall:** <average>/5

---

## Findings by Priority

### Critical Issues (Fix Immediately)

1. **<Issue Title>** — `<file:line>`
   - Problem, team consensus on urgency, recommended fix
   - Complexity: Small/Medium/Large

### Important Improvements

1. **<Issue Title>** — `<file:line>`
   - Problem, why it matters, recommended fix
   - Complexity: Small/Medium/Large

### Nice-to-Have

- [ ] `<file:line>` — <description>

---

## AI Slop Detected

| Pattern | Count | Example | Severity |
|---------|-------|---------|----------|
| Over-commenting | <n> | `<file:line>` | Low/Med/High |
| Unnecessary abstractions | <n> | `<file:line>` | Low/Med/High |
| Excessive error handling | <n> | `<file:line>` | Low/Med/High |
| Dead code/unused exports | <n> | `<file:line>` | Low/Med/High |

**Cleanup recommendations:** <brief summary>

---

## Improvement Plan

### Phase 1: Quick Wins
- [ ] `<file:line>` — <task>
- [ ] `<file:line>` — <task>

### Phase 2: Structural Improvements
- [ ] `<file:line>` — <task>

### Phase 3: Major Refactoring
- [ ] `<file:line>` — <task>

---

## Tooling Recommendations

<linters, formatters, or tools to add/configure>

---

## Team Debate Highlights

- **<Topic>**: <disagreement and resolution>
- **<Topic>**: <what the team learned>
```

## Validation

After completion, verify:
- Audit report exists at AUDIT_OUTPUT
- All 5 auditors contributed findings
- Team debate highlights are documented
- At least 3 improvement items identified with team consensus
- Specific file:line references included where applicable

## Report

After audit is complete, provide:

```
✅ Best Practices Audit Complete (Agent Team)

Report: <AUDIT_OUTPUT path>
Project: <project name>
Team: 5 specialist auditors (Code Style, Architecture, Maintainability, Anti-Patterns, AI Slop)
Pattern: Parallel Exploration + Debate

Summary:
- Overall Score: <X>/5 (team consensus)
- Critical Issues: <count> (all agreed by team)
- AI Slop Patterns: <count>
- Quick Wins Identified: <count>

Team Debate Highlights:
- <Notable discussion that improved the audit>
- <Finding that was challenged and refined>
- <Consensus that emerged through auditor discussion>

Compliance Scores:
- Code Style: <score>/5
- Architecture: <score>/5
- Maintainability: <score>/5
- Anti-Patterns: <score>/5
- AI Slop: <score>/5

Next Steps:
1. Review the full report at <path>
2. Use `/cc-dev-workflow` or `/cc-tdd` to implement agreed improvements
```

## Error Handling

- If project path doesn't exist: ask user for correct path
- If an auditor fails or times out: respawn with same instructions, or continue with remaining auditors if persistent
- If auditors aren't debating: explicitly remind them to challenge each other's findings
- If team can't reach consensus on priority: lead makes final call and documents the disagreement
- If no issues found: report clean audit (rare but possible for well-maintained projects)
- If auditors are too harsh/lenient: remind them to cite research and evidence

## Tips

- Best audits come from substantive debate, not rubber-stamping
- Auditors should challenge each other: "That's not actually an anti-pattern in this framework"
- AI Slop Detective should be especially critical but evidence-based
- Consensus doesn't mean unanimity - document interesting disagreements
- Quick wins should truly be quick - team should validate effort estimates
- The improvement plan should be actionable with specific file references
