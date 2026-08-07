---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

Run a `/grilling` session, using the `/domain-modeling` skill.

## Explore, then fact-check — EVERY turn

Your exploration drifts. What you read early goes stale, and a mental model built once gets asserted as fact many turns later. So on every turn where you present findings, ask a question, or make a recommendation: **first explore — read the actual files this turn depends on and form your claim from them — then run an independent fact-check on that claim.** Order matters; the check is a second opinion on findings you already grounded, not your researcher. See [VERIFY.md](./VERIFY.md). No exceptions: even a turn that feels purely design-level usually rests on some claim about what the repo already does.

The check runs in a fresh, independent process — direct `pi -p` with `deepseek/deepseek-v4-pro` by default, or the Fusion reviewer subagent when Fusion is active (model and tools pinned in `settings.json`). It loads no skills and is grounded only in the actual files, so it has none of your accumulated assumptions. It returns VERIFIED / FALSE / UNSURE per claim with file:line evidence.

Surface the result to me inline before your question, e.g.: "Fact-check: my claim that Orders cancel wholesale came back FALSE — `order.ts:88` shows line-item cancellation. Corrected question: …". If the check disagrees with you but you have fuller context and still believe you're right, say so and go with your judgment — note the disagreement so I can weigh in. The check informs the turn; it does not override you.
