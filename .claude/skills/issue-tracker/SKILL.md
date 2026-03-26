---
name: cc-issue-tracker
description: Track and manage issues across Claude conversations using Markdown files with frontmatter. Use this skill when the user asks to "track an issue", "create a new issue", "update the issue status", "show all issues", "add work performed to issue", or mentions tracking problems across conversations.
---

# Issue Tracker

Track and manage issues across Claude conversations using Markdown files with frontmatter. Maintain context about problems, work performed, and status between sessions.

## Quick Start

When asking to track issues, specify the issue title or describe the problem:

- **Create new issue:** "Track the auth bug" or "Create issue for database migration"
- **Update existing issue:** "Update the DNS issue - added new records"
- **View issue:** "Show the auth-bug issue" or "What's the status of the login problem?"
- **List all issues:** "Show all my issues" or "List open issues"
- **Close issue:** "Close the auth-bug issue" or "Mark database migration as resolved"

## How It Works

1. **Issue Storage**: Issues stored as Markdown files in `./issuetracker/` or `../issuetracker/`
2. **File Format**: Each issue uses YAML frontmatter for metadata
3. **Slug Generation**: Issue titles converted to filenames (e.g., "auth bug" → `auth-bug.md`)
4. **Natural Language Matching**: Fuzzy matching finds issues by title/phrases

## Issue Structure

Each issue file contains:

```markdown
---
title: "Issue Title"
status: open|investigating|resolved|closed
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
tags: []
---

# Issue: [Title]

## Original Problem
[Problem description]

## Work Performed
### YYYY-MM-DD HH:MM
- Work entries with timestamps

## Status
Current status explanation

## Resolution
[Filled when resolved/closed]
```

## Status Values

| Status | When to Use |
|--------|-------------|
| `open` | New issue, initial state |
| `investigating` | Active investigation, root cause analysis |
| `resolved` | Solution found, verifying |
| `closed` | Confirmed fixed, complete |

## Common Operations

### Create New Issue

**Trigger:** "Track the [problem]" or "Create issue for [topic]"

**Flow:**
1. Generate slug from title
2. Check for existing issue
3. If not found, create with defaults:
   - Status: `open`
   - Created: today's date
   - Prompt for original problem description
4. Save to `./issuetracker/[slug].md`

**Example:**
```
User: "Track the auth bug"
→ Creates: ./issuetracker/auth-bug.md
→ Prompts for problem description
→ Confirms creation
```

### Update Work Performed

**Trigger:** "Update [issue] - [work description]" or "Add work to [issue]"

**Flow:**
1. Find issue by title/slug
2. Read existing file
3. Append to "Work Performed" section:
   - Add timestamp
   - Include description of work
   - Note last attempted solution if relevant
4. Update `last_updated` field
5. Save file

**Example:**
```
User: "Update auth bug - tried regenerating API keys"
→ Appends to auth-bug.md:
  ### 2025-01-02 14:30
  - Attempted fix: Regenerated API keys
  - Result: Still failing, invalid token error
→ Updates last_updated: 2025-01-02
```

### Update Status

**Trigger:** "Mark [issue] as [status]" or "[Issue] is [status]"

**Valid Transitions:**
- `open` → `investigating`
- `investigating` → `resolved`
- `resolved` → `closed`
- `open` → `closed` (quick close)
- `resolved` → `open` (reopen)

**Flow:**
1. Find issue by title/slug
2. Validate status transition
3. Update frontmatter `status` field
4. Update `last_updated`
5. Add work entry explaining status change
6. Save file

**Example:**
```
User: "Mark auth bug as resolved"
→ Updates status: resolved
→ Adds work entry: "Status changed to resolved - fix verified"
→ Updates last_updated: 2025-01-02
```

### View Issue

**Trigger:** "Show the [issue]" or "Status of [issue]"

**Flow:**
1. Find issue by title/slug
2. Parse frontmatter and content
3. Display:
   - Title and status
   - Creation date
   - Last update
   - Original problem
   - Recent work entries (last 3)
   - Current status explanation
