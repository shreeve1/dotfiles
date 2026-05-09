---
name: Investigate
description: Systematic 6-phase bug investigation loop — understand, resolve ambiguity, locate, verify, confirm root cause, stop at diagnosis with fix test generation. USE WHEN investigate, bug, root cause, debug, diagnose, where is the bug, error, unexpected behavior, trace issue, find defect.
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Investigate/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## Model Recommendation

**Recommended model: sonnet** — Investigation is iterative with many read/search/verify cycles. Speed matters more than deep reasoning per cycle. Sonnet provides fast, accurate code tracing while keeping iteration latency low.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Investigate, bug, root cause, debug, diagnose | `Workflows/Investigate.md` |
| Trace issue, find defect, where is the bug | `Workflows/Investigate.md` |
| Error, unexpected behavior, something is broken | `Workflows/Investigate.md` |
| Any problem requiring systematic diagnosis | `Workflows/Investigate.md` |

This sub-skill has a single comprehensive workflow. All investigation requests route to `Investigate.md`.

## Pipeline Position

**Type:** Auxiliary (available at any pipeline stage)

**Typical usage:**
- After `/dev-build` — diagnose bugs found during implementation
- After `/dev-test` — investigate failing tests
- Standalone — diagnose any bug or unexpected behavior at any time

**Outputs feed into fix agents:**
- Investigation file saved to `investigations/`
- Fix tests written to `tests/regression/`
- These artifacts are consumed by a fix agent (e.g., `/dev-build` with the investigation file as context)

**Does not require input from other pipeline stages.** Operates independently on whatever problem is described.

## Context Files

| File | Purpose |
|------|---------|
| `Workflows/Investigate.md` | Full 6-phase investigation workflow |

## Examples

**Example 1: Diagnose a runtime error**
```
User: "Login returns 500 on odd hours"
-> Routes to Investigate workflow
-> Phase 1: Understand the problem (500 error, time-dependent)
-> Phase 2: Resolve ambiguity (ask about logs, timing, environment)
-> Phase 3: Locate (search codebase for login handler, time logic)
-> Phase 4: Verify location (confirm suspected code matches symptom)
-> Phase 5: Confirm root cause (WHERE/WHAT/WHY all answered)
-> Phase 6: Save investigation + write fix tests
```

**Example 2: Investigate unexpected test failure**
```
User: "The auth tests started failing after the refactor"
-> Routes to Investigate workflow
-> Traces from failing test back through code path
-> Identifies refactor introduced a breaking change in token validation
-> Saves investigation with fix tests for handoff
```

**Example 3: Performance regression**
```
User: "Dashboard page takes 10 seconds to load now"
-> Routes to Investigate workflow
-> Locates the slow query path
-> Identifies N+1 query introduced in recent commit
-> Saves investigation for fix agent
```
