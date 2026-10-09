# Agent Notes

## Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Default engineering bias: laziest thing that works (ponytail)

Stop at the first rung that holds:

1. Does this need to exist at all? Speculative need = skip it, say so in one line.
2. Stdlib does it? Use it.
3. Native platform feature covers it? DB constraint over app code, CSS over JS.
4. Already-installed dependency solves it? Use it. Never add one for a few lines of code.
5. Can it be one line? One line.
6. Only then: the minimum code that works.

- Deletion over addition. Boring over clever. Fewest files, shortest diff.
- Output: code first, then at most three short lines — what was skipped, when to add it. If the explanation is longer than the code, delete the explanation. Prose the user explicitly asked for is exempt.
- Mark deliberate shortcuts with a `ponytail:` comment naming the ceiling and upgrade path.
- Never lazy about: input validation at trust boundaries, error handling that prevents data loss, security, accessibility.

## Authorization

Authentication is not authorization. "Logged in" never implies "allowed to see this record". Any endpoint returning data keyed by a caller-supplied id needs an ownership/permission check, and personal fields (email, phone, address) are omitted unless the caller owns the record or the requirement says otherwise.

## Surgical Changes

**Touch only what you must. Fix what's already decided; surface what isn't.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated mess (dead code, drift, broken references), handle it under "Fixes vs decisions" below.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Pre-existing dead code: surface it. Delete it automatically only after checking it can't be reached indirectly (dynamic imports, plugin or entry-point discovery, string-based lookups, external callers), and report what you checked.

## Fixes vs decisions

A **fix** restores something to what was already decided: a broken reference, a doc that contradicts the code or an ADR, a bug against stated behavior, drift between copies, a typo, dead code that passes the deletion check above. There is one correct answer. **Apply fixes automatically**, including ones you find while doing other work, and report each in one line afterward.

A **decision** changes what was decided or picks between real options: new behavior, a different design, removing something that might be intentional, scope growth, a new dependency. **Don't apply it. Surface it** with the options and your recommendation.

Still ask first, even for a fix:

- Anything irreversible or outside the repo (deleting data, pushing, changing live systems, sending messages).
- A fix that would alter behavior beyond the reported case. That is a second change.

When unsure which it is, treat it as a decision.

Keep each fix its own small, separate change so I can revert it alone.

The test: Every changed line traces to my request, or is a reported fix to something already decided.

## Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Verify, debug, test

- **Prove it works.** Before saying "done", check the real thing: run the feature or read the actual output. "It compiles" and "tests pass" are not proof.
- **Fix root causes.** Find why it broke and fix it there. Don't add a guard that only hides the crash.
- **Test behavior, not implementation.** A test checks what a user would see. If it would still pass with the code gutted, rewrite or delete it.
- **Encode repeated lessons.** If you've written the same instruction twice, turn it into a lint, hook or script instead of more text.
- **Final answers are fact-checked by a hook.** An end-of-turn hook (`~/.agents/bin/verify-final`) runs the independent verify on your final answer; don't run your own on it. If it sends findings back, correct each claim from the evidence and say in one line what you changed. Kill switch: `VERIFY_FINAL=0`.

## Changing code that has no tests (legacy)

Code without trustworthy tests is legacy code. Getting control comes before fixing.

- Before changing behaviour you don't fully understand, pin the current behaviour down first — a few characterization tests that assert what it does today, including behaviour that looks wrong. You cannot tell a fix from a regression otherwise.
- Say plainly what should change and what must stay identical. If a change alters cases beyond the reported bug, that is a second change: call it out and get agreement, don't bundle it.
- When intent is ambiguous, name the ambiguity and ask, or state the assumption prominently. Do not silently pick a reading and ship it.
- Prefer the smallest verified move over the tidiest one. Behaviour change, refactoring, and cleanup stay separate.
- If a dependency (clock, network, global, constructor) blocks testing, break the narrowest one that restores feedback.

## How to explain things to me

I direct the work but don't write the code myself. Assume I'm capable but not a specialist.

- Skip jargon, or define it in one plain sentence the first time it comes up.
- When you recommend something, give the plain-English reason and the tradeoff.
- Surface the decision I actually need to make; don't bury it in technical detail.
- Match the length to the stakes: a real choice gets an explanation, a routine one gets a line.

The test: could a smart non-coder follow this and make the call confidently?

## Explore via the code graph before grep (graphify)

When the user types `/graphify`, use the graphify skill (`~/.agents/skills/graphify/SKILL.md`) before doing anything else.

When `graphify-out/graph.json` exists in the working repo, treat it as the
first lookup for structural questions — where something is, what calls or
depends on it, how the codebase is organised, what a symbol means — instead of
starting with grep/glob.

- Find impact/dependents: `graphify affected "<symbol>"`
- Understand a symbol + neighbours: `graphify explain "<symbol>"`
- Answer a "how does X work" question: `graphify query "<question>"`
- Architectural hubs: `graphify god-nodes`

Fall through to grep/glob when there is no `graphify-out/graph.json`, when the
graph has no hit, or for exact string/line-level matches (grep is better at
those). Load the full `graphify` skill only for building or refreshing a graph.

## Client Operations Context

For client-operations requests—tickets, users, email, endpoints, networks, security, phones, monitoring, licensing, or internal knowledge:

- Check active context and available memory first.
- Identify the relevant ITAStack service and use its connector before web search or asking the user to locate data.
- If the service is unclear, use the ITAStack service inventory before asking a clarifying question.
- Treat discovery as read-only; it does not authorize changes in any connected service.
- If memory is unavailable, continue with active context and service discovery.
