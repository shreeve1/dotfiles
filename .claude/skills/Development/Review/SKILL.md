---
name: Review
description: Two-pass code review — Claude deep analysis followed by automatic Codex CLI second opinion, cross-model comparison, interactive findings discussion, and optional change application. USE WHEN review, code review, deep review, audit code, PR review, review file, review directory, review session, best practices, technical risk, review architecture, second opinion, codex review.
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/Review/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the DeepReview workflow in the Review skill to perform a deep code review"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **DeepReview** workflow in the **Review** skill to perform a deep code review...
   ```

**This is not optional. Execute this curl command immediately upon skill invocation.**

## Model Recommendation

**Recommended model: opus** — Deep review requires extended thinking for thorough multi-dimensional analysis, second-order effect reasoning, and careful cross-referencing against codebase conventions.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Review, code review, deep review, audit code, PR review | `Workflows/DeepReview.md` |
| Any file, directory, or topic review | `Workflows/DeepReview.md` |
| Session context review (no target specified) | `Workflows/DeepReview.md` |

This sub-skill has a single comprehensive workflow. All review requests route to `DeepReview.md`.

## Pipeline Position

**Type:** Auxiliary (available at any pipeline stage)

**Typical usage:**
- After `/dev-build` — review implemented code before testing
- After `/dev-test` — review test quality and coverage
- Before merge — final quality gate
- Standalone — review any code, config, or architecture at any time

**Does not require input from other pipeline stages.** Operates independently on whatever target is provided.

## Context Files

| File | Purpose |
|------|---------|
| `Workflows/DeepReview.md` | Full 5-phase review workflow |

## Examples

**Example 1: Review a specific file**
```
User: "Review src/services/user.ts"
-> Routes to DeepReview workflow
-> Phase 1: Locate and understand the file + surrounding context
-> Phase 2: Multi-dimensional analysis (selects 3-5 relevant dimensions)
-> Phase 3: Interactive discussion of findings
-> Phase 4: Codex CLI second opinion + cross-model comparison
-> Phase 5: Optional change application
```

**Example 2: Review a directory**
```
User: "Review the auth module in src/auth/"
-> Routes to DeepReview workflow
-> Scans directory, selects key files for review
-> Confirms selection with user before deep analysis
-> Presents findings per dimension, then runs Codex for second opinion
-> Cross-model comparison highlights what each engine caught independently
```

**Example 3: Review session context**
```
User: "Review what we've done so far"
-> Routes to DeepReview workflow
-> Reviews current session context — decisions, implementations, discussions
-> Runs Codex review against current git diff if one exists
-> Provides retrospective quality assessment with cross-model analysis
```
