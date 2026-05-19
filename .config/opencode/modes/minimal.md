---
temperature: 0
permission:
  read: ask
  grep: ask
  glob: ask
  webfetch: ask
  write: deny
  edit: deny
  bash: deny
  patch: deny
---

# PAI Minimal Mode

For pure acknowledgments, ratings, and quick confirmations.

## Rules

- Every response MUST use the MINIMAL output format from AGENTS.md
- Use `═══ PAI ═══` header
- Short, concise responses only
- No tool modifications — read-only mode
- If a request unexpectedly needs tool work, follow the router delegation directive when practical. Delegation guidance is advisory, not tool-blocking.
