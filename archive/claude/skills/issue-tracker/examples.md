# Issue Tracker Examples

## Create

**User:** "Track the auth bug — users can't log in with API tokens"

Create `./issuetracker/auth-bug.md`:

```markdown
---
title: auth bug
status: open
created: 2025-01-02
last_updated: 2025-01-02
tags: []
---

# Issue: auth bug

## Original Problem
Users cannot log in with API tokens after deployment.

## Work Performed

## Resolution
```

Reply: "Created `./issuetracker/auth-bug.md`."

## Add work

**User:** "Update the auth bug — regenerated JWT keys but still failing"

Find `auth-bug.md`, append under `## Work Performed`, bump `last_updated`:

```markdown
### 2025-01-02 14:30
- Regenerated JWT keys
- Still failing: "Invalid token signature"
```

## Close

**User:** "Close the auth bug"

Ask for the resolution, then set `status: closed`, bump `last_updated`, and fill
the section:

```markdown
## Resolution
JWT secret wasn't loading from .env, so signature validation failed. Updated the
secret and restarted the service; admin login works. Verified 2025-01-02.
```

## Ambiguous match

**User:** "Update the api issue"

If several files match, list them and ask:

```
Found a few matches:
1. api-auth-issue.md   — API auth issue (investigating)
2. api-timeout.md      — API timeout (open)
3. api-rate-limit.md   — API rate limiting (resolved)

Which one? (or "new" to create)
```
