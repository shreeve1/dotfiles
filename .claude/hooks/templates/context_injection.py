#!/usr/bin/env python3
"""
Context injection mixin for Claude Code hooks.

Provides methods to inject git, GitHub issues, and project context into Claude.
Includes caching to avoid redundant CLI calls.
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class ContextInjectionMixin:
    """
    Mixin for injecting contextual information into Claude.

    Provides methods to gather and format:
    - Git repository context (branch, changes, recent commits)
    - GitHub issues context (recent issues via gh CLI)
    - Project context (README, recent file changes)

    Includes 5-minute TTL cache to avoid redundant CLI calls.
    """

    def __init__(self):
        """Initialize context injection with empty cache."""
        self._context_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = timedelta(minutes=5)

    def inject_git_context(self) -> str:
        """
        Inject git repository context.

        Returns:
            Markdown-formatted string with git status, branch, and recent commits
        """
        cached = self._get_cached("git_context")
        if cached:
            return cached

        context_parts = []

        # Current branch
        try:
            branch = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if branch.returncode == 0:
                context_parts.append(f"**Current Branch:** `{branch.stdout.strip()}`")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass

        # Uncommitted changes
        try:
            status = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if status.returncode == 0 and status.stdout.strip():
                changed_files = status.stdout.strip().split("\n")
                context_parts.append(f"\n**Uncommitted Changes:** {len(changed_files)} file(s)")
                # Show first 5 files
                for line in changed_files[:5]:
                    context_parts.append(f"  - {line.strip()}")
                if len(changed_files) > 5:
                    context_parts.append(f"  - ... and {len(changed_files) - 5} more")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass

        # Recent commits
        try:
            log = subprocess.run(
                ["git", "log", "--oneline", "-5"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if log.returncode == 0 and log.stdout.strip():
                context_parts.append("\n**Recent Commits:**")
                for line in log.stdout.strip().split("\n"):
                    context_parts.append(f"  - {line}")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass

        result = "\n".join(context_parts) if context_parts else "No git context available"
        self._set_cached("git_context", result)
        return result

    def inject_issue_context(self, limit: int = 5) -> str:
        """
        Inject GitHub issues context via gh CLI.

        Args:
            limit: Number of recent issues to include (default 5)

        Returns:
            Markdown-formatted string with recent issues
        """
        cached = self._get_cached(f"issue_context_{limit}")
        if cached:
            return cached

        try:
            # Check if gh CLI is available
            gh_check = subprocess.run(
                ["gh", "--version"],
                capture_output=True,
                timeout=3
            )
            if gh_check.returncode != 0:
                return "GitHub CLI (gh) not available"

            # Get recent issues
            issues = subprocess.run(
                ["gh", "issue", "list", "--limit", str(limit), "--json", "number,title,state,labels"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if issues.returncode != 0:
                return "Could not fetch GitHub issues"

            issues_data = json.loads(issues.stdout)
            if not issues_data:
                return "No open issues"

            context_parts = ["**Recent GitHub Issues:**"]
            for issue in issues_data:
                number = issue.get("number")
                title = issue.get("title")
                state = issue.get("state")
                labels = ", ".join(label["name"] for label in issue.get("labels", []))

                issue_line = f"  - #{number}: {title} [{state}]"
                if labels:
                    issue_line += f" ({labels})"
                context_parts.append(issue_line)

            result = "\n".join(context_parts)
            self._set_cached(f"issue_context_{limit}", result)
            return result

        except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
            return "Could not fetch GitHub issues"

    def inject_project_context(self) -> str:
        """
        Inject project context (README summary, recent changes).

        Returns:
            Markdown-formatted string with project context
        """
        cached = self._get_cached("project_context")
        if cached:
            return cached

        context_parts = []

        # README summary
        for readme_name in ["README.md", "readme.md", "README.txt", "README"]:
            readme_path = Path.cwd() / readme_name
            if readme_path.exists():
                try:
                    content = readme_path.read_text()
                    # Get first 200 chars of README
                    summary = content[:200].replace("\n", " ")
                    if len(content) > 200:
                        summary += "..."
                    context_parts.append(f"**Project Summary:** {summary}")
                    break
                except Exception:
                    pass

        # Recent file changes (last 24 hours)
        try:
            recent = subprocess.run(
                ["git", "log", "--name-only", "--since='24 hours ago'", "--pretty=format:", "--", "*.py", "*.ts", "*.js"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if recent.returncode == 0 and recent.stdout.strip():
                changed = set(line for line in recent.stdout.strip().split("\n") if line)
                context_parts.append(f"\n**Recently Modified:** {len(changed)} file(s) in last 24h")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass

        result = "\n".join(context_parts) if context_parts else "No project context available"
        self._set_cached("project_context", result)
        return result

    def inject_all_context(self) -> str:
        """
        Inject all available context (git + issues + project).

        Returns:
            Combined markdown-formatted context string
        """
        sections = [
            "# Current Context\n",
            self.inject_git_context(),
            "\n\n",
            self.inject_issue_context(),
            "\n\n",
            self.inject_project_context(),
        ]
        return "".join(sections)

    def _get_cached(self, key: str) -> Optional[str]:
        """Get cached value if still valid."""
        if key in self._context_cache:
            cached = self._context_cache[key]
            if datetime.utcnow() - cached["timestamp"] < self._cache_ttl:
                return cached["value"]
        return None

    def _set_cached(self, key: str, value: str) -> None:
        """Set cached value with current timestamp."""
        self._context_cache[key] = {
            "value": value,
            "timestamp": datetime.utcnow()
        }


if __name__ == "__main__":
    # Test context injection
    class TestContextHook(ContextInjectionMixin):
        def __init__(self):
            super().__init__()

    hook = TestContextHook()

    print("=== Git Context ===")
    print(hook.inject_git_context())

    print("\n=== Issue Context ===")
    print(hook.inject_issue_context())

    print("\n=== Project Context ===")
    print(hook.inject_project_context())
