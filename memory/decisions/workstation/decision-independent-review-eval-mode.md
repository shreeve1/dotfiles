---
title: Independent Review Eval Mode
summary: "eval" runs one reviewer blind to the current setup to judge a tool or approach; global AGENTS.md says the incumbent is a candidate, not the yardstick.
type: decision
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Decision

On 2026-11-04 James found agents anchor on whatever he already runs when he evaluates a new tool or method (session `01a1a369`, dsh-superagent vs pi-durable/ita-bot: every option was framed around pi-durable, "we already have X" counted against alternatives). He chose two fixes:

- **Global `.agents/AGENTS.md` "Evaluating options"**: judge each candidate against the goal on its own terms; the incumbent is one candidate, not the yardstick; switching cost counted once. Simplicity is scoped to "When building" so its "already-installed dependencies" order doesn't read as "prefer what's installed" during evaluations.
- **`independent-review` eval mode**: fires on "eval" (or "evaluate") like "quick", so the full suite doesn't run. One reviewer, lens `Eval` in `references/lenses.md`, first model of Step 2's row. The brief states the goal without naming current tools (a must-keep integration becomes a constraint), reads only the candidate's material, and omits memory and the session's leaning. The lead then compares against the incumbent and names where the views differ.

## Why

Research James accepted: agents use what context files mention far more (ETH Zurich AGENTS.md study, arxiv 2602.11988); LLMs favour status-quo options about 7.5x (Wynes et al. 2026); prompt-level debiasing only partly works (arxiv 2505.15392). A reviewer whose context never holds the incumbent is the reliable fix; the AGENTS.md rule is the cheap partial one. Also start evaluations from a neutral folder, not the incumbent's repo.

## Related

- [Independent Review Quick Mode](memory/decisions/workstation/decision-independent-review-quick-mode.md)
