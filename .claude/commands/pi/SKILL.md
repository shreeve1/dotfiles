---
name: pi
description: Orchestrate Pi coding agent teams from Claude Code. Dispatches tasks to multi-vendor Pi specialist agents with full visibility into each agent's work. Usage: /pi <team-name> <task> [--resume]
---

# Pi Team Orchestrator

Claude Code acts as the dispatcher for a Pi agent team. You break down the user's task, dispatch specialist Pi agents via CLI, read their full output, and chain results adaptively until the task is complete.

## Variables

- `TEAM_NAME` — Pi team folder name (e.g., `1-full`, `frontend`, `qa`, `info`)
- `TASK` — The task to accomplish
- `RESUME` — Whether to resume existing agent sessions (default: false)

## Argument Parsing

Parse the skill arguments: `/pi <team-name> [--resume] <task>`

- First token = team name
- If `--resume` is present anywhere, set RESUME=true and remove it from args
- Remaining tokens = the task description

If no arguments provided, use AskUserQuestion to ask for team name and task.

## Pre-flight

### 1. Discover the team

The team definition lives at `~/.pi/agent/agents/teams/{TEAM_NAME}/team.yaml`.
If `{TEAM_NAME}` doesn't match a directory, check if it's a symlink (e.g., `full` -> `1-full`).

Read the team.yaml to get the agent list. Example format:
```yaml
name: full
agents:
  - scout
  - web-searcher
  - planner
  - builder
  - reviewer
  - tester
  - documenter
  - red-team
  - investigator
```

If the team directory doesn't exist, list available teams from `~/.pi/agent/agents/teams/` and ask the user to pick one.

### 2. Load agent definitions

For each agent in the team roster, read `~/.pi/agent/agents/{agent-name}.md`.
Extract frontmatter fields:
- `name` — agent identifier
- `description` — what the agent does
- `model` — provider/model string (e.g., `minimax/MiniMax-M2.7`)
- `tools` — comma-separated tool list (e.g., `read,write,edit,bash,grep,find,ls`)
- `allowed_write_paths` — optional path restrictions

The body after the frontmatter `---` is the agent's system prompt.

### 3. Load team context files

From the team directory `~/.pi/agent/agents/teams/{TEAM_NAME}/`, read these if they exist:
- `brief.md` — short description of when to use this team
- `context.md` — shared domain context all agents receive
- `dispatcher.md` — orchestration guide (how to route, pipeline patterns, verification tiers)
- `expertise/{agent-name}.md` — per-agent expertise files
- `knowledge/shared.md` — shared domain knowledge
- `knowledge/{agent-name}.md` — per-agent domain knowledge
- `session-notes/{agent-name}.jsonl` — prior session notes (last 20 entries)

### 4. Set up team communications directory

```bash
mkdir -p .pi/team-comms/requests .pi/team-comms/responses
# Clear channel from prior runs
rm -f .pi/team-comms/channel.jsonl
rm -f .pi/team-comms/requests/*.json .pi/team-comms/responses/*.json
```

### 5. Set up session directory

```bash
mkdir -p .pi/agent-sessions
```

If RESUME is false, do NOT delete existing session files — they are only used if `--resume` is passed. When RESUME is false, omit the `-c` flag from agent invocations so Pi starts fresh sessions (but still writes to the session file for potential future resume).

## Dispatching Agents

### How to invoke a Pi agent

To dispatch agent `{AGENT_NAME}` with task `{AGENT_TASK}`, run this via Bash:

```bash
# 1. Write the combined system prompt to a temp file
PROMPT_FILE=$(mktemp /tmp/pi-claude-prompt-XXXXXX.txt)

# 2. Build the prompt content (see "Building the Agent Prompt" below)

# 3. Invoke pi
pi --mode json -p \
  --no-extensions \
  -e ~/.pi/agent/extensions/team-comms.ts \
  -e ~/.pi/agent/extensions/domain-lock.ts \
  --model "{AGENT_MODEL}" \
  --tools "{AGENT_TOOLS}" \
  --thinking off \
  --append-system-prompt "$PROMPT_FILE" \
  --session .pi/agent-sessions/{AGENT_KEY}.json \
  {RESUME_FLAG} \
  "{AGENT_TASK}"

# 4. Clean up
rm -f "$PROMPT_FILE"
```

