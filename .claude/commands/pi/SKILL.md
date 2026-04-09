---
name: pi
description: Dispatch Pi coding agents from Claude Code. Uses raw agent definitions for reliable, fast execution. Usage: /pi <agent> <task> or /pi <task> (auto-selects agent)
---

# Pi Agent Dispatcher

Claude Code dispatches Pi specialist agents via CLI. Each agent has its own model, tools, and personality defined in a single `.md` file. No team infrastructure, no extensions — just agent + task.

## When to Use Pi (Proactive Dispatch)

**Use Pi agents automatically during normal Claude Code work — don't wait for the user to ask.** Pi agents are independent second opinions from different models. Dispatch them whenever a second perspective adds value:

- **After implementing a feature** → dispatch `reviewer` to catch issues you missed
- **Before committing security-sensitive changes** → dispatch `red-team` in background
- **When stuck debugging** → dispatch `investigator` in parallel while you continue
- **When you need to understand unfamiliar code** → dispatch `scout` to map the area
- **For research questions** → dispatch `web-searcher` rather than guessing
- **After writing a plan** → dispatch `reviewer` to stress-test it

The cost is low (~30-90s per dispatch) and the value of a second model's perspective is high. When in doubt, dispatch.

## Variables

- `AGENT` — Agent name (e.g., `reviewer`, `scout`, `builder`)
- `TASK` — The task to accomplish

## Argument Parsing

Parse the skill arguments: `/pi [agent] <task>`

- If the first token matches a known agent name, use it as AGENT and the rest as TASK
- If the first token doesn't match an agent, treat the entire input as TASK and auto-select the agent based on task type (see Orchestration Guide)
- If no arguments provided, use AskUserQuestion to ask for the task

## Pre-flight

### 1. Discover available agents

Search for agent `.md` files in order of precedence:
1. `{cwd}/agents/`
2. `{cwd}/.pi/agents/`
3. `~/.pi/agent/agents/`

Also check one level of subdirectories in each location.

List the available agents and their descriptions by reading frontmatter from each `.md` file. Extract:
- `name` — agent identifier
- `description` — what the agent does
- `model` — provider/model string
- `tools` — comma-separated tool list

**Key agents:**

| Agent | Purpose |
|-------|---------|
| `scout` | Codebase exploration, find files, map structure (READ-ONLY) |
| `reviewer` | Review plans and code for issues, categorize Critical/Important/Minor |
| `builder` | Implement plans, write code, execute wave-by-wave |
| `worker` | Single focused task — write code, refactor, implement a feature |
| `planner` | Create implementation plans in `artifacts/plans/` |
| `tester` | Run tests, verify acceptance criteria |
| `investigator` | Debug issues, trace root causes |
| `red-team` | Security review, adversarial testing |
| `documenter` | Write documentation |
| `web-searcher` | Research via web search |

### 2. Resolve agent file path

Given an agent name, find its `.md` file using the search order above. Store the absolute path as `{AGENT_FILE}`.

If the agent is not found, list available agents and ask the user to pick one.

## Dispatching Agents

### How to invoke a Pi agent

```bash
timeout 180 pi -p \
  --no-extensions --no-skills --no-prompt-templates \
  --skill "{AGENT_FILE}" \
  --thinking off \
  "{AGENT_TASK}" \
  2>&1
```

That's it. The `--skill` flag loads the agent's model, tools, and system prompt from the `.md` file automatically. No env vars, no extensions, no session files needed.

**Key flags:**
- `--no-extensions --no-skills --no-prompt-templates` — prevents Pi from auto-loading dozens of extensions/skills that bloat context and cause timeouts
- `--skill "{AGENT_FILE}"` — loads the agent definition (model, tools, personality)
- `--thinking off` — faster responses
- `-p` — non-interactive print mode
- `timeout 180` — 3-minute timeout per dispatch (agents should complete in 30-90s)

### Providing additional context

If the agent needs extra context (e.g., prior agent output, project-specific info), prepend it to the task string:

```bash
timeout 180 pi -p \
  --no-extensions --no-skills --no-prompt-templates \
  --skill "{AGENT_FILE}" \
  --thinking off \
  "Context from prior scout: {SCOUT_OUTPUT}

Your task: {ACTUAL_TASK}" \
  2>&1
```

Keep context concise — summarize prior agent output rather than passing it verbatim.

### Capturing output

Capture the agent's text output directly from stdout:

```bash
AGENT_OUTPUT=$(timeout 180 pi -p \
  --no-extensions --no-skills --no-prompt-templates \
  --skill "{AGENT_FILE}" \
  --thinking off \
  "{AGENT_TASK}" \
  2>&1)
PI_EXIT=$?

echo "Exit: $PI_EXIT"
echo "$AGENT_OUTPUT"
```

Use `$PI_EXIT` for error handling: 0 = success, 124 = timeout.

### Project context injection

For better results, inject project context via `--append-system-prompt`. Create a temp file with key project info:

