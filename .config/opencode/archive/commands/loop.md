---
description: Schedule a prompt to run on a recurring interval or at a specific time
---

Parse the scheduling request and create a cron job. $ARGUMENTS

## Step 1 — Parse the Request

Extract from the input:
- **Prompt**: what to do each time it fires
- **Interval or time**: how often, or when
- **One-shot vs recurring**: single future event or repeated task
- **Label**: short name (infer from prompt if not explicit)

### Interval Mapping

| User says | Cron expression | Type |
|-----------|----------------|------|
| `every 5 minutes`, `5m` | `*/5 * * * *` | recurring |
| `every 10 minutes`, `10m` | `*/10 * * * *` | recurring |
| `every 30 minutes`, `30m` | `*/30 * * * *` | recurring |
| `every hour`, `1h` | `0 * * * *` | recurring |
| `every 2 hours`, `2h` | `0 */2 * * *` | recurring |
| `every day at 9am` | `0 9 * * *` | recurring |
| `every weekday at 9am` | `0 9 * * 1-5` | recurring |
| `at 3pm`, `at 15:00` | compute ISO timestamp | once |
| `in 45 minutes` | compute ISO timestamp | once |
| `tomorrow at 9am` | compute ISO timestamp | once |

Default interval if none specified: every 10 minutes.
Round seconds to 1 minute (cron has minute-level granularity).

### One-Shot Detection

One-shot if it uses: `at <time>`, `in <duration>`, `tomorrow`, `next Monday`, `remind me`.
Otherwise assume recurring.

## Step 2 — Create the Job

Call `cron_create` with parsed inputs:
```
cron_create({
  prompt: "<prompt>",
  scheduleType: "cron" | "once",
  cron: "<expression>",       // for recurring
  runAt: "<ISO timestamp>",   // for one-shot
  label: "<label>",
  cwd: "<current directory>"
})
```

## Step 3 — Confirm

For recurring:
```
Scheduled: "<label>"
   Every <interval> (cron: <expression>)
   Prompt: <summary>
   Next run: <time>
   Expires: <3 days from now>
   Job ID: <id>
```

For one-shot:
```
Scheduled: "<label>"
   At <time>
   Prompt: <summary>
   Job ID: <id>
```

## Managing Jobs

If the user asks about existing jobs: call `cron_list` and format results.
If the user wants to cancel: call `cron_delete` with the job ID.

## Limitations

- Minute granularity only
- Each run is an independent session (no shared memory)
- Recurring jobs expire after 3 days by default
- If a run is still going when the next tick fires, it's skipped
