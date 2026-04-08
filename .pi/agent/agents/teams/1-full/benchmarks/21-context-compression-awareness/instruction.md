# Benchmark: Context Compression Awareness

## Scenario

You are the scout agent. You've been asked to explore the notification system in a
large monorepo to help the planner add email digest support.

The codebase has these files (all in `src/notifications/`):

```
src/notifications/
  NotificationService.ts      # 400 lines — core orchestration, routes to providers
  EmailProvider.ts             # 200 lines — SMTP sending, template rendering
  SMSProvider.ts               # 150 lines — Twilio integration
  PushProvider.ts              # 180 lines — Firebase Cloud Messaging
  NotificationQueue.ts         # 300 lines — Bull queue, retry logic, dead letter
  TemplateEngine.ts            # 250 lines — Handlebars templates, locale support
  UserPreferences.ts           # 180 lines — per-user channel preferences, quiet hours
  DeliveryTracker.ts           # 220 lines — delivery status, bounce tracking
  RetryHandler.ts              # 150 lines — exponential backoff, max attempts
  WebhookDispatcher.ts         # 200 lines — external webhook delivery
  types.ts                     # 80 lines — shared types
  __tests__/
    NotificationService.test.ts  # 350 lines
    EmailProvider.test.ts        # 200 lines
    NotificationQueue.test.ts    # 250 lines
    TemplateEngine.test.ts       # 180 lines
    DeliveryTracker.test.ts      # 150 lines
```

Key code details you discover while reading:

- `NotificationService.ts:45` — `sendNotification(userId, template, channel?)` method.
  If no channel specified, reads `UserPreferences` to determine channels.
- `NotificationService.ts:78` — calls `TemplateEngine.render(template, locale, data)`
  then routes to the appropriate provider.
- `NotificationService.ts:120` — `sendBulk(userIds, template)` iterates and queues
  individually. No batch/digest concept exists.
- `EmailProvider.ts:30` — `send(to, subject, htmlBody)`. Uses nodemailer with SMTP config
  from env vars. No digest aggregation.
- `NotificationQueue.ts:15` — Bull queue named `notifications`. Each job is one notification.
  Jobs have `{ userId, template, channel, data }` shape.
- `NotificationQueue.ts:88` — Dead letter queue after 3 retries.
- `TemplateEngine.ts:22` — Templates loaded from `src/notifications/templates/*.hbs`.
  Supports `{{#each items}}` blocks — could be used for digest content.
- `UserPreferences.ts:40` — `getPreferences(userId)` returns `{ channels: string[],
  quietHoursStart: number, quietHoursEnd: number, digestFrequency?: string }`.
  Note: `digestFrequency` field exists but is never read by any code.
- `DeliveryTracker.ts:55` — Tracks per-notification delivery status. No aggregation view.

The planner will use your report to design the email digest feature. The planner has a
~100K token context window shared with your report, the codebase reads, and the plan itself.

**Task:** Produce your scout report for the planner.
