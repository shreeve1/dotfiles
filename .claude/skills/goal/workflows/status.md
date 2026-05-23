# Workflow: status

Report the state of one or all goals without doing any work.

## 1. List goals

```bash
ls .claude/state/goals/ 2>/dev/null | grep -v '^_archive$'
```

If empty → tell the user: no goals set. Offer to **set** one.

If the user explicitly asks for archived goals, also list `.claude/state/goals/_archive/`.

## 2. Read each goal

For each goal directory, read `GOAL.md` and the most recent **real** entries from `PROGRESS.md` (ignore the HTML comment template block at the top of the file). Read up to the last 3 entries that begin with `## <date>`. If `PROGRESS.md` contains only the title and the template comment, treat history as empty.

Also extract from `GOAL.md` whether the verifier is enabled (`Validation is read-only:` field — `yes` means enabled, `no` means disabled).

If `<goal_dir>/.verify-last.json` exists, read it for the most recent verifier verdict, model, and timestamp.

## 3. Render

For each goal:

```
─── <name> ───
Status:    <active | paused | blocked | done | abandoned>
Objective: <one-line>
Stopping:  <stopping condition, one-line>
Verifier:  <enabled | disabled (Validation is read-only: no)>
Last:      <last checkpoint name from PROGRESS, or "no progress yet">
Verified:  <last verified line>
Remains:   <last remains line>
Blocked:   <last blocked line or "no">
Last verify: <verdict from .verify-last.json> by <model> at <timestamp>, or "never">
Updated:   <last_updated date>
```

If `.verify-last.json` does not exist, render `Last verify: never`. If it exists, include the verdict and any `injection_flags` count if non-empty (`Last verify: done by anthropic/claude-sonnet-4-5 at 2025-05-14T20:30:00Z (injection flags: 0)`).

If only one goal exists, drop the header rule.

## 4. Suggest next action

Based on status:
- `active` → "Run **work** to continue."
- `paused` → "Run **resume** to reactivate (will flip status and run **work**)."
- `blocked` → surface the blocker from the last PROGRESS entry and ask the user to resolve it (or **clear** / **archive** if abandoning).
- `done` → offer to **archive** (preserves state under `_archive/`) or **clear** (deletes).
- `abandoned` → offer to **archive** or **clear**.
