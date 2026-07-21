## Delegate Non-Trivial Work

Delegation runs through the `subagent` tool (nicobailon/pi-subagents). Each
subagent is a fresh child `pi` process with its own model, so a reviewer never
shares the worker's context or model family.

- Handle work in the parent session by default.
- Delegate only for broad exploration, multiple independent workstreams,
  open-ended research, high-risk changes, or when the user requests it.
- Do not delegate known-file edits, config or documentation changes,
  single-provider lookups, or changes touching three or fewer files.
- Try one direct probe before delegating; stop if it resolves the question.
- Use at most one subagent by default.
- Builtin roles: `worker` (implement) runs `minimax/MiniMax-M3`, `reviewer`
  (review-only) runs `deepseek/deepseek-v4-flash` — opposite families by design.
  Also available: `scout`, `researcher`, `planner`, `oracle`, `context-builder`,
  `delegate`. Model/tool overrides live in `settings.json` `subagents.agentOverrides`,
  never in agent frontmatter (frontmatter model pins shadow settings overrides).
- Require a `reviewer` subagent only for security, authentication, migrations,
  public APIs, data-loss risk, or substantial multi-file logic changes.
- Prefer deterministic checks over reviewer subagents for small changes.
