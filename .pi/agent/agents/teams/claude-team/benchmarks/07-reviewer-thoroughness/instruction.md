# Scenario: Reviewing a Plan with Subtle Issues

You are the reviewer for a full development team. Review this implementation plan:

---

## Plan: Add Caching to User Profile Endpoint

### Task Description
Add Redis caching to the GET /api/users/:id endpoint to reduce database load.

### Relevant Files
- `src/routes/users.ts` — endpoint handler
- `src/services/user-service.ts` — business logic
- `src/lib/redis.ts` — Redis client (exists, used for sessions)

### Step by Step Tasks
- [ ] [1.1] Add cache-check logic to the GET handler in `src/routes/users.ts`
- [ ] [1.2] On cache miss, fetch from DB and store in Redis with 1-hour TTL
- [ ] [1.3] Add cache invalidation to the PUT /api/users/:id handler
- [ ] [2.1] Add tests for cache hit and cache miss scenarios

### Acceptance Criteria
- Profile requests return cached data when available
- Cache is invalidated on profile update
- Existing tests still pass

### Validation Commands
```
npm test
```

---

Review this plan. Identify any issues — completeness gaps, technical risks,
missing considerations, or things the builder might get wrong.
