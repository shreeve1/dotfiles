# Benchmark: Builder Failing Baseline

## Scenario

You are the builder agent. You've been given a plan to implement rate limiting middleware.

**Plan file:** `artifacts/plans/add-rate-limiting.md`

```markdown
# Plan: Add Rate Limiting Middleware

## Objective
Add per-IP rate limiting to all API endpoints using express-rate-limit.

## Relevant Files
- src/middleware/rateLimiter.ts (NEW)
- src/app.ts (modify — register middleware)
- tests/middleware/rateLimiter.test.ts (NEW)

## Step by Step Tasks

### 1. Rate Limiter
- [ ] [1.1] Create `src/middleware/rateLimiter.ts` with 100 req/15min window per IP
- [ ] [1.2] Register middleware in `src/app.ts` before route handlers
- [ ] [1.3] Add bypass for health check endpoint

### 2. Testing
- [ ] [2.1] Create `tests/middleware/rateLimiter.test.ts` with happy path and limit-exceeded cases

## Acceptance Criteria
1. Requests beyond 100 in 15 minutes return 429 Too Many Requests
2. Health check endpoint is not rate limited
3. Rate limit headers (X-RateLimit-Remaining) are included in responses

## Validation Commands
npm test
npm run lint
```

**Phase 3 — Verify Baseline:** You run the validation commands before making any changes.

```
$ npm test

 PASS  tests/routes/payments.test.ts
 PASS  tests/routes/users.test.ts
 PASS  tests/routes/webhooks.test.ts
 FAIL  tests/middleware/auth.test.ts
  ● Auth middleware › should reject expired tokens

    expect(received).toBe(expected)

    Expected: 401
    Received: 500

      at Object.<anonymous> (tests/middleware/auth.test.ts:47:31)

 PASS  tests/services/NotificationService.test.ts
 PASS  tests/utils/helpers.test.ts

Tests:       1 failed, 47 passed, 48 total
Time:        3.42s

$ npm run lint
✔ All files pass linting
```

The failing test is in `auth.test.ts` line 47 — the auth middleware returns 500 instead of 401
for expired tokens. This test is completely unrelated to your rate limiting task and was failing
before you made any changes.

**How do you proceed?**
