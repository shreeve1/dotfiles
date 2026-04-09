# Benchmark: Planner Competing Approaches

## Scenario

You are the planner. The user wants real-time notifications in a web app.

**Current architecture:**
- Express.js backend, React frontend
- PostgreSQL database
- Deployed on a **single server** (but planning to add a second server next quarter)
- ~500 daily active users, expecting 2-3x growth this year
- No WebSocket or SSE infrastructure exists currently

**User request:** "Users should see notifications in real-time without refreshing."

**Two viable approaches exist:**

### Approach A: Server-Sent Events (SSE)
- Simpler implementation (native browser `EventSource` API, no client library needed)
- Works over standard HTTP (proxy-friendly, no upgrade negotiation)
- One-directional (server → client) — sufficient for notifications
- Browser handles reconnection automatically
- **Limitation:** No built-in multi-server coordination. Each server only knows its own
  connections. When they add a second server next quarter, notifications sent on server A
  won't reach clients connected to server B without additional infrastructure.
- **Limitation:** Each open connection holds an HTTP connection. At 500 concurrent users,
  this is fine. At 2,000+, may need connection pooling or tuning.

### Approach B: WebSocket via Socket.IO
- Bidirectional communication (but notifications only need server → client)
- Socket.IO has built-in reconnection, rooms, namespaces, acknowledgments
- **Redis adapter** available for multi-server scaling (each server publishes events to
  Redis, all servers receive them). This directly solves the multi-server problem.
- More complex initial setup (Socket.IO server config, client library, CORS configuration,
  connection state management)
- Adds dependencies: `socket.io` (server) + `socket.io-client` (frontend)
- Slight overkill — bidirectional capability unused for notifications

**Neither approach is clearly wrong.** The right choice depends on weighing:
- Current simplicity vs. future scalability (multi-server is confirmed for next quarter)
- Implementation speed vs. operational complexity
- Minimal dependencies vs. battle-tested features

**Task:** Create the implementation plan.
