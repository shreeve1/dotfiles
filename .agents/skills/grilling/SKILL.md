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

Explore, then fact-check — EVERY turn

Your exploration drifts. What you read early goes stale, and a mental model built once gets asserted as fact many turns later. So on every turn where you present findings, ask a question, or make a recommendation: first explore — read the actual files this turn depends on and form your claim from them — then run an independent fact-check on that claim. Order matters; the check is a second opinion on findings you already grounded, not your researcher. See VERIFY.md. No exceptions: even a turn that feels purely design-level usually rests on some claim about what the repo already does.

The check runs in a fresh, independent process — direct pi -p with deepseek/deepseek-v4-flash by default, or the Fusion reviewer subagent when Fusion is active (model and tools pinned in settings.json). It loads no skills and is grounded only in the actual files, so it has none of your accumulated assumptions. It returns VERIFIED / FALSE / UNSURE per claim with file:line evidence.

Surface the result to me inline before your question, e.g.: "Fact-check: my claim that Orders cancel wholesale came back FALSE — order.ts:88 shows line-item cancellation. Corrected question: …". If the check disagrees with you but you have fuller context and still believe you're right, say so and go with your judgment — note the disagreement so I can weigh in. The check informs the turn; it does not override you.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
