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

Search for teams in order of precedence:
1. `{cwd}/agents/teams/{TEAM_NAME}/team.yaml`
2. `{cwd}/.pi/agents/teams/{TEAM_NAME}/team.yaml`
3. `~/.pi/agent/agents/teams/{TEAM_NAME}/team.yaml`

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

For each agent in the team roster, search for `{agent-name}.md` in:
1. `{cwd}/agents/`
2. `{cwd}/.pi/agents/`
3. `~/.pi/agent/agents/`

Also check one level of subdirectories in each location.

Extract frontmatter fields:
- `name` — agent identifier
- `description` — what the agent does
- `model` — provider/model string (e.g., `minimax/MiniMax-M2.7`)
- `tools` — comma-separated tool list (e.g., `read,write,edit,bash,grep,find,ls`)
- `allowed_write_paths` — optional path restrictions

The body after the frontmatter `---` is the agent's system prompt.

**Agent key normalization:** Convert the agent name to a key by lowercasing and replacing any non-alphanumeric character (except hyphens) with a hyphen: `name.toLowerCase().replace(/[^a-z0-9-]/g, "-")`.

### 3. Load team context files

From the team directory, read these if they exist:
- `brief.md` — short description of when to use this team
- `context.md` — shared domain context all agents receive
- `dispatcher.md` — orchestration guide (adopt this as YOUR orchestration instructions)
- `program.md` — program-level context if present
- `expertise/{agent-key}.md` — per-agent expertise files
- `knowledge/shared.md` — shared domain knowledge
- `knowledge/{agent-key}.md` — per-agent domain knowledge
- `session-notes/{agent-key}.jsonl` — prior session notes (last 20 entries)
- `agent-skills/*.md` — shared agent skill files (max 4000 chars combined, alphabetical order)

**Truncation guardrail:** If any expertise or knowledge file exceeds 64KB, truncate to 64KB and append `\n\n[truncated]`.

### 4. Set up team communications directory

```bash
mkdir -p .pi/team-comms/requests .pi/team-comms/responses
# Clear channel from prior runs
rm -f .pi/team-comms/channel.jsonl
rm -f .pi/team-comms/requests/*.json .pi/team-comms/responses/*.json
```

### 5. Set up session directory

**CRITICAL:** Pi's `--session` flag loads the entire session file into context, even without `-c`. Existing session files from prior Pi dispatcher runs can be hundreds of KB, causing API timeouts.

When RESUME is false, use a **fresh session directory** scoped to this skill invocation:

```bash
# Create a unique session directory for this run
SKILL_SESSION_DIR=".pi/agent-sessions/pi-skill-$(date +%s)"
mkdir -p "$SKILL_SESSION_DIR"
```

Use `$SKILL_SESSION_DIR/{AGENT_KEY}.json` as the session path for all agents. This guarantees fresh sessions that won't collide with prior Pi dispatcher runs in `.pi/agent-sessions/`.

When RESUME is true, use the standard `.pi/agent-sessions/` directory so agents pick up their prior sessions. But validate them first (step 6).

### 6. Validate sessions when resuming

When RESUME is true, validate each agent's session file before resuming:

```bash
# Check last 6 lines for consecutive error stopReasons
tail -6 .pi/agent-sessions/{AGENT_KEY}.json 2>/dev/null | python3 -c "
import sys, json
errors = 0
for line in sys.stdin:
    try:
        entry = json.loads(line.strip())
        if entry.get('type') == 'message' and entry.get('message', {}).get('role') == 'assistant':
            if entry['message'].get('stopReason') == 'error':
                errors += 1
            else:
                errors = 0
    except: pass
if errors >= 3:
    print('POISONED')
else:
    print('OK')
"
```

If a session is POISONED, delete it and treat that agent as fresh (no `-c` flag).

### 7. Build team write map

Build a JSON map of which agents can write to which paths. Agent names in the map must be title-cased (e.g., "Scout" not "scout"):

```python
# Pseudocode for building the write map
write_map = {}
for agent in team_agents:
    if agent.allowed_write_paths:
        display_name = agent.name.split("-").map(w => w[0].upper() + w[1:]).join(" ")
        for path in agent.allowed_write_paths.split(","):
            path = path.strip()
            if path not in write_map:
                write_map[path] = []
            if display_name not in write_map[path]:
                write_map[path].append(display_name)
```

