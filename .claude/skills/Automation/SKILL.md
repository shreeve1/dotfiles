# Automation Skill

Manage scheduled tasks, webhook endpoints, and notification delivery for PAI.

## Sections

- **Cron Management** — add, list, update, and delete cron jobs
- **Webhook Management** — register webhook routes with named transform modules
- **Notification** — send alerts via Telegram

---

## Cron Management

### Registry

All cron jobs are defined in `References/cron-jobs.json`. Each job entry:

```json
{
  "id": "unique-id",
  "name": "descriptive-name",
  "schedule": "cron expression (e.g. 0 */4 * * *)",
  "type": "shell|llm|skill",
  "command": "path to script or command to run",
  "enabled": true,
  "staggerSeconds": 300,
  "lockName": "unique-lock-name",
  "logFile": "name.log",
  "timezone": "America/Los_Angeles"
}
```

### Adding a Cron Job

1. Add the job entry to `References/cron-jobs.json` in the `jobs` array
2. Run the cron install workflow (below) to regenerate the crontab

### Removing a Cron Job

1. Remove the job entry from `References/cron-jobs.json`
2. Run the cron install workflow to regenerate the crontab

### Cron Install Workflow (Idempotent)

The crontab is managed via a sentinel block pattern:

```
# >>> PAI AUTOMATION - DO NOT EDIT BETWEEN THESE MARKERS <<<
<generated entries>
# <<< PAI AUTOMATION END <<<
```

To install/update cron entries:

1. Read `References/cron-jobs.json` to get all enabled jobs
2. Resolve the `claude` binary path via `which claude` (use absolute path in commands)
3. Generate crontab entries for each job:
   - **Shell jobs**: `~/.claude/skills/Automation/Tools/cron-wrapper.sh --stagger N --lock NAME --log ~/.claude/logs/NAME.log -- ~/.claude/scripts/SCRIPT.sh`
   - **LLM/Skill jobs**: Create a runner script at `~/.claude/scripts/run-JOBNAME.sh` that handles `cd`, env vars, and `exec claude -p "..."`. Then: `~/.claude/skills/Automation/Tools/cron-wrapper.sh --stagger N --lock NAME --log ~/.claude/logs/NAME.log -- ~/.claude/scripts/run-JOBNAME.sh`
   
   **Why runner scripts?** Inline `cd /dir && claude -p "..."` breaks in crontab because `&&` is interpreted by cron's shell, not the wrapper. Runner scripts encapsulate working directory, environment, and claude invocation in one file.
4. Extract any existing PAI sentinel block from `crontab -l`
5. Replace the block (or append if none exists) with the new entries
6. Install the updated crontab

This is **idempotent** — re-running never duplicates entries.

### Listing Jobs

Read `References/cron-jobs.json` and format the output. Include: name, schedule, type, enabled status, last run status from `execution-log.jsonl`.

---

## Webhook Management

### Registry

Webhook routes are defined in `References/webhook-routes.json`. Each route:

```json
{
  "id": "unique-id",
  "path": "/webhook-path",
  "authToken": "bearer-token",
  "transformModule": "module-name",
  "notifyChannel": "telegram",
  "notifyChatId": "chat-id",
  "enabled": true
}
```

Routes reference a **named transform module** in `Tools/transforms/<transformModule>.ts`. The registry is data-only — all logic lives in transform files.

### Adding a Webhook Route

1. Create a transform module in `Tools/transforms/<name>.ts` that exports `classify(payload)`
2. Add the route entry to `References/webhook-routes.json`
3. Restart the webhook server

### Webhook Server

The webhook server (`Tools/webhook-server.ts`) is a Bun HTTP server that:
- Reads routes from `References/webhook-routes.json`
- Loads named transform modules from `Tools/transforms/`
- Validates auth tokens per route
- Caps request bodies at 262144 bytes
- Rate-limits per source IP (60 req/min)
- Treats all webhook payloads as **untrusted input** — field values are JSON-serialized in prompts with a guard prefix
- Triggers `claude -p` for investigation and sends Telegram notifications

### Running the Server

The server runs as a LaunchAgent (`~/Library/LaunchAgents/com.pai.uptime-webhook.plist`) and starts automatically on login.

---

## Notification

### telegram-send.sh

`Tools/telegram-send.sh` is the standard delivery path for all automated notifications.

```bash
# Basic usage
telegram-send.sh "Alert message"

# With Markdown formatting
telegram-send.sh --parse-mode Markdown "*Bold alert*"

# With custom chat ID
telegram-send.sh --chat-id 123456 "Message"

# Silent mode (no stdout)
telegram-send.sh --silent "Message"
```

Credentials are read from `~/.claude/secrets/telegram-env.sh` — the single canonical source.

### Cron Failure Alerts

The `cron-wrapper.sh` automatically sends a Telegram alert when a job fails, including the job name, exit code, and last log lines.

### Webhook Alerts

Incoming webhook alerts trigger `claude -p` for investigation, then send findings via `telegram-send.sh`.

---

## Tools Reference

| Tool | Purpose |
|------|---------|
| `Tools/cron-wrapper.sh` | Shared cron execution wrapper (PATH, stagger, lockfiles, logging, alerting) |
| `Tools/telegram-send.sh` | Telegram Bot API helper for sending notifications |
| `Tools/webhook-server.ts` | Bun HTTP server for webhook ingestion |
| `Tools/transforms/` | Named transform modules for payload classification |
| `References/cron-jobs.json` | Job registry (source of truth) |
| `References/webhook-routes.json` | Webhook route registry (data-only) |
| `References/critical-hosts.json` | Critical host classification for alerts |
| `References/execution-log.jsonl` | Append-only execution journal |

---

## Cron Health Check

To check the health of all scheduled jobs:

1. Read `References/cron-jobs.json` for the job list
2. Read `References/execution-log.jsonl` (last 100 lines)
3. For each enabled job, report:
   - **Last run**: timestamp and status from the most recent execution-log entry matching the job's `lockName`
   - **Next expected**: calculate from the cron `schedule` expression
   - **Recent failures**: count of failures in the last 24 hours
4. Flag any job that hasn't run within 2x its expected interval as **STALE**

Output format:
```
Job                        | Last Run            | Status  | Failures (24h)
---------------------------|---------------------|---------|---------------
email-organizer            | 2026-04-17 15:00    | success | 0
zeroday-monitor            | 2026-04-17 15:00    | failure | 3
```

---

## Routing Logic

- "Add a cron job" / "schedule a task" → Cron Management workflow
- "Remove a cron job" / "delete a scheduled task" → Cron Management workflow
- "List cron jobs" / "show scheduled tasks" → Cron Management listing
- "Add a webhook" / "register a webhook route" → Webhook Management workflow
- "Send a notification" / "send a Telegram alert" → Notification workflow
- "Check job history" / "show execution log" → Read `execution-log.jsonl`
- "Check cron health" / "are my jobs running?" → Cron Health Check workflow
