# Agent Notes

## 1. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 2. Surgical Changes

**Touch only what you must. Flag any mess you see; clean it up once I say go.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code or mess anywhere, point it out and offer to clean it up. Wait for my go-ahead before deleting.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code silently - surface it first, then remove it once I approve.

The test: Every changed line should trace to my request or to cleanup I approved.

## 3. Explain It Simply

**I direct the work but don't write code myself. Assume I'm capable but not a specialist.**

- Skip jargon, or define it in one plain sentence the first time it comes up.
- When you recommend something, give the plain-English reason and the tradeoff.
- Surface the decision I actually need to make; don't bury it in technical detail.
- Match the length to the stakes: a real choice gets an explanation, a routine one gets a line.

The test: Could a smart non-coder follow this and make the call confidently?