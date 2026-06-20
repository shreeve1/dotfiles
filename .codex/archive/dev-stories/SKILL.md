---
name: dev-stories
description: Generate Playwright-ready user stories from implementation plans as YAML-style UI flow descriptions with browser automation action verbs. Use when the user asks for user stories, Playwright stories, browser stories, UI flows, test stories, user flow testing, or UI testing stories from a plan.
---

# Dev Stories

Convert a plan into observable browser workflows for automation or manual UI verification.

## Workflow

1. Require or discover a plan path.
2. Read the plan and identify UI-facing features, pages, interactions, and error states.
3. Read `references/story-format.md` for the expected YAML format.
4. Generate stories for happy paths, navigation, forms, errors, and important edge cases.
5. Save to `artifacts/plans/<plan-name>/stories.md`.
6. Validate YAML shape and workflow coverage before reporting completion.

Read `references/generate-stories.md` for the full generation workflow.

## Constraints

- Include only observable UI behavior.
- Do not include backend-only tasks, deployment steps, or implementation instructions.
- Every workflow should start with navigation and end with verification.
- Use placeholder URLs only when the plan does not specify real routes.

## Paths

All artifacts use the canonical layout at `artifacts/{kind}/{slug}/`. See `~/.codex/skills/dev-development/references/Paths.md` for slug rules and the full directory map.

## Output

Report the stories file path, source plan, story count, flow coverage, and next testing step.
