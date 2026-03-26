#!/usr/bin/env python3
"""
Example: Audit trail hook with structured logging.

Demonstrates AuditLoggerMixin for comprehensive tool usage auditing.

Usage:
    Add to settings.json as PostToolUse hook:
    "PostToolUse": {
        "type": "python",
        "command": "uv run ~/.claude/hooks/examples/audit_trail_hook.py"
    }
"""

import sys
import json
from pathlib import Path

# Add hooks directory to path
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))

from templates import BaseHook, AuditLoggerMixin


class AuditTrailHook(BaseHook, AuditLoggerMixin):
    """
    PostToolUse hook that logs comprehensive audit trails.

    Tracks all tool usage with structured logging, PII filtering,
    and severity levels.
    """

    def __init__(self, input_data: dict):
        """Initialize audit hook."""
        BaseHook.__init__(self, hook_name="AuditTrail", log_level="INFO")
        AuditLoggerMixin.__init__(self)

        self.input_data = input_data
        self.tool_name = input_data.get('tool_name', 'unknown')
        self.tool_input = input_data.get('tool_input', {})
        self.tool_output = input_data.get('tool_output', {})
        self.success = input_data.get('success', True)

    def _determine_severity(self) -> str:
        """Determine audit log severity based on tool and outcome."""
        # Critical tools that need high attention
        critical_tools = ['Bash', 'Write', 'Edit', 'MultiEdit']

        if not self.success:
            return "ERROR"
        elif self.tool_name in critical_tools:
            return "WARN"
        else:
            return "INFO"

    def _is_high_value_tool(self) -> bool:
        """Check if tool usage should be audited."""
        # Audit file modifications and command executions
        high_value_tools = [
            'Bash',
            'Write',
            'Edit',
            'MultiEdit',
            'NotebookEdit',
        ]
        return self.tool_name in high_value_tools

    def execute(self):
        """Main hook logic - log audit trail."""
        # Only audit high-value tools
        if not self._is_high_value_tool():
            self.logger.debug(f"Skipping audit for low-value tool: {self.tool_name}")
            return

        # Determine severity
        severity = self._determine_severity()

        # Extract key parameters for audit
        parameters = {}
        if self.tool_name == 'Bash':
            parameters = {
                'command': self.tool_input.get('command', ''),
                'timeout': self.tool_input.get('timeout'),
            }
        elif self.tool_name in ['Write', 'Edit']:
            parameters = {
                'file_path': self.tool_input.get('file_path', ''),
                'content_length': len(self.tool_input.get('content', '')),
            }
        elif self.tool_name == 'MultiEdit':
            parameters = {
                'file_path': self.tool_input.get('file_path', ''),
                'edit_count': len(self.tool_input.get('edits', [])),
            }

        # Determine result
        if self.success:
            result = "completed successfully"
        else:
            error = self.tool_output.get('error', 'unknown error')
            result = f"failed: {error}"

        # Log audit event
        self.log_audit_event(
            hook_name="AuditTrail",
            event_type="tool_execution",
            severity=severity,
            tool_name=self.tool_name,
            parameters=parameters,
            result=result,
        )

        self.logger.info(
            f"Audited {self.tool_name} execution: {result}"
        )


def main():
    """Entry point for hook execution."""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        # Create and run hook
        hook = AuditTrailHook(input_data)
        result = hook.run()

        sys.exit(result)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"Error in audit trail hook: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