## Dispatching Agents

### How to invoke a Pi agent

To dispatch agent `{AGENT_NAME}` with task `{AGENT_TASK}`, run this via Bash:

```bash
# 1. Write the combined system prompt to a temp file
PROMPT_FILE=$(mktemp /tmp/pi-claude-prompt-XXXXXX.txt)

# 2. Build the prompt content (see "Building the Agent Prompt" below)
# Write content to $PROMPT_FILE

# 3. Invoke pi in text mode with environment variables
RAW_FILE=$(mktemp /tmp/pi-raw-XXXXXX.txt)
PI_AGENT_NAME="{AGENT_KEY}" \
PI_TEAM_COMMS_DIR="$(pwd)/.pi/team-comms" \
PI_TEAM_DIR="{TEAM_DIR_ABSOLUTE}" \
PI_COMMS_DEPTH="0" \
PI_ALLOWED_WRITE_PATHS="{ALLOWED_WRITE_PATHS}" \
PI_TEAM_WRITE_MAP='{WRITE_MAP_JSON}' \
timeout 600 pi -p \
  --no-extensions \
  -e ~/.pi/agent/extensions/team-comms.ts \
  -e ~/.pi/agent/extensions/domain-lock.ts \
  {WEB_EXTENSION_FLAG} \
  --model "{AGENT_MODEL}" \
  --tools "{AGENT_TOOLS}" \
  --thinking off \
  --append-system-prompt "$PROMPT_FILE" \
  --session "$SKILL_SESSION_DIR/{AGENT_KEY}.json" \
  {RESUME_FLAG} \
  "{AGENT_TASK}" \
  > "$RAW_FILE" 2>/dev/null
PI_EXIT=$?
AGENT_OUTPUT=$(cat "$RAW_FILE")

# 4. Clean up temp files
rm -f "$PROMPT_FILE" "$RAW_FILE"
```

Where:
- `{AGENT_KEY}` = agent name normalized: `name.lower().replace(/[^a-z0-9-]/g, "-")`
- `{AGENT_MODEL}` = the `model` field from the agent's .md frontmatter. If missing, fall back to `zai/glm-5.1`
- `{AGENT_TOOLS}` = the `tools` field from the agent's .md frontmatter
- `{RESUME_FLAG}` = `-c` if RESUME is true AND the session file exists AND is not poisoned, otherwise omit
- `{TEAM_DIR_ABSOLUTE}` = absolute path to the team folder
- `{ALLOWED_WRITE_PATHS}` = from agent frontmatter `allowed_write_paths`, or empty string
- `{WRITE_MAP_JSON}` = JSON string from step 7 above
- `{WEB_EXTENSION_FLAG}` = `-e ~/.pi/agent/extensions/web-fetch/index.ts` ONLY if the agent's tools include `web_search` or `web_fetch`, otherwise omit entirely

**IMPORTANT: `PI_COMMS_DEPTH` must be `"0"` for normal dispatches.** Only set to `"1"` when dispatching an agent to answer another agent's `request_input` (see "Handling request_input" below).

### Building the Agent Prompt

The temp prompt file should contain these sections concatenated in this exact order (skip empty sections):

1. **Shared Domain Context** — `## Shared Domain Context\n\n` + contents of `context.md`
2. **Team Roster** — formatted as:
   ```
   ## Your Team
   You are {agent-name} on a team with:
   - scout: Codebase exploration specialist...
   - builder: Implementation specialist...
   (all team members)

   ## Team Communication
   You have two tools for team communication:
   - post_to_channel: Share discoveries, decisions, warnings, or disagreements with the team
   - request_input: Ask a specific teammate a question and wait for their response
   ```
3. **Curated Channel Messages** — filter `.pi/team-comms/channel.jsonl` for this agent:
   - Exclude messages FROM this agent
   - Prioritize messages that mention this agent's name in content
   - Then high-priority messages
   - Then recent messages from others
   - Max 20 curated messages total
   - Format: `## Team Channel (Recent Messages)\n\n` + formatted messages
