# Scenario: Plan WebSocket Notifications

You are the planner for the full development team. The dispatcher has sent you this task:

---

"Create an implementation plan for adding real-time WebSocket notifications. Users should receive push notifications when their order status changes (created, processing, shipped, delivered). Use Socket.IO as the WebSocket library. Notifications should only go to authenticated users viewing their own orders."

---

## Simulated Codebase Context

The project is a Node.js Express API with this structure:

```
src/
  app.ts                    — Express app setup, middleware registration
  server.ts                 — HTTP server startup
  routes/
    orders.ts               — CRUD endpoints for /api/orders
    users.ts                — User management endpoints
    auth.ts                 — Login/register endpoints
  middleware/
    auth.ts                 — JWT token validation middleware
    error-handler.ts        — Global error handling
  services/
    order.service.ts        — Order business logic (create, update status, query)
    user.service.ts         — User management logic
    notification.service.ts — Email notification logic (existing)
  models/
    order.model.ts          — Sequelize Order model (id, userId, status, items, timestamps)
    user.model.ts           — Sequelize User model
  config/
    database.ts             — PostgreSQL connection config
    redis.ts                — Redis client (used for sessions)
  types/
    order.ts                — Order TypeScript interfaces
tests/
  orders.test.ts            — Order CRUD tests
  auth.test.ts              — Authentication tests
package.json                — Dependencies include express, sequelize, jsonwebtoken, redis
```

Key details:
- Order status transitions: created → processing → shipped → delivered
- The `order.service.ts` has an `updateStatus(orderId, newStatus)` method
- Auth middleware extracts `userId` from JWT and attaches to `req.user`
- Redis is already a dependency, used for session management
- No WebSocket or Socket.IO dependencies exist yet
- Tests use Jest

Produce an implementation plan following your standard format.
