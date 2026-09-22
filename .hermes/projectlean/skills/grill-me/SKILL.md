---
name: grill-me
description: "Adversarial plan interview before implementation."
version: 2.1.0
author: "Rafael Zendron (rafaumeu) + Matt Pocock (mattpocock/skills, grilling) + Hermes Agent"
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [planning, adversarial, interview, decision-tree, pre-implementation, review, alignment]
    related_skills: [requesting-code-review, subagent-driven-development, test-driven-development]
---

# Grill Me

Stress-tests a plan through concise, structured adversarial questioning before
any code is written. Models the plan as a **design tree** — every decision
branches into the decisions that hang off it — and applies the **80/20 rule**:
interview the user on the small set of consequential frontier decisions while
explicitly resolving lower-impact branches with recommended defaults.

Combines the phase discipline of the original with the frontier-rounds
mechanic from mattpocock/skills' `grilling`.

## When to Use

- User says "grill me", "interview my plan", "stress test this idea"
- Before complex work: auth flows, schema changes, migrations, payments
- A plan has unresolved decisions or seems vague
- Before `subagent-driven-development` decomposition

Do NOT use for existing code (use `requesting-code-review`) or simple one-off
tasks.

## Prerequisites

None. The skill works on any plan or raw idea.

## Core Mechanic: Frontier Rounds

Map the plan as a design tree. The **frontier** is every decision whose
prerequisites are already settled — the questions you can ask NOW without
guessing at answers you haven't heard yet.

Work in **rounds**. Recompute the current frontier, then apply an 80/20 gate:

- **Ask** only decisions whose alternatives materially change scope,
  architecture, interfaces/data, security, reliability, reversibility,
  operating cost, or delivery time.
- **Default** low-impact, conventional, or easily reversible decisions to your
  recommendation. List them compactly so nothing is silently assumed.
- Prefer 1–3 high-leverage questions per round. Exceed this only when the
  decisions are independent and genuinely consequential.
- Every asked question carries a firm recommendation and one-line rationale.
- Let the user accept the whole round by replying `accept` or answer only the
  exceptions; treat unanswered items as acceptance of the recommendations.

A question whose answer depends on another question still open belongs to a
LATER round, not this one.

Format each round like so:

```
Frontier round N — reply `accept`, or list exceptions only.

Q1 — <consequential decision>
Recommendation: <recommended answer + one-line why>

Q2 — <consequential decision>
Recommendation: <recommended answer + one-line why>

Defaults applied: <compact list of low-impact decisions and defaults>
```

Each answer reshapes the tree: settled decisions push the frontier outward
and unblock dependent questions. Recompute, apply the 80/20 gate, and ask the
next round. Do not manufacture questions merely to prolong the interview.

**Facts are your job; decisions are the user's.** When a frontier question
needs a fact from the environment (codebase, filesystem, config, docs), find
it yourself with `search_files` / `read_file` / `terminal` — or dispatch a
subagent via `delegate_task` for a heavy exploration. Never ask the user for
anything you could look up. Don't block on an exploration: only the questions
downstream of it wait; ask the rest of the frontier now.

## Question Coverage (work these branches into the tree)

**Understanding** — the real goal and boundaries:
- What is the ACTUAL objective? What is explicitly IN and OUT of scope?
- What are the constraints (time, tech, team, budget)? Who are the users?

**Technical decisions** — for each architectural choice:
- "Why this approach and not X?" / "What happens if Y fails?"
- "What's the worst case?" / "How would you roll back?"
- Cross-reference the existing codebase; if the project already has a
  pattern for this, call it out.

**Edge cases:**
- "What happens if the user does Z?" / "What if dependency X goes down?"
- "What if volume is 100x expected?" / "What are the security implications?"

## Synthesis (when the frontier is empty)

1. Summarize the consequential decisions in bullet points
2. Summarize accepted defaults compactly
3. List anything left open, and what is explicitly OUT of scope
4. Ask: "Aligned? Should I start implementing, or adjust anything?"

Do not act on the plan until the user confirms shared understanding.

## Pitfalls

1. **Asking questions out of dependency order.** A question that depends on
   an unanswered question is a guess wearing a question mark. Keep it for a
   later round.
2. **Skipping the codebase.** Find facts in code with Hermes tools instead of
   asking the user.
3. **Accepting "I don't know" as final.** Suggest options, explain
   trade-offs, make a recommendation.
4. **Writing code during the interrogation.** Alignment only — code after the
   explicit green light.
5. **Being too agreeable.** Your job is to find material problems. If every
   consequential branch looks fine, stop; do not create low-value objections.
6. **Over-interviewing.** Apply the 80/20 gate. Default low-impact choices and
   spend user attention only on decisions that can materially change outcomes.
7. **Weak recommendations.** The user should be able to reply `accept`; make a
   clear best-choice recommendation rather than delegating analysis back to them.
8. **Not adapting to the user's language.** Interview in whatever language
   the user speaks.

## Verification

- [ ] Every question had its prerequisites settled and passed the 80/20 gate
- [ ] Asked only consequential frontier decisions, normally 1–3 per round
- [ ] Provided a clear recommendation with each question
- [ ] Listed low-impact recommended defaults instead of silently assuming them
- [ ] Allowed `accept` or exception-only replies
- [ ] Explored the codebase for facts instead of asking the user
- [ ] Frontier resolved by explicit answers or declared defaults before synthesis
- [ ] Produced a clear summary of decisions, defaults, and open items
- [ ] Confirmed user alignment before stopping
