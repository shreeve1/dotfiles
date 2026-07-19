---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Before saving, run an **independent verify (see `../_shared/verify-claims.md`)** on the load-bearing claims in one batched call, checked against the cited sources rather than the agent's memory. A research memo is trusted verbatim by whoever consumes it — a `wayfinder` map indexing it into Decisions-so-far, a `teach` lesson, a `wiki-update` claim — so a wrong fact here propagates silently. Correct any FALSE claim (or drop it and re-read the source on UNSURE) before the memo lands.
4. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
