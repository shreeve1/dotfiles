# Verifier: Parallel vs. Sequential Dispatch Decisions

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Correct Parallel Identification (weight: 3)
- 5: Correctly identifies Request 1 and Request 3 as parallelizable (independent context-gathering), and Request 2 as strictly sequential (each step depends on the previous)
- 3: Gets two of three correct, or identifies the right pattern but hedges unnecessarily
- 1: Only one correct, or treats all requests the same way
- 0: Uses parallel for the sequential pipeline or sequential for all three

### Criterion 2: Tool Selection (weight: 3)
- 5: Explicitly names `dispatch_parallel` for Requests 1 and 3, and sequential `dispatch_agent` for Request 2
- 3: Describes parallel/sequential behavior but doesn't name the correct tool
- 1: Mentions parallelism conceptually but doesn't connect to available tools
- 0: No distinction between tools or uses the wrong tool for each

### Criterion 3: Independence Reasoning (weight: 2)
- 5: Clearly articulates WHY tasks are independent (no data dependency, different information sources, results don't feed into each other) or dependent (output of one is input to the next)
- 3: Reasoning present but shallow ("these can run at the same time" without explaining why)
- 1: No reasoning, just states parallel or sequential
- 0: Reasoning is incorrect (claims dependent tasks are independent or vice versa)

### Criterion 4: Agent Selection Accuracy (weight: 2)
- 5: Correct agents for each request — R1: scout + web-searcher, R2: builder → reviewer → tester, R3: scout + web-searcher + investigator
- 3: Mostly correct but includes unnecessary agents or misses one
- 1: Some agents correct but significant routing errors
- 0: Wrong agents for most requests

### Criterion 5: Task Description Quality (weight: 1)
- 5: Each agent gets a specific, focused task description tailored to the request context
- 3: Task descriptions exist but are generic or just forward the user's words
- 1: Vague single-sentence tasks
- 0: No task descriptions

## Required Elements
- [ ] `dispatch_parallel` explicitly used or recommended for Request 1
- [ ] Sequential `dispatch_agent` used for Request 2 (plan → build → review → test)
- [ ] `dispatch_parallel` explicitly used or recommended for Request 3
- [ ] Explanation of data dependency as the reason for sequential in Request 2
- [ ] Explanation of independence as the reason for parallel in Requests 1 and 3

## Anti-Patterns
- Using `dispatch_parallel` for Request 2 (builder, reviewer, tester have strict ordering)
- Using sequential dispatch for Request 3 when all three investigations are independent
- Defaulting to sequential for everything without considering parallelism
- Claiming all requests should be parallel because it's faster
- Not mentioning the `dispatch_parallel` tool at all
