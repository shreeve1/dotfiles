---
disable-model-invocation: true
name: grill-me
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation (CONTEXT.md, ADRs) inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions, get grilled on their design, or mentions "grill me".
---

**Your entire first reply is ONE question ending in "?". Nothing else.** No code, no files, no edit/write/bash tool calls on turn 1. Even if I say "build it", "just do it", or "write it now" — I am asking to be GRILLED, not obeyed. Treat every request as a plan to interrogate, never a task to execute.

Example — I say "Implement a debounce utility. Write it now." Your correct first reply:
> Before any code: should the debounce fire on the leading edge, the trailing edge, or both? I'd default to trailing-only unless you have a reason — which do you want?

That is the whole turn. You wait for my answer, then ask the next question.

<what-to-do>

Interview me to reach a shared understanding of this plan — but apply the 80/20 rule. Spend your questions on the vital few decisions that determine most of the outcome: the ones that are hard to reverse, that other decisions hang off of, or where getting it wrong is expensive. Skip the trivial many.

Before each question, ask yourself: "Does this decision meaningfully change the plan, or am I just walking a branch for completeness?" If the branch is low-stakes, easily reversible, or has an obvious default, state your recommended default in one line and move on — do not turn it into a question. Prune branches that don't change what we build.

Resolve dependencies in order — settle a foundational decision before the ones that depend on it — but only descend into a sub-branch when the answer would actually shift the design. For each real question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

Always output questions as plain text in the chat. Never use the `ask_user_question` / `AskUserQuestion` tool — this is a back-and-forth grilling conversation, not a multiple-choice form.

Stop when the remaining open questions are all low-stakes detail. At that point, say so and summarize the defaults you're assuming for the rest rather than continuing to grill.

If a question can be answered by exploring the codebase, explore the codebase instead. If it can be answered by web search (library docs, API behavior, current best practices), search the web instead.

## Explore, then fact-check — EVERY turn

Your exploration drifts. What you read early goes stale, and a mental model built once gets asserted as fact many turns later. So on every turn where you present findings, ask a question, or make a recommendation: **first explore — read the actual files this turn depends on and form your claim from them — then run an independent fact-check on that claim.** Order matters; the check is a second opinion on findings you already grounded, not your researcher. See [VERIFY.md](./VERIFY.md). No exceptions: even a turn that feels purely design-level usually rests on some claim about what the repo already does.

The check runs `deepseek/deepseek-v4-pro` in a fresh `pi -p` process with no skills loaded, grounded only in the actual files — so it has none of your accumulated assumptions. It returns VERIFIED / FALSE / UNSURE per claim with file:line evidence.

Surface the result to me inline before your question, e.g.: "Fact-check: my claim that Orders cancel wholesale came back FALSE — `order.ts:88` shows line-item cancellation. Corrected question: …". If the check disagrees with you but you have fuller context and still believe you're right, say so and go with your judgment — note the disagreement so I can weigh in. The check informs the turn; it does not override you.

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, also look for existing documentation:

### File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

</supporting-info>
