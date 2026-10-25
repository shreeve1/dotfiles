# Subagent models (OpenCode)

Standing request from James: when a skill dispatches subagents (superpowers plans, reviews, parallel agents), always set `model` on the `subagent` call. This is the explicit user request the tool's "never set this" note allows for. The aim is to spread load across providers so no single account hits its usage limit.

| Role | Model |
| --- | --- |
| Implementer, prose task or multi-file | `cliproxy/gpt-6.1-sol` |
| Implementer, plan contains the code; single-file mechanical fix | `cliproxy/gpt-6-luna` |
| Per-task review, fix-loop rounds | `cliproxy/gpt-6.1-sol` |
| Scoped re-review of a small fix diff | `cliproxy/gpt-6-luna` |
| Fix-loop escalation (rounds 4-5) | `cliproxy/claude-sonnet-5-5` |
| Spec/design review, plan review, final whole-branch review | `cliproxy/claude-opus-5-5` |
| Exploration and search (`explore`) | `cliproxy/gpt-6-luna` |

## When a provider runs out

A dispatch that fails with a rate-limit, quota or usage-limit error means that provider is out. Switch for the rest of the session instead of retrying it, and write a ledger line: `Ruling: <provider> exhausted, using <model> for <roles>`.

- GPT out: implementers and task reviews go to `cliproxy/claude-sonnet-5-5`; final review stays on Opus.
- Claude out: escalation, design and final reviews go to `cliproxy/gpt-6.1-sol`.
- Both out: `cliproxy/glm-5.3`, then `cliproxy/deepseek-v4.1-flash`.

James may also say a provider is out; treat that the same way. If a listed model is missing, check the `models` tool and pick the nearest equivalent.
