---
description: Independent review of the current context, plan, build, file, or proposal using a fresh OpenCode session (delegates to the dev-review skill).
agent: build
---

# /dev-review

Thin entry point. Loads and runs the `dev-review` skill, which is the single source of truth.

Skill: `.config/opencode/skills/dev-review/SKILL.md`

$ARGUMENTS

## Behaviour

1. Load `.config/opencode/skills/dev-review/SKILL.md` and follow its workflow exactly.
2. Optional reviewer model flags:
   - `--claude` — use Claude Opus 4.7 via `cliproxy/claude-opus-4-7`
   - `--gpt` — use GPT 5.5 via `openai/gpt-5.5`
3. Pass any positional argument as `TARGET` after removing model flags:
   - `plan` — most recent plan file on disk
   - `build` — uncommitted git changes
   - `proposal` (aliases: `idea`, `context`) — an inline proposal from the current conversation
   - An explicit file or directory path
   - Omitted — review the current plan/context for gaps

The reviewer runs in a fresh `opencode run --dangerously-skip-permissions` session. The primary agent gathers context, sends a structured brief, and discusses findings interactively before applying any changes.
