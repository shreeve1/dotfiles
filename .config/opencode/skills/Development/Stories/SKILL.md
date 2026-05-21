---
name: Stories
description: Generate Playwright-ready user stories from implementation plans — YAML-format UI flow descriptions with action verbs for browser automation testing. USE WHEN user stories, Playwright stories, UI flows, browser stories, generate stories, test stories, user flow testing, UI testing stories.
---

## Model Recommendation

**Recommended model: opus** — Story generation requires deep plan comprehension, creative coverage of edge cases, and precise YAML formatting. Opus provides the best quality for comprehensive UI flow extraction.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| User stories, Playwright stories, UI flows | `Workflows/GenerateStories.md` |
| Generate stories from plan | `Workflows/GenerateStories.md` |
| Browser stories, test stories | `Workflows/GenerateStories.md` |
| Any request to create testable UI flows | `Workflows/GenerateStories.md` |

This sub-skill has a single comprehensive workflow. All story generation requests route to `GenerateStories.md`.

## Pipeline Position

**Type:** Auxiliary (available at any pipeline stage)

**Typical usage:**
- After `/dev-plan` — generate stories from a completed implementation plan
- After `/dev-build` — create regression stories for implemented features
- Standalone — generate stories from any plan file at any time

**Feeds into:**
- Playwright browser automation testing
- Manual UI flow verification

**Source plans discovered from:**
- `plans/` (primary)
- `specs/`
- `artifacts/plans/`
- `artifacts/specs/`

**Output:** `specs/<plan-name>-stories.md`

## Context Files

| File | Purpose |
|------|---------|
| `StoryFormat.md` | YAML story format specification with action verbs reference table |
| `Workflows/GenerateStories.md` | Full 8-step story generation workflow |

## Examples

**Example 1: Generate stories from a plan**
```
User: "Generate stories from plans/auth-feature.md"
-> Routes to GenerateStories workflow
-> Reads plan, identifies all UI flows
-> Generates YAML stories covering login, signup, password reset
-> Saves to specs/auth-feature-stories.md
-> Validates output format
```

**Example 2: Generate stories with no argument**
```
User: "Generate user stories"
-> No plan specified, lists available plans from specs/ and plans/
-> User selects one
-> Generates comprehensive story coverage
```

**Example 3: Stories for edge cases**
```
User: "Create stories for the error handling in the checkout flow"
-> Routes to GenerateStories workflow
-> Focuses on error states, validation failures, timeout scenarios
-> Generates stories emphasizing error recovery workflows
```