4. **Domain Knowledge** — `## Domain Knowledge\n\n` + `knowledge/shared.md` + `knowledge/{agent-key}.md`
5. **Expertise** — `## Your Expertise\n\n` + `expertise/{agent-key}.md`
6. **Agent Skills** — `## Agent Skills\n\n` + concatenated `agent-skills/*.md` files (max 4000 chars)
7. **Agent System Prompt** — the body of the agent's .md file (everything after the frontmatter `---`)
8. **Session Notes** — `## Recent Session Notes\n\n` + last 20 entries from `session-notes/{agent-key}.jsonl`, formatted as bullet points with timestamps

### Parsing Agent Output — Text Mode (Preferred)

**Use text mode (`-p` without `--mode json`) as the default.** It is significantly more resilient to provider degradation than JSON streaming mode. The agent's text output is captured directly from stdout.

```bash
# Dispatch in text mode — output is plain text, not JSON
RAW_FILE=$(mktemp /tmp/pi-raw-XXXXXX.txt)
PI_AGENT_NAME="{AGENT_KEY}" \
PI_TEAM_COMMS_DIR="$(pwd)/.pi/team-comms" \
PI_TEAM_DIR="{TEAM_DIR_ABSOLUTE}" \
PI_COMMS_DEPTH="0" \
PI_ALLOWED_WRITE_PATHS="{ALLOWED_WRITE_PATHS}" \
PI_TEAM_WRITE_MAP='{WRITE_MAP_JSON}' \
timeout 600 pi -p \
  --no-extensions \
  -e ~/.pi/agent/extensions/team-comms.ts \
  -e ~/.pi/agent/extensions/domain-lock.ts \
  {WEB_EXTENSION_FLAG} \
  --model "{AGENT_MODEL}" \
  --tools "{AGENT_TOOLS}" \
  --thinking off \
  --append-system-prompt "$PROMPT_FILE" \
  --session "$SKILL_SESSION_DIR/{AGENT_KEY}.json" \
  {RESUME_FLAG} \
  "{AGENT_TASK}" \
  > "$RAW_FILE" 2>/dev/null
PI_EXIT=$?

AGENT_OUTPUT=$(cat "$RAW_FILE")
rm -f "$RAW_FILE"

# Now you have both $AGENT_OUTPUT and $PI_EXIT
echo "Exit code: $PI_EXIT"
echo "$AGENT_OUTPUT"
```

Text mode outputs the agent's final text response directly — no JSON parsing needed. Use `$PI_EXIT` for error handling (0 = success, 124 = timeout).

### JSON Mode (Fallback — for structured event tracking)

If you need structured events (tool call counts, context usage, per-turn tracking), use `--mode json`. This is less resilient under provider degradation but gives richer data:

```bash
RAW_FILE=$(mktemp /tmp/pi-raw-XXXXXX.jsonl)
# Same command as above but add: --mode json
# ... > "$RAW_FILE" 2>/dev/null

# Parse with fallback chain: text_deltas -> message_end -> tool_execution_end
AGENT_OUTPUT=$(python3 -c "
import json
text_chunks = []
last_assistant = ''
last_tool_result = ''
for line in open('$RAW_FILE'):
    line = line.strip()
    if not line: continue
    try:
        e = json.loads(line)
        t = e.get('type', '')
        if t == 'message_update':
            ae = e.get('assistantMessageEvent', {})
            if ae.get('type') == 'text_delta':
                text_chunks.append(ae.get('delta', ''))
        elif t == 'message_end':
            msg = e.get('message', {})
            if msg.get('role') == 'assistant':
                parts = [c.get('text', '') for c in msg.get('content', []) if c.get('type') == 'text']
                joined = ''.join(parts)
                if joined: last_assistant = joined
        elif t == 'tool_execution_end':
            result = e.get('result', {})
            parts = [c.get('text', '') for c in result.get('content', []) if c.get('type') == 'text']
            joined = ''.join(parts)
            if joined and len(joined) < 2000: last_tool_result = joined
    except: pass
output = ''.join(text_chunks) or last_assistant or last_tool_result
print(output)
")
rm -f "$RAW_FILE"
```

