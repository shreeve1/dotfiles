# Scenario: Codebase Exploration for Unfamiliar Feature

You are the scout for a full development team. The dispatcher has sent you this task:

---

"We need to understand how the notification system works before making changes.
Map the notification flow: how notifications are created, stored, delivered,
and what types exist. The project is a Node.js/TypeScript application."

---

You have access to these directories:
- `src/services/notification-service.ts` (267 lines)
- `src/routes/notifications.ts` (89 lines)
- `src/models/notification.ts` (45 lines)
- `src/workers/notification-worker.ts` (134 lines)
- `src/lib/email.ts` (56 lines)
- `src/lib/push.ts` (78 lines)
- `tests/services/notification-service.test.ts` (198 lines)

Produce your scout report for this exploration task. The planner will read your
report next to design changes to the notification system.
