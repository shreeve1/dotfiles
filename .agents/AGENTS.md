# Agent Notes

## How to explain things to me

I direct the work but don't write code. Assume I'm capable but not a specialist.

- Skip jargon, or define it in one plain sentence.
- When you recommend something, give the plain-English reason and the tradeoff.
- Surface the decision I need to make. Match length to the stakes.

## Scope: fixes vs decisions

- Touch only what the task needs. Don't improve adjacent code, comments or formatting; match existing style. Remove only what your own change orphaned.
- A **fix** restores what was already decided: a broken reference, a doc contradicting the code, a bug against stated behaviour, drift between copies, a typo. In a file you're already changing, apply it as its own small change and report it in one line; elsewhere it's side work (below).
- A **decision** changes what was decided: new behaviour, a design choice, removing something that may be intentional, scope growth, a new dependency. Don't apply it; surface the options and your recommendation. When unsure, it's a decision.
- Ask first for anything irreversible or outside the repo: deleting data, pushing, changing live systems, sending messages.

## Side work

When you find something that needs doing but would pull focus from the current task (broken or dead code, a side bug, a gap), and herdr is reachable, spin it off with the `herdr-handoff` skill in `task` mode, briefed to fix it. Don't ask first: say in one line what you spun off and carry on. Without herdr, list the items at the end of your answer.

## Simplicity

Write the minimum that solves the problem: stdlib, then platform features, then already-installed dependencies, then the fewest lines. No speculative features, abstractions or configurability. Never skimp on input validation at trust boundaries, data-loss handling, security or accessibility. Mark deliberate shortcuts with a `ponytail:` comment naming the limit and the upgrade path.

## Showing me things

My terminal can't open links: write paths and URLs as plain codespans, never Markdown links. To show me a file or page, run `agent-open <file-or-url>` (pages open in chrome-cdp on workspace 5, Markdown in Obsidian, `agent-open changes` opens lazygit) and say where it opened. From a pane I'm not viewing it only prints the target; pass that on.

## Client operations

For client work (tickets, users, email, endpoints, networks, security, phones, monitoring, licensing), use the matching ITAStack connector, or its service inventory if unclear, before web search or asking me. Discovery is read-only and authorizes no changes.
