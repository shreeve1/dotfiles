---
name: save-session
description: Save current conversation todos and highwatermark to ~/.claude/sessions/ for efficient resume
argument-hint: [optional-label]
allowed-tools: Bash(mkdir:*), Bash(python3:*), Bash(ls:*), Bash(tail:*), Bash(jq:*), Bash(rm:*)
model: haiku
---

# Save Session

Save the current session's todo state and highwatermark to a centralized location for token-efficient resumption. This command stores session metadata without duplicating the full transcript.

## Variables

```
SESSION_LABEL: $ARGUMENTS
PROJECT_CWD: !`pwd`
PROJECT_KEY: !`pwd | sed 's|/|-|g'`
SESSIONS_DIR: ~/.claude/sessions/<PROJECT_KEY>
```

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Find current session** — find most recent transcript in project's .claude/projects/ directory
2. **Create session directory** — set up SESSIONS_DIR if needed
3. **Collect todo state** — gather and merge all todo files for current session
4. **Extract highwatermark** — parse last user message and position from transcript
5. **Write session files** — save meta.json, todos.json, highwatermark.json
6. **Generate summary** — report save location and task counts
7. **Instruct user to clear** — tell user to type /clear and show resume command

## Instructions

### Step 1: Find Current Session

Claude Code stores transcripts per-project at `~/.claude/projects/<PROJECT_KEY>/`.

Find the **most recently modified** `.jsonl` file in that directory:

```bash
ls -t ~/.claude/projects/<PROJECT_KEY>/*.jsonl 2>/dev/null | head -1
```

