# Ralph Progress Log

This file tracks implementation notes across Ralph iterations.

# Conventions & Decisions

- Gralph reads GitHub issue data through GraphQL variables and validates response structure before writing run state.
- Frontier manifests sort children, labels, blockers, and dependency edges for deterministic output.

# Iteration Log

## #033 Plan the eligible GitHub child frontier — 2026-07-23

**What changed:** Added read-only direct-child planning, eligibility classification, and deterministic manifests with fixture-driven tests.
**Files:** `bin/gralph`, `tests/gralph-frontier.test.sh`
**Decisions:** Fail rather than silently truncate after 100 children or blockers; non-dry-run execution remains unavailable until later slices.
**Conventions established:** GitHub values cross the shell boundary as GraphQL variables, never interpolated commands.
**Notes for next iteration:** `.gralph/` runtime state is not ignored yet; decide its retention policy when execution artifacts arrive in #034.
