"""
Initial baseline schema for project databases.
This migration establishes the baseline for existing or new databases.
"""

VERSION = 1
DESCRIPTION = "Initial baseline schema"


def up(cursor):
    """Establish baseline for existing or new databases."""
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


def verify(cursor):
    """Verify baseline schema exists."""
    # Verify all required tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}
    required = {'sessions', 'file_changes', 'transcript_chunks', 'transcript_fts'}
    missing = required - tables
    assert not missing, f"Missing tables: {missing}"

    # Verify FTS5 is functional
    cursor.execute("SELECT COUNT(*) FROM transcript_fts")
    # Success if no exception


def down(cursor):
    """Rollback not supported for baseline migration."""
    raise NotImplementedError("Baseline cannot be rolled back")
