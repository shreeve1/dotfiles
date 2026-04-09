# Verifier: Reviewer Subtle Logic Bug

## Target Agent
reviewer (from agents/reviewer.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Memory Leak Detection (weight: 3)
- 5: Identifies that the `rateLimits` Map grows unboundedly. Entries are only replaced when the same IP returns after window expiry. IPs that make one request and never return create permanent entries. In production with diverse IPs (CDN, mobile users), this leaks memory indefinitely. Classifies as Important or Critical.
- 3: Mentions the Map could grow but doesn't explain the mechanism (entries never cleaned) or the production impact.
- 1: Vaguely mentions "consider cleanup" without identifying it as a real issue.
- 0: Doesn't notice the memory leak.

### Criterion 2: Fixed vs Sliding Window Mismatch (weight: 3)
- 5: Identifies that the plan requested "sliding window" but the implementation uses a fixed window. Explains the concrete exploit: a client making 99 requests at minute 14:59 and 100 more at minute 15:01 gets 199 requests in 2 minutes (nearly 2x the intended limit). Classifies as Critical (plan mismatch + security implication).
- 3: Notes it's a "fixed window" but doesn't explain the burst exploit or connect it to the plan's "sliding window" requirement.
- 1: Mentions windowing but doesn't identify the discrepancy with the plan.
- 0: Doesn't notice the fixed vs sliding window difference.

### Criterion 3: Additional Issues (weight: 2)
- 5: Identifies at least one more real issue: (a) not process-safe — in cluster mode each worker has its own Map, so rate limits are per-process not per-IP, or (b) the `Date.now()` spy in tests isn't restored (test pollution), or (c) tests don't actually test sliding window behavior (they test fixed window correctly, masking the plan mismatch).
- 3: Identifies one additional issue but it's minor or imprecise.
- 1: Only surface-level observations (naming, formatting).
- 0: No additional issues beyond the two above.

### Criterion 4: Severity Classification (weight: 2)
- 5: Correctly classifies: memory leak as Important/High (production risk), sliding vs fixed window as Critical (plan mismatch + can be exploited to bypass limit), additional issues appropriately. Doesn't over-inflate minor issues or under-rate critical ones.
- 3: Identifies issues but severity doesn't match impact (e.g., memory leak as "Minor").
- 1: All issues listed at same severity without differentiation.
- 0: No severity classification.

## Required Elements
- [ ] Identifies the memory leak (Map entries never cleaned up for departed IPs)
- [ ] Identifies the sliding vs fixed window mismatch with the plan
- [ ] Explains the burst exploit (2x rate limit across window boundary)
- [ ] Classifies findings by severity with reasoning
- [ ] Does NOT say "all tests pass, implementation looks correct"

## Anti-Patterns
- "Implementation looks correct, all tests pass" without deeper analysis
- Only checks surface-level code style and misses the logic bugs
- Identifies issues but classifies everything as "Minor" or "Info"
- Says "tests pass so implementation is verified" without examining test quality
- Misses both the memory leak and the window mismatch
