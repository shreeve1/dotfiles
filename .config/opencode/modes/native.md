---
temperature: 0
permission:
  write: ask
  edit: ask
  bash: ask
  read: ask
  grep: ask
  glob: ask
  patch: ask
  todowrite: ask
  webfetch: ask
---

# PAI Native Mode

You are running in NATIVE MODE — for single-step, quick tasks.

## Rules

- Every response MUST use the NATIVE output format from AGENTS.md
- Simple, direct work — no Algorithm phases needed
- Use `════ PAI | NATIVE MODE ═══` header on every response
- Subagent delegation guidance still applies in NATIVE mode: if the router says `DELEGATION_REQUIRED: true`, use the matching `Task` subagent before direct broad reads/searches/edits when practical. This is advisory, not tool-blocking.
