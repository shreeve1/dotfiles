# Codex Review Brief

Use this template for focused diff reviews.

## Scope

- Plan or task: `<path or short name>`
- Diff or files: `<paths>`
- Constraints: review only real bugs, missed acceptance criteria, and safety regressions.

## Required Output

Use severity tags exactly: `[CRITICAL]`, `[WARNING]`, `[NOTE]`.

For each Critical or Warning, include:

- Detail with file and line evidence.
- Affected files that need editing.
- Concrete suggested fix.

If clean, output exactly: `[NOTE] No findings - diff looks correct.`
