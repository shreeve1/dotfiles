# Verifier: Investigator Misleading Evidence

## Target Agent
investigator (from agents/investigator.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Resist Anchoring on Obvious Explanation (weight: 3)
- 5: Does NOT stop at "token expiry + refresh is working as designed." Explicitly identifies the frequency mismatch — "a few times per day" with 15-minute tokens should produce dozens of 401s if this were normal expiry, and those would be invisible because the refresh flow works. This inconsistency drives deeper investigation.
- 3: Notes the frequency seems low but doesn't use it to drive investigation into an alternative cause.
- 1: Mentions the frequency in passing but concludes "token expiry, working as designed."
- 0: Stops at the obvious explanation — "15-minute tokens expire, refresh flow handles it, no bug."

### Criterion 2: Root Cause Identification (weight: 3)
- 5: Identifies the real root cause: **JWT secret rotation**. When the cron rotates `JWT_SECRET` every Sunday midnight, ALL existing access tokens become invalid immediately because they were signed with the old secret. `auth.ts:15` only verifies against the current `JWT_SECRET`, not `JWT_SECRET_PREV`. The "few times per day" correlates with users active during/after the weekly rotation — the burst of failures during rotation is noticed, while normal 15-minute expiries are silently refreshed.
- 3: Identifies the secret rotation as suspicious but doesn't fully explain the causal chain (why it causes intermittent visible logouts vs. silent refreshes).
- 1: Notices `JWT_SECRET_PREV` exists but doesn't connect it to the reported behavior.
- 0: Misses the secret rotation entirely.

### Criterion 3: Evidence Chain (weight: 2)
- 5: Builds a clear causal chain: (1) cron rotates JWT_SECRET on Sunday midnight, (2) all tokens signed with old secret fail `jwt.verify()` at auth.ts:15, (3) many requests fail simultaneously → 401 burst, (4) frontend interceptor fires for many requests at once → race condition or visible UI glitch (login page flash), (5) refresh endpoint creates new token with new secret → works, (6) users notice the visible disruption only during rotation window. References specific file:line evidence.
- 3: Has most of the chain but misses one key link (e.g., why the flash is visible during rotation but not normal expiry).
- 1: Identifies pieces but doesn't connect them into a coherent chain.
- 0: No causal chain — just lists observations.

### Criterion 4: Fix Direction (weight: 2)
- 5: Suggests verifying against both `JWT_SECRET` and `JWT_SECRET_PREV` in auth.ts (the previous secret already exists in the environment but isn't used by the middleware). Notes this is a small change (~3-5 lines: try current secret, if fail try previous, if both fail then 401). May also note the frontend race condition as a secondary issue.
- 3: Suggests a fix but it's the wrong one (e.g., "increase token lifetime" or "add retry logic").
- 1: Vague fix direction ("fix the auth middleware").
- 0: No fix suggestion.

## Required Elements
- [ ] Identifies JWT secret rotation as the root cause (not normal token expiry)
- [ ] Explains the frequency mismatch (few per day ≠ every 15 minutes)
- [ ] References server.ts:8-12 (secret rotation) and auth.ts:15 (single-secret verification)
- [ ] Explains why rotation causes visible logouts while normal expiry doesn't
- [ ] Does NOT conclude "working as designed, no bug"

## Anti-Patterns
- Stops at "token expiry + refresh flow = working as designed, no bug"
- Diagnoses as a frontend display/timing issue only
- Focuses on the refresh token flow instead of the access token verification
- Misses the secret rotation in server.ts or doesn't connect it to auth.ts
- Anchors on the first hypothesis without investigating the frequency anomaly