4. Offer action menu

**Example Output:**
```
Issue: auth-bug.md
Status: investigating
Created: 2025-01-01
Last Updated: 2025-01-02

Original Problem:
Users cannot authenticate with API tokens after deployment.

Recent Work:
- 2025-01-02 14:30: Regenerated API keys
- 2025-01-02 11:00: Investigated JWT token validation

What would you like to do?
1. View full details
2. Update work performed
3. Update status
4. Edit problem
5. Close issue
```

### List All Issues

**Trigger:** "Show all issues" or "List open issues"

**Flow:**
1. Scan `./issuetracker/` directory
2. Parse all `.md` files
3. Display table with:
   - Filename
   - Title
   - Status
   - Last updated
4. Sort by last_updated (newest first)

**Example Output:**
```
Issues (3 total):

Filename          | Title             | Status        | Last Updated
------------------|-------------------|---------------|-------------
auth-bug.md       | auth bug          | investigating | 2025-01-02
dns-issue.md      | DNS resolution    | open          | 2025-01-01
migration.md      | database migration| closed        | 2024-12-28

Open issues: 2
Closed issues: 1
```

### Close/Resolve Issue

**Trigger:** "Close [issue]" or "Resolve [issue]"

**Flow:**
1. Find issue by title/slug
2. Prompt for resolution summary
3. Update frontmatter:
   - Status: `closed` or `resolved`
   - `last_updated`: today
4. Fill "Resolution" section
5. Add final work entry
6. Save file

**Example:**
```
User: "Close the auth bug issue"
→ Prompts: "What was the resolution?"
→ User: "Fixed by updating JWT secret in config"
→ Updates status: closed
→ Fills Resolution section with solution
→ Adds work entry documenting closure
```

## Directory Detection

Skill searches for issue tracker directory in order:

1. `./IssueTracker/` (capital I, current directory - project-specific)
2. `./issuetracker/` (lowercase, current directory - backward compatibility)
3. If neither exist, creates `./IssueTracker/` (capital I)

Issues are ALWAYS stored in the current project directory only. Parent directories are never searched.

**Override with path:** "Use /path/to/issues for tracking"

## Issue Matching Algorithm

When searching for existing issues:

1. **Normalize input:** lowercase, remove punctuation
2. **Extract potential title:** nouns/phrases from user input
3. **Search issues:** Compare against frontmatter `title` fields
4. **Match scoring:**
   - Exact match: 100%
   - Contains phrase: 80%
   - Word overlap: 60%
   - Similar phrasing: 50%
5. **Confidence threshold:** Return match if >70%
6. **Ambiguous:** Present matching issues for selection

**Examples:**
| User Input | Match | Confidence |
|------------|-------|------------|
| "auth bug" | "auth-bug.md" (title: "auth bug") | 100% |
| "authentication problem" | "auth-bug.md" (title: "auth bug") | 75% |
| "login issue" | "login-problem.md" (title: "login problem") | 95% |

## Error Handling

| Situation | Behavior |
|-----------|----------|
| No write permission | Suggest alternative location |
| Invalid frontmatter | Offer to fix or recreate file |
| Multiple matches | Present list for selection |
| Corrupted file | Offer backup restore or recreate |
| Concurrent modification | Prompt to reload/merge |

## Best Practices

1. **Descriptive titles:** Use specific, searchable titles
   - Good: "JWT token validation fails after deployment"
   - Bad: "bug" or "problem"

2. **Timestamps:** Always timestamp work entries for audit trail

3. **Last attempted solution:** Include in work entries to avoid repeating failed attempts

4. **Status transitions:** Follow the progression (open → investigating → resolved → closed)

5. **Resolution documentation:** Always document what fixed the issue before closing

6. **Tag usage:** Add tags for cross-referencing (e.g., `critical`, `security`, `performance`)

## Examples

For detailed usage examples, see [examples.md](examples.md).

For implementation guidelines, see [reference.md](reference.md).
