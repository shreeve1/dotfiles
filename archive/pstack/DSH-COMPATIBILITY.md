# Pstack on DeepSeek Harness

This port preserves pstack's skills, playbooks, principles, scripts, guide, and Benny automation material while isolating them from the existing skill set.

## Invocation

Every imported skill is prefixed with `pstack-` and is user-invoked only. This prevents the experiment from changing the model-visible skill catalogue or automatically affecting ordinary work.

Examples:

- `/pstack-poteto-mode`
- `/pstack-how`
- `/pstack-architect`
- `/pstack-interrogate`
- `/pstack-principle-prove-it-works`

When an imported skill says to invoke another pstack skill, use the corresponding `pstack-` name. Because user-only skills are absent from the model catalogue, a running pstack skill may read the target sibling `SKILL.md` directly when the `skill` tool cannot load it.

## Cursor to DSH mapping

| Upstream term | DSH behavior |
| --- | --- |
| `Task` | Use the most specific `delegate_scout`, `delegate_planner`, `delegate_worker`, or `delegate_reviewer` tool. Use `subagent` only when no role fits. |
| `AskQuestion` | Use `ask_user_question`. |
| `subagent_type: "poteto-agent"` | Read `../pstack-poteto-agent/SKILL.md` and include its execution rules in the delegated prompt. |
| `subagent_type: "Comment Sicko"` | Read `../pstack-comment-sicko/SKILL.md` and delegate a read-only review with those rules. |
| Cursor `/loop` | Use a DSH same-session goal for ordinary long-running work. Use Ralph only when the user explicitly requests Ralph or fresh-agent iteration. |
| Cursor background agents | DSH delegation tools run in the background by default. Collect their completion notices and review their output. |
| Cursor model slug | Use a provider/model route confirmed available in DSH. If none is configured, inherit the captain's current route by omitting provider and model overrides. |
| Cursor control/browser tools | Load `dsh-pilot-browser` and use `pilot_*`. |
| Cursor todo list | Use `todo_write`. |
| Cursor plugin agents directory | Agent definitions are exposed as the user-only skills `pstack-poteto-agent` and `pstack-comment-sicko`. |
| `~/.cursor/rules/pstack-models.mdc` | Use `~/.dsh/pstack-models.md`. This is pstack-owned configuration read by pstack skills, not an automatically injected DSH rule. |

## DSH authority rules

Platform rules override imported wording where they conflict:

- AgentTeams is used only when the user explicitly requests AgentTeams.
- Ralph is used only when the user explicitly requests Ralph or fresh-agent iteration.
- `workflow` is used only when the user explicitly asks for a workflow or large multi-agent orchestration.
- Irreversible deployment, destructive writes, and customer-facing communication still require explicit confirmation.
- Available tools and their current contracts take precedence over Cursor examples in the imported prose.

## Attribution

The imported framework is derived from Cursor's pstack plugin by Lauren Tan and remains under the upstream MIT License. See `LICENSE` and `UPSTREAM.md`.
