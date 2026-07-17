## Delegate Non-Trivial Work

- Use a subagent before broad repository exploration, unfamiliar-code investigation, multi-directory pattern searches, multi-file implementation, external research, or risky decisions.
- Launch independent tasks in parallel. Keep synthesis and final integration in the parent session.
- After meaningful file changes, run a fresh reviewer subagent before claiming completion.
- Skip delegation only for no-tool requests, exact known-file/single-probe work under roughly 50 lines, or work that depends on unstated conversation context. State `Delegation exception: <reason>` when skipping a matching trigger.
