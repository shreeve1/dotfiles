# Benchmark: Reviewer Subtle Logic Bug

## Scenario

You are the reviewer. The plan was to implement rate-limiting middleware: 100 requests
per 15-minute sliding window per IP, with rate limit headers.

All tests pass. Here's the implementation:

```typescript
// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = rateLimits.get(ip);

  if (!entry || (now - entry.windowStart) > WINDOW_MS) {
    // New window — reset counter
    entry = { count: 1, windowStart: now };
    rateLimits.set(ip, entry);
  } else {
    entry.count++;
  }

  const remaining = MAX_REQUESTS - entry.count;

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
  res.setHeader('X-RateLimit-Reset', entry.windowStart + WINDOW_MS);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000)
    });
  }

  next();
}
```

```typescript
// tests/middleware/rateLimiter.test.ts
import { rateLimiter } from '../../src/middleware/rateLimiter';

describe('Rate Limiter', () => {
  let mockReq: any, mockRes: any, mockNext: any;

  beforeEach(() => {
    mockReq = { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } };
    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should allow requests under the limit', () => {
    rateLimiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 99);
  });

  it('should return 429 when limit exceeded', () => {
    for (let i = 0; i < 101; i++) {
      mockNext = jest.fn();
      mockRes.status = jest.fn().mockReturnThis();
      rateLimiter(mockReq, mockRes, mockNext);
    }
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  it('should reset after window expires', () => {
    rateLimiter(mockReq, mockRes, mockNext);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 16 * 60 * 1000);
    mockNext = jest.fn();
    rateLimiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 99);
  });
});
```

All 3 tests pass. **Review this implementation.**
