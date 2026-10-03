# Pstack compatibility on DeepSeek Harness

This is an isolated, user-invoked pstack port. Imported skill names use the `pstack-` prefix. Load the namespaced sibling `SKILL.md` directly when a pstack workflow refers to another pstack skill.

## Cursor to DSH mapping

- `Task` means the most specific `delegate_scout`, `delegate_planner`, `delegate_worker`, or `delegate_reviewer` tool. Use `subagent` only when no role fits.
- `AskQuestion` means `ask_user_question` and must run in the captain session.
- Poteto-agent delegates read `../pstack-poteto-agent/SKILL.md` and include those rules in their complete prompt.
- Comment Sicko delegates read `../pstack-comment-sicko/SKILL.md` and receive a read-only review prompt.
- Cursor `/loop` means a DSH same-session goal for ordinary long-running work. Ralph requires an explicit user request for Ralph or fresh-agent iteration.
- Per-role routes come from `~/.dsh/pstack-models.md`. Missing configuration means inherit the current route.
- Browser or UI control uses `dsh-pilot-browser` and `pilot_*`.
- Multi-step progress uses `todo_write`.
- Cursor custom agents are represented by the `pstack-poteto-agent` and `pstack-comment-sicko` skills.
- Cursor model slugs are examples only. Never pass one to DSH unless its provider, model, and reasoning effort have been confirmed available.

## Platform authority

DSH platform rules and current tool contracts override imported Cursor wording. In particular, AgentTeams, workflow, Ralph, cron creation, deployments, destructive writes, and customer-facing actions retain their normal DSH activation and confirmation requirements.
