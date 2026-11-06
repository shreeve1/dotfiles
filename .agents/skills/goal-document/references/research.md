# Research: goal documents for agents

Text copies of each source are in `sources/` beside this file.

Gathered 2026-11-06 during a homelab ops review, where most stalled work came from accumulated cautious rules rather than real risk: re-approvals of approved work, escalations about the system's own rules, and a rule meant to protect verification that blocked applies over a whitespace reformat.

## What others do

The common name for this is **commander's intent**, a military idea (mission command): state the goal and why it matters, then let the subordinate choose the route.

- **A home lab run this way.** Cody Nichols, "Stop Using AI. Start Commanding It", War on the Rocks, 2026-08-31: `https://warontherocks.com/stop-using-ai-start-commanding-it/`. He runs dozens of agents on hobby hardware in his basement. They "execute against targets 24/7 within their commander's intent, even when he is unreachable", under "centralized planning, decentralized execution, and clear commander's intent."
- **Principles of Earned Autonomy** (Nils Holmager, 2026-04): `https://raw.githubusercontent.com/ntholm86/principles-of-earned-autonomy/refs/tags/v1.0.0/PRINCIPLES.md`.
  - "Define the destination. Never prescribe the route."
  - A checklist-following agent "scores well on the checklist and misses everything the checklist didn't mention. The checklist becomes the ceiling."
  - Test: delete the specific thresholds from the instructions; would a capable agent still know what to do?
  - Second principle: autonomy depends on a visible trail of every decision. (The ticket event log already provides this.)
- **Anthropic's constitution for Claude**, as quoted by BCS: `https://www.bcs.org/articles-opinion-and-research/from-compliance-to-comprehension-what-claude-s-new-constitution-means-for-llms/`. Models "need to understand why we want them to behave in certain ways… to apply broad principles rather than mechanically following specific rules."
- **Business framing:** "Why your 2026 IT strategy needs an agentic constitution", CIO: `https://www.cio.com/article/4118138/why-your-2026-it-strategy-needs-an-agentic-constitution.html`. Proposes a machine-readable "agentic constitution" with three tiers: full autonomy for low-stakes routine work, supervised autonomy with a reasoning trace for patching and config, and human-only red lines (data deletion, security overrides, changing the constitution itself). More rule-and-tier oriented than the others.
