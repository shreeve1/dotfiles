---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---
Run a `/grilling` session, using the `/domain-modeling` skill.

## Handing over

The glossary lands in `CONTEXT.md`, the rare ADR in `docs/adr/`, and the system's constraints in the grill's ledger (`.kanban/grilling/`). The reasoning behind the decisions (scope cuts, behaviour, edge cases, what is deliberately not being done) lives only in this conversation. Hand `/to-spec` the ledger path along with the conversation. When the grill is done, say so and offer to run `/to-spec` **now, in this session**, so those decisions are written into the spec's "Decisions from the grill" section while they are still in context. If the user ends the session first, tell them the decisions are lost to any later session unless they name this one: `/to-spec` records the session id for that reason.

## Brainstorm intake

Before the first question, glob `docs/brainstorming/*/brainstorm-intent.md`. If any exist, name the most recent and ask whether to grill it.

On yes, read that file — and only that file, not the session's `.memlog.md`, which is the raw log — then open the grill from its chosen directions. Treat them as proposals to stress-test, not settled decisions: a brainstorm optimizes for volume and surprise, so its output is the least-verified input you can get. Before building on it, run the independent verify once (`../_shared/verify-claims.md`) on the intent doc's claims about the repo — the end-of-turn hook only sees what you restate in a message. Say which intent doc you loaded.

If none exist, or the user declines, start the grill normally.

