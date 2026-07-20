## Delegate Selectively

- Handle work in the parent session by default.
- Delegate only for broad exploration, multiple independent workstreams, open-ended research, high-risk changes, or when the user requests it.
- Do not delegate known-file edits, config or documentation changes, single-provider lookups, or changes touching three or fewer files.
- Try one direct probe before delegating; stop if it resolves the question.
- Use at most one subagent by default.
- Require reviewer subagents only for security, authentication, migrations, public APIs, data-loss risk, or substantial multi-file logic changes.
- Prefer deterministic checks over reviewer subagents for small changes.
