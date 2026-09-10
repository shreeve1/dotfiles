---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---
Run a `/grilling` session, using the `/domain-modeling` skill.

## Brainstorm intake

Before the first question, glob `docs/brainstorming/*/brainstorm-intent.md`. If any exist, name the most recent and ask whether to grill it.

On yes, read that file — and only that file, not the session's `.memlog.md`, which is the raw log — then open the grill from its chosen directions. Treat them as proposals to stress-test, not settled decisions: a brainstorm optimizes for volume and surprise, so its output is the least-verified input you can get. The claims it makes about the repo are exactly what the VERIFY.md fact-check exists for. Say which intent doc you loaded.

If none exist, or the user declines, start the grill normally.

