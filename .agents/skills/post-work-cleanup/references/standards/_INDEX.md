# Vendored Standards Index

Per-language rules for the judgement pass. Load only the rules that match the files in the sweep
diff. Each rule lives in a `<category>/<rule-slug>/RULES.md`; a rule's own `references/` files carry
detail.

Upstream: `HoangNguyen0403/agent-skills-standard` (MIT). See `SOURCES.md` for the pinned commit.
PowerShell, shell and this index are authored locally (upstream has no such skills). The vendored rule files
are replaced by `scripts/refresh-standards.sh`; never edit them by hand. This file is the one file under
`references/standards/**` that is authored locally and in scope when the diff edits it.

Workspace policy in `AGENTS.md` and `CODING_STANDARDS.md` overrides any vendored rule that conflicts (for
example a vendored commit-message convention). State the conflict in the report instead of applying the
vendored rule.

## File match

| Surface | File patterns | Rules to load |
| --- | --- | --- |
| Python | `**/*.py`, `**/*.pyi`, `pyproject.toml` | `python/python-language/RULES.md`, `python/python-best-practices/RULES.md`, `python/python-error-handling/RULES.md`, `python/python-tooling/RULES.md` |
| Python, tests | `tests/**`, `**/test_*.py`, `**/conftest.py` | `python/python-testing/RULES.md` |
| Python, data | `**/repository/**`, `**/repositories/**`, `alembic.ini` | `python/python-database/RULES.md` |
| Python, security | subprocess, secrets, network I/O | `python/python-security/RULES.md` |
| Python, async | `asyncio`, `async def` | `python/python-async-runtime/RULES.md` |
| PowerShell | `**/*.ps1`, `**/*.psm1`, `**/*.psd1` | `powershell/powershell-language/RULES.md`, `powershell/powershell-tooling/RULES.md` |
| Shell | `**/*.sh`, `**/*.bash`, `bin/**` | `shell/shell-language/RULES.md`, `shell/shell-tooling/RULES.md` |
| Extensionless scripts | match by **shebang**, not directory: `.githooks/pre-commit` is `#!/usr/bin/env python3` (Python), `.githooks/commit-msg` is `#!/bin/sh` (shell) | the rule for that shebang's language |
| TypeScript | `**/*.ts`, `**/*.tsx`, `tsconfig.json` | `typescript/typescript-language/RULES.md`, `typescript/typescript-best-practices/RULES.md`, `typescript/typescript-tooling/RULES.md` |
| JavaScript | `**/*.js`, `**/*.jsx`, `**/*.mjs`, `**/*.cjs` | `javascript/javascript-language/RULES.md`, `javascript/javascript-best-practices/RULES.md`, `javascript/javascript-tooling/RULES.md` |
| Web, security | request handlers, auth, input parsing | `typescript/typescript-security/RULES.md` |
| Docs & data | `**/*.md`, `**/*.json`, `**/*.yaml`, `**/*.yml` | `common/common-documentation/RULES.md` |

Out of scope, and checked **before** the rows above (an out-of-scope path is never matched to a rule):
generated and vendored paths — `references/standards/**` (except this index), `node_modules/**`, `vendor/**`,
`.venv/**`, `export-src/skills-new/**`, `dist/**`, `build/**` — and lockfiles (`package-lock.json`,
`pnpm-lock.yaml`, `yarn.lock`, `uv.lock`, `poetry.lock`, `Cargo.lock`, `go.sum`, …). A sweep does not clean
code the project does not own; list such a path in the report instead of matching it to a rule.

## Cross-language (only when the diff touches the concern)

| Concern | Rules to load |
| --- | --- |
| Readability, naming, simplicity, refactor | `common/common-best-practices/RULES.md` |
| Errors, exceptions, retries | `common/common-error-handling/RULES.md` |
| Comments and docs | `common/common-documentation/RULES.md` |
| Duplication, hot paths, latency | `common/common-performance-engineering/RULES.md` |
| Secrets, injection, input validation | `common/common-security-standards/RULES.md` |
| Commit and history hygiene | `common/common-git-collaboration/RULES.md` |
| Reviewing the swept diff | `common/common-code-review/RULES.md` |
| Reproducing a defect before fixing it | `common/common-debugging/RULES.md` |

## How to load

1. Run `git diff --name-only` (and `git status --short` for untracked files) to list changed paths.
2. Match each path against the **File match** table; an out-of-scope path (generated, vendored, lockfile)
is dropped first and never matched to a rule.
3. Read every matched `RULES.md` in full. Read a rule's `references/` file only when the rule points at
   it for the concern you are actually cleaning. A vendored rule may point at an upstream sibling that is
   not vendored (see `common/_INDEX.md`); when a pointer does not resolve, note it and continue.
4. Load both a language rule and the cross-language concern rules that the diff touches.

Exhaustiveness bar: every changed file either matches a row above (a language rule, Docs & data, or the
concern rules that apply to it) or is an out-of-scope path named as such. A changed file that is neither is
a gap — say so.
