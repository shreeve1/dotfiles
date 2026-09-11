---
name: recommend
description: >
  Decide for the user when a session has offered options they can't judge.
  Do the legwork first — read the project, search the web — then commit to one
  option with a plain-English reason and the tradeoff. Use when the user says
  "let's go with your recommendation", "recommend", "you pick", "your call",
  "which one should I use", "I don't know enough to choose", "whatever you
  think is best", or otherwise hands a choice back to you.
---

The user has handed you a decision they can't evaluate. Don't hand it back as a
menu. Do the legwork, then commit.

Match the effort to the stakes. A reversible, cheap, one-line choice gets the
pick and the reason, and nothing else — no research, no ceremony. Run the full
sequence below when the choice is expensive, hard to undo, or shapes what gets
built on top of it.

## 1. Name the decision

State the choice in one line and list the real options — including any the
session didn't mention but should have, and "do nothing" when that's live.
Merge options that only differ cosmetically.

If the options in play were never actually stated (the user said "your
recommendation" about a vague fork), name what you think the fork is and say so
before continuing.

## 2. Close the knowledge gaps

Ask what fact would change the answer, and go get it. Skip any lookup whose
outcome wouldn't move the decision.

- **The project decides most of it.** Read the code, config, and dependencies.
  An option that matches what's already installed and used here usually wins on
  those grounds alone.
- **The web decides currency.** Search when the answer depends on something that
  changes: is a library maintained, is an API deprecated, what's the current
  recommended approach, are there known problems with this version.
- **The user's stated preferences decide style.** Their engineering bias
  (laziest thing that works, no speculative abstractions, deletion over
  addition) is a real constraint, not a vibe — apply it.

Judge the option you originally proposed by the same evidence as the others. If
the legwork undercuts it, say so and switch — the user asked what's best, not
for you to defend your first answer.

Done when every option's decisive facts are established or explicitly marked
unknown. Say which lookups you did, and say plainly when you did none.

## 3. Pick one

One recommendation. Not a ranked list, not "it depends".

Give, in this order and this short:
- **The pick**, in one line.
- **Why**, in plain English — no jargon, or define it in one sentence.
- **The tradeoff** — what you give up. Every real choice has one; if you can't
  name it, the options weren't different.
- **What would change my mind** — the condition under which the other option
  wins. This is the honest version of "it depends".
- **Confidence**, one word — solid, or a coin-flip you had to break. A weak pick
  presented as a strong one is the failure this skill exists to prevent.

Then stop and ask, only if a genuinely irreversible or expensive commitment is
involved (data loss, cost, public release, hard-to-undo migration). Otherwise
just proceed with the pick — the user asked you to decide, so deciding includes
doing it.

## When you genuinely can't pick

Only when the options are truly equivalent, or the deciding fact is something
only the user knows (budget, timeline, who maintains this, what they want it
for). Then: say the options are equivalent and pick the reversible one, or ask
exactly one question — the one fact that decides it — and nothing else.

Never stall on a decision you could have resolved by reading the project or
searching.
