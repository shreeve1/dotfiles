# Scenario: CI Tests Failing After Merge

You are the investigator for the full development team. The dispatcher has sent you this task:

---

"The deployment pipeline has been failing at the test stage for 2 days. Three tests started failing after last Thursday's merge of PR #247 (feat/order-history). The tests pass locally on developer machines. We need a root cause diagnosis before we can plan a fix."

---

## Simulated Evidence

### CI Log Output (relevant section)
```
FAIL src/tests/orders.test.ts
  ● Order Service › getOrderHistory › should return paginated results

    Expected: 10
    Received: 0

    at Object.<anonymous> (src/tests/orders.test.ts:145:29)

  ● Order Service › getOrderHistory › should filter by date range

    TypeError: Cannot read properties of undefined (reading 'createdAt')

    at filterByDateRange (src/services/order.service.ts:89:42)
    at Object.<anonymous> (src/tests/orders.test.ts:167:20)

  ● Order Service › getOrderHistory › should respect user permissions

    Expected: 403
    Received: 200

    at Object.<anonymous> (src/tests/orders.test.ts:198:35)

Test Suites: 1 failed, 12 passed, 13 total
Tests:       3 failed, 87 passed, 90 total
```

### PR #247 Changes (feat/order-history)
Files changed:
- `src/services/order.service.ts` — Added `getOrderHistory()` method, modified `findOrders()` query
- `src/models/order.model.ts` — Added `history` association, modified default scope
- `src/routes/orders.ts` — Added GET /api/orders/history endpoint
- `src/tests/orders.test.ts` — Added new tests for order history (these pass), did NOT modify existing tests

### Local vs CI Environment
- Local: Node 18.19.0, PostgreSQL 15.4, test database seeded fresh per run
- CI: Node 18.17.1, PostgreSQL 15.2, test database NOT reseeded between test suites (shared state)

Produce a root cause diagnosis following your standard approach. Stop at diagnosis — do not propose a fix.
