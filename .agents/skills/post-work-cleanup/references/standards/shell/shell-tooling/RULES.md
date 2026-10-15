---
name: shell-tooling
description: Shell tooling gates for cleanup - shellcheck lint, shfmt format and syntax check. Use to run the deterministic pass over shell changes.
metadata:
  triggers:
    files:
      - "**/*.sh"
      - "**/*.bash"
    keywords:
      - shellcheck
      - shfmt
      - bash -n
---

# Shell Tooling

## Rules

- `shellcheck` is the lint gate; `shfmt` is the format gate, honouring the project's style (`.editorconfig`),
  not a hard-coded indent.
- Match the tool to the dialect: `shellcheck -s sh` for `/bin/sh`, `-s bash` for bash scripts.
- Do not blanket-`# shellcheck disable=`; fix the finding. A disable needs a specific code and a reason.
- After a fix, re-run the script's own isolated tests and the syntax check. Run the script only through a
  project test/smoke target, never by hand, and never a maintenance or mutating script — it may delete files.

## Commands

```sh
# Lint every changed shell file (POSIX example)
shellcheck -s sh .githooks/commit-msg

# Format check / apply (project style; no hard-coded indent)
shfmt -d scripts/*.sh   # diff only
shfmt -w scripts/*.sh   # write

# Syntax check without running
sh -n file.sh
```

## Verify

- `shellcheck` on the changed paths returns no output.
- `sh -n`/`bash -n` parses clean, and the script's isolated tests are green. If the project has no safe
  test/smoke target, report runtime verification as unavailable; do not hand-run a mutating script.
