---
name: continue
description: Resume work from a saved session using highwatermark for token-efficient context restoration
argument-hint: [session-label]
model: sonnet
allowed-tools: Bash(ls:*), Bash(cat:*), Bash(tail:*), Bash(find:*), Bash(python3:*), Read, TodoWrite
---

# Continue Session

Resume work from a previously saved session using highwatermark tracking. This command efficiently restores context by loading only the necessary state without reading full transcripts.

## Variables

```
SESSION_REF: $ARGUMENTS — Optional label to identify which session to resume. If omitted, uses most recent session.
PROJECT_CWD: !`pwd`
PROJECT_KEY: !`pwd | sed 's|/|-|g'`
SESSIONS_DIR: ~/.claude/sessions/<PROJECT_KEY>
PROJECTS_DIR: ~/.claude/projects/<PROJECT_KEY>
```

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Find session** — match SESSION_REF to label, or find most recent session by modification time
2. **Load session files** — read meta.json, todos.json, and highwatermark.json
3. **Read transcript tail** — read last 15-20 lines of transcript for recent context
4. **Present session summary** — display what was happening with task status
5. **Interview for next steps** — ask clarifying questions about continuing tasks or new direction
6. **Hydrate todos** — use TodoWrite to restore task state into current session
7. **Confirm direction** — summarize plan and get explicit confirmation before proceeding

## Instructions

### Step 1: Find Session

The sessions directory structure is:

```
~/.claude/sessions/
└── <PROJECT_KEY>/
    └── <session_id>/
        ├── meta.json
        ├── todos.json
        └── highwatermark.json
```

If `SESSION_REF` is provided:
- List all sessions in `<SESSIONS_DIR>` and match against `meta.json` labels
- Find session where `label` matches SESSION_REF (partial match ok)

```bash
python3 -c "
import json, glob, os

sessions_dir = '<SESSIONS_DIR>'
session_ref = '<SESSION_REF>'

if not os.path.exists(sessions_dir):
    print(f'NO_SESSIONS:{sessions_dir} not found')
    exit(1)

session_dirs = glob.glob(os.path.join(sessions_dir, '*'))
matching = []

for sd in session_dirs:
    meta_file = os.path.join(sd, 'meta.json')
    if os.path.exists(meta_file):
        with open(meta_file) as f:
            meta = json.load(f)
            label = meta.get('label', '')
            session_id = meta.get('session_id', '')
            # Match by label (partial) or session_id (partial)
            if session_ref and (session_ref in label.lower() or session_id.startswith(session_ref)):
                matching.append((meta.get('saved_at', ''), sd, meta))

# Sort by saved_at descending
matching.sort(key=lambda x: x[0], reverse=True)

if matching:
    # Print most recent match
    print(matching[0][1])
else:
    print('NO_MATCH')
"
```

If `SESSION_REF` is empty, find most recent session:

```bash
ls -dt <SESSIONS_DIR>/*/ 2>/dev/null | head -1
```

If no sessions found or directory doesn't exist:
- Report: "No saved sessions found for this project"
- Suggest: "Run `/cc-save-session` first to save your current work"
- Exit

### Step 2: Load Session Files

For the identified session directory, read:

1. **meta.json** — Session metadata (label, timestamps, summary)
2. **todos.json** — Structured task data with agent assignments
3. **highwatermark.json** — Resume position and last user message

Parse these files to extract:
- `session_id` — Original session ID
- `label` — Session label (optional)
- `saved_at` — When session was saved
- `summary` — Brief description of session content
- `last_user_message` — The last thing the user asked
- `tasks` — Array of task objects with status, content, source_agent

### Step 3: Read Transcript Tail

Read the last 15-20 lines of the original transcript for recent context:

```bash
tail -20 <PROJECTS_DIR>/<session_id>.jsonl
```

Store this context to provide recent conversation context without loading the full transcript.

### Step 4: Present Session Summary

Display what was happening:

