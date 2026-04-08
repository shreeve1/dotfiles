# Team Knowledge Base

## Working Assumptions
- Project structure varies; verify source, test, and config locations from the actual repo before assuming conventions.
- Treat project configuration and the checked-in code as the source of truth for language mode, tooling, and architectural boundaries.
- Prefer established local patterns over generic defaults when planning or implementing work.

## Pi Team Layout
- Agent definitions use YAML frontmatter plus markdown instructions.
- Team-specific coordination lives under `agents/teams/<team>/`.
- Session notes are JSONL; expertise files are markdown.
