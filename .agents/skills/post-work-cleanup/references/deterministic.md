# Deterministic Pass

Run the formatter, then the linter, **before** any judgement. The formatter settles style so the judgement
pass spends its attention on meaning. Never ask the model to out-lint a linter.

The **style contract** is the rule this pass shares with pi-lens (which formats on every edit), the
pre-push hook and `run-all.sh`: **a tool runs only from the repo's own config, and every caller runs
the same tool from that config.** Two callers that pick tools or flags of their own fight each other,
each rewriting the other's output on alternate edits. So this pass adds no formatter, flag or rule
the repo has not declared.

## 1. Setup check

Run `style-init --check` in the repo root (it is on PATH via `~/.local/bin`):

| Exit | Meaning | Do |
| --- | --- | --- |
| `0` | The repo has the standard files | Go to step 2 |
| `3` | An owned repo (`~/dotfiles/.config/style/owned-repos`) missing some | Offer setup, below |
| `4` | Not an owned repo | Go to step 2; it uses whatever config the repo has |
| `127` | `style-init` not installed | Report "style tools not installed on this machine", go to step 2 |

**Offer setup** (exit `3`): tell the user which files are missing, that setup is separate commits made
*before* this session's work (config, then one baseline reformat per language, recorded in
`.git-blame-ignore-revs`), and that the tree must be clean. Ask; do not run it unprompted. The sweep
diff is the session's files, and a whole-repo reformat inside it would bury the real change.

- **Yes:** `git stash push --include-untracked` if the tree is dirty, run `style-init --yes`, then
  `git stash pop`. A conflicted pop means the reformat touched a session file; for each conflicted file
  run `git checkout --theirs <file> && git reset -q <file>` (the session's version), run
  `style-check --fix` on those files, then `git stash drop`. Report the commits `style-init` made. If it refuses (branch behind its upstream), report that and continue as for No.
- **No:** continue. Formatting then runs only on surfaces the repo already configures.

**Done when** the check has run and, for exit `3`, the user has answered.

## 2. Format and lint the sweep diff

**When `style-check` is available** (exit `0`, `3` or `4` above), it is the only command for this pass.
It runs exactly what pi-lens runs, from the repo's config, at the pinned versions:

```bash
style-check --fix <sweep files>   # format + safe autofix
style-check <sweep files>         # report what is left
```

A surface it reports as `skipped` has no config in this repo: say so in the report and do not format
it by other means. A remaining finding is a judgement-pass item (fix it, or name it as out of scope);
it is never silenced with a blanket disable.

**When it is not installed**, use the repo's own config directly, still only for surfaces the repo
declares:

| Surface | Declared by | Format | Lint |
| --- | --- | --- | --- |
| Shell | `.editorconfig` | `shfmt -w <files>` | `shellcheck -S warning <files>` |
| Python | `ruff.toml`, `.ruff.toml`, `[tool.ruff]` | `ruff format <files>` | `ruff check --fix <files>` |
| Python | `[tool.black]` | `black <files>` | the repo's linter |
| TS / JS | `biome.json(c)` | `biome check --write <files>` (also lints) | — |
| TS / JS | `.prettierrc*` | `prettier --write <files>` | `eslint --fix` when configured |
| Markdown | `.markdownlint*` | — (never formatted) | `markdownlint-cli2 <files>` |
| PowerShell | `PSScriptAnalyzerSettings.psd1` | `Invoke-Formatter` | `Invoke-ScriptAnalyzer -Severity Error,Warning` |

Undeclared surface → no formatter, and say so. Run tools from the repo root, on the sweep files only.

**Done when** every surface in the diff has been formatted and linted from its config, or is named in
the report as having none.

## 3. Verify commands

Run the repo's own checks after the judgement pass: `tests/run-all.sh` when it exists, otherwise the test,
typecheck (`tsc --noEmit`, `python -m py_compile`, `bash -n`) and lint commands the repo documents.

## After the pass

The formatter's rewriting of a file is part of the sweep diff: review it once, by hand, for the one thing
formatters get wrong, a mechanical change that hides a semantic one.
