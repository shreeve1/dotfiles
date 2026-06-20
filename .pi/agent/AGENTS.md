# Pi Agent Configuration

Pi loads this file from `~/.pi/agent/AGENTS.md` in addition to any project-level guidance it finds in the current workspace. Keep this file focused on Pi-only behavior. General coding standards, safety rules, and project-specific norms live in Claude/project guidance (`~/.claude/CLAUDE.md` and project `CLAUDE.md` files).

## Pi Tool Usage

- Use `advisor` before substantive implementation choices, when stuck, and before declaring work complete.
- Use `ask_user_question` when progress depends on a user decision; group related questions into one prompt.
- Use `todo` for multi-step work, dependency tracking, or handoffs; keep exactly one active task when executing.
- Use `web_search` and `web_fetch` for current external information, and cite fetched/search sources in the final answer.
- Use LSP tools for definitions, references, hover/type information, and diagnostics before broad builds.
- Use AST tools for semantic code search and replacement when text search would be fragile.
- Use the `Agent` tool from `pi-subagents` for delegated exploration, implementation, reviews, and parallel research.

## Subagent usage

Use `Agent` when a task benefits from an isolated worker or independent context:

- multi-step codebase discovery or dependency tracing
- implementation-plan execution or code review
- independent parallel research from different angles
- bounded implementation tasks that can run without touching the same files

Do not use subagents for trivial chat, single-command checks, or simple single-file edits that are faster and clearer inline.

`pi-subagents` discovers project agents from `.pi/agents/<name>.md` and global agents from `~/.pi/agent/agents/<name>.md`. Prefer this tool over pasting Claude agent markdown into the parent session.

## First Prompt Kickoff

On the first substantive repo/code prompt in a new Pi session, start an `Explore` subagent in the background to map relevant files and risks while the main thread begins the obvious first checks.

Skip this kickoff when:

- the prompt is pure chat or Pi configuration discussion
- the task is a trivial single-file edit
- the user asks not to use agents
- an equivalent exploration has already run in the session

## Pi Extension Notes

- Keep `.pi/agent/settings.json` as the source for installed Pi extensions and canonical skill paths.
- `cross-agent.ts` should bridge Claude commands and skills, plus global Claude guidance that Pi does not load natively.
- Pi core is responsible for loading project `CLAUDE.md` files; do not duplicate that injection in extensions.
- Do not install synced/vendored extensions with `pi install`; repair them from this dotfiles repo with `bash install.sh`.