```
Resuming Session

  Session ID: <session_id>
  Label:      <label or "(none)">
  Saved:      <saved_at>
  Project:    <project_path>

  Summary:    <summary from meta.json>

  Last action: <last_user_message from highwatermark>

## Task Status

  Completed:   <completed-count> tasks
  In Progress: <in-progress-count> tasks
  Pending:     <pending-count> tasks
```

Then list tasks by status:

```
### In Progress
- <task content>

### Pending
- <task content>

### Completed
- <task content>
```

### Step 5: Interview for Next Steps

Ask user clarifying questions to understand intent:

**If there are in_progress tasks:**
> I see <n> tasks were in progress when this session ended. Do you want to:
> 1. Continue with in-progress tasks
> 2. Focus on pending tasks instead
> 3. Something new

**If all tasks are completed:**
> All tasks from this session were completed. What would you like to work on next?

**If there are pending tasks:**
> There are <n> pending tasks. Should I:
> 1. Start on the first pending task
> 2. Let you choose which to prioritize
> 3. Do something else

**Always ask:**
> Is there anything new I should know about? Changes to requirements, blockers discovered, or new context since this session was saved?

### Step 6: Hydrate Todos

Use the TodoWrite tool to restore the task state into the current session. Parse the todos.json and create TodoWrite calls for tasks that are not completed:

```python
# Example logic for tasks to restore:
for task in tasks:
    if task['status'] in ['pending', 'in_progress']:
        # These will be restored as pending
        # completed tasks are not restored
```

Format for TodoWrite:
```json
{
  "todos": [
    {"content": "Task description", "status": "pending", "activeForm": "Working on task"}
  ]
}
```

**Important:** Only restore `pending` and `in_progress` tasks. Completed tasks should be noted but not re-added to the todo list.

### Step 7: Confirm Direction

Summarize what you understand and get explicit confirmation:

```
## Plan for This Session

Focus: <what we're working on>
From previous: <what carries over>
New context: <anything user mentioned>

Tasks to work on:
- [ ] <pending task 1>
- [ ] <pending task 2>
- [-] <in-progress task>

Ready to proceed? (y/n)
```

## Output Format

After the interview and confirmation:

```
Session Resumed

  From:       <SESSIONS_DIR>/<session_id>/
  Label:      <label>
  Saved:      <saved_at>

Tasks Loaded: <n> active (<in-progress> in-progress, <pending> pending)

Focus: <what user wants to work on>

Recent Context:
<brief summary from transcript tail>

Ready to continue. What would you like to do first?
```

## Validation

- Verify session directory exists and contains all required files (meta.json, todos.json, highwatermark.json)
- Confirm original transcript exists at `~/.claude/projects/<PROJECT_KEY>/<session_id>.jsonl`
- Ensure user confirmation before proceeding with work
- Verify TodoWrite was called with correct task data

## Examples

### Example 1: Resume Most Recent

**Input:** `/cc-continue`
**Output:**
```
Resuming Session

  Session ID: 098a7ecb-279a-4c46-aae6-a6866fc25398
  Label:      refactor-auth
  Saved:      2026-02-22T12:30:00Z

  Summary:    Refactor authentication middleware to use new...

  Last action: Can we review the current auth implementation?

## Task Status

  Completed:   5 tasks
  In Progress: 2 tasks
  Pending:     3 tasks

### In Progress
- Update auth middleware to use new token format
- Add unit tests for token validation

### Pending
- Update documentation
- Migrate existing tokens
- Clean up deprecated code

I see 2 tasks were in progress. Continue with in-progress tasks?
```

### Example 2: Resume by Label

**Input:** `/cc-continue auth`
**Output:** Finds session with label containing "auth" and resumes context.

### Example 3: No Sessions

**Input:** `/cc-continue`
**Output:**
```
No saved sessions found for this project.
Run /cc-save-session first to save your current work.
```

## Report

After establishing direction:

```
Session Resumed

  From:       ~/.claude/sessions/<PROJECT_KEY>/<session_id>/
  Tasks:      <n> loaded (<in-progress> in-progress, <pending> pending)

  Focus:      <what user wants to work on>

  Transcript: ~<n> lines, resuming from line <highwatermark_line>

Ready to continue.
```
