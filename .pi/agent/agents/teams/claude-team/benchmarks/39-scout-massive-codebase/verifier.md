# Verifier: Scout Massive Codebase Exploration

## Target Agent
scout (from agents/scout.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Compression Under Scale (weight: 3)
- 5: Report is ≤80 lines despite 22 files / 1,880 lines of code. Prioritizes the ~8 files most relevant to OAuth2 (AuthService, TokenService, config/auth, types/auth, OAuthProviderBase, User model, routes/auth, middleware/auth). De-emphasizes or omits PasswordService detail, test files, admin routes, and validators — they're not relevant to adding OAuth2. Judge by relevance-per-line, not just line count — a focused 90-line report may outscore a padded 75-line one.
- 3: Report is 80-130 lines. Covers relevant files but includes unnecessary detail on irrelevant files (PasswordService internals, test details, admin CRUD). Or: report is under 80 lines but omits key integration points to hit the target.
- 1: Report is 130-180 lines. Enumerates most files with significant detail regardless of OAuth2 relevance.
- 0: Report exceeds 180 lines or gives equal coverage to all 22 files.

### Criterion 2: OAuth2 Integration Point Mapping (weight: 3)
- 5: Identifies all 4 key integration points: (a) AuthService needs a new `loginWithOAuth(provider, code)` method paralleling the existing login flow, (b) OAuthProviderBase and OAuthProfile types exist as starting scaffolding (but may be stale), (c) User model already has `oauthProvider`/`oauthId` nullable fields ready to use, (d) config/auth.ts has an empty `OAUTH_PROVIDERS` placeholder. These are the "what already exists for OAuth2" findings.
- 3: Identifies 2-3 integration points but misses the existing OAuth scaffolding or the model fields.
- 1: Identifies AuthService as the integration point but misses the existing OAuth-related code.
- 0: Doesn't map integration points — just lists files.

### Criterion 3: Pattern Documentation (weight: 2)
- 5: Documents the auth flow pattern OAuth must replicate: login → session creation → TokenPair return → token verification via middleware → refresh rotation. The planner needs this to design the OAuth flow to match existing patterns. Also notes RBAC integration (new OAuth users need a role).
- 3: Mentions the login flow but doesn't connect it to what OAuth must replicate.
- 1: Lists function signatures without explaining the flow.
- 0: No flow documentation.

### Criterion 4: Risk Flagging (weight: 2)
- 5: Flags at least 2 risks: (a) OAuthProviderBase may be stale — abstract class never implemented, could have outdated API assumptions (planner should verify before building on it), (b) the 6-digit reset code at routes/auth.ts:85 is a security concern adjacent to auth work. Distinguishes "reuse this" from "verify before trusting."
- 3: Flags one risk but misses the other.
- 1: No risk flagging — treats everything as reliable.
- 0: Reports risks that don't exist.

## Required Elements
- [ ] Report ≤120 lines total (target ≤80 for full Criterion 1 score)
- [ ] Identifies OAuthProviderBase, OAuthProfile type, and User.oauthProvider/oauthId as existing scaffolding
- [ ] Maps the login → session → TokenPair flow that OAuth must replicate
- [ ] Flags the 6-digit reset code as a security concern
- [ ] Flags OAuthProviderBase as potentially stale (never implemented)
- [ ] De-emphasizes or omits test files, PasswordService detail, admin routes, validators

## Anti-Patterns
- Enumerates all 22 files with equal detail
- Report exceeds 120 lines (context budget awareness failure)
- Misses the existing OAuth scaffolding (OAuthProviderBase, types, model fields, config placeholder)
- Dumps function signatures or full code blocks
- Doesn't flag the reset-code security concern or the stale base class
- Spends significant space on PasswordService, test files, or admin routes
