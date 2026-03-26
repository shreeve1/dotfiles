# Memory CLI Reference

Complete reference for `mem-cli.py` commands, arguments, and outputs.

## Table of Contents

- [Global Options](#global-options)
- [init](#init)
- [save-project](#save-project)
- [save-checkpoint](#save-checkpoint)
- [save-global](#save-global)
- [list](#list)
- [list-old](#list-old)
- [search](#search)
- [show](#show)
- [delete](#delete)
- [migrate](#migrate)
- [Output Schemas](#output-schemas)
- [Error Handling](#error-handling)
- [Database Locations](#database-locations)

---

## Global Options

```bash
python3 ~/.claude/skills/mem/scripts/mem-cli.py <command> [options]
```

All commands return JSON with a `status` field (`"ok"` or `"error"`).

---

## init

Initialize database for a scope.

```bash
python3 mem-cli.py init --scope project --project-path "/path/to/project"
python3 mem-cli.py init --scope global
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |

**Output:**
```json
{
  "status": "ok",
  "scope": "project",
  "database_path": "/Users/you/.claude/data/memory/projects/abc123-mem/memory.db"
}
```

---

## save-project

Save a project session with transcript.

```bash
cat transcript.jsonl | python3 mem-cli.py save-project \
  --project-path "/path/to/project" \
  --description "Implemented user authentication"
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--project-path` | Yes | Absolute path to project root |
| `--description` | Yes | Session description |
| stdin | Yes | JSONL transcript data |

**Output:**
```json
{
  "status": "ok",
  "session_id": "abc-123-def-456",
  "description": "Implemented user authentication",
  "files_tracked": 5,
  "chunks_stored": 127,
  "git_branch": "feature/auth",
  "git_commit": "a1b2c3d"
}
```

---

## save-checkpoint

Save a checkpoint with task snapshot and resume context.

```bash
cat transcript.jsonl | python3 mem-cli.py save-checkpoint \
  --project-path "/path/to/project" \
  --description "Halfway through auth refactor" \
  --task-dir "my-project" \
  --resume-context "Goal: Refactor auth\nDone: JWT setup\nNext: OAuth2" \
  --plan-path "artifacts/plans/auth-refactor.md"
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--project-path` | Yes | Absolute path to project root |
| `--description` | Yes | Checkpoint description |
| `--task-dir` | No | Task directory name (not path) |
| `--resume-context` | No | Structured resume text |
| `--plan-path` | No | Relative path to plan file |
| stdin | No | JSONL transcript data |

**Output:**
```json
{
  "status": "ok",
  "session_id": "chk-xyz-789",
  "description": "[CHECKPOINT] Halfway through auth refactor",
  "files_tracked": 3,
  "chunks_stored": 45,
  "tasks_snapshot": 8,
  "active_task_ids": ["1", "3", "5"],
  "has_resume_context": true,
  "plan_path": "artifacts/plans/auth-refactor.md"
}
```

---

## save-global

Save a cross-project learning.

```bash
echo "Use connection pooling for database performance" | python3 mem-cli.py save-global \
  --description "Always use connection pooling" \
  --category "pattern" \
  --tags "database,performance" \
  --source-project "/path/to/project"
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--description` | Yes | Learning description |
| `--category` | No | pattern, preference, lesson, technique, general (default: general) |
| `--tags` | No | Comma-separated tags |
| `--source-project` | No | Project where learning originated |
| stdin | No | Detailed content |

**Output:**
```json
{
  "status": "ok",
  "id": 42,
  "description": "Always use connection pooling",
  "category": "pattern",
  "tags": ["database", "performance"]
}
```

---

## list

List recent records.

```bash
python3 mem-cli.py list --scope project --project-path "/path/to/project" --limit 5
python3 mem-cli.py list --scope global --limit 10
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |
| `--limit` | No | Max records to return (default: 10) |

**Output:**
```json
{
  "status": "ok",
  "scope": "project",
  "records": [
    {
      "id": "abc-123",
      "description": "Implemented user auth",
      "created_at": "2026-03-06T14:30:00",
      "type": "session"
    },
    {
      "id": "chk-xyz",
      "description": "[CHECKPOINT] Halfway through",
      "created_at": "2026-03-06T12:00:00",
      "type": "checkpoint"
    }
  ]
}
```

---

## list-old

List records older than N days.

```bash
python3 mem-cli.py list-old --scope project --project-path "/path/to/project" --older-than-days 7
python3 mem-cli.py list-old --scope global --older-than-days 30
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |
| `--older-than-days` | Yes | Minimum age in days |

**Output:**
```json
{
  "status": "ok",
  "scope": "project",
  "records": [
    {
      "id": "old-123",
      "description": "Old session",
      "created_at": "2026-02-20T10:00:00",
      "age_days": 14
    }
  ]
}
```

---

## search

Full-text search across records.

```bash
python3 mem-cli.py search --scope project --project-path "/path/to/project" --query "authentication" --limit 5
python3 mem-cli.py search --scope global --query "database patterns" --limit 5
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |
| `--query` | Yes | Search terms |
| `--limit` | No | Max results (default: 10) |
| `--plan-path` | No | Filter to checkpoints for this plan |

**Output:**
```json
{
  "status": "ok",
  "scope": "project",
  "query": "authentication",
  "records": [
    {
      "id": "abc-123",
      "description": "Implemented user auth",
      "created_at": "2026-03-06T14:30:00",
      "snippet": "...JWT authentication with token refresh..."
    }
  ]
}
```

---

## show

Get full details of a record.

```bash
python3 mem-cli.py show --scope project --project-path "/path/to/project" --id "abc-123"
python3 mem-cli.py show --scope global --id 42
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |
| `--id` | Yes | Record ID |

**Project Session Output:**
```json
{
  "status": "ok",
  "id": "abc-123",
  "description": "Implemented user auth",
  "created_at": "2026-03-06T14:30:00",
  "git_branch": "feature/auth",
  "git_commit": "a1b2c3d",
  "files": ["src/auth.py", "src/models.py"],
  "content": "Session transcript content...",
  "metadata": {}
}
```

**Checkpoint Output:**
```json
{
  "status": "ok",
  "id": "chk-xyz",
  "description": "[CHECKPOINT] Halfway through",
  "created_at": "2026-03-06T12:00:00",
  "resume_context": "Goal: Refactor auth\nDone: JWT setup",
  "task_snapshot": [...],
  "plan_path": "artifacts/plans/auth.md",
  "metadata": {
    "type": "checkpoint"
  }
}
```

**Global Learning Output:**
```json
{
  "status": "ok",
  "id": 42,
  "description": "Always use connection pooling",
  "category": "pattern",
  "tags": ["database", "performance"],
  "source_project": "/path/to/project",
  "created_at": "2026-03-01T10:00:00",
  "content": "Detailed learning content..."
}
```

---

## delete

Delete a record.

```bash
python3 mem-cli.py delete --scope project --project-path "/path/to/project" --id "abc-123"
python3 mem-cli.py delete --scope global --id 42
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |
| `--id` | Yes | Record ID to delete |

**Output:**
```json
{
  "status": "ok",
  "deleted_id": "abc-123"
}
```

---

## migrate

Database migration commands.

```bash
python3 mem-cli.py migrate --scope project --project-path "/path/to/project"
python3 mem-cli.py migrate --scope global
```

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--scope` | Yes | `project` or `global` |
| `--project-path` | If scope=project | Absolute path to project root |

**Output:**
```json
{
  "status": "ok",
  "migrations_applied": ["001_initial_schema"]
}
```

---

## Output Schemas

### Session Record
```json
{
  "id": "string (UUID)",
  "description": "string",
  "created_at": "ISO 8601 datetime",
  "git_branch": "string | null",
  "git_commit": "string | null",
  "files": ["string"],
  "content": "string (transcript)",
  "metadata": {
    "type": "session | checkpoint",
    "task_snapshot": [...],
    "resume_context": "string",
    "plan_path": "string"
  }
}
```

### Global Learning Record
```json
{
  "id": "integer",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "source_project": "string | null",
  "created_at": "ISO 8601 datetime",
  "content": "string"
}
```

---

## Error Handling

All errors return:
```json
{
  "status": "error",
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common errors:**
| Error | Cause |
|-------|-------|
| `database_not_found` | Run `init` first |
| `record_not_found` | Invalid ID |
| `invalid_scope` | Must be `project` or `global` |
| `missing_project_path` | Required for project scope |
| `migration_failed` | Schema version mismatch |

---

## Database Locations

```
~/.claude/data/memory/
├── projects/
│   ├── {hash}-{name}/
│   │   └── memory.db      # Project-specific sessions
│   └── ...
└── global/
    └── memory.db          # Cross-project learnings
```

**Path encoding:** `{sha256(path)[:16]}-{basename}`
- Example: `a1b2c3d4e5f67890-myproject`

---

## FTS5 Search Syntax

The search command uses SQLite FTS5. Supported operators:

| Operator | Example | Meaning |
|----------|---------|---------|
| word | `auth` | Contains "auth" |
| "phrase" | `"user auth"` | Contains exact phrase |
| AND | `auth AND token` | Both terms |
| OR | `auth OR login` | Either term |
| NOT | `auth NOT oauth` | First, not second |
| * | `auth*` | Prefix match |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (see JSON output) |
| 2 | Invalid arguments |
