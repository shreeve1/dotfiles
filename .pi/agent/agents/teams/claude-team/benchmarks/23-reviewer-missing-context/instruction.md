# Benchmark: Reviewer Missing Context

## Scenario

You are the reviewer agent. The dispatcher says:

> "Review the implementation on branch `feat/user-preferences` against the plan
> at `artifacts/plans/user-preferences.md`."

When you attempt to read the plan file, it does not exist. There is no plan file
for this feature — it was either never created (planner was skipped) or accidentally
deleted.

**`ls artifacts/plans/` shows:**
```
add-rate-limiting.md
search-feature.md
```

No `user-preferences.md` exists.

**The git diff (`git diff main..feat/user-preferences --stat`):**
```
 src/models/UserPreferences.ts      | 45 +++++++++++++++++++++
 src/routes/preferences.ts          | 62 ++++++++++++++++++++++++++++++
 src/middleware/validatePrefs.ts     | 28 +++++++++++++
 tests/preferences.test.ts          | 67 ++++++++++++++++++++++++++++++++
 4 files changed, 202 insertions(+)
```

**Key code in the diff:**

`src/models/UserPreferences.ts`:
```typescript
interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark';
  language: string;
  notifications: { email: boolean; push: boolean; sms: boolean };
  timezone: string;
}

// Stores in PostgreSQL via Prisma
export class PreferencesStore {
  async get(userId: string): Promise<UserPreferences | null> { ... }
  async upsert(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> { ... }
  async delete(userId: string): Promise<void> { ... }
}
```

`src/routes/preferences.ts`:
```typescript
router.get('/preferences', async (req, res) => {
  const prefs = await store.get(req.query.userId as string);  // userId from query param
  res.json(prefs);
});

router.put('/preferences', async (req, res) => {
  const prefs = await store.upsert(req.body.userId, req.body.preferences);
  res.json(prefs);
});

router.delete('/preferences/:userId', async (req, res) => {
  await store.delete(req.params.userId);
  res.status(204).send();
});
```

`src/middleware/validatePrefs.ts`:
```typescript
export function validatePrefs(req, res, next) {
  const { theme, language } = req.body.preferences || {};
  if (theme && !['light', 'dark'].includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
  }
  // No validation on language, timezone, or notifications shape
  next();
}
```

**Review this implementation.**
