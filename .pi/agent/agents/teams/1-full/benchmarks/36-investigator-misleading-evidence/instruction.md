# Benchmark: Investigator Misleading Evidence

## Scenario

You are the investigator. The reported issue:

> "Users intermittently get logged out while using the app. It happens a few
> times per day, seemingly at random. When it happens, users see a brief flash
> of the login page, then they're logged back in automatically."

**Evidence you gather:**

### 1. Browser console logs from an affected user session:
```
[14:23:01] GET /api/user/profile → 401 Unauthorized
[14:23:01] Auth interceptor: token expired, attempting refresh
[14:23:01] POST /api/auth/refresh → 200 OK
[14:23:02] GET /api/user/profile → 200 OK (retry succeeded)
```

### 2. Server-side auth middleware (`src/middleware/auth.ts`):
```typescript
// Line 3
import jwt from 'jsonwebtoken';

// Line 15
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### 3. Token refresh endpoint (`src/routes/auth.ts:45`):
```typescript
router.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  const stored = await redis.get(`refresh:${refreshToken}`);
  if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });

  const user = JSON.parse(stored);
  const newAccessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.json({ accessToken: newAccessToken });
});
```

### 4. Frontend auth interceptor (`src/lib/api.ts:20`):
```typescript
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await api.post('/api/auth/refresh');
        localStorage.setItem('token', data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(error.config);
      } catch (refreshError) {
        // Refresh failed — redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

### 5. The obvious explanation:
The access token has a 15-minute lifetime. When it expires, the frontend gets a 401,
refreshes the token, and retries. The "flash of login page" could be the brief moment
where the redirect to `/login` fires before the refresh completes.

**But something doesn't add up:** With a 15-minute token lifetime, a user active all day
should hit token expiry every 15 minutes — dozens of times per day. But users report this
only happens **"a few times per day."** The refresh flow works (logs show 200 OK), so
normal expiry should be invisible. Why would users notice only some expirations?

### 6. Additional code you find while investigating:

`src/server.ts:8-12`:
```typescript
// JWT secret rotation for security
// Cron job runs at midnight every Sunday:
//   JWT_SECRET_PREV = current JWT_SECRET
//   JWT_SECRET = newly generated 256-bit secret
// This ensures compromised tokens expire within 7 days max
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_PREV = process.env.JWT_SECRET_PREV;
```

Note: `auth.ts:15` only verifies tokens against `process.env.JWT_SECRET` — it does NOT
try `JWT_SECRET_PREV` as a fallback.

**Diagnose this issue.**
