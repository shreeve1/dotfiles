# Issue Tracker Examples

Practical examples for tracking issues across conversations.

## Creating Issues

### Example 1: Create from Problem Statement

**User:** "Track the auth bug - users can't log in with API tokens"

**Action:**
1. Generate slug: `auth-bug.md`
2. Check for existing issue
3. Create new file:
```markdown
---
title: "auth bug"
status: "open"
created: "2025-01-02"
last_updated: "2025-01-02"
tags: []
---

# Issue: auth bug

## Original Problem
Users cannot log in with API tokens after deployment.

## Work Performed

## Status
New issue, initial state

## Resolution
```

**Output:** "Created issue: `./issuetracker/auth-bug.md`"

### Example 2: Create with Suggested Title

**User:** "I'm having problems with the database migration"

**Action:**
1. Extract title: "database migration"
2. Generate slug: `database-migration.md`
3. Prompt for problem description
4. Create issue file

**Output:** "Created issue: `./issuetracker/database-migration.md`"

## Updating Issues

### Example 3: Update Work Performed

**User:** "Update the auth bug - tried regenerating JWT keys but still failing"

**Action:**
1. Find `auth-bug.md`
2. Parse existing content
3. Append work entry:
```markdown
### 2025-01-02 14:30
- Attempted fix: Regenerated JWT keys
- Result: Still failing, same error
- Error: "Invalid token signature"
```
4. Update `last_updated: "2025-01-02"`
5. Save file

**Output:** "Updated auth-bug.md with new work entry"

### Example 4: Update Status

**User:** "Mark the auth bug as investigating, I'm looking into it now"

**Action:**
1. Find `auth-bug.md`
2. Update frontmatter:
```yaml
status: "investigating"
last_updated: "2025-01-02"
```
3. Add work entry:
```markdown
### 2025-01-02 15:00
- Status changed to investigating
- Starting root cause analysis
```

**Output:** "Updated auth-bug.md status to investigating"

### Example 5: Update Original Problem

**User:** "Edit the auth bug - it's specifically affecting admin users only"

**Action:**
1. Find `auth-bug.md`
2. Update "Original Problem" section:
```markdown
## Original Problem
Admin users cannot log in with API tokens after deployment.
Regular users unaffected.
```
3. Update `last_updated`
4. Save file

**Output:** "Updated auth-bug.md problem description"

## Viewing Issues

### Example 6: View Single Issue

**User:** "Show the auth bug issue"

**Action:**
1. Find `auth-bug.md`
2. Parse and display:
```
Issue: auth bug
Status: investigating
Created: 2025-01-01
Last Updated: 2025-01-02

Original Problem:
Admin users cannot log in with API tokens.

Recent Work:
- 2025-01-02 14:30: Regenerated JWT keys - still failing
- 2025-01-02 15:00: Status changed to investigating

What would you like to do?
1. View full details
2. Update work performed
3. Update status
4. Edit problem
5. Close issue
```

### Example 7: List All Issues

**User:** "Show all my issues"

**Action:**
1. Scan `./issuetracker/` directory
2. Parse all `.md` files
3. Display table:
```
Issues (4 total):

Filename              | Title                | Status        | Last Updated
----------------------|----------------------|---------------|-------------
auth-bug.md          | auth bug             | investigating | 2025-01-02
database-migration.md | database migration   | open          | 2025-01-02
dns-issue.md         | DNS resolution       | resolved      | 2024-12-30
api-timeout.md       | API timeout          | closed        | 2024-12-28

Open issues: 2
Investigating: 1
Resolved: 1
Closed: 1
```

## Closing Issues

### Example 8: Close with Resolution

**User:** "Close the auth bug issue"

