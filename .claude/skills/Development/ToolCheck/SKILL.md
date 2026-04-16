---
name: ToolCheck
description: Audit installed tools against a development plan to find missing MCP servers, plugins, or CLI tools. Compares plan requirements against current environment, fixes tool reference mismatches, and recommends tools to install. USE WHEN tool check, audit tools, missing tools, MCP audit, plan prerequisites, check tooling, tool gap analysis.
---

# ToolCheck

Analyze a development plan and compare its requirements against the currently installed tools (plugins, MCP servers, CLI tools). Identify gaps, fix mismatches, and recommend tools to install.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/ToolCheck/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the Audit workflow in the ToolCheck skill to audit tools against plan"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **Audit** workflow in the **ToolCheck** skill to audit tools against plan...
   ```

**Full documentation:** `~/.claude/PAI/THENOTIFICATIONSYSTEM.md`

## Model Recommendation

**Recommended model: opus** — This skill requires cross-referencing multiple data sources (plan requirements, settings files, plugin manifests, CLI availability), reasoning about tool compatibility, and making judgment calls about impact. Opus provides the strongest analysis quality for this audit work.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| Audit tools against a plan, find gaps, recommend tools | `Workflows/Audit.md` |

## Pipeline Position

**Where this skill fits in the development pipeline:**

- **Before:** `/dev-plan` (plan must exist first)
- **After:** Install recommended tools, then proceed to `/dev-build`
- **Alternative to:** Manually checking each tool requirement

**Workflow chain:**
```
/dev-plan -> [ToolCheck/Audit] -> install recommended tools -> /dev-build
```

## Context Files

| File | Content |
|------|---------|
| `../PipelineReference.md` | Full pipeline flow documentation and conventions |

## Examples

### Example 1: Audit existing plan

```
User: "Tool check plans/add-auth.md"
-> Invokes Audit workflow
-> Reads plan, inventories installed tools, finds gaps
-> Recommends missing MCP servers and CLI tools
```

### Example 2: Auto-discover most recent plan

```
User: "Check my tools against the plan"
-> Invokes Audit workflow
-> Finds most recent plan in plans/ or artifacts/plans/
-> Full 6-phase audit with recommendations
```

### Example 3: Fix tool mismatches

```
User: "Audit the plan for tooling issues"
-> Invokes Audit workflow
-> Discovers plan references jest but project uses vitest
-> Fixes plan references automatically
-> Reports corrections and recommendations
```
