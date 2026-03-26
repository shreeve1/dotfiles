---
description: Prep context for OpenClaw agent setup
model: sonnet
---

# Purpose

Gathers context about your OpenClaw agent configuration including structure, agents, hooks, and documentation for reference in AI conversations.

## Context Sources

- **Local path** - User-specified OpenClaw config directory (default: `~/.openclaw`)
- **Online documentation** - Official OpenClaw docs from docs.openclaw.ai (optional)

## Workflow

1. **Get Config Path** - Ask user for their OpenClaw config directory
2. **Fetch Local Structure** - List and read key files in the config directory
3. **Get Online Docs Option** - Ask if user wants to fetch official OpenClaw docs
4. **Fetch Online Docs** - Retrieve docs.openclaw.ai if selected
5. **Gather Configuration** - Read `openclaw.json` and relevant subdirectory contents
6. **Output Summary** - Provide structured overview of the setup

## Output Format

```
OpenClaw Configuration Summary
==============================

Config Path: <user-specified path>

Agents:
- <agent_id>: <agent_name> (workspace: <workspace_path>)

Subagents Available: <list of allowed subagent IDs>

Key Configuration:
- Primary Model: <model_id>
- Providers: <providers>
- Gateway Port: <port>
- Hooks Enabled: <yes/no>

Documentation:
- Plans: <path>
- Available Plans: <list of plan files>

Active Hooks:
- <hook_name>: <agent_id> / <channel>

Online Documentation Added:
- <source_name>: <url>
```

## AskUserQuestion

**Question:** "Where is your OpenClaw configuration located?"
**Header:** "Config Path"
**Options:**
- "Default (~/.openclaw)" - Uses standard `~/.openclaw` directory
- "Custom Path" - Let me specify a different location
**MultiSelect:** false

After user selects, if "Custom Path" is chosen, ask:
**Question:** "Please enter your OpenClaw config directory path"
**Header:** "Custom Path"
**Options:** []
**MultiSelect:** false

Then ask:
**Question:** "Would you like to fetch the official OpenClaw documentation?"
**Header:** "Online Docs"
**Options:**
- "Yes, fetch docs" - Fetch docs from docs.openclaw.ai
- "No, skip online" - Skip fetching online documentation
**MultiSelect:** false
