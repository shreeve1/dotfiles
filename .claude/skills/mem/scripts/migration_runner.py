#!/usr/bin/env python3
"""
Migration framework for memory system databases.
Handles schema versioning, automatic migrations, and integrity verification.
"""

import sqlite3
import sys
import json
import importlib.util
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple


class MigrationError(Exception):
    """Raised when migration fails."""
    pass


class DatabaseCorruptError(Exception):
    """Raised when database corruption detected."""
    pass


class VersionMismatchError(Exception):
    """Raised when database version is newer than supported."""
    pass


class MigrationRunner:
    """Handles database migrations with transaction safety and verification."""

    def __init__(self, db_path: Path, scope: str):
        """
        Initialize migration runner.

        Args:
            db_path: Path to the database file
            scope: Either "project" or "global"
        """
        self.db_path = db_path
        self.scope = scope
        self.migrations_dir = Path(__file__).parent / "migrations" / scope

    def get_current_version(self) -> int:
        """Get current database schema version."""
        if not self.db_path.exists():
            return 0

        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            cursor.execute("PRAGMA user_version")
            version = cursor.fetchone()[0]
            conn.close()
            return version
        except Exception as e:
            raise DatabaseCorruptError(f"Failed to read database version: {e}")

    def set_version(self, version: int) -> None:
        """Set database schema version."""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA user_version = {version}")
            conn.commit()
            conn.close()
        except Exception as e:
            raise MigrationError(f"Failed to set database version: {e}")

    def get_target_version(self) -> int:
        """Get latest migration version available."""
        if not self.migrations_dir.exists():
            return 0

        max_version = 0
        for migration_file in self.migrations_dir.glob("*.py"):
            if migration_file.stem.startswith("__"):
                continue
            # Extract version from filename (e.g., "001_initial_schema.py" -> 1)
            try:
                version_str = migration_file.stem.split("_")[0]
                version = int(version_str)
                max_version = max(max_version, version)
            except (ValueError, IndexError):
                continue

        return max_version

    def needs_migration(self) -> bool:
        """Check if database needs migration."""
        current = self.get_current_version()
        target = self.get_target_version()
        return current < target

    def get_pending_migrations(self) -> List[Path]:
        """Get list of pending migration files in order."""
        current_version = self.get_current_version()
        target_version = self.get_target_version()

        pending = []
        for version in range(current_version + 1, target_version + 1):
            # Find migration file for this version
            pattern = f"{version:03d}_*.py"
            matches = list(self.migrations_dir.glob(pattern))
            if matches:
                pending.append(matches[0])

        return pending

    def create_backup(self) -> Optional[Path]:
        """Create timestamped backup of database."""
        if not self.db_path.exists():
            return None

        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
        backup_path = self.db_path.parent / f"{self.db_path.name}.backup-{timestamp}"

        try:
            # Use SQLite backup API for safe backup
            import shutil
            shutil.copy2(self.db_path, backup_path)

            # Also backup WAL and SHM files if they exist
            for suffix in ["-wal", "-shm"]:
                wal_path = Path(str(self.db_path) + suffix)
                if wal_path.exists():
                    shutil.copy2(wal_path, Path(str(backup_path) + suffix))

            return backup_path
        except Exception as e:
            raise MigrationError(f"Failed to create backup: {e}")

    def cleanup_old_backups(self, keep_count: int = 3) -> None:
        """Remove old backups, keeping most recent N."""
        if not self.db_path.exists():
            return

        # Find all backup files
        backup_pattern = f"{self.db_path.name}.backup-*"
        backups = sorted(
            self.db_path.parent.glob(backup_pattern),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        # Remove old backups (keep recent N)
        for backup in backups[keep_count:]:
            try:
                backup.unlink()
                # Also remove associated WAL/SHM files
                for suffix in ["-wal", "-shm"]:
                    wal_path = Path(str(backup) + suffix)
                    if wal_path.exists():
                        wal_path.unlink()
            except Exception:
                pass  # Ignore errors during cleanup

    def verify_integrity(self) -> bool:
        """Run SQLite integrity check."""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            result = cursor.fetchone()[0]
            conn.close()
            return result == "ok"
        except Exception as e:
            raise DatabaseCorruptError(f"Integrity check failed: {e}")

    def load_migration(self, migration_file: Path) -> object:
        """Load migration module from file."""
        try:
            spec = importlib.util.spec_from_file_location(
                f"migration_{migration_file.stem}",
                migration_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
        except Exception as e:
            raise MigrationError(f"Failed to load migration {migration_file}: {e}")

    def apply_migration(self, migration_file: Path, conn: sqlite3.Connection) -> None:
        """Apply a single migration file."""
        migration = self.load_migration(migration_file)

        # Validate migration has required attributes
        if not hasattr(migration, "VERSION"):
            raise MigrationError(f"Migration {migration_file} missing VERSION")
        if not hasattr(migration, "up"):
            raise MigrationError(f"Migration {migration_file} missing up() function")

        # Apply migration
        cursor = conn.cursor()
        try:
            migration.up(cursor)
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise MigrationError(f"Migration {migration_file} failed: {e}")

        # Run verification if provided
        if hasattr(migration, "verify"):
            try:
                migration.verify(cursor)
            except Exception as e:
                raise MigrationError(f"Migration {migration_file} verification failed: {e}")

    def run_migrations(self, auto: bool = True) -> Dict:
        """
        Run all pending migrations.

        Args:
            auto: If True, automatically proceed with migration

        Returns:
            Dict with status and details
        """
        try:
            # Check if migration needed
            if not self.needs_migration():
                return {
                    "status": "ok",
                    "message": "No migration needed",
                    "current_version": self.get_current_version()
                }

            current_version = self.get_current_version()
            target_version = self.get_target_version()
            pending = self.get_pending_migrations()

            # Verify integrity before migration
            if self.db_path.exists():
                if not self.verify_integrity():
                    return {
                        "status": "error",
                        "error": "Database integrity check failed before migration"
                    }

            # Create backup
            backup_path = self.create_backup()

            # Connect with immediate transaction lock
            conn = sqlite3.connect(str(self.db_path))
            conn.execute("BEGIN IMMEDIATE")

            try:
                # Apply each pending migration
                for migration_file in pending:
                    print(f"Applying migration: {migration_file.name}...", file=sys.stderr)
                    self.apply_migration(migration_file, conn)

                # Update version to target
                cursor = conn.cursor()
                cursor.execute(f"PRAGMA user_version = {target_version}")
                conn.commit()

                # Verify integrity after migration
                if not self.verify_integrity():
                    conn.rollback()
                    return {
                        "status": "error",
                        "error": "Database integrity check failed after migration",
                        "backup_path": str(backup_path) if backup_path else None
                    }

                # Cleanup old backups
                self.cleanup_old_backups()

                return {
                    "status": "ok",
                    "message": f"Migrated from v{current_version} to v{target_version}",
                    "current_version": target_version,
                    "migrations_applied": len(pending),
                    "backup_path": str(backup_path) if backup_path else None
                }

            except Exception as e:
                conn.rollback()
                conn.close()
                raise MigrationError(f"Migration failed: {e}")

            finally:
                conn.close()

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "current_version": self.get_current_version()
            }

    def get_migration_history(self) -> List[Dict]:
        """Get list of applied migrations (inferred from current version)."""
        current_version = self.get_current_version()
        history = []

        for version in range(1, current_version + 1):
            pattern = f"{version:03d}_*.py"
            matches = list(self.migrations_dir.glob(pattern))
            if matches:
                migration_file = matches[0]
                migration = self.load_migration(migration_file)
                description = getattr(migration, "DESCRIPTION", migration_file.stem)
                history.append({
                    "version": version,
                    "file": migration_file.name,
                    "description": description
                })

        return history


def create_lock_file(db_path: Path) -> Optional[Path]:
    """Create migration lock file to prevent concurrent migrations."""
    lock_path = db_path.parent / ".migration.lock"
    try:
        if lock_path.exists():
            # Check if lock is stale (older than 5 minutes)
            import time
            age = time.time() - lock_path.stat().st_mtime
            if age < 300:  # 5 minutes
                return None
            else:
                # Remove stale lock
                lock_path.unlink()

        lock_path.write_text(str(datetime.now().isoformat()))
        return lock_path
    except Exception:
        return None


def remove_lock_file(lock_path: Optional[Path]) -> None:
    """Remove migration lock file."""
    if lock_path and lock_path.exists():
        try:
            lock_path.unlink()
        except Exception:
            pass