Extract from the result:
- `transcript_path` — the full path returned
- `session_id` — the filename without `.jsonl` extension (it's a UUID)

**If no transcript is found**, report an error: "No session transcript found for this project. Are you running this from the correct project directory?" and stop.

### Step 2: Create Session Directory

Create the directory structure if it doesn't exist:

```bash
mkdir -p <SESSIONS_DIR>
```

### Step 3: Collect Todo State

Todo files for a session are stored in `~/.claude/todos/` with the naming pattern:

```
<session_id>-agent-*.json
```

Each file is a JSON array of task objects with fields: `content`, `status` (`pending`/`in_progress`/`completed`), `activeForm`, and optionally `id`, `priority`, `description`.

#### 3a: Find Todo Files

```bash
ls ~/.claude/todos/<session_id>-agent-*.json 2>/dev/null
```

If no todo files are found (empty glob), set `todos_count = 0` and skip the merge step.

#### 3b: Merge Todo Data

Use python3 to merge all matching todo files into a single JSON file. The merged output should be a JSON object with:
- `session_id` — the session UUID
- `saved_at` — ISO 8601 timestamp
- `source_files` — list of original filenames
- `tasks` — flat array of all tasks from all agent files, with a `source_agent` field added to each task

```bash
python3 -c "
import json, glob, os, datetime

session_id = '<session_id>'
todo_dir = os.path.expanduser('~/.claude/todos')
pattern = os.path.join(todo_dir, f'{session_id}-agent-*.json')
files = glob.glob(pattern)

all_tasks = []
source_files = []
for f in sorted(files):
    basename = os.path.basename(f)
    source_files.append(basename)
    # Extract agent ID from filename: {session}-agent-{agent}.json
    agent_id = basename.replace(f'{session_id}-agent-', '').replace('.json', '')
    with open(f) as fh:
        tasks = json.load(fh)
        for task in tasks:
            task['source_agent'] = agent_id
            all_tasks.append(task)

output = {
    'session_id': session_id,
    'saved_at': datetime.datetime.now().isoformat(),
    'source_files': source_files,
    'tasks': all_tasks
}

with open('<SESSIONS_DIR>/<session_id>/todos.json', 'w') as out:
    json.dump(output, out, indent=2)

print(f'Saved {len(all_tasks)} tasks from {len(files)} agent file(s)')
"
```

If no tasks were found, still create the todos.json with an empty tasks array.

### Step 4: Extract Highwatermark

Parse the transcript to find the last user message and extract resume position:

```bash
python3 -c "
import json

last_user_message = ''
last_message_id = ''
last_timestamp = ''
line_number = 0

with open('<transcript_path>', 'r') as f:
    for i, line in enumerate(f, 1):
        line_number = i
        try:
            entry = json.loads(line)
            # Track the last message ID and timestamp from any entry
            if 'messageId' in entry:
                last_message_id = entry['messageId']
            if 'timestamp' in entry:
                last_timestamp = entry['timestamp']
            # Look for user messages - typically have 'role' or specific structure
            if entry.get('type') == 'user_prompt' or entry.get('role') == 'user':
                last_user_message = entry.get('content', entry.get('prompt', ''))
        except:
            pass

import datetime
output = {
    'session_id': '<session_id>',
    'last_message_id': last_message_id,
    'last_user_message': last_user_message,
    'last_timestamp': last_timestamp,
    'line_number': line_number,
    'tasks_summary': {}
}

# Add task counts from the todos.json we just created
try:
    with open('<SESSIONS_DIR>/<session_id>/todos.json') as f:
        todos = json.load(f)
        by_status = {}
        for t in todos.get('tasks', []):
            s = t.get('status', 'unknown')
            by_status[s] = by_status.get(s, 0) + 1
        output['tasks_summary'] = by_status
except:
    pass

with open('<SESSIONS_DIR>/<session_id>/highwatermark.json', 'w') as out:
    json.dump(output, out, indent=2)

print(f'Highwatermark: line {line_number}, last_message_id={last_message_id}')
"
```

### Step 5: Write Session Files

#### 5a: meta.json

Create the meta.json file with session metadata:

```bash
python3 -c "
import json, datetime, os

session_id = '<session_id>'
label = '<SESSION_LABEL>' if '<SESSION_LABEL>' else ''

# Try to get a simple summary from the highwatermark's last_user_message
summary = ''
try:
    with open('<SESSIONS_DIR>/<session_id>/highwatermark.json') as f:
        hw = json.load(f)
        summary = hw.get('last_user_message', '')[:200]  # First 200 chars
        if len(hw.get('last_user_message', '')) > 200:
            summary += '...'
except:
    pass

output = {
    'session_id': session_id,
    'label': label,
    'project_path': '<PROJECT_CWD>',
    'created_at': datetime.datetime.now().isoformat(),
    'saved_at': datetime.datetime.now().isoformat(),
    'summary': summary
}

with open('<SESSIONS_DIR>/<session_id>/meta.json', 'w') as out:
    json.dump(output, out, indent=2)

print('Meta saved')
"
```

### Step 6: Generate Summary

Generate a brief summary showing what was saved:
1. Session ID
2. Save location
3. Task counts by status (completed / in_progress / pending)

### Step 7: Instruct User to Clear

After saving, tell the user:

> Session saved. To clear the current conversation, type `/clear` in the chat.
> To resume this work in a new session, run: `/cc-continue`

**Do NOT attempt to invoke `/clear` yourself** — it is a built-in CLI command that only the user can run.

## Report

```
Session Saved

  Session ID: <full-session-id>
  Location:   ~/.claude/sessions/<PROJECT_KEY>/<session_id>/
  Label:      <SESSION_LABEL or "(none)">

  Tasks:      <completed-count> done, <in-progress-count> active, <pending-count> pending

To clear this conversation, type: /clear
To resume in a new session, run: /cc-continue
```

If no todos were found, show:
```
  Tasks:      (none active)
```

## Validation

- Verify the session directory was created
- Verify meta.json, todos.json, and highwatermark.json exist
- Verify todos.json is valid JSON (even if empty)
- Verify the highwatermark has a line_number and last_message_id
