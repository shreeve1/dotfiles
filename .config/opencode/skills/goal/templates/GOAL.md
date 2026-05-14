# Goal: <one-line objective>

**Name:** <slug>
**Status:** active  <!-- active | paused | blocked | done | abandoned -->
**Created:** <YYYY-MM-DD>
**Last updated:** <YYYY-MM-DD>

## Objective
<One concrete sentence describing the end state. Not a list of tasks — the destination.>

## Stopping condition
<The verifiable signal that proves done. Be specific: "all 142 tests in suite X pass", "eval score on suite Y ≥ 0.85", "playwright run of stories/*.spec.ts passes against the reference screenshots".>

## Validation command(s)
```bash
# Exact command(s) that produce the stopping signal.
# Example:
# npm test -- --run
# bun test
# pytest tests/migration/
```

## Inputs to read first
- <path/to/plan.md>
- <path/to/relevant-source-dir/>
- <issue/PR link or local copy>

## Out of scope
- <what NOT to change>
- <files/dirs the agent must leave alone>
- <patterns to preserve — public APIs, file layout, naming>

## Checkpoint strategy
<How the work decomposes. A handful of named milestones, each with a verifiable signal. Examples:>

- **C1: Inventory** — list every call site of `legacyFn` and write to `migration-plan.md`
- **C2: Adapter** — add `newFn` adapter, all existing tests still green
- **C3: Migrate module A** — module A's tests pass against `newFn`
- **C4: Migrate module B** — module B's tests pass against `newFn`
- **C5: Cleanup** — `legacyFn` deletion, full suite green

## Notes / Constraints
<Anything else the agent needs to remember across turns. Style rules, perf budgets, parity requirements, rollback plan.>
