#!/usr/bin/env python3
"""
Audit logger mixin for Claude Code hooks.

Provides structured audit logging with PII filtering and severity levels.
"""

import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, Set


AUDIT_LOG = Path.home() / ".claude" / "logs" / "audit.jsonl"

# Patterns for PII/sensitive data detection
SENSITIVE_PATTERNS = {
    "api_key": re.compile(r"(api[_-]?key|apikey)[\s:=]+['\"]?([a-zA-Z0-9_-]{20,})['\"]?", re.IGNORECASE),
    "token": re.compile(r"(token|bearer)[\s:=]+['\"]?([a-zA-Z0-9_-]{20,})['\"]?", re.IGNORECASE),
    "password": re.compile(r"(password|passwd|pwd)[\s:=]+['\"]?([^\s'\"]+)['\"]?", re.IGNORECASE),
    "secret": re.compile(r"(secret|private[_-]?key)[\s:=]+['\"]?([a-zA-Z0-9_-]{20,})['\"]?", re.IGNORECASE),
}


class AuditLoggerMixin:
    """
    Mixin for structured audit logging.

    Provides:
    - Structured audit format with timestamp, event type, severity
    - Automatic PII filtering for sensitive fields
    - Append-only audit trail to audit.jsonl
    - Optional remote sync capability (off by default)
    """

    def __init__(self):
        """Initialize audit logger."""
        self._pii_filter_enabled = True
        self._sensitive_fields: Set[str] = {
            "password", "token", "api_key", "secret", "apikey",
            "private_key", "bearer", "authorization"
        }

    def log_audit_event(
        self,
        hook_name: str,
        event_type: str,
        severity: str = "INFO",
        tool_name: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        result: Optional[str] = None,
        user: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log a structured audit event.

        Args:
            hook_name: Name of the hook generating the event
            event_type: Type of event (e.g., "tool_execution", "validation_failure")
            severity: Event severity (DEBUG, INFO, WARN, ERROR, CRITICAL)
            tool_name: Name of tool being used (if applicable)
            parameters: Tool parameters or event details
            result: Outcome or result summary
            user: User identifier (defaults to system user)
            metadata: Additional event metadata
        """
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "hook_name": hook_name,
            "event_type": event_type,
            "severity": severity.upper(),
        }

        if tool_name:
            audit_entry["tool_name"] = tool_name

        if parameters:
            # Filter sensitive data from parameters
            filtered_params = self._filter_sensitive_data(parameters)
            audit_entry["parameters"] = filtered_params

        if result:
            audit_entry["result"] = result

        if user:
            audit_entry["user"] = user
        else:
            # Try to get system user
            import getpass
            try:
                audit_entry["user"] = getpass.getuser()
            except Exception:
                audit_entry["user"] = "unknown"

        if metadata:
            audit_entry["metadata"] = self._filter_sensitive_data(metadata)

        # Write to audit log
        self._write_audit_log(audit_entry)

    def _filter_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter sensitive data from dictionary.

        Args:
            data: Dictionary potentially containing sensitive data

        Returns:
            Dictionary with sensitive values redacted
        """
        if not self._pii_filter_enabled:
            return data

        filtered = {}
        for key, value in data.items():
            # Check if key name indicates sensitive data
            if any(sensitive in key.lower() for sensitive in self._sensitive_fields):
                filtered[key] = "[REDACTED]"
            elif isinstance(value, str):
                # Check value against patterns
                filtered[key] = self._redact_patterns(value)
            elif isinstance(value, dict):
                # Recursively filter nested dicts
                filtered[key] = self._filter_sensitive_data(value)
            elif isinstance(value, list):
                # Filter list items
                filtered[key] = [
                    self._filter_sensitive_data(item) if isinstance(item, dict)
                    else self._redact_patterns(item) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                filtered[key] = value

        return filtered

    def _redact_patterns(self, text: str) -> str:
        """
        Redact sensitive patterns from text.

        Args:
            text: String to check for sensitive patterns

        Returns:
            String with sensitive values replaced with [REDACTED]
        """
        result = text
        for pattern_name, pattern in SENSITIVE_PATTERNS.items():
            result = pattern.sub(r"\1=[REDACTED]", result)
        return result

    def _write_audit_log(self, entry: Dict[str, Any]) -> None:
        """
        Write audit entry to log file.

        Args:
            entry: Audit log entry dictionary
        """
        AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(AUDIT_LOG, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            # Don't fail hook if audit logging fails
            print(f"Warning: Failed to write audit log: {e}", file=__import__("sys").stderr)

    def set_pii_filter(self, enabled: bool) -> None:
        """
        Enable or disable PII filtering.

        Args:
            enabled: True to enable PII filtering, False to disable
        """
        self._pii_filter_enabled = enabled

    def add_sensitive_field(self, field_name: str) -> None:
        """
        Add a custom field name to be treated as sensitive.

        Args:
            field_name: Field name to redact (case-insensitive)
        """
        self._sensitive_fields.add(field_name.lower())


if __name__ == "__main__":
    # Test audit logger
    class TestAuditHook(AuditLoggerMixin):
        def __init__(self):
            super().__init__()

    hook = TestAuditHook()

    # Log various audit events
    print("Logging test audit events...")

    # Event with sensitive parameters
    hook.log_audit_event(
        hook_name="TestHook",
        event_type="tool_execution",
        severity="INFO",
        tool_name="git",
        parameters={
            "command": "git push",
            "api_key": "sk_test_secret12345",
            "safe_param": "public_value"
        },
        result="success"
    )

    # Event with error
    hook.log_audit_event(
        hook_name="TestHook",
        event_type="validation_failure",
        severity="ERROR",
        parameters={"file": "settings.json"},
        result="Schema validation failed",
        metadata={"error_count": 3}
    )

    # High-severity event
    hook.log_audit_event(
        hook_name="TestHook",
        event_type="security_alert",
        severity="CRITICAL",
        result="Suspicious activity detected",
        metadata={"reason": "Multiple failed auth attempts"}
    )

    print(f"\nAudit log written to: {AUDIT_LOG}")
    print("\nRecent audit entries:")
    with open(AUDIT_LOG) as f:
        for line in f.readlines()[-3:]:
            print(json.dumps(json.loads(line), indent=2))
