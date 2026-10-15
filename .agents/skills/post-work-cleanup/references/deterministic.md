# Deterministic Pass

Run the language's formatter, then its linter with autofix, **before** any judgement. The formatter settles
style so the judgement pass spends its attention on meaning. Never ask the model to out-lint a linter: a tool
that fixes fifty style findings for free leaves the judgement for the fifty it cannot.

The pass is **best-effort**: if a surface has no installed tool, the sweep is judgement-only for that surface
and the report must say so. Do not present an unverified judgement pass as a deterministic one.

## Policy

- Run what is installed; detect with `command -v`, `Get-Command`, or an ephemeral runner. **Never install
  tooling during a sweep.** When the project already runs a tool through an ephemeral runner (this
  workspace's `.githooks/pre-commit` runs `uvx ruff`), use the same runner instead of `command -v`.
- Use the project's own config when one exists (`pyproject.toml`, `ruff.toml`, `.shellcheckrc`,
  `.editorconfig`, `tsconfig.json`, `PSScriptAnalyzerSettings.psd1`, `biome.json`, `.prettierrc`). Never
  hard-code a style the project has not chosen.
- A tool that is not installed is a line in the report, not a stop.
- Fix findings; do not blanket-disable a rule. A suppression needs a specific code and a reason.
- Run on the files in the sweep diff, not the whole tree. A formatter rewrites the **whole file** it is
  given, so when the repo has no formatter config, skip formatting rather than reformat every unrelated
  line — and say so in the report.

## Commands by surface

| Surface | Format | Lint / autofix | Typecheck / syntax | Test |
| --- | --- | --- | --- | --- |
| Python | `ruff format <files>` (or `uvx ruff format` if the project uses it) | `ruff check --fix <files>` | `python -m py_compile <files>`, `mypy`/`pyright` | the repo's runner — `python -m unittest discover -s <dir>` here, or `pytest` if the repo uses it |
| PowerShell | `Invoke-Formatter` | `Invoke-ScriptAnalyzer -Path <p> -Severity Error,Warning` | `[Parser]::ParseFile` | `Invoke-Pester` |
| Shell | `shfmt -w <files>` (project style; do not hard-code an indent) | `shellcheck -s sh\|bash <files>` | `sh -n <file>` / `bash -n <file>` | the project's isolated tests; run the script only through a project test/smoke target, never by hand, and never a mutating script |
| TypeScript | `biome format --write` or `prettier --write` | `biome check --write` or `eslint --fix` | `tsc --noEmit` | project runner (`npm test`, `vitest`, …) |
| JavaScript | `biome format --write` or `prettier --write` | `biome check --write` or `eslint --fix` | `node --check <file>` | project runner |
| Markdown / JSON / YAML | `prettier --write` | `markdownlint-cli2 <files>` (Markdown only) | — | — |

`markdownlint-cli2` lints Markdown only; JSON and YAML are format-only here. Run it with `--fix` only when
the project carries a markdownlint config (`.markdownlint-cli2.*` or `.markdownlint.*`), so the rule set is
the project's own. With no config, run it plain and report the findings rather than rewriting the files,
since a default rule set is a style the project has not chosen.

The order above (format, then lint --fix) is the default. `biome check --write` also sorts imports, so if you
run it after `biome format --write` the file may be touched twice; run `biome check --write` once and skip a
separate format when the project uses biome for both.

If a surface has no project tooling installed, say so in the report and skip to judgement; do not invent a
config or add a dependency.

## After the pass

The formatter's rewriting of a file is part of the sweep diff — review it once, by hand, for the one thing
formatters get wrong: a mechanical change that hides a semantic one.
