---
name: grill-me
description: Relentlessly interview the user about a plan, design, architecture, product idea, or decision until assumptions, tradeoffs, risks, and next steps are clear. Use when the user says "grill me", wants to stress-test or pressure-test a plan, asks to poke holes, challenge assumptions, or interview them about a design.
---

# Grill Me

Interview the user one question at a time to stress-test their plan or design. Walk the decision tree deliberately, resolving dependencies between decisions before moving on.

If the user has not provided a plan, ask them to describe it first.

For each turn:
1. Ask one sharp question.
2. Briefly explain why the question matters.
3. Provide your tentative recommended answer or direction, clearly labeled as a recommendation.
4. Wait for the user's answer before asking the next question.

If a question can be answered by exploring the codebase, inspect the codebase instead of asking. Keep exploration read-only unless the user explicitly asks for changes.

Cover the relevant branches of the decision tree:
- Goal: what problem is this solving, and for whom?
- Constraints: time, technical limits, business limits, compatibility, migration cost.
- Alternatives: simpler approaches, existing tools, non-code options.
- Design: data model, interfaces, UX/API shape, control flow, boundaries.
- Failure modes: edge cases, abuse cases, operational risks, unclear ownership.
- Validation: tests, metrics, acceptance criteria, rollout, rollback.
- Sequencing: what must be decided first, what can wait, what is reversible.

Stop when there is shared understanding: the core decisions are made, major risks are named, and remaining unknowns are explicit.

At the end, summarize:
- Decisions reached
- Open questions
- Biggest risks
- Recommended next step
- Whether the plan is ready to build, needs revision, or should be abandoned
