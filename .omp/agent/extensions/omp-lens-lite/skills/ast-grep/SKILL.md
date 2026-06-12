---
name: ast-grep
description: Use omp's ast_grep tool for structural code search and safe code-pattern refactors.
---

# Omp AST-Grep

Use `ast_grep` when code structure matters: calls, imports, declarations, JSX, classes, or language-aware replacement. Use `lsp` first for definitions, references, types, and renames.

## Rules

1. Scope paths narrowly.
2. Use valid code patterns.
3. Prefer specific patterns: `fetchMetrics($$$ARGS)` over `fetchMetrics`.
4. Retry once with a simpler pattern on zero matches.
5. Inspect matches with `read` before applying edits.
6. Use `edit` for final surgical changes unless `ast_grep` offers a safe apply mode in this workspace.

## Metavariables

| Syntax | Meaning |
|---|---|
| `$X` | one AST node |
| `$$$` | zero or more nodes |
| `$$$ARGS` | named list capture |

## Examples

- Call: `logger.warn($$$ARGS)`
- Function: `function $NAME($$$PARAMS) { $$$BODY }`
- Import: `import { $NAMES } from "$PATH"`
- JSX: `<$COMP $$$PROPS>$CHILDREN</$COMP>`

## Gotchas

- Metavariables inside strings match literal text in many languages; use `search` for wildcard string paths.
- Shorthand object properties need their own pattern: `{ userId }` differs from `{ userId: $ID }`.
- AST-grep is not code intelligence; use `lsp` for semantic references and safe renames.
