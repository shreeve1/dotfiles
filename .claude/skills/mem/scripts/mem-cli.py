#!/usr/bin/env python3
"""
Shared CLI tool for memory skills: mem-project, mem-checkpoint, and mem-global.
Handles SQLite operations, FTS5 search, and all CRUD operations.
"""

import argparse
import json
import sqlite3
import sys
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
from hashlib import md5, sha256

from migration_runner import MigrationRunner, MigrationError, VersionMismatchError, create_lock_file, remove_lock_file


class MemoryCLI:
    """Main CLI handler for memory operations."""

    # Schema version constants
    CURRENT_PROJECT_SCHEMA_VERSION = 1
    CURRENT_GLOBAL_SCHEMA_VERSION = 1
    SUPPORTED_MAX_VERSION = 1

    def __init__(self):
        self.data_dir = Path.home() / ".claude" / "data" / "memory"

    def encode_path(self, path: str) -> str:
        """
        Encode project path using SHA256 hash + readable suffix.
        Collision-free encoding that's still human-readable.
        """
        # Normalize to absolute path
        path = str(Path(path).resolve())

        # Generate SHA256 hash (first 16 chars = 64 bits, collision-resistant)
        hash_prefix = sha256(path.encode('utf-8')).hexdigest()[:16]

        # Extract last path component for readability (max 30 chars)
        suffix = Path(path).name[:30]

        # Sanitize suffix (only alphanumeric and hyphens)
        suffix = ''.join(c if c.isalnum() or c == '-' else '-' for c in suffix)

        return f"{hash_prefix}-{suffix}"

    def encode_path_legacy(self, path: str) -> str:
        """Legacy encoding for backward compatibility during migration."""
        return path.replace("/", "-")

    def migrate_database(self, project_path: str, old_db: Path, new_db: Path) -> bool:
        """
        Migrate database from old encoding to new encoding.
        Returns True if migration successful.
        """
        try:
            # Create lock file to prevent concurrent migrations
            lock_path = create_lock_file(old_db)
            if not lock_path:
                print("Migration already in progress, using old database", file=sys.stderr)
                return False

            # Create timestamped backup
            timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
            backup_dir = old_db.parent.parent / f"{old_db.parent.name}.backup-{timestamp}"

            print(f"Migrating database to new encoding format...", file=sys.stderr)
            print(f"  Old: {old_db.parent.name}", file=sys.stderr)
            print(f"  New: {new_db.parent.name}", file=sys.stderr)
            print(f"  Backup: {backup_dir.name}", file=sys.stderr)

            # Create backup of entire directory
            shutil.copytree(old_db.parent, backup_dir)

            # Ensure new directory exists
            new_db.parent.mkdir(parents=True, exist_ok=True)

            # Copy database files to new location
            shutil.copy2(old_db, new_db)
            for suffix in ["-wal", "-shm"]:
                old_wal = Path(str(old_db) + suffix)
                new_wal = Path(str(new_db) + suffix)
                if old_wal.exists():
                    shutil.copy2(old_wal, new_wal)

            # Create migration metadata
            metadata = {
                "original_path": project_path,
                "old_encoding": old_db.parent.name,
                "new_encoding": new_db.parent.name,
                "migrated_at": timestamp,
                "old_db_size": old_db.stat().st_size,
            }
            metadata_file = new_db.parent / ".migration_metadata.json"
            metadata_file.write_text(json.dumps(metadata, indent=2))

            # Verify data integrity
            conn = sqlite3.connect(str(new_db))
            cursor = conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            integrity = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sessions")
            session_count = cursor.fetchone()[0]
            conn.close()

            if integrity != "ok":
                print(f"WARNING: Integrity check failed after migration: {integrity}", file=sys.stderr)
                remove_lock_file(lock_path)
                return False

            # Rename old directory
            migrated_dir = old_db.parent.parent / f"{old_db.parent.name}.migrated.bak"
            old_db.parent.rename(migrated_dir)

            print(f"✓ Migration successful ({session_count} sessions preserved)", file=sys.stderr)

            remove_lock_file(lock_path)
            return True

        except Exception as e:
            print(f"Migration failed: {e}", file=sys.stderr)
            # Log error
            error_log = self.data_dir / "migration_errors.log"
            with open(error_log, "a") as f:
                f.write(f"{datetime.now().isoformat()} - {project_path}: {e}\n")
            if 'lock_path' in locals():
                remove_lock_file(lock_path)
            return False

    def get_db_path(self, scope: str, project_path: str = None) -> Path:
        """Get the database path for global or project scope."""
        if scope == "global":
            db_path = self.data_dir / "global" / "memory.db"
        elif scope == "project":
            if not project_path:
                project_path = str(Path.cwd())

            # Try new encoding first
            encoded = self.encode_path(project_path)
            db_path = self.data_dir / "projects" / encoded / "memory.db"

            # If new encoding doesn't exist, check for old encoding
            if not db_path.exists():
                old_encoded = self.encode_path_legacy(project_path)
                old_db = self.data_dir / "projects" / old_encoded / "memory.db"

                if old_db.exists():
                    # Trigger migration
                    self.migrate_database(project_path, old_db, db_path)
                    # After migration, use new path
        else:
            raise ValueError(f"Invalid scope: {scope}")

        # Ensure parent directory exists
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return db_path

    def check_version_compatibility(self, db_path: Path, scope: str) -> None:
        """Check if database version is compatible with this CLI."""
        if not db_path.exists():
            return

        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("PRAGMA user_version")
            db_version = cursor.fetchone()[0]
            conn.close()

            if db_version > self.SUPPORTED_MAX_VERSION:
                print(f"ERROR: Database version {db_version} is too new for this CLI", file=sys.stderr)
                print(f"This CLI supports up to version {self.SUPPORTED_MAX_VERSION}", file=sys.stderr)
                print(f"Please upgrade: pip install --upgrade claude-mem-cli", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            print(f"WARNING: Could not check database version: {e}", file=sys.stderr)

    def check_and_migrate(self, db_path: Path, scope: str) -> None:
        """Check version compatibility and run migrations if needed."""
        if not db_path.exists():
            return

        # Check if newer than supported
        self.check_version_compatibility(db_path, scope)

        # Check if migration needed
        runner = MigrationRunner(db_path, scope)
        if runner.needs_migration():
            result = runner.run_migrations(auto=True)
            if result["status"] != "ok":
                print(f"ERROR: Migration failed: {result.get('error')}", file=sys.stderr)
                sys.exit(1)

    def init_project_db(self, db_path: Path) -> None:
        """Initialize project memory database with schema."""
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")

        # Core sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                project_path TEXT NOT NULL,
                git_branch TEXT,
                git_commit_sha TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                metadata JSON DEFAULT '{}'
            )
        """)

        # File changes tracked per session
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS file_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL REFERENCES sessions(session_id),
                file_path TEXT NOT NULL,
                change_type TEXT NOT NULL CHECK(change_type IN ('added', 'modified', 'deleted', 'renamed')),
                diff_summary TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # Session transcript storage (chunked for large transcripts)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transcript_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL REFERENCES sessions(session_id),
                chunk_index INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
                content TEXT NOT NULL,
                timestamp TEXT,
                UNIQUE(session_id, chunk_index)
            )
        """)

        # FTS5 for full-text search across transcripts
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS transcript_fts USING fts5(
                session_id UNINDEXED,
                content,
                content=transcript_chunks,
                content_rowid=id
            )
        """)

        # Triggers to keep FTS in sync
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS transcript_ai AFTER INSERT ON transcript_chunks BEGIN
                INSERT INTO transcript_fts(rowid, session_id, content) VALUES (new.id, new.session_id, new.content);
            END
        """)

        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS transcript_ad AFTER DELETE ON transcript_chunks BEGIN
                INSERT INTO transcript_fts(transcript_fts, rowid, session_id, content) VALUES('delete', old.id, old.session_id, old.content);
            END
        """)

        # Indexes for common queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_file_changes_session ON file_changes(session_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_file_changes_path ON file_changes(file_path)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcript_chunks(session_id, chunk_index)
        """)

        # Set schema version
        cursor.execute(f"PRAGMA user_version = {self.CURRENT_PROJECT_SCHEMA_VERSION}")

        conn.commit()
        conn.close()

    def init_global_db(self, db_path: Path) -> None:
        """Initialize global memory database with schema."""
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Enable WAL mode
        cursor.execute("PRAGMA journal_mode=WAL")

        # Global learnings/patterns table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('pattern', 'preference', 'lesson', 'technique', 'general')),
                content TEXT NOT NULL,
                source_project TEXT,
                tags JSON DEFAULT '[]',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                metadata JSON DEFAULT '{}'
            )
        """)

        # FTS5 for searching learnings
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(
                description,
                content,
                category UNINDEXED,
                content=learnings,
                content_rowid=id
            )
        """)

        # Triggers to keep FTS in sync
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS learnings_ai AFTER INSERT ON learnings BEGIN
                INSERT INTO learnings_fts(rowid, description, content, category) VALUES (new.id, new.description, new.content, new.category);
            END
        """)

        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS learnings_ad AFTER DELETE ON learnings BEGIN
                INSERT INTO learnings_fts(learnings_fts, rowid, description, content, category) VALUES('delete', old.id, old.description, old.content, old.category);
            END
        """)

        # Indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_learnings_created ON learnings(created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_learnings_category ON learnings(category)
        """)

        # Set schema version
        cursor.execute(f"PRAGMA user_version = {self.CURRENT_GLOBAL_SCHEMA_VERSION}")

        conn.commit()
        conn.close()

    def cmd_init(self, args) -> None:
        """Initialize database for given scope."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if args.scope == "project":
                self.init_project_db(db_path)
            else:
                self.init_global_db(db_path)

            result = {
                "status": "ok",
                "scope": args.scope,
                "db_path": str(db_path),
            }
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def get_git_info(self, project_path: str) -> tuple:
        """Get git branch and commit SHA. Returns (branch, sha) or (None, None) if not in git repo."""
        try:
            branch = subprocess.check_output(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=project_path,
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
            sha = subprocess.check_output(
                ["git", "rev-parse", "HEAD"],
                cwd=project_path,
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
            return branch, sha
        except (subprocess.CalledProcessError, FileNotFoundError):
            return None, None

    def get_file_changes(self, project_path: str) -> list:
        """Get file changes from git diff. Returns list of (file_path, change_type)."""
        changes = []
        try:
            # Get staged changes
            output = subprocess.check_output(
                ["git", "diff", "--cached", "--name-status"],
                cwd=project_path,
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
            if output:
                for line in output.split("\n"):
                    parts = line.split("\t", 1)
                    if len(parts) == 2:
                        change_type, file_path = parts
                        # Normalize change type
                        if change_type.startswith("R"):
                            change_type = "renamed"
                        elif change_type == "A":
                            change_type = "added"
                        elif change_type == "D":
                            change_type = "deleted"
                        elif change_type == "M":
                            change_type = "modified"
                        changes.append((file_path, change_type))

            # Get unstaged changes
            output = subprocess.check_output(
                ["git", "diff", "--name-status"],
                cwd=project_path,
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
            if output:
                for line in output.split("\n"):
                    parts = line.split("\t", 1)
                    if len(parts) == 2:
                        change_type, file_path = parts
                        # Normalize change type
                        if change_type.startswith("R"):
                            change_type = "renamed"
                        elif change_type == "A":
                            change_type = "added"
                        elif change_type == "D":
                            change_type = "deleted"
                        elif change_type == "M":
                            change_type = "modified"
                        # Avoid duplicates
                        if (file_path, change_type) not in changes:
                            changes.append((file_path, change_type))
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass

        return changes

    def cmd_save_project(self, args) -> None:
        """Save a project session to the database."""
        try:
            project_path = args.project_path or str(Path.cwd())
            db_path = self.get_db_path("project", project_path)

            # Ensure DB exists
            if not db_path.exists():
                self.init_project_db(db_path)
            else:
                # Check version and migrate if needed
                self.check_and_migrate(db_path, "project")

            # Generate session ID if not provided
            session_id = args.session_id or datetime.now().isoformat() + "-" + md5(
                project_path.encode()
            ).hexdigest()[:8]

            # Read transcript from stdin or file
            if args.transcript:
                if args.transcript == "-":
                    transcript_data = sys.stdin.read()
                else:
                    with open(args.transcript) as f:
                        transcript_data = f.read()
            else:
                transcript_data = sys.stdin.read()

            # Parse transcript JSONL
            transcript_lines = [
                line for line in transcript_data.strip().split("\n") if line
            ]
            transcript_chunks = []
            first_user_message = None

            for chunk_index, line in enumerate(transcript_lines):
                try:
                    chunk = json.loads(line)
                    role = chunk.get("type", "unknown")
                    if role == "user" and not first_user_message:
                        first_user_message = chunk.get("content", "")
                    content = chunk.get("content", "")
                    timestamp = chunk.get("timestamp", None)
                    transcript_chunks.append(
                        (chunk_index, role, content, timestamp)
                    )
                except json.JSONDecodeError:
                    pass

            # Auto-generate description if not provided
            description = args.description
            if not description and first_user_message:
                description = first_user_message[:100]
            elif not description:
                description = "Session"

            # Get git info
            branch, sha = self.get_git_info(project_path)

            # Get file changes
            file_changes = self.get_file_changes(project_path)

            # Connect to DB and save
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()

            # Insert session
            cursor.execute(
                """
                INSERT INTO sessions (session_id, description, project_path, git_branch, git_commit_sha, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    description,
                    project_path,
                    branch,
                    sha,
                    json.dumps({}),
                ),
            )

            # Insert file changes
            for file_path, change_type in file_changes:
                cursor.execute(
                    """
                    INSERT INTO file_changes (session_id, file_path, change_type)
                    VALUES (?, ?, ?)
                    """,
                    (session_id, file_path, change_type),
                )

            # Insert transcript chunks
            for chunk_index, role, content, timestamp in transcript_chunks:
                cursor.execute(
                    """
                    INSERT INTO transcript_chunks (session_id, chunk_index, role, content, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (session_id, chunk_index, role, content, timestamp),
                )

            conn.commit()
            conn.close()

            result = {
                "status": "ok",
                "session_id": session_id,
                "description": description,
                "files_tracked": len(file_changes),
                "chunks_stored": len(transcript_chunks),
            }
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_save_checkpoint(self, args) -> None:
        """Save a checkpoint session with task list snapshot and resume context."""
        try:
            project_path = args.project_path or str(Path.cwd())
            db_path = self.get_db_path("project", project_path)

            # Ensure DB exists
            if not db_path.exists():
                self.init_project_db(db_path)
            else:
                # Check version and migrate if needed
                self.check_and_migrate(db_path, "project")

            # Generate checkpoint session ID
            timestamp = datetime.now().isoformat()
            session_id = args.session_id or (
                timestamp + "-chk-" + md5(project_path.encode()).hexdigest()[:8]
            )

            # Read transcript from stdin
            if args.transcript:
                if args.transcript == "-":
                    transcript_data = sys.stdin.read()
                else:
                    with open(args.transcript) as f:
                        transcript_data = f.read()
            else:
                transcript_data = sys.stdin.read()

            # Parse transcript JSONL
            transcript_lines = [
                line for line in transcript_data.strip().split("\n") if line
            ]
            transcript_chunks = []
            first_user_message = None

            valid_roles = {"user", "assistant", "system", "tool"}
            for chunk_index, line in enumerate(transcript_lines):
                try:
                    chunk = json.loads(line)
                    role = chunk.get("type", "unknown")
                    if role not in valid_roles:
                        continue
                    if role == "user" and not first_user_message:
                        first_user_message = chunk.get("content", "")
                    content = chunk.get("content", "")
                    timestamp_val = chunk.get("timestamp", None)
                    transcript_chunks.append(
                        (chunk_index, role, content, timestamp_val)
                    )
                except json.JSONDecodeError:
                    pass

            # Auto-generate description with [CHECKPOINT] prefix
            description = args.description
            if not description and first_user_message:
                description = "[CHECKPOINT] " + first_user_message[:100]
            elif not description:
                description = "[CHECKPOINT] Session checkpoint"
            elif not description.startswith("[CHECKPOINT]"):
                description = "[CHECKPOINT] " + description

            # Get git info
            branch, sha = self.get_git_info(project_path)

            # Get file changes
            file_changes = self.get_file_changes(project_path)

            # Snapshot task list from task dir
            task_list_snapshot = []
            active_task_ids = []
            task_dir_name = args.task_dir or ""

            if task_dir_name:
                task_dir = Path.home() / ".claude" / "tasks" / task_dir_name
                if task_dir.is_dir():
                    for task_file in sorted(task_dir.glob("*.json")):
                        try:
                            with open(task_file) as f:
                                task_obj = json.load(f)
                            task_list_snapshot.append(task_obj)
                            # Track active (non-completed) tasks
                            status = task_obj.get("status", "")
                            if status in ("in_progress", "pending"):
                                task_id = task_obj.get("id", task_file.stem)
                                active_task_ids.append(str(task_id))
                        except (json.JSONDecodeError, OSError):
                            pass

            # Build metadata
            metadata = {
                "type": "checkpoint",
                "resume_context": args.resume_context or "",
                "task_list_snapshot": task_list_snapshot,
                "task_list_dir": task_dir_name,
                "active_task_ids": active_task_ids,
                "plan_path": args.plan_path or "",
            }

            # Connect to DB and save
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()

            # Insert session
            cursor.execute(
                """
                INSERT INTO sessions (session_id, description, project_path, git_branch, git_commit_sha, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    description,
                    project_path,
                    branch,
                    sha,
                    json.dumps(metadata),
                ),
            )

            # Insert file changes
            for file_path, change_type in file_changes:
                cursor.execute(
                    """
                    INSERT INTO file_changes (session_id, file_path, change_type)
                    VALUES (?, ?, ?)
                    """,
                    (session_id, file_path, change_type),
                )

            # Insert transcript chunks
            for chunk_index, role, content, ts in transcript_chunks:
                cursor.execute(
                    """
                    INSERT INTO transcript_chunks (session_id, chunk_index, role, content, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (session_id, chunk_index, role, content, ts),
                )

            conn.commit()
            conn.close()

            result = {
                "status": "ok",
                "session_id": session_id,
                "description": description,
                "files_tracked": len(file_changes),
                "chunks_stored": len(transcript_chunks),
                "tasks_snapshot": len(task_list_snapshot),
                "active_task_ids": active_task_ids,
                "has_resume_context": bool(args.resume_context),
                "plan_path": args.plan_path or "",
            }
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_save_global(self, args) -> None:
        """Save a global learning to the database."""
        try:
            db_path = self.get_db_path("global")

            # Ensure DB exists
            if not db_path.exists():
                self.init_global_db(db_path)
            else:
                # Check version and migrate if needed
                self.check_and_migrate(db_path, "global")

            # Read content from stdin or argument
            if args.content:
                content = args.content
            else:
                content = sys.stdin.read()

            # Parse tags
            tags = []
            if args.tags:
                tags = [t.strip() for t in args.tags.split(",")]

            # Connect and save
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO learnings (description, category, content, source_project, tags, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    args.description,
                    args.category or "general",
                    content,
                    args.source_project,
                    json.dumps(tags),
                    json.dumps({}),
                ),
            )

            conn.commit()
            learning_id = cursor.lastrowid
            conn.close()

            result = {
                "status": "ok",
                "id": learning_id,
                "description": args.description,
                "category": args.category or "general",
            }
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_list(self, args) -> None:
        """List saved records."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "ok", "records": []}
                print(json.dumps(result))
                return

            # Check version and migrate if needed
            self.check_and_migrate(db_path, args.scope)

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if args.scope == "project":
                limit = args.limit or 20
                cursor.execute(
                    """
                    SELECT id, session_id, description, created_at
                    FROM sessions
                    ORDER BY created_at DESC
                    LIMIT ?
                    """,
                    (limit,),
                )
            else:  # global
                limit = args.limit or 20
                query = "SELECT id, description, category, created_at FROM learnings"
                params = []

                if args.category:
                    query += " WHERE category = ?"
                    params.append(args.category)

                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)

                cursor.execute(query, params)

            records = [dict(row) for row in cursor.fetchall()]
            conn.close()

            result = {"status": "ok", "records": records}
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_list_old(self, args) -> None:
        """List records older than N days."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "ok", "records": [], "scope": args.scope}
                print(json.dumps(result))
                return

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            limit = args.limit or 50
            days = args.older_than_days

            if args.scope == "project":
                cursor.execute(
                    """
                    SELECT id, session_id, description, created_at,
                           CAST(julianday('now') - julianday(created_at) AS INTEGER) as age_days
                    FROM sessions
                    WHERE julianday('now') - julianday(created_at) > ?
                    ORDER BY created_at ASC
                    LIMIT ?
                    """,
                    (days, limit),
                )
            else:  # global
                cursor.execute(
                    """
                    SELECT id, description, category, created_at,
                           CAST(julianday('now') - julianday(created_at) AS INTEGER) as age_days
                    FROM learnings
                    WHERE julianday('now') - julianday(created_at) > ?
                    ORDER BY created_at ASC
                    LIMIT ?
                    """,
                    (days, limit),
                )

            records = [dict(row) for row in cursor.fetchall()]
            conn.close()

            result = {"status": "ok", "records": records, "scope": args.scope}
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_search(self, args) -> None:
        """Search records using FTS5 with fallback to LIKE search on description."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "ok", "records": []}
                print(json.dumps(result))
                return

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            limit = args.limit or 10
            like_pattern = f"%{args.query}%"

            if args.scope == "project":
                # Check if filtering by plan_path
                if hasattr(args, 'plan_path') and args.plan_path:
                    plan_filter = f'%"plan_path": "{args.plan_path}"%'
                    # Hybrid search: FTS5 on transcripts + LIKE on description
                    cursor.execute(
                        """
                        SELECT DISTINCT session_id, id, description, created_at FROM (
                            -- FTS5 search on transcript content
                            SELECT
                                tc.session_id,
                                s.id,
                                s.description,
                                s.created_at
                            FROM transcript_fts f
                            JOIN transcript_chunks tc ON f.rowid = tc.id
                            JOIN sessions s ON tc.session_id = s.session_id
                            WHERE transcript_fts MATCH ?
                                AND s.metadata LIKE ?

                            UNION

                            -- LIKE search on description
                            SELECT
                                s.session_id,
                                s.id,
                                s.description,
                                s.created_at
                            FROM sessions s
                            WHERE s.description LIKE ?
                                AND s.metadata LIKE ?
                        )
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                        (args.query, plan_filter, like_pattern, plan_filter, limit),
                    )
                else:
                    # Hybrid search: FTS5 on transcripts + LIKE on description
                    cursor.execute(
                        """
                        SELECT DISTINCT session_id, id, description, created_at FROM (
                            -- FTS5 search on transcript content
                            SELECT
                                tc.session_id,
                                s.id,
                                s.description,
                                s.created_at
                            FROM transcript_fts f
                            JOIN transcript_chunks tc ON f.rowid = tc.id
                            JOIN sessions s ON tc.session_id = s.session_id
                            WHERE transcript_fts MATCH ?

                            UNION

                            -- LIKE search on description
                            SELECT
                                s.session_id,
                                s.id,
                                s.description,
                                s.created_at
                            FROM sessions s
                            WHERE s.description LIKE ?
                        )
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                        (args.query, like_pattern, limit),
                    )
            else:  # global
                # Hybrid search for global: FTS5 + LIKE on description
                cursor.execute(
                    """
                    SELECT DISTINCT id, description, category, created_at FROM (
                        -- FTS5 search
                        SELECT l.id, l.description, l.category, l.created_at
                        FROM learnings l
                        WHERE l.id IN (
                            SELECT rowid FROM learnings_fts WHERE learnings_fts MATCH ?
                        )

                        UNION

                        -- LIKE search on description
                        SELECT l.id, l.description, l.category, l.created_at
                        FROM learnings l
                        WHERE l.description LIKE ?
                    )
                    ORDER BY created_at DESC
                    LIMIT ?
                    """,
                    (args.query, like_pattern, limit),
                )

            records = [dict(row) for row in cursor.fetchall()]
            conn.close()

            result = {"status": "ok", "records": records}
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_show(self, args) -> None:
        """Show a single record with full details."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "error", "error": "Database not found"}
                print(json.dumps(result), file=sys.stderr)
                sys.exit(1)

            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if args.scope == "project":
                cursor.execute("SELECT * FROM sessions WHERE id = ?", (args.id,))
                session = cursor.fetchone()
                if not session:
                    result = {"status": "error", "error": "Session not found"}
                    print(json.dumps(result), file=sys.stderr)
                    sys.exit(1)

                session_dict = dict(session)

                # Get file changes
                cursor.execute(
                    "SELECT file_path, change_type FROM file_changes WHERE session_id = ?",
                    (session_dict["session_id"],),
                )
                file_changes = [dict(row) for row in cursor.fetchall()]

                # Get transcript chunks
                cursor.execute(
                    "SELECT chunk_index, role, content, timestamp FROM transcript_chunks WHERE session_id = ? ORDER BY chunk_index",
                    (session_dict["session_id"],),
                )
                transcript_chunks = [dict(row) for row in cursor.fetchall()]

                session_dict["file_changes"] = file_changes
                session_dict["transcript_chunks"] = transcript_chunks
                result = {"status": "ok", "record": session_dict}
            else:  # global
                cursor.execute("SELECT * FROM learnings WHERE id = ?", (args.id,))
                learning = cursor.fetchone()
                if not learning:
                    result = {"status": "error", "error": "Learning not found"}
                    print(json.dumps(result), file=sys.stderr)
                    sys.exit(1)

                learning_dict = dict(learning)
                result = {"status": "ok", "record": learning_dict}

            conn.close()
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_delete(self, args) -> None:
        """Delete a record and associated data."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "error", "error": "Database not found"}
                print(json.dumps(result), file=sys.stderr)
                sys.exit(1)

            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()

            if args.scope == "project":
                # Get session_id from id
                cursor.execute("SELECT session_id FROM sessions WHERE id = ?", (args.id,))
                row = cursor.fetchone()
                if not row:
                    result = {"status": "error", "error": "Session not found"}
                    print(json.dumps(result), file=sys.stderr)
                    sys.exit(1)

                session_id = row[0]

                # Delete file changes
                cursor.execute(
                    "DELETE FROM file_changes WHERE session_id = ?", (session_id,)
                )

                # Delete transcript chunks (triggers will handle FTS cleanup)
                cursor.execute(
                    "DELETE FROM transcript_chunks WHERE session_id = ?", (session_id,)
                )

                # Delete session
                cursor.execute("DELETE FROM sessions WHERE id = ?", (args.id,))
            else:  # global
                cursor.execute("DELETE FROM learnings WHERE id = ?", (args.id,))

            conn.commit()
            conn.close()

            result = {"status": "ok", "message": "Record deleted"}
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_migrate_status(self, args) -> None:
        """Check migration status for a database."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {
                    "status": "ok",
                    "message": "Database does not exist yet",
                    "current_version": 0,
                    "target_version": 0,
                    "up_to_date": True
                }
                print(json.dumps(result))
                return

            runner = MigrationRunner(db_path, args.scope)
            current = runner.get_current_version()
            target = runner.get_target_version()
            needs_migration = runner.needs_migration()

            result = {
                "status": "ok",
                "current_version": current,
                "target_version": target,
                "up_to_date": not needs_migration,
                "pending_migrations": len(runner.get_pending_migrations()) if needs_migration else 0
            }
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_migrate_up(self, args) -> None:
        """Manually apply pending migrations."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "error", "error": "Database does not exist"}
                print(json.dumps(result), file=sys.stderr)
                sys.exit(1)

            runner = MigrationRunner(db_path, args.scope)
            result = runner.run_migrations(auto=args.auto)
            print(json.dumps(result))

            if result["status"] != "ok":
                sys.exit(1)
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_migrate_history(self, args) -> None:
        """Show migration history."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "ok", "history": []}
                print(json.dumps(result))
                return

            runner = MigrationRunner(db_path, args.scope)
            history = runner.get_migration_history()

            result = {"status": "ok", "history": history}
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_migrate_verify(self, args) -> None:
        """Verify database integrity."""
        try:
            db_path = self.get_db_path(args.scope, args.project_path)

            if not db_path.exists():
                result = {"status": "error", "error": "Database does not exist"}
                print(json.dumps(result), file=sys.stderr)
                sys.exit(1)

            runner = MigrationRunner(db_path, args.scope)
            integrity_ok = runner.verify_integrity()

            result = {
                "status": "ok" if integrity_ok else "error",
                "integrity": "ok" if integrity_ok else "failed"
            }
            print(json.dumps(result))

            if not integrity_ok:
                sys.exit(1)
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def cmd_rollback_migration(self, args) -> None:
        """Rollback to backup before migration."""
        try:
            project_path = args.project_path or str(Path.cwd())

            # Find new encoding database and check for .migrated.bak
            encoded = self.encode_path(project_path)
            new_db_dir = self.data_dir / "projects" / encoded

            old_encoded = self.encode_path_legacy(project_path)
            old_backup_dir = self.data_dir / "projects" / f"{old_encoded}.migrated.bak"

            if not old_backup_dir.exists():
                result = {"status": "error", "error": "No migration backup found"}
                print(json.dumps(result), file=sys.stderr)
                sys.exit(1)

            # Create safety backup of new database
            if new_db_dir.exists():
                timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
                safety_backup = self.data_dir / "projects" / f"{encoded}.rollback-backup-{timestamp}"
                shutil.copytree(new_db_dir, safety_backup)
                print(f"Created safety backup: {safety_backup.name}", file=sys.stderr)

                # Remove new database
                shutil.rmtree(new_db_dir)

            # Restore old database
            old_db_dir = self.data_dir / "projects" / old_encoded
            shutil.move(str(old_backup_dir), str(old_db_dir))

            result = {
                "status": "ok",
                "message": "Rolled back to pre-migration database",
                "restored_path": str(old_db_dir)
            }
            print(json.dumps(result))
        except Exception as e:
            result = {"status": "error", "error": str(e)}
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

    def run(self):
        """Main entry point."""
        parser = argparse.ArgumentParser(
            description="Shared CLI for memory skills (mem-project and mem-global)"
        )
        subparsers = parser.add_subparsers(dest="command", help="Subcommand to run")

        # init command
        init_parser = subparsers.add_parser("init", help="Initialize database")
        init_parser.add_argument(
            "--scope",
            required=True,
            choices=["project", "global"],
            help="Scope of memory",
        )
        init_parser.add_argument(
            "--project-path",
            help="Project path (required for project scope)",
        )
        init_parser.set_defaults(func=self.cmd_init)

        # save-project command
        save_project_parser = subparsers.add_parser(
            "save-project", help="Save project session"
        )
        save_project_parser.add_argument(
            "--description", help="Session description"
        )
        save_project_parser.add_argument(
            "--project-path", help="Project path (defaults to cwd)"
        )
        save_project_parser.add_argument(
            "--session-id", help="Session ID (auto-generated if not provided)"
        )
        save_project_parser.add_argument(
            "--transcript", help="Transcript file path (defaults to stdin)"
        )
        save_project_parser.set_defaults(func=self.cmd_save_project)

        # save-checkpoint command
        save_checkpoint_parser = subparsers.add_parser(
            "save-checkpoint", help="Save a checkpoint session with task snapshot"
        )
        save_checkpoint_parser.add_argument(
            "--description", help="Checkpoint description"
        )
        save_checkpoint_parser.add_argument(
            "--project-path", help="Project path (defaults to cwd)"
        )
        save_checkpoint_parser.add_argument(
            "--session-id", help="Session ID (auto-generated if not provided)"
        )
        save_checkpoint_parser.add_argument(
            "--transcript", help="Transcript file path (defaults to stdin)"
        )
        save_checkpoint_parser.add_argument(
            "--task-dir", help="Name of task directory under ~/.claude/tasks/ to snapshot"
        )
        save_checkpoint_parser.add_argument(
            "--resume-context", help="AI-generated summary of where things stand"
        )
        save_checkpoint_parser.add_argument(
            "--plan-path", help="Path to the plan file being tracked"
        )
        save_checkpoint_parser.set_defaults(func=self.cmd_save_checkpoint)

        # save-global command
        save_global_parser = subparsers.add_parser(
            "save-global", help="Save global learning"
        )
        save_global_parser.add_argument(
            "--description", required=True, help="Learning description"
        )
        save_global_parser.add_argument(
            "--content", help="Learning content (defaults to stdin)"
        )
        save_global_parser.add_argument(
            "--category",
            choices=["pattern", "preference", "lesson", "technique", "general"],
            help="Learning category",
        )
        save_global_parser.add_argument(
            "--tags", help="Comma-separated tags"
        )
        save_global_parser.add_argument(
            "--source-project", help="Source project path"
        )
        save_global_parser.set_defaults(func=self.cmd_save_global)

        # list command
        list_parser = subparsers.add_parser("list", help="List records")
        list_parser.add_argument(
            "--scope",
            required=True,
            choices=["project", "global"],
            help="Scope of memory",
        )
        list_parser.add_argument(
            "--project-path", help="Project path (for project scope)"
        )
        list_parser.add_argument("--limit", type=int, help="Number of records to return")
        list_parser.add_argument(
            "--category", help="Category filter (for global scope)"
        )
        list_parser.set_defaults(func=self.cmd_list)

        # list-old command
        list_old_parser = subparsers.add_parser(
            "list-old", help="List records older than N days"
        )
        list_old_parser.add_argument(
            "--scope",
            required=True,
            choices=["project", "global"],
            help="Scope of memory",
        )
        list_old_parser.add_argument(
            "--older-than-days",
            type=int,
            required=True,
            help="Only show records older than this many days",
        )
        list_old_parser.add_argument(
            "--project-path", help="Project path (for project scope)"
        )
        list_old_parser.add_argument(
            "--limit", type=int, help="Number of records to return"
        )
        list_old_parser.set_defaults(func=self.cmd_list_old)

        # search command
        search_parser = subparsers.add_parser("search", help="Search records")
        search_parser.add_argument(
            "--scope",
            required=True,
            choices=["project", "global"],
            help="Scope of memory",
        )
        search_parser.add_argument("--query", required=True, help="FTS5 search query")
        search_parser.add_argument(
            "--project-path", help="Project path (for project scope)"
        )
        search_parser.add_argument("--limit", type=int, help="Number of results")
        search_parser.add_argument(
            "--plan-path", help="Filter by plan path (for project scope)"
        )
        search_parser.set_defaults(func=self.cmd_search)

        # show command
        show_parser = subparsers.add_parser("show", help="Show a record")
        show_parser.add_argument(
            "--scope",
            required=True,
            choices=["project", "global"],
            help="Scope of memory",
        )
        show_parser.add_argument("--id", type=int, required=True, help="Record ID")
        show_parser.add_argument(
            "--project-path", help="Project path (for project scope)"
        )
        show_parser.set_defaults(func=self.cmd_show)

        # delete command
        delete_parser = subparsers.add_parser("delete", help="Delete a record")
        delete_parser.add_argument(
            "--scope",
            required=True,
            choices=["project", "global"],
            help="Scope of memory",
        )
        delete_parser.add_argument("--id", type=int, required=True, help="Record ID")
        delete_parser.add_argument(
            "--project-path", help="Project path (for project scope)"
        )
        delete_parser.set_defaults(func=self.cmd_delete)

        # migrate command (with subcommands)
        migrate_parser = subparsers.add_parser("migrate", help="Database migration commands")
        migrate_subparsers = migrate_parser.add_subparsers(dest="migrate_command", help="Migration subcommand")

        # migrate status
        migrate_status_parser = migrate_subparsers.add_parser("status", help="Check migration status")
        migrate_status_parser.add_argument("--scope", required=True, choices=["project", "global"], help="Scope of memory")
        migrate_status_parser.add_argument("--project-path", help="Project path (for project scope)")
        migrate_status_parser.set_defaults(func=self.cmd_migrate_status)

        # migrate up
        migrate_up_parser = migrate_subparsers.add_parser("up", help="Apply pending migrations")
        migrate_up_parser.add_argument("--scope", required=True, choices=["project", "global"], help="Scope of memory")
        migrate_up_parser.add_argument("--project-path", help="Project path (for project scope)")
        migrate_up_parser.add_argument("--auto", action="store_true", help="Automatically proceed")
        migrate_up_parser.set_defaults(func=self.cmd_migrate_up)

        # migrate history
        migrate_history_parser = migrate_subparsers.add_parser("history", help="Show migration history")
        migrate_history_parser.add_argument("--scope", required=True, choices=["project", "global"], help="Scope of memory")
        migrate_history_parser.add_argument("--project-path", help="Project path (for project scope)")
        migrate_history_parser.set_defaults(func=self.cmd_migrate_history)

        # migrate verify
        migrate_verify_parser = migrate_subparsers.add_parser("verify", help="Verify database integrity")
        migrate_verify_parser.add_argument("--scope", required=True, choices=["project", "global"], help="Scope of memory")
        migrate_verify_parser.add_argument("--project-path", help="Project path (for project scope)")
        migrate_verify_parser.set_defaults(func=self.cmd_migrate_verify)

        # rollback-migration command (separate from migrate subcommand)
        rollback_parser = subparsers.add_parser("rollback-migration", help="Rollback to pre-migration backup")
        rollback_parser.add_argument("--project-path", help="Project path (defaults to cwd)")
        rollback_parser.set_defaults(func=self.cmd_rollback_migration)

        args = parser.parse_args()

        if not args.command:
            parser.print_help()
            sys.exit(1)

        args.func(args)


if __name__ == "__main__":
    cli = MemoryCLI()
    cli.run()