Where:
- `{AGENT_KEY}` = agent name lowercased with spaces replaced by hyphens
- `{AGENT_MODEL}` = the `model` field from the agent's .md frontmatter
- `{AGENT_TOOLS}` = the `tools` field from the agent's .md frontmatter
- `{RESUME_FLAG}` = `-c` if RESUME is true AND the session file exists, otherwise omit

**Environment variables to pass:**
```bash
PI_AGENT_NAME="{AGENT_KEY}" \
PI_TEAM_COMMS_DIR="$(pwd)/.pi/team-comms" \
PI_TEAM_DIR="{TEAM_DIR}" \
PI_COMMS_DEPTH="1" \
PI_ALLOWED_WRITE_PATHS="{ALLOWED_WRITE_PATHS}" \
PI_TEAM_WRITE_MAP='{WRITE_MAP_JSON}' \
pi ...
```

- `{TEAM_DIR}` = absolute path to the team folder (e.g., `~/.pi/agent/agents/teams/1-full`)
- `{ALLOWED_WRITE_PATHS}` = from agent frontmatter, or empty
- `{WRITE_MAP_JSON}` = JSON object mapping paths to agent names who can write there (build from all agents' `allowed_write_paths`)

**If the agent definition has web tools** (`web_search` or `web_fetch` in its tools string), also add:
```
-e ~/.pi/agent/extensions/web-fetch/index.ts
```

### Building the Agent Prompt

The temp prompt file should contain these sections concatenated (skip empty sections):

1. **Shared Domain Context** — contents of `context.md`
2. **Team Roster** — list of all agents on the team with descriptions, formatted as:
   ```
   ## Your Team
   You are {agent-name} on a team with:
   - scout: Codebase exploration specialist...
   - builder: Implementation specialist...
   (etc.)

   ## Team Communication
   You have two tools for team communication:
   - post_to_channel: Share discoveries, decisions, warnings, or disagreements with the team
   - request_input: Ask a specific teammate a question and wait for their response
   ```
3. **Team Channel Messages** — recent messages from `.pi/team-comms/channel.jsonl` relevant to this agent (messages from other agents, high-priority first, max 20)
4. **Domain Knowledge** — from `knowledge/shared.md` and `knowledge/{agent-key}.md`
5. **Expertise** — from `expertise/{agent-key}.md`
6. **Agent Skills** — from `agent-skills/*.md` in the team directory (if exists, max 4000 chars combined)
7. **Agent System Prompt** — the body of the agent's .md file (after frontmatter)
8. **Session Notes** — last 20 entries from `session-notes/{agent-key}.jsonl`

### Parsing Agent Output

Pi with `--mode json` outputs newline-delimited JSON events to stdout. The agent's text response is assembled from `message_update` events with `assistantMessageEvent.type === "text_delta"`:

```
{"type":"message_update","assistantMessageEvent":{"type":"text_delta","delta":"some text"}}
```

Concatenate all `delta` values to get the full agent output.

**Practical approach:** Since you're running via Bash and reading the full output, you can use a simpler extraction:

```bash
pi ... 2>/dev/null | grep '"text_delta"' | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        e = json.loads(line)
        d = e.get('assistantMessageEvent', {}).get('delta', '')
        if d: print(d, end='')
    except: pass
print()
"
```

Or if the output is manageable, just capture raw and let Claude read the JSON lines directly.

### Reading Team Channel Between Dispatches

After each agent completes, read the team channel for situational awareness:

```bash
cat .pi/team-comms/channel.jsonl 2>/dev/null | tail -20
```

Channel messages are JSONL with fields: `from_agent`, `message_type` (discovery/decision/warning/question/disagreement), `content`, `priority`.

Use these to inform your next dispatch decision. If an agent posted a warning or disagreement, factor that into your routing.

## Orchestration Guide

You are the dispatcher. Follow these principles from the team's dispatcher guide:

### Bias Toward Action
- Be a coordinator who gets work done, not a messenger who reports findings
- Always try agents first before falling back to the user
- Don't do partial work: diagnose -> plan -> fix -> verify

### Verification Tiers

**Trivial** (single-file, non-logic changes): builder directly. 1 dispatch max.

**Standard** (multi-file, behavior changes): planner -> builder -> reviewer. Add tester when behavior changes. 2-4 dispatches.

**High-Risk** (security, auth, infrastructure, many consumers): planner -> reviewer -> builder -> reviewer -> tester. Add red-team for security-sensitive work. 4-6 dispatches.

**Hard cap: never exceed 6 dispatches for a single user request.**

### Reference Pipelines

**Implementation:** planner -> reviewer -> builder -> reviewer -> tester
**Debugging:** investigator -> planner -> builder -> reviewer -> tester
**Exploration:** scout directly (no pipeline needed)
**Research:** web-searcher directly

### Parallel Dispatch

Use parallel Bash calls (background processes) when lanes are independent:
- scout + web-searcher (independent context gathering)
- scout + investigator (different subsystems)

Use sequential dispatch when there are dependencies:
- planner -> builder -> reviewer -> tester (each needs the prior output)

### After All Dispatches Complete

Give the user a concise summary:
- What was done and which agents ran
- File paths for any artifacts created (plans, docs, etc.)
- Issues encountered
- Recommended follow-up actions

## Timeout and Error Handling

- Set a 10-minute timeout per agent dispatch (`timeout 600 pi ...`)
- If an agent returns exit code != 0 or produces no output, report the error and decide whether to retry with a different agent or adjusted task
- If an agent times out, report it and consider breaking the task into smaller pieces

## Example Full Dispatch

Here's a complete example of dispatching the scout agent:

```bash
# Build prompt
PROMPT_FILE=$(mktemp /tmp/pi-claude-prompt-XXXXXX.txt)
cat > "$PROMPT_FILE" << 'PROMPT_END'
## Shared Domain Context

Pipeline Reality. You operate in a sequential pipeline...

## Your Team
You are scout on a team with:
- scout: Codebase exploration specialist
- builder: Implementation specialist
- reviewer: Code and plan review specialist
...

## Team Communication
You have two tools for team communication:
- post_to_channel: Share discoveries, decisions, warnings, or disagreements
- request_input: Ask a specific teammate a question and wait for response

## Agent System Prompt
You are a codebase exploration specialist...
PROMPT_END

# Dispatch
PI_AGENT_NAME="scout" \
PI_TEAM_COMMS_DIR="$(pwd)/.pi/team-comms" \
PI_TEAM_DIR="$HOME/.pi/agent/agents/teams/1-full" \
PI_COMMS_DEPTH="1" \
timeout 600 pi --mode json -p \
  --no-extensions \
  -e ~/.pi/agent/extensions/team-comms.ts \
  -e ~/.pi/agent/extensions/domain-lock.ts \
  --model "minimax/MiniMax-M2.5-highspeed" \
  --tools "read,bash,grep,find,ls" \
  --thinking off \
  --append-system-prompt "$PROMPT_FILE" \
  --session .pi/agent-sessions/scout.json \
  "Explore the project structure and identify key entry points" \
  2>/dev/null | grep '"text_delta"' | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        e = json.loads(line)
        d = e.get('assistantMessageEvent', {}).get('delta', '')
        if d: print(d, end='')
    except: pass
print()
"

# Clean up
rm -f "$PROMPT_FILE"

# Check team channel
cat .pi/team-comms/channel.jsonl 2>/dev/null | tail -20
```
