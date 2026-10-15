---
name: powershell-tooling
description: PowerShell tooling gates for cleanup - PSScriptAnalyzer lint/format and Pester tests. Use to run the deterministic pass over PowerShell changes.
metadata:
  triggers:
    files:
      - "**/*.ps1"
      - "**/*.psm1"
      - "**/*.psd1"
    keywords:
      - psscriptanalyzer
      - invoke-scriptanalyzer
      - invoke-formatter
      - pester
---

# PowerShell Tooling

## Rules

- `Invoke-ScriptAnalyzer` is the lint gate; `Invoke-Formatter` (from PSScriptAnalyzer) is the format gate.
- Treat analyzer **Error** and **Warning** severities as failures; **Information** is advisory.
- Fix real code, do not silence rules. An inline `[Diagnostics.CodeAnalysis.SuppressMessageAttribute]` is a
  last resort and needs a reason; prefer `Settings` file suppressions for a deliberate project-wide rule.
- Run existing Pester tests after the sweep.

## Commands

```powershell
# Lint the changed files (Error/Warning only)
Invoke-ScriptAnalyzer -Path <dir> -Recurse -Severity Error,Warning

# Format in place
Invoke-Formatter -ScriptDefinition (Get-Content -Raw <file>) | Set-Content <file>

# Tests
Invoke-Pester ./tests
```

## Verify

- Analyzer run on the changed paths returns nothing at Error/Warning.
- `Invoke-Pester` is green; note any pre-existing failure you did not introduce.

## References

- Upstream PowerShell conventions live with the local `powershell-expert` and
  `powershell-code-review` skills; read them when a rule question is not covered here.
