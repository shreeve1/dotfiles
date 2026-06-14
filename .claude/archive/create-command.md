---
description: Create a Claude Code slash command
---

Create a Claude Code command file. Default to global `~/.claude/commands/`; use project-local `.claude/commands/` only when the user asks for project scope.

Arguments: $ARGUMENTS

Ask one question at a time if missing:
- Command name.
- What it should do.
- Global or project-local scope.

Before writing, inspect existing commands in the chosen scope to avoid collisions and match style. Create Markdown command files with concise frontmatter and direct Claude Code instructions. Do not create OpenCode commands.