```bash
CONTEXT_FILE=$(mktemp /tmp/pi-context-XXXXXX.txt)
cat > "$CONTEXT_FILE" << 'CTX'
Project: [name] — [one-line description]
Stack: [key technologies]
Key files: [most relevant files for this task]
CTX

timeout 180 pi -p \
  --no-extensions --no-skills --no-prompt-templates \
  --skill "{AGENT_FILE}" \
  --append-system-prompt "$CONTEXT_FILE" \
  --thinking off \
  "{AGENT_TASK}" 2>&1

rm -f "$CONTEXT_FILE"
```

Keep context to 5-10 lines max. The agent reads the codebase itself — context just points it in the right direction.

### Chaining agent output

When piping one agent's output into the next, **summarize** rather than passing raw output. Large task strings can cause provider issues.

```bash
# Step 1: Scout explores
SCOUT_OUT=$(timeout 180 pi -p ... --skill scout.md "Map the auth module" 2>&1)

# Step 2: Summarize and pass to planner (don't pass raw SCOUT_OUT if it's huge)
SUMMARY="Auth module: src/auth/ with 3 files. Uses JWT tokens. Entry point is auth/mod.rs."
PLAN_OUT=$(timeout 180 pi -p ... --skill planner.md "Plan a fix for the auth bug. Context: $SUMMARY" 2>&1)
```

For short outputs (<500 chars), passing verbatim is fine. For longer outputs, summarize the key findings.

### Error handling

- If an agent returns exit code 124 (timeout) or empty output, **retry once** with the same task
- If it fails again, report the failure to the user and suggest an alternative agent or breaking the task down
- **Do not retry more than once** — repeated failures indicate a provider issue
- Empty output with exit code 0 may mean the agent did work via tools without emitting text — check if files were created/modified

## Orchestration Guide

You are the dispatcher. Your job is to pick the right agent(s), dispatch them, chain their output, and deliver the result.

### Auto-selecting agents

When the user provides a task without specifying an agent, select based on task type:

| Task type | Agent | Notes |
|-----------|-------|-------|
| "review", "check", "audit" | `reviewer` | Code/plan review |
| "explore", "find", "where is", "how does" | `scout` | Codebase exploration |
| "build", "implement", "add", "create" | `worker` | Single focused implementation |
| "plan", "design", "architect" | `planner` | Create implementation plan |
| "debug", "fix", "why is", "investigate" | `investigator` | Root cause analysis |
| "test", "verify", "validate" | `tester` | Run tests |
| "document", "write docs" | `documenter` | Documentation |
| "search", "research", "look up" | `web-searcher` | Web research |
| "security", "vulnerabilities", "pentest" | `red-team` | Security review |

For ambiguous tasks, prefer `worker` for implementation and `scout` for understanding.

### Multi-agent pipelines

For complex tasks, chain agents sequentially. Each agent's output informs the next dispatch.

**Verification Tiers:**

**Trivial** (single-file, non-logic changes): worker directly. 1 dispatch.

**Standard** (multi-file, behavior changes): planner -> worker -> reviewer. 2-3 dispatches.

**High-Risk** (security, auth, infrastructure): planner -> reviewer -> worker -> reviewer -> tester. 4-5 dispatches.

**Hard cap: never exceed 6 dispatches for a single user request.**

### Reference Pipelines

- **Implementation:** planner -> worker -> reviewer
- **Debugging:** investigator -> worker -> reviewer
- **Exploration:** scout directly
- **Research:** web-searcher directly
- **Documentation:** documenter directly
- **Security review:** reviewer -> red-team

### Parallel Dispatch

Run independent agents in parallel by making **multiple Bash tool calls in a single message**. Claude Code executes independent tool calls concurrently.

**When to parallelize:**
- scout + web-searcher (independent context gathering)
- scout + investigator (different subsystems)
- reviewer + red-team (independent review perspectives)
- Any two agents that don't depend on each other's output

**Example: parallel scout + reviewer**

Make two Bash tool calls in the same message:

Call 1:
```bash
timeout 180 pi -p --no-extensions --no-skills --no-prompt-templates \
  --skill ~/.pi/agent/agents/scout.md --thinking off \
  "Map the authentication module structure" 2>&1
```

Call 2:
```bash
timeout 180 pi -p --no-extensions --no-skills --no-prompt-templates \
  --skill ~/.pi/agent/agents/reviewer.md --thinking off \
  "Review git diff HEAD for security issues" 2>&1
```

Both run simultaneously. Combine their outputs when both complete.

**You can also use background Bash** (`run_in_background: true`) for fire-and-forget dispatches — e.g., dispatch `red-team` in background while continuing other work, then check the output later.

**Sequential dispatch** when there are dependencies:
- planner -> worker -> reviewer (each needs prior output)

**Never dispatch the same agent twice in parallel.**

### After All Dispatches Complete — Final Review

**You own the final output.** Before presenting work as complete:

1. **Review the work product.** Read key files that were created or modified.
2. **Verify artifacts exist.** If agents created plans/docs/files, confirm they exist.
3. **Catch cross-agent gaps.** Look for things that fell between the cracks.
4. **Fix or re-dispatch.** Fix issues directly or dispatch another agent.
5. **Summarize for the user:**
   - What was accomplished and which agents ran
   - File paths for any artifacts created
   - Issues found and how they were resolved
   - Recommended follow-up actions
