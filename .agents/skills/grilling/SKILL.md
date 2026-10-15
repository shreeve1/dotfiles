---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview me to reach a shared understanding of this plan — but apply the 80/20 rule. Spend your questions on the vital few decisions that determine most of the outcome: the ones that are hard to reverse, that other decisions hang off of, or where getting it wrong is expensive. Skip the trivial many.

Before each question, ask yourself: "Does this decision meaningfully change the plan, or am I just walking a branch for completeness?" If the branch is low-stakes, easily reversible, or has an obvious default, state your recommended default in one line and move on — do not turn it into a question. Prune branches that don't change what we build.

Resolve dependencies in order — settle a foundational decision before the ones that depend on it — but only descend into a sub-branch when the answer would actually shift the design. For each real question, provide your recommended answer.

Each question should be formatted like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

## The ledger

Every grill happens inside a system: the software being integrated with, the stack being chosen, the platform and machines it runs on, the budget. That system fades from your context as the session runs, so keep it written down in the ledger: `.kanban/grilling/<topic-slug>.md` under the current working directory.

- Before Q1, create the ledger (or reopen this topic's existing one) with what the system is and what is already fixed.
- Add a line the moment something lands: a decision the user settles, a capability or limit you find in the system's docs, a fact you observe in the repo or environment. Each line carries its source: the question that settled it, the doc URL, the file:line, or the user's own statement.
- Research is how the ledger grows. When a recommendation hinges on what the system can do and the ledger doesn't say, look it up in the system's official docs, the files, or through a sub-agent, and record what you find, limits included, before you recommend. If it can't be established, mark it unknown in the question.
- When the better answer would break a ledger line, put that to the user as its own question: revisit the line, or stay inside it.
- End every grill turn with `Ledger: .kanban/grilling/<topic-slug>.md`, so the check reads this grill's ledger and no other.

## Explore first, then ground — EVERY turn

Your exploration drifts. What you read early goes stale, and a mental model built once gets asserted as fact many turns later. So on every turn where you present findings, ask a question, or make a recommendation: first explore — re-read the ledger and the actual files this turn depends on and form your claim and your recommendation from them, never from memory. Recommend only what is possible inside the ledger. Even a turn that feels purely design-level usually rests on some claim about what the repo already does.

Don't run your own fact-check on the final message: an end-of-turn hook (`~/.agents/bin/verify-final`) fact-checks it independently against the actual files and the ledger, and sends back anything FALSE, plus any recommendation resting on a capability the ledger doesn't establish (UNGROUNDED: research it and record it). When findings come back, open your corrected message with them, e.g.: "Fact-check: my claim that Orders cancel wholesale came back FALSE — order.ts:88 shows line-item cancellation. Corrected question: …". If the check disagrees with you but you have fuller context and still believe you're right, say so and go with your judgment — note the disagreement so I can weigh in. The check informs the turn; it does not override you. If the hook isn't active in this harness (dsh and Pi have none), run the grill check from `../_shared/verify-claims.md` on your drafted turn before sending it, and fold its findings in.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

The session is done when every remaining open question is low-stakes: say so and list the defaults you are assuming for the rest. Do not act on it until the user confirms you have reached a shared understanding.
