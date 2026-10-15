---
name: shell-language
description: POSIX sh and bash standards for scripts, hooks and CLI helpers - quoting, strictness flags, traps and pipefail. Use when cleaning .sh/.bash files and extensionless scripts whose shebang is sh or bash.
metadata:
  triggers:
    files:
      - "**/*.sh"
      - "**/*.bash"
      - "bin/**"
    keywords:
      - bash
      - sh
      - posix
      - shellcheck
      - pipefail
---

# Shell Language

## Rules

- Pick the dialect from the **shebang** and honour it: `#!/bin/sh` is POSIX (no `[[ ]]`, no arrays, no
  `local`), `#!/usr/bin/env bash` unlocks bash features. An extensionless script is not shell by location:
  read its shebang (`.githooks/commit-msg` is `/bin/sh`; `.githooks/pre-commit` is Python).
- bash scripts start with `set -euo pipefail`; POSIX `/bin/sh` uses `set -eu` (no `pipefail` guarantee).
- Quote every expansion: `"$var"`, `"$@"`, `"${arr[@]}"`. Never bare `$var` in a command.
- Use `$(...)`, never backticks. Use `printf` over `echo` for anything but a fixed line.
- Check a command's exit status or let `set -e` handle it; never rely on `$?` after an unrelated command.
- Install a `trap ... EXIT` (and `INT TERM`) to clean up temp files and processes.
- Compare strings with `[ "$a" = "$b" ]` (POSIX) or `[[ "$a" == "$b" ]]` (bash); numbers with `-eq`.
- Use `command -v` to test for a program, `mktemp` for temp files, `read -r` to read lines.

## Recipe

1. Confirm the shebang dialect before editing; a bashism in a `/bin/sh` script is a portability bug.
2. Quote every expansion; drop the `[ ]` vs `[[ ]]` mismatch to the dialect.
3. Replace `ls | while read` parsing with `for f in ./*` or `find ... -print0 | while IFS= read -r -d ''`.
4. Fold repeated logic into a function with `local` (bash) or a prefixed variable (POSIX).
5. Remove dead variables, unused helpers and commented-out commands.

## Anti-Patterns

- No unquoted `$@`/`$*`; no `for f in $(ls)`.
- No `eval` on assembled input.
- No `cd` without a `|| exit` guard in a `set -e` script.
- No `--`-less `rm -rf "$dir"/` and no glob that can expand to `/`.
- No `echo -e` for portability; `printf` instead.
- No parsing human-readable output with `awk`/`sed` when a `--json`/`--porcelain` mode exists.

## Verify

- `shellcheck` reports no findings (see `../shell-tooling/RULES.md`).
- `sh -n <file>` (or `bash -n`) parses clean.
