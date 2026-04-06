# Agent Definitions Expert — Expertise File

## Agent Definition Format
- Markdown files with YAML frontmatter + system prompt body
- Frontmatter: `name`, `description`, `tools` (required); `model`, `allowedWritePaths` (optional)
- Tools: comma-separated Pi tool names (read, write, edit, bash, grep, find, ls)
- Locations: `.pi/agents/*.md`, `.claude/agents/*.md`, `agents/*.md`, `~/.pi/agent/agents/*.md`

## Team Configuration
- Per-team folders: `agents/teams/{name}/team.yaml` with `name:` and `agents:` list
- Legacy: `.pi/agents/teams.yaml` (flat multi-team format)
- Folder-defined teams take precedence over teams.yaml entries
- team.yaml is purely declarative — roster only, no lifecycle/timeout/policy config

## Agent Dispatch Architecture (agent-team.ts)
- Extension registers `dispatch_agent` tool; dispatcher LLM is locked to `["dispatch_agent", "track_goal"]`
- Agents spawn as isolated `pi` child processes via `child_process.spawn()`
- Two dispatch paths: `dispatchAgent()` (tool-driven) and `handleInputRequest()` (inter-agent comms)
- Combined system prompt assembled from: context + team roster + comms + domain knowledge + expertise + skills + session notes
- Prompt written to temp file, passed via `--append-system-prompt`
- JSON mode stdout parsed for streaming updates (text_delta, tool_execution_start, message_end, agent_end)

## Critical Gap: No Abort/Cancel Support in agent-team.ts
- `_signal` parameter is explicitly ignored in `dispatch_agent` execute()
- `proc` is a local variable — no stored reference for external kill
- No proc.kill(), SIGTERM, or SIGKILL anywhere in the file
- No `/agents-stop` command; no timeout mechanism; no orphan cleanup on exit
- The official subagent example DOES implement abort correctly (SIGTERM + SIGKILL fallback via signal listener)

## AgentState Interface
- Tracks: def, status (idle/running/done/error), task, toolCount, elapsed, lastWork, contextPct, sessionFile, runCount, timer
- Does NOT store process handle (proc/pid) — this is the missing piece for abort support

## Pi Core Abort Infrastructure
- Escape key → `app.interrupt` → aborts dispatcher LLM turn (but NOT spawned subprocesses)
- `ctx.signal` — AbortSignal available during active turns
- `ctx.abort()` — programmatic abort from extensions
- RPC `abort` command — external abort
- SDK `session.abort()` — programmatic abort
- `session_shutdown` event — cleanup hook (agent-team only stops request watcher, doesn't kill children)

## Session Management
- `--session <file>` for persistent sessions; `-c` to continue
- Agent sessions stored in `.pi/agent-sessions/{agent-key}.json`
- Sessions wiped on team session_start (fresh start each session)

## Agent Orchestration Patterns
- Dispatcher: primary agent delegates via dispatch_agent (hub-and-spoke)
- Pipeline: sequential chain (scout → planner → builder → reviewer)
- Parallel: concurrent dispatch via Promise.all (not yet in agent-team.ts, exists in subagent example)
- Inter-agent comms: request_input tool → file-based watcher → handleInputRequest dispatch