### Post-Dispatch: Auto-Post to Channel

After each agent dispatch completes, write a summary to the team channel so other agents can see what happened:

```bash
python3 -c "
import json, uuid, datetime
msg = {
    'id': str(uuid.uuid4()),
    'timestamp': datetime.datetime.now().isoformat(),
    'from_agent': 'dispatcher',
    'message_type': 'decision' if EXIT_CODE == 0 else 'warning',
    'content': 'Dispatched {AGENT_NAME}: {TASK_PREVIEW}... Result: {OUTPUT_PREVIEW}...',
    'priority': 'normal'
}
with open('.pi/team-comms/channel.jsonl', 'a') as f:
    f.write(json.dumps(msg) + '\n')
"
```

Truncate task to 100 chars and output to 200 chars for the preview.

### Post-Dispatch: Check Channel

After each agent completes and after posting the dispatch result, read the channel:

```bash
cat .pi/team-comms/channel.jsonl 2>/dev/null | tail -20
```

Use these messages to inform your next dispatch decision.

### Post-Dispatch: Check for Pending Input Requests

After each agent completes, check if any agent left a `request_input` that hasn't been answered:

```bash
ls .pi/team-comms/requests/*.json 2>/dev/null
```

If there are pending request files, handle them (see "Handling request_input" below).

## Handling request_input

When an agent uses `request_input`, it writes a JSON file to `.pi/team-comms/requests/{id}.json`:

```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "from_agent": "builder",
  "to_agent": "reviewer",
  "question": "Should I use approach A or B for the auth module?",
  "context": "optional additional context"
}
```

The agent then polls `.pi/team-comms/responses/{id}.json` every 500ms for up to 120 seconds.

**Claude's responsibility as dispatcher:**

