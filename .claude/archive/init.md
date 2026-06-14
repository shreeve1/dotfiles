---
description: Scan a project and create or update CLAUDE.md
---

Scan the current project and create or update a Claude Code `CLAUDE.md`. Do not create `AGENTS.md` or `.opencode/*`.

Arguments: $ARGUMENTS

Workflow:
1. Detect project type from config files.
2. Read existing `CLAUDE.md`, `AGENTS.md`, and README if present.
3. If `AGENTS.md` contains useful rules, propose merging them into `CLAUDE.md` and archiving/removing `AGENTS.md` only after user approval.
4. Document only durable project facts: commands, structure, testing, conventions, gotchas.
5. Keep content concise and source-oriented; avoid copying tool-specific OpenCode rules.
6. Write `CLAUDE.md` in the project root, then read it back to verify.
