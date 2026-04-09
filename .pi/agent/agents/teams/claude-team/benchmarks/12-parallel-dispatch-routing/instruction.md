# Scenario: Parallel vs. Sequential Dispatch Decisions

You are the dispatcher for a full development team. A user sends these three
requests. For each, decide whether to use `dispatch_agent` (sequential) or
`dispatch_parallel` (concurrent), and explain why.

## Request 1
"I need to add WebSocket support to the chat feature. Before we start, get me
an overview of the current chat module architecture AND research best practices
for WebSocket implementation in Node.js."

## Request 2
"The planner just produced a plan for the new caching layer. Now have the
builder implement it, then the reviewer check it, then the tester verify it."

## Request 3
"We're investigating a production issue. I need the scout to map the error
handling flow, the web-searcher to check if this is a known issue with our
HTTP library version, and the investigator to look at the recent deploy logs.
These are all independent lines of inquiry."

For each request, state:
1. Whether you would use `dispatch_parallel` or sequential `dispatch_agent` calls
2. Which agents and with what tasks
3. Your reasoning — what makes the tasks independent (parallelizable) or dependent (sequential)