1. Read the request file
2. Check if the target agent exists on the team
3. Check if the target agent is currently busy (if you're running it already, decline)
4. Dispatch the target agent with the question as the task, using `PI_COMMS_DEPTH="1"` (prevents nesting)
5. Write the response file so the requesting agent can continue

**Dispatch for input request:**
```bash
PI_COMMS_DEPTH="1" \
... (same as normal dispatch) \
pi ... "{formatted_question}"
```

**Write the response:**
```bash
python3 -c "
import json
response = {
    'request_id': '{REQUEST_ID}',
    'timestamp': '{ISO_TIMESTAMP}',
    'from_agent': '{TARGET_AGENT_KEY}',
    'content': '''AGENT_OUTPUT_HERE''',
    'status': 'answered'  # or 'declined' if target unavailable
}
with open('.pi/team-comms/responses/{REQUEST_ID}.json', 'w') as f:
    json.dump(response, f, indent=2)
"
```

**Declining a request** (target busy or not on team):
```bash
python3 -c "
import json
response = {
    'request_id': '{REQUEST_ID}',
    'timestamp': '{ISO_TIMESTAMP}',
    'from_agent': '{TARGET_AGENT_KEY}',
    'content': 'Agent is currently busy / not on this team',
    'status': 'declined'
}
with open('.pi/team-comms/responses/{REQUEST_ID}.json', 'w') as f:
    json.dump(response, f, indent=2)
"
```

After handling, delete the request file:
```bash
rm -f .pi/team-comms/requests/{REQUEST_ID}.json
```

**IMPORTANT:** Since Claude dispatches agents sequentially, `request_input` timing is tricky. The requesting agent will be waiting (polling) while you dispatch the target agent. This means:
- For long-running agents, the requesting agent may time out (120s) before the target responds
- When possible, dispatch the target agent quickly and keep the task focused
- If you know the answer yourself from prior agent outputs, write the response directly without dispatching

## Orchestration Guide

You are the dispatcher. Adopt the team's `dispatcher.md` as your primary orchestration instructions. The guidance below is the default; if the team's dispatcher.md provides different instructions, follow those instead.

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
**Documentation:** documenter directly (after build, or standalone)
**Security:** append red-team after tester for security-sensitive work

### Parallel Dispatch

Run parallel agents using background Bash processes when lanes are independent:
- scout + web-searcher (independent context gathering) — **always parallelize these**
- scout + investigator (different subsystems)

Use sequential dispatch when there are dependencies:
- planner -> builder -> reviewer -> tester (each needs the prior output)

**Never dispatch the same agent twice in parallel.**

### After All Dispatches Complete — Final Review

**You own the final output.** Pi agents are specialists, but Claude Code is accountable for the delivered result. Before presenting work as complete:

1. **Review the work product.** Read the key files that were created or modified. For code changes, scan for obvious issues (broken imports, missing error handling, leftover debug code). For plans or docs, check they're coherent and complete. Match the depth of review to the risk:
   - **Trivial tasks:** Quick scan of the output is sufficient
   - **Standard tasks:** Read modified files, verify they match what was planned
   - **High-risk tasks:** Read all changed files, verify tests pass, check edge cases

2. **Verify artifacts exist.** If agents were supposed to create plans, docs, or other files, confirm they exist and contain real content (not empty or stub files).

3. **Catch cross-agent gaps.** Agents work in isolation — look for things that fall between the cracks: a planner assumed something the builder didn't implement, a reviewer flagged an issue nobody fixed, tests cover the happy path but not the error case.

4. **Fix or re-dispatch.** If you find issues, either fix them directly (Claude Code has full tool access) or dispatch another Pi agent with a targeted fix task. Don't pass known problems to the user.

5. **Summarize for the user:**
   - What was accomplished and which agents ran (with their models)
   - File paths for any artifacts created (plans, docs, etc.)
   - Any issues found during your review and how they were resolved
   - Anything you chose NOT to fix and why (out of scope, needs user decision, etc.)
   - Recommended follow-up actions

## Timeout and Error Handling

- Set a 10-minute timeout per agent dispatch (`timeout 600 pi ...`)
- If an agent returns exit code != 0 or produces no output, report the error and decide whether to retry with a different agent or adjusted task
- If an agent times out, report it and consider breaking the task into smaller pieces
- Empty output with exit code 0 may mean the agent did work via tools without emitting text — check artifacts directory for output

## Example Full Dispatch

Here's a complete example of dispatching the scout agent in text mode:

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

# Dispatch in text mode — capture output + exit code
RAW_FILE=$(mktemp /tmp/pi-raw-XXXXXX.txt)
PI_AGENT_NAME="scout" \
PI_TEAM_COMMS_DIR="$(pwd)/.pi/team-comms" \
PI_TEAM_DIR="$HOME/.pi/agent/agents/teams/1-full" \
PI_COMMS_DEPTH="0" \
PI_ALLOWED_WRITE_PATHS="" \
PI_TEAM_WRITE_MAP='{}' \
timeout 600 pi -p \
  --no-extensions \
  -e ~/.pi/agent/extensions/team-comms.ts \
  -e ~/.pi/agent/extensions/domain-lock.ts \
  --model "minimax/MiniMax-M2.5-highspeed" \
  --tools "read,bash,grep,find,ls" \
  --thinking off \
  --append-system-prompt "$PROMPT_FILE" \
  --session "$SKILL_SESSION_DIR/scout.json" \
  "Explore the project structure and identify key entry points" \
  > "$RAW_FILE" 2>/dev/null
PI_EXIT=$?

AGENT_OUTPUT=$(cat "$RAW_FILE")
rm -f "$RAW_FILE"
echo "Exit: $PI_EXIT"
echo "$AGENT_OUTPUT"

# Clean up
rm -f "$PROMPT_FILE"

# Post dispatch result to team channel
python3 -c "
import json, uuid, datetime
msg = {
    'id': str(uuid.uuid4()),
    'timestamp': datetime.datetime.now().isoformat(),
    'from_agent': 'dispatcher',
    'message_type': 'decision',
    'content': 'Dispatched scout: Explore the project structure... Result: (see above)',
    'priority': 'normal'
}
with open('.pi/team-comms/channel.jsonl', 'a') as f:
    f.write(json.dumps(msg) + '\n')
"

# Check for pending input requests
ls .pi/team-comms/requests/*.json 2>/dev/null

# Read team channel
cat .pi/team-comms/channel.jsonl 2>/dev/null | tail -20
```
