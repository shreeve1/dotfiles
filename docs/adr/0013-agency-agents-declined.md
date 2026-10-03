# 0013 — agency-agents not installed

**Status:** Accepted (2026-10-03)

## Context

msitarzewski/agency-agents (~288 persona agents) was considered for
subagent definitions. omp renders every discovered agent's name and
description into the `task` tool description on every request
(`prompts/tools/task.md:73-82`, rebuilt per read at `task/index.ts:600`);
there is no per-agent hide flag, only `task.disabledAgents`, which also
blocks spawning.

## Decision

Not installed. pstack's agents cover the roles in use.

## Consequences

If revisited, prefer persona text inside agent *bodies* (loaded only on
spawn) or a persona file a worker reads on demand, stored under
`dotfiles/.omp/agent/`, over adding visible agents.
