---
name: powershell-language
description: PowerShell language and style standards for idiomatic scripts, functions, parameters and pipeline code. Use when cleaning PowerShell .ps1/.psm1/.psd1 files; defer module publishing and GUI layout to other docs.
metadata:
  triggers:
    files:
      - "**/*.ps1"
      - "**/*.psm1"
      - "**/*.psd1"
    keywords:
      - powershell
      - cmdlet
      - parameter
      - pipeline
      - psscriptanalyzer
---

# PowerShell Language

## Rules

- New scripts start with `#Requires -Version 5.1` when they assume a floor and `Set-StrictMode -Version Latest`.
  For an existing script, flag a missing `Set-StrictMode` in the report; do not add it — it changes runtime
  behavior (an uninitialised variable or missing property starts throwing).
- Use approved `Verb-Noun` names from `Get-Verb`; singular nouns, correct case.
- Type and validate parameters: `[Parameter(Mandatory)]`, `[ValidateSet(...)]`,
  `[ValidateRange(...)]`, `[ValidateNotNullOrEmpty()]`, `[switch]` for flags.
- Use `[CmdletBinding()]` and let it supply `-Verbose`/`-Debug`; do not hand-roll them.
- Emit objects (`[PSCustomObject]` or plain values), never formatted text, from functions.
- Quote strings unless expansion is intended; prefer single quotes for literals.
- Prefer `-LiteralPath` unless wildcards are wanted; use `Join-Path`, never string concatenation.
- Return early with guard clauses; keep nesting shallow.

## Recipe

1. Read the whole changed file: parameter block, `begin/process/end`, error handling, output.
2. Collapse alias usage (`%`, `?`, `gci`) to full cmdlet names in scripts.
3. Replace `+=` array building with pipeline or `[System.Collections.Generic.List[object]]`.
4. Turn string concatenation into `-f`, `-join` or here-strings.
5. Remove `Write-Output` where the value already flows on the pipeline.

## Anti-Patterns

- No aliases, no `echo`/`cat`/`dir` wrappers in scripts.
- No `return $null` at the end of a function; no `| Out-Null` where `[void]` or `$null =` is clearer.
- No empty `catch {}`; no `try/catch` around code that cannot throw.
- No `$ErrorActionPreference` juggling to paper over a missing check.
- No `Invoke-Expression` on assembled strings.
- No untyped `$args` passing where parameters belong.

## Verify

- `Invoke-ScriptAnalyzer` reports no Error or Warning (see `../powershell-tooling/RULES.md`).
- `pwsh -NoProfile -Command '[System.Management.Automation.Language.Parser]::ParseFile(<path>,[ref]$null,[ref]$errs)'`
  parses clean.
