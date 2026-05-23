---
name: Review
description: Independent code review — gathers context, runs a fresh Claude Code reviewer session, discusses findings before applying changes. Routes all review requests to the canonical `dev-review` skill.
---

## Routing

All review requests — file, directory, plan, build, proposal, session context — route to the canonical skill:

`~/.claude/skills/dev-review/SKILL.md`

There is no longer a separate Development/Review workflow. The Development pack's Review entry point exists only to keep pipeline routing consistent; the actual review logic lives in `dev-review`.

## Pipeline Position

**Type:** Auxiliary (available at any pipeline stage)

**Typical usage:**
- After `/dev-build` — review implemented code before testing
- After `/dev-test` — review test quality and coverage
- Before merge — final quality gate
- Standalone — review any code, config, plan, or architecture at any time

**Does not require input from other pipeline stages.** Operates independently on whatever target is provided.

## Examples

**Example 1: Review a specific file**
```
User: "Review src/services/user.ts"
-> Loads dev-review skill
-> Target = file path
-> Fresh Claude Code session reviews; findings discussed interactively
```

**Example 2: Review the current plan for gaps**
```
User: "Review the plan for gaps"
-> Loads dev-review skill
-> Target = plan (or context)
-> Fresh Claude Code session reviews; findings discussed interactively
```

**Example 3: Review uncommitted changes**
```
User: "Review the build"
-> Loads dev-review skill
-> Target = build (git diff)
-> Fresh Claude Code session reviews; findings discussed interactively
```
