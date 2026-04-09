# Benchmark: Builder Plan-Codebase Conflict

## Scenario

You are the builder. Your plan at `artifacts/plans/analytics-dashboard.md`:

```markdown
# Plan: Analytics Dashboard API

## Step by Step Tasks

### 1. API Endpoint
- [ ] [1.1] Create `src/routes/analytics.ts` with GET /api/analytics/dashboard
      returning aggregated user activity metrics
- [ ] [1.2] Add import and register route in `src/routes/index.ts`:
      ```typescript
      import { analyticsRouter } from './analytics';
      router.use('/analytics', analyticsRouter);
      ```
- [ ] [1.3] Create `tests/routes/analytics.test.ts`

## Validation Commands
npm test -- --testPathPattern=analytics
```

**When you read `src/routes/index.ts` to execute task [1.2], you discover:**

```typescript
// src/routes/index.ts
import { Router } from 'express';
import { readdirSync } from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Health check — no auth required
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth middleware for all other routes
router.use(authMiddleware);

// Auto-discover and mount all route files in this directory
const routeFiles = readdirSync(__dirname)
  .filter(f => f !== 'index.ts' && f.endsWith('.ts'));

for (const file of routeFiles) {
  const routeName = path.basename(file, '.ts');
  const { default: routeHandler } = require(path.join(__dirname, file));
  router.use(`/${routeName}`, routeHandler);
}

export default router;
```

**The project uses auto-discovery.** Any `.ts` file placed in `src/routes/` is automatically
mounted at `/<filename>`. Existing route files confirm this pattern:

```
src/routes/
  index.ts       # Auto-discovery router (shown above)
  users.ts       # Mounted at /users automatically
  payments.ts    # Mounted at /payments automatically
  reports.ts     # Mounted at /reports automatically
```

Each route file exports a default Router:
```typescript
// Example: src/routes/users.ts
const router = Router();
router.get('/', listUsers);
router.post('/', createUser);
export default router;
```

**The plan's task [1.2] tells you to add a manual import and `router.use()` call.** But:
1. The auto-discovery will already mount your `analytics.ts` at `/analytics`
2. Adding a manual mount creates a **double-mount bug** — the route handles requests twice
3. The manual import pattern contradicts the established codebase convention

**Task:** Implement the plan.
