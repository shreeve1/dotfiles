# Audit Workflow

Six-phase tool audit: **locate plan -> inventory tools -> gap analysis -> plan corrections -> research recommendations -> report**.

## Variables

PLAN_PATH: Path to the plan file (optional — auto-discovers most recent plan if not provided).
SETTINGS_FILE: `~/.claude/settings.json`
PLUGINS_FILE: `~/.claude/plugins/installed_plugins.json`
PLAN_DIRECTORIES: `plans/`, `specs/`, `artifacts/plans/`

## Instructions

- **AUDIT + FIX ONLY**: Do NOT install anything or modify settings. You MAY edit the plan file to correct tool references that don't match the project's actual tooling (e.g., plan says `jest` but project uses `vitest`).
- If no `PLAN_PATH` is provided, check `PLAN_DIRECTORIES` for the most recently modified `.md` file and use that. If no plans exist, stop and ask the user to provide a plan path or run `/dev-plan` first.
- Read the plan thoroughly to understand ALL technologies, frameworks, languages, APIs, and domains involved.
- Inventory every currently installed tool by reading `SETTINGS_FILE` and `PLUGINS_FILE`.
- Compare plan requirements against installed tools to identify gaps.
- Search the web for MCP servers, Claude Code plugins, and CLI tools that would fill those gaps.
- Prioritize recommendations by impact: tools that would make the biggest difference in completing the plan.
- Only recommend tools that are actively maintained and compatible with Claude Code.

## Disallowed Tools

Do NOT use: Task, EnterPlanMode, Write, NotebookEdit. This is a read-only audit with the exception of editing the plan file for corrections.

## Workflow

### Phase 1: Locate and Parse the Plan

1. If `PLAN_PATH` is provided, read that file directly.
2. If not provided, scan `PLAN_DIRECTORIES` (`plans/`, `specs/`, `artifacts/plans/`) for the most recently modified `.md` file. Use that as the plan.
3. Parse the plan and extract:
   - **Languages & runtimes** (Python, Node.js, Go, Rust, etc.)
   - **Frameworks** (React, FastAPI, Django, etc.)
   - **Infrastructure** (Docker, Kubernetes, AWS, GCP, Terraform, etc.)
   - **Databases** (PostgreSQL, Redis, MongoDB, etc.)
   - **APIs & services** (Stripe, GitHub, Slack, etc.)
   - **Testing needs** (unit, integration, E2E, load testing)
   - **Domains** referenced in tasks (frontend, backend, DevOps, data, etc.)
   - **File types** involved (.py, .ts, .yaml, .sql, .tf, etc.)
   - **Specific tools mentioned** in validation commands or notes

### Phase 2: Inventory Installed Tools

4. Read `SETTINGS_FILE` and extract:
   - All `mcpServers` entries (name, command, purpose)
   - All `enabledPlugins` entries
5. Read `PLUGINS_FILE` and extract:
   - All installed plugins (name, scope, version)
6. Check for common CLI tools relevant to the plan by running `which` or `command -v` for tools mentioned in the plan's validation commands.
7. Compile a complete inventory of what's currently available.

### Phase 3: Gap Analysis

8. For each technology/domain identified in Phase 1, check if there is a corresponding installed tool that provides assistance.
9. Categorize findings:
   - **Covered**: Plan requirement has a matching installed tool
   - **Gap**: Plan requirement has NO matching installed tool
   - **Partial**: An installed tool partially covers the requirement

### Phase 4: Plan Corrections

10. Cross-reference the plan's **validation commands**, **test runner references**, and **CLI tool invocations** against the project's actual tooling:
    - Read `package.json` to identify the project's real test runner (e.g., `vitest`, `jest`, `mocha`), build tools, and scripts
    - Check for mismatches where the plan references a tool the project doesn't use (e.g., plan says `npx jest` but project uses `vitest run`)
    - Check for incorrect CLI flags or command syntax for the installed tool versions
11. If mismatches are found, use the Edit tool to fix them directly in the plan file:
    - Replace incorrect tool references with the correct ones (e.g., `npx jest tests/...` -> `npx vitest run tests/...`)
    - Preserve the surrounding context and intent — only change the tool/command, not the purpose
    - Log each correction in the report under a new **Plan Corrections** section
12. If no mismatches are found, skip this phase and note "No corrections needed" in the report.

### Phase 5: Research Recommendations

13. For each **Gap** and **Partial** item, search the web for:
    - MCP servers (search: `"MCP server" <technology> site:github.com OR site:npmjs.com`)
    - Claude Code plugins (search: `"claude code plugin" <technology>`)
    - Relevant CLI tools that Claude Code could use via Bash
14. For each recommended tool, gather:
    - Name and source URL
    - What it does (one sentence)
    - How it helps with THIS specific plan
    - Install command (npm, pip, brew, etc.)
    - Whether it's an MCP server, plugin, or CLI tool

### Phase 6: Report

15. Print the audit report directly to the conversation using the format below.

## Report Format

Print this report directly (do NOT save to a file):

```
# Tool Audit Report

## Plan Analyzed
- **File**: <plan path>
- **Topic**: <plan title/description>
- **Technologies**: <comma-separated list of techs identified>

## Currently Installed Tools

### MCP Servers
| Server | Purpose |
|--------|---------|
| <name> | <what it does> |

### Plugins
| Plugin | Scope | Purpose |
|--------|-------|---------|
| <name> | <user/project> | <what it does> |

### Relevant CLI Tools
| Tool | Status | Version |
|------|--------|---------|
| <name> | Installed / Not Found | <version or -> |

## Coverage Analysis

### Covered (plan needs are met)
- <requirement> -> <installed tool that covers it>

### Gaps (no tool installed)
- <requirement> -> No matching tool found

### Partial Coverage
- <requirement> -> <tool> covers <X> but not <Y>

## Plan Corrections

List corrections made to the plan file. If none, write "No corrections needed."

| Location | Before | After | Reason |
|----------|--------|-------|--------|
| <line/section> | `<old command>` | `<new command>` | <why it was wrong> |

## Recommended Tools

### High Impact
Tools that would significantly improve plan execution:

#### 1. <Tool Name>
- **Type**: MCP Server / Plugin / CLI Tool
- **Source**: <URL>
- **Purpose**: <one sentence>
- **Plan relevance**: <how it helps with THIS plan specifically>
- **Install**: `<install command>`

#### 2. <Next Tool>
...

### Nice to Have
Tools that would help but aren't critical:

#### 1. <Tool Name>
...

## Summary
- **Plan requirements identified**: <N>
- **Currently covered**: <N>
- **Gaps found**: <N>
- **Plan corrections made**: <N>
- **Tools recommended**: <N>

## Quick Install

To install the high-impact recommendations, run:
<install commands for high-impact tools, one per line>
```
