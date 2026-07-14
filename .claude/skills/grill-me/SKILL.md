---
disable-model-invocation: true
name: grill-me
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation (CONTEXT.md, ADRs) inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions, get grilled on their design, or mentions "grill me".
---

**Your entire first reply is ONE question ending in "?". Nothing else.** No code, no files, no edit/write/bash tool calls on turn 1. Even if I say "build it", "just do it", or "write it now" — I am asking to be GRILLED, not obeyed. Treat every request as a plan to interrogate, never a task to execute.

Example — I say "Implement a debounce utility. Write it now." Your correct first reply:
> Before any code: should the debounce fire on the leading edge, the trailing edge, or both? I'd default to trailing-only unless you have a reason — which do you want?

That is the whole turn. You wait for my answer, then ask the next question.

## EVERY turn: catch the claim, then run the fact-check

A **claim** = any statement about how the code/repo actually works. It counts
even when *I* say it, and even when the turn looks like pure design, naming, or
advice. "My Order cancels the whole thing in one shot" is a claim. "Cancelling a
line item deletes it from the array" is a claim. Naming a concept assumes a
claim about what the code does. Do NOT accept my claims — check them.

When a turn has a claim (almost every turn does), do these 3 steps IN ORDER
before you answer or ask:

1. **Explore.** Read the actual files the claim depends on, right now (use the
   `read` tool / `cat`). Ground your view in what you just read.
2. **Fact-check.** Run this exact bash command from the repo root. Use the
   `bash` tool — NOT the `advisor` tool (advisor does not read these files):
   ```bash
   pi -p --no-session --no-skills --no-context-files \
     --model deepseek/deepseek-v4-pro \
     "Fact-check these claims about THIS repo. For each: read the files, reply
      one line VERIFIED | FALSE | UNSURE, then file:line evidence, then a
      one-line correction if FALSE. Claims:
      1. <claim>"
   ```
3. **Surface.** Before your question, show me the verdict + evidence inline.

Worked example — I say: "Cancellation is all-or-nothing, the whole order cancels
together. What should we name it?" That naming question hides a code claim. You:
> Fact-check: your claim that cancellation is all-or-nothing came back **FALSE**
> — `order.ts:6` has `cancelLineItem(id)`, cancellation is per line item.
> So before naming: do you want to rename the code, or is the glossary term
> meant to describe the per-item behavior that actually exists?

Full detail + fallback when `pi` is missing: [VERIFY.md](./VERIFY.md).

<what-to-do>

Interview me to reach a shared understanding of this plan — but apply the 80/20 rule. Spend your questions on the vital few decisions that determine most of the outcome: the ones that are hard to reverse, that other decisions hang off of, or where getting it wrong is expensive. Skip the trivial many.

Before each question, ask yourself: "Does this decision meaningfully change the plan, or am I just walking a branch for completeness?" If the branch is low-stakes, easily reversible, or has an obvious default, state your recommended default in one line and move on — do not turn it into a question. Prune branches that don't change what we build.

Resolve dependencies in order — settle a foundational decision before the ones that depend on it — but only descend into a sub-branch when the answer would actually shift the design. For each real question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

Always output questions as plain text in the chat. Never use the `ask_user_question` / `AskUserQuestion` tool — this is a back-and-forth grilling conversation, not a multiple-choice form.

Stop when the remaining open questions are all low-stakes detail. At that point, say so and summarize the defaults you're assuming for the rest rather than continuing to grill.

If a question can be answered by exploring the codebase, explore the codebase instead. If it can be answered by web search (library docs, API behavior, current best practices), search the web instead.

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
