#!/usr/bin/env python3
"""
Example: SessionStart hook using templates.

Demonstrates how to use BaseHook and ContextInjectionMixin to create
a context-aware session start hook.

Usage:
    Add to settings.json:
    "SessionStart": {
        "type": "python",
        "command": "uv run ~/.claude/hooks/examples/templated_session_start.py"
    }
"""

import sys
import json
from pathlib import Path

# Add hooks directory to path
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))

from templates import BaseHook, ContextInjectionMixin


class ContextAwareSessionStart(BaseHook, ContextInjectionMixin):
    """
    SessionStart hook that injects git, issue, and project context.

    Combines BaseHook (metrics, logging, error handling) with
    ContextInjectionMixin (git status, issues, project info).
    """

    def __init__(self, input_data: dict):
        """Initialize with session data."""
        BaseHook.__init__(self, hook_name="SessionStart", log_level="INFO")
        ContextInjectionMixin.__init__(self)

        self.input_data = input_data
        self.session_id = input_data.get('session_id', 'unknown')
        self.source = input_data.get('source', 'unknown')

    def execute(self):
        """Main hook logic - inject all available context."""
        self.logger.info(f"Starting session {self.session_id[:8]}... (source: {self.source})")

        # Gather all context using template mixin
        context = self.inject_all_context()

        # Add session-specific info
        session_info = f"\n## Session Info\n"
        session_info += f"- Session ID: {self.session_id[:12]}...\n"
        session_info += f"- Source: {self.source}\n"

        full_context = session_info + "\n" + context

        # Return context to be injected into Claude
        return {
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": full_context
            }
        }


def main():
    """Entry point for hook execution."""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        # Create and run hook
        hook = ContextAwareSessionStart(input_data)
        result = hook.run()

        # If successful, output result
        if result == 0 and hasattr(hook, 'execute'):
            output = hook.execute()
            print(json.dumps(output))

        sys.exit(result)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"Error in session start hook: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
