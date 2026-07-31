---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
---

Run a `/grilling` session, using the `/domain-modeling` skill.

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

The check runs in a fresh, independent process — direct `pi -p` with `deepseek/deepseek-v4-pro` by default, or the Fusion reviewer subagent when Fusion is active (model and tools pinned in `settings.json`). It loads no skills and is grounded only in the actual files, so it has none of your accumulated assumptions. It returns VERIFIED / FALSE / UNSURE per claim with file:line evidence.

Surface the result to me inline before your question, e.g.: "Fact-check: my claim that Orders cancel wholesale came back FALSE — `order.ts:88` shows line-item cancellation. Corrected question: …". If the check disagrees with you but you have fuller context and still believe you're right, say so and go with your judgment — note the disagreement so I can weigh in. The check informs the turn; it does not override you.

</what-to-do>