**Action:**
1. Prompt: "What was the resolution?"
2. User: "Fixed by updating JWT secret in environment config"
3. Update file:
```yaml
---
status: "closed"
last_updated: "2025-01-02"
---
```
4. Add work entry:
```markdown
### 2025-01-02 16:00
- Status changed to closed
- Resolution: Fixed by updating JWT secret in environment config
- Verified: Admin users can now log in successfully
```
5. Fill Resolution section:
```markdown
## Resolution
Fixed by updating JWT secret in environment config (.env file).
The secret was not being loaded correctly, causing signature validation to fail.
After updating and restarting the service, admin authentication works correctly.
Verified at: 2025-01-02 16:00
```

**Output:** "Closed auth-bug.md with resolution documented"

### Example 9: Quick Close (Skip Resolution)

**User:** "Close the dns-issue as resolved"

**Action:**
1. Update status to `resolved`
2. Add work entry noting status change
3. Leave Resolution section blank (to be filled when fully closed)

**Output:** "Updated dns-issue.md status to resolved"

## Complex Scenarios

### Example 10: Multiple Matches Found

**User:** "Update the api issue"

**Action:**
1. Search finds 3 matches:
   - `api-auth-issue.md` (title: "API auth issue")
   - `api-timeout.md` (title: "API timeout")
   - `api-rate-limit.md` (title: "API rate limiting")

2. Prompt user:
```
Found multiple matching issues:

1. api-auth-issue.md - "API auth issue" (investigating)
2. api-timeout.md - "API timeout" (open)
3. api-rate-limit.md - "API rate limiting" (resolved)

Which issue? (1-3, or create new)
```

3. User selects: "1"
4. Proceed with updating `api-auth-issue.md`

### Example 11: Issue Not Found

**User:** "Show the performance issue"

**Action:**
1. No match found
2. Prompt:
```
No existing issue found for "performance issue".

Create new issue?
- Title: "performance issue"
- File: ./issuetracker/performance-issue.md
- Status: open

Proceed? (y/n)
```

3. User: "y"
4. Create new issue with prompt for problem description

### Example 12: Reopen Closed Issue

**User:** "Reopen the dns-issue, it's happening again"

**Action:**
1. Find `dns-issue.md` (status: `closed`)
2. Validate transition: `closed` → `open` (requires special handling)
3. Prompt:
```
Issue is currently closed. Reopen as a new instance?

This will:
- Change status to: investigating
- Add work entry noting recurrence
- Preserve original resolution for reference

Proceed? (y/n)
```

4. User: "y"
5. Update status and add recurrence note

## Integration Examples

### Example 13: Track During Development

**Session 1:**
```
User: "Track the authentication bug"
→ Creates: auth-bug.md
→ Problem: Users can't log in
```

**Session 2 (later):**
```
User: "Update auth bug - investigated JWT tokens"
→ Updates: auth-bug.md
→ Work: Investigated JWT token validation
```

**Session 3 (next day):**
```
User: "What's the status of the auth bug?"
→ Shows: Current status and recent work
User: "Update it - fixed by updating secret"
→ Updates: auth-bug.md
→ Status: resolved
```

**Session 4:**
```
User: "Close the auth bug"
→ Prompts for resolution summary
→ Updates: auth-bug.md
→ Status: closed
```

### Example 14: Multiple Related Issues

**User:** "Track the API performance issues"

**Action:**
1. Creates: `api-performance-issue.md`
2. User realizes multiple distinct problems
3. Advice: Split into separate issues
   - `api-timeout.md` - Timeouts on high load
   - `api-rate-limit.md` - Rate limiting errors
   - `api-memory.md` - Memory leaks
4. Create focused issues for better tracking

## Quick Reference

| Action | Example Phrases |
|--------|----------------|
| Create | "Track the X", "Create issue for X", "New issue: X" |
| Update work | "Update X - did Y", "Add work to X", "X progress" |
| Update status | "Mark X as Y", "X is Y", "Change X status to Y" |
| View | "Show X", "Status of X", "What about X" |
| List | "Show all issues", "List issues", "My issues" |
| Close | "Close X", "Resolve X", "X is fixed" |
