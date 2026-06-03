---
name: lsp-navigation
description: Use omp's built-in lsp tool for definitions, references, types, implementations, code actions, renames, and diagnostics.
---

# Omp LSP Navigation

Use `lsp` for code intelligence. Do not use text search for symbol-aware work when an LSP server is available.

## Primary Actions

| Need | `lsp` action |
|---|---|
| Current errors/warnings | `diagnostics` |
| Definition | `definition` |
| Type definition | `type_definition` |
| Implementations | `implementation` |
| References | `references` |
| Hover/type docs | `hover` |
| File/workspace symbols | `symbols` |
| Safe rename | `rename` |
| Rename/move file | `rename_file` |
| Quick fixes/imports/refactors | `code_actions` |

## Patterns

- Diagnostics: `lsp({ action: "diagnostics", file: "src/file.ts" })`; use a glob for scoped batches or `"*"` for workspace diagnostics.
- References before edits: query from the definition site when possible.
- Rename: use `lsp rename` / `rename_file`; never manual cross-file text replacement.
- Code actions: list first, then apply the exact action by title or index.

## Fallbacks

- If LSP reports no server, say so and use `search`/`ast_grep` only for non-symbol work.
- If symbols are stale, `read` the file or run `lsp reload`, then retry once.
- Use `search` for comments, URLs, literals, TODOs, or non-code text.
