# System Decisions (placeholder)

Convention overlay for portable memories that describe PAI system decisions — typically `type: "tools"` or `type: "procedures"` records covering things like "we use OpenCode as the primary harness", "memory store is review-gated SQLite", "learning capture is gated until durable portable memory exists".

The canonical memory types are still `tools` and `procedures` in the SQLite store. This directory is an organizational view; the source of truth is `exports/accepted-memories.json`.

See [`../README.md`](../README.md) for the full portable memory contract.
