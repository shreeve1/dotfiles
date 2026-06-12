---
name: anti-slop
description: Prevent incomplete or fake implementations; use before claiming code work is done or when tempted to stub/mock/assume.
---

# Anti-Slop Implementation Check

Use this before final answer on code changes.

## Hard Stops

Do not ship:
- stubs, TODO implementations, fake fallbacks, no-op branches
- mocks replacing real integration behavior
- validation skipped because command noisy or slow
- broad refactors unrelated to request
- ungrounded claims about tests, logs, APIs, or files

## Omp Workflow

1. Locate code with `search` or `lsp symbols`; do not guess paths.
2. For definitions/references/types/renames, use `lsp` first.
3. For structural code patterns, use `ast_grep`; for exact text, use `search`.
4. Read enough surrounding code with `read` before `edit`.
5. Track multi-step work with `todo_write`.
6. After `edit`/`write`, verify affected behavior with targeted tests or `lsp diagnostics`.

## Done Means

- all requested behavior implemented end-to-end
- affected call sites updated
- obsolete code from your change removed
- tests or equivalent verification observed
- final report only claims commands actually run
