---
name: npm-audit-cron
description: Installs a permanent system cron job that runs npm audit every morning at 7am PST across all npm projects in the home directory, logging results to CWD/artifacts/audit.log. Use when the user wants to automate vulnerability scanning, set up a recurring npm audit, schedule daily security checks, or ensure ongoing dependency security without relying on short-lived loop jobs.
---

# npm-audit-cron

Sets up a **permanent system cron job** (via `crontab`) that scans all npm projects under `~` every morning at 7am PST and logs vulnerability results to `artifacts/audit.log` in the directory where the skill is invoked. Unlike the `loop` skill, this persists indefinitely — it survives session restarts and has no expiry.

Use this skill when the user wants ongoing, automated vulnerability monitoring. Do not use it for one-off audits — for that, just run `npm audit` directly.

---

## Phase 1 — Confirm Setup Details

Before installing:

1. Use `bash` to detect the current working directory — this becomes the log output location (`CWD/artifacts/audit.log`)
2. Show the user what will be installed:
   - **Cron schedule**: `0 15 * * *` (7am PST / 8am PDT — note: not DST-adjusted)
   - **Script**: `~/.config/opencode/skills/npm-audit-cron/scripts/run-audit.sh`
   - **Log file**: `<CWD>/artifacts/audit.log`
   - **Scan scope**: All npm projects under `~/` with a lockfile (excluding `node_modules`, `.git`, `Library`, `.cache`)
3. Use `mcp_question` to ask the user to confirm before proceeding:
   - Question: "Ready to install the npm-audit-cron job with these settings?"
   - Options: "Install now" / "Cancel"
   - If the user cancels, stop and do nothing.

---

## Phase 2 — Check for Existing Cron Job

Use `bash` to check if a job already exists:

```bash
crontab -l 2>/dev/null | grep "npm-audit-cron"
```

If a job already exists:
- Tell the user it's already installed and show the existing entry
- Ask if they want to update it (e.g. change log path) or leave it as-is
- If updating, remove the old entry before adding the new one:
  ```bash
  crontab -l 2>/dev/null | grep -v "npm-audit-cron" | crontab -
  ```

---

## Phase 3 — Install the Cron Job

Resolve `<CWD>` to the actual working directory before running any commands. Use `bash` to add the cron entry. The comment `# npm-audit-cron` is used as a stable identifier for future updates/removal.

```bash
CWD="$(pwd)"
LOG_FILE="$CWD/artifacts/audit.log"
SCRIPT="$HOME/.config/opencode/skills/npm-audit-cron/scripts/run-audit.sh"

(crontab -l 2>/dev/null; echo "0 15 * * * $SCRIPT \"$LOG_FILE\" # npm-audit-cron") | crontab -
```

Verify the entry was installed:
```bash
crontab -l | grep "npm-audit-cron"
```

If the entry is not present, report the error and do not claim success.

---

## Phase 4 — Create the Log Directory

Use `bash` to ensure the artifacts directory exists (use the resolved `CWD` from Phase 3):

```bash
mkdir -p "$CWD/artifacts"
```

---

## Phase 5 — Offer a Test Run

Ask the user if they'd like to run the audit now to verify everything works:

> "Want me to run the audit now so you can see what it will look like in the log?"

If yes, run:
```bash
"$HOME/.config/opencode/skills/npm-audit-cron/scripts/run-audit.sh" "$CWD/artifacts/audit.log"
```

Then show the user the tail of the log:
```bash
tail -50 "$CWD/artifacts/audit.log"
```

---

## Phase 6 — Removal Instructions

Tell the user how to remove the cron job in the future if needed:

```bash
crontab -l | grep -v "npm-audit-cron" | crontab -
```

---

## Report

After completing setup, output:

```
npm-audit-cron installed

Schedule:   Every day at 7am PST / 8am PDT (cron: 0 15 * * *)
Script:     ~/.config/opencode/skills/npm-audit-cron/scripts/run-audit.sh
Log file:   <resolved CWD>/artifacts/audit.log
Scan scope: All npm projects under ~/ with a lockfile (excluding node_modules, .git, Library, .cache)

To view logs:     tail -50 <resolved CWD>/artifacts/audit.log
To remove job:    crontab -l | grep -v "npm-audit-cron" | crontab -
To run manually:  ~/.config/opencode/skills/npm-audit-cron/scripts/run-audit.sh "<resolved CWD>/artifacts/audit.log"
```
