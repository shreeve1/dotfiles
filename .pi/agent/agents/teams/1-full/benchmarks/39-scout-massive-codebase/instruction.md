# Benchmark: Scout Massive Codebase Exploration

## Scenario

You are the scout. The planner needs to understand the authentication system to plan
adding OAuth2 support (Google + GitHub providers).

**The auth system spans 22 files across 8 directories (~1,880 lines total):**

```
src/
  auth/
    AuthService.ts          # 280 lines — orchestrates login, register, refresh, logout
    TokenService.ts         # 150 lines — JWT access/refresh token creation & verification
    PasswordService.ts      # 120 lines — bcrypt hashing, comparison, strength policy
    SessionStore.ts         # 90 lines — Redis-backed session CRUD
    OAuthProviderBase.ts    # 60 lines — abstract base class (authorize, callback, getProfile)
  middleware/
    auth.ts                 # 45 lines — Express JWT verification middleware
    rbac.ts                 # 85 lines — role-based access control (user/admin/super_admin)
    rateLimit.ts            # 35 lines — login attempt rate limiting (10/min per IP)
  routes/
    auth.ts                 # 130 lines — POST login/register/refresh/logout/reset-password
    admin/
      users.ts              # 95 lines — admin user management (CRUD + role assignment)
  models/
    User.ts                 # 55 lines — Prisma model: email, password, role, oauthProvider?, oauthId?
    Session.ts              # 30 lines — session model with userId, token, expiresAt
    Role.ts                 # 25 lines — role enum (user/admin/super_admin) + permissions map
  utils/
    crypto.ts               # 40 lines — token generation helpers, constant-time comparison
    validators.ts           # 35 lines — zod schemas for email, password format validation
  config/
    auth.ts                 # 50 lines — JWT secrets, token lifetimes, OAUTH_PROVIDERS: {} (empty)
  types/
    auth.ts                 # 45 lines — AuthPayload, TokenPair, UserProfile, OAuthProfile
  __tests__/
    auth/
      AuthService.test.ts   # 200 lines
      TokenService.test.ts  # 120 lines
      PasswordService.test.ts # 80 lines
    middleware/
      auth.test.ts          # 90 lines
      rbac.test.ts          # 70 lines
    routes/
      auth.test.ts          # 150 lines
```

**Key details you discover while reading:**

- `AuthService.ts:12` — imports TokenService, PasswordService, SessionStore
- `AuthService.ts:45` — `login(email, password)` → validate → hash compare → create session → return TokenPair
- `AuthService.ts:78` — `register(email, password, role?)` → validate → hash → create user → auto-login
- `AuthService.ts:110` — `refreshToken(refreshToken)` → verify → rotate → return new TokenPair
- `AuthService.ts:140` — `logout(sessionId)` → destroy session → add token to blacklist
- `TokenService.ts:20` — `createTokenPair(user)` returns `{ accessToken (15m), refreshToken (7d) }`
- `TokenService.ts:55` — `verifyToken(token, type)` checks expiry, blacklist status, signature
- `config/auth.ts:15` — `OAUTH_PROVIDERS: {}` — empty placeholder, never populated
- `config/auth.ts:30` — `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_TTL=7d`, `TOKEN_BLACKLIST_TTL=1h`
- `types/auth.ts:35` — `OAuthProfile { provider, providerId, email, name, avatar }` — defined but unused
- `OAuthProviderBase.ts:1` — abstract class with `authorize()`, `callback()`, `getProfile()` — never implemented, may be stale
- `routes/auth.ts:85` — `POST /auth/reset-password` generates 6-digit numeric code (potential security issue)
- `rbac.ts:20` — permissions: user (read own), admin (read/write all users), super_admin (everything)
- `User.ts:15` — `oauthProvider String?` and `oauthId String?` fields exist in schema but nullable and unused

**The planner needs to know:**
1. Where does OAuth2 plug in? (which files need changes)
2. What already exists vs. what needs building? (existing scaffolding)
3. What patterns must the OAuth flow follow? (session + token lifecycle)
4. What risks exist? (stale OAuth code, security issues)

**Produce your scout report.** The planner's context window is shared with your report,
codebase reads, and the plan — keep your output focused and compressed.
