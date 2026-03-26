"""
Initial baseline schema for global databases.
This migration establishes the baseline for existing or new databases.
"""

VERSION = 1
DESCRIPTION = "Initial baseline schema"


def up(cursor):
    """Establish baseline for existing or new databases."""
    # Enable WAL mode for better concurrency
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


def verify(cursor):
    """Verify baseline schema exists."""
    # Verify all required tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}
    required = {'learnings', 'learnings_fts'}
    missing = required - tables
    assert not missing, f"Missing tables: {missing}"

    # Verify FTS5 is functional
    cursor.execute("SELECT COUNT(*) FROM learnings_fts")
    # Success if no exception


def down(cursor):
    """Rollback not supported for baseline migration."""
    raise NotImplementedError("Baseline cannot be rolled back")
