---
name: dev-team
description: Coordinate an end-to-end automated development pipeline for planning, validation, implementation, testing, and commit creation. Use only when the user explicitly asks for a dev team, automated pipeline, hands-off build, full team build, run pipeline end-to-end, agent team, or delegated multi-agent development workflow.
---

# Dev Team

Use this skill only for explicit automated pipeline requests. For normal coding work, prefer the narrower `$dev-plan`, `$dev-build`, and `$dev-test` skills.

## Workflow

1. Parse the request and determine whether an existing plan path was provided.
2. Explore the codebase enough to understand stack, patterns, and affected files.
3. Coordinate phases: plan, validate, build, test, and commit.
4. Stop on critical failures and report the exact current state.
5. Create a commit only if the user asked for a commit or the automated pipeline request clearly includes commit creation.

Read `references/run-pipeline.md` for the expanded pipeline workflow. Read `references/pipeline-reference.md` for pipeline conventions.

## Codex Delegation Rule

This skill implies delegated or multi-agent work only when the user's request explicitly asks for a team, agent pipeline, or hands-off automated pipeline. Follow the active Codex session's available delegation tools and do not invent unavailable team APIs.

## Constraints

- Do not continue past critical build failures.
- Do not hide failing tests.
- Do not create commits for ordinary coding requests unless requested.
- Keep phase reports concise and evidence-based.

## Output

Report request, phases completed, status, files changed, tests run, failures if any, and commit hash/message if one was created.
