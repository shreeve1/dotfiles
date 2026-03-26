# Claude Code Hooks Enhancements

Production-grade enhancements for the Claude Code hooks system, adding templates, validation, metrics, and retry logic.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Hook Templates](#hook-templates)
- [Validation Tools](#validation-tools)
- [Performance Metrics](#performance-metrics)
- [Retry Configuration](#retry-configuration)
- [Migration Guide](#migration-guide)
- [Template API Reference](#template-api-reference)

---

## Overview

This enhancement system provides four core improvements to Claude Code hooks:

1. **Hook Templates** - Reusable base classes and mixins for common patterns
2. **Validation Layer** - CLI tool and pre-commit hook for settings.json validation
3. **Performance Metrics** - Automatic timing and statistics logging
4. **Retry Logic** - Exponential backoff for critical hooks

All enhancements are **non-breaking** and **opt-in**. Existing hooks continue working unchanged.

---

## Quick Start

### 1. Validate Your Configuration

```bash
# Validate settings.json
uv run ~/.claude/hooks/validate_hooks_config.py

# Auto-fix common issues
uv run ~/.claude/hooks/validate_hooks_config.py --fix
```

### 2. View Hook Metrics

```bash
# Show summary of all hooks (last 24 hours)
uv run ~/.claude/hooks/show_metrics.py

# Show specific hook details
uv run ~/.claude/hooks/show_metrics.py --hook SessionStart

# Show recent failures
uv run ~/.claude/hooks/show_metrics.py --failures
```

### 3. Enable Retry for Critical Hooks

Add to your `~/.claude/settings.json`:

```json
{
  "retryConfig": {
    "enabled": true,
    "criticalHooks": ["Setup", "SessionStart", "PreToolUse"],
    "maxAttempts": 3,
    "baseDelay": 1.0,
    "maxDelay": 10.0
  }
}
```

### 4. Install Pre-Commit Hook (Optional)

```bash
# Create git hooks directory if it doesn't exist
mkdir -p ~/.claude/.git/hooks

# Link pre-commit hook
ln -sf ~/.claude/hooks/.pre-commit-hook.sh ~/.claude/.git/hooks/pre-commit

# Make it executable
chmod +x ~/.claude/.git/hooks/pre-commit
```

---

## Hook Templates

### Overview

Templates provide reusable patterns for common hook implementations:

- **BaseHook** - Abstract base with metrics, logging, error handling
- **ContextInjectionMixin** - Git status, GitHub issues, project context
- **AuditLoggerMixin** - Structured audit trails with PII filtering

### Using BaseHook

```python
#!/usr/bin/env python3
import sys
from pathlib import Path

# Add hooks directory to path
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))

from templates import BaseHook

class MyCustomHook(BaseHook):
    def __init__(self):
        super().__init__(hook_name="MyHook", log_level="INFO")

    def execute(self):
        """Implement your hook logic here."""
        self.logger.info("Hook executing...")
        # Your logic here
        return {"status": "success"}

# Entry point
hook = MyCustomHook()
sys.exit(hook.run())  # Automatically handles metrics & errors
```

**Features:**
- ✅ Automatic metrics collection
- ✅ Structured logging to `.claude/logs/`
- ✅ Graceful error handling
- ✅ Standard execution pattern

### Using ContextInjectionMixin

```python
from templates import BaseHook, ContextInjectionMixin

class ContextAwareHook(BaseHook, ContextInjectionMixin):
    def __init__(self):
        BaseHook.__init__(self, hook_name="ContextHook", log_level="INFO")
        ContextInjectionMixin.__init__(self)

    def execute(self):
        # Inject all available context
        context = self.inject_all_context()

        # Or inject specific context
        git_context = self.inject_git_context()
        issue_context = self.inject_issue_context(limit=5)
        project_context = self.inject_project_context()

        return {
            "hookSpecificOutput": {
                "additionalContext": context
            }
        }
```

**Available Methods:**
- `inject_git_context()` - Current branch, uncommitted changes, recent commits
- `inject_issue_context(limit=5)` - Recent GitHub issues via gh CLI
- `inject_project_context()` - README summary, recent file changes
- `inject_all_context()` - Combines all context sources

**Caching:** 5-minute TTL to avoid redundant CLI calls.

### Using AuditLoggerMixin

```python
from templates import BaseHook, AuditLoggerMixin

class AuditHook(BaseHook, AuditLoggerMixin):
    def __init__(self):
        BaseHook.__init__(self, hook_name="AuditHook", log_level="INFO")
        AuditLoggerMixin.__init__(self)

    def execute(self):
        # Log structured audit event
        self.log_audit_event(
            hook_name="AuditHook",
            event_type="tool_execution",
            severity="INFO",
            tool_name="Bash",
            parameters={"command": "git status"},
            result="success"
        )
```

**Features:**
- ✅ Structured JSON logging to `.claude/logs/audit.jsonl`
- ✅ Automatic PII filtering (API keys, tokens, passwords)
- ✅ Severity levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
- ✅ Configurable sensitive field detection

**Audit Log Format:**
```json
{
  "timestamp": "2024-02-03T10:30:45Z",
  "hook_name": "AuditHook",
  "event_type": "tool_execution",
  "severity": "INFO",
  "tool_name": "Bash",
  "parameters": {"command": "git status"},
  "result": "success",
  "user": "james"
}
```

---

## Validation Tools

### CLI Validator

Validate settings.json against JSON schema:

```bash
# Basic validation
uv run ~/.claude/hooks/validate_hooks_config.py ~/.claude/settings.json

# Auto-fix common issues
uv run ~/.claude/hooks/validate_hooks_config.py --fix

# JSON output for scripts
uv run ~/.claude/hooks/validate_hooks_config.py --json
```

**Checks:**
- ✅ JSON syntax validity
- ✅ Schema compliance (all hook fields correct)
- ✅ File path existence (script files exist)
- ✅ Command format (`uv run` for Python hooks)

**Auto-Fixes:**
- Adds missing `uv run` prefix to Python hooks
- Corrects path separators

### Pre-Commit Hook

Blocks commits with invalid settings.json:

```bash
# Install
ln -sf ~/.claude/hooks/.pre-commit-hook.sh ~/.claude/.git/hooks/pre-commit

# Test by modifying settings.json
echo 'invalid json' >> ~/.claude/settings.json
git add settings.json
git commit -m "test"  # Will be blocked

# Skip validation (not recommended)
git commit --no-verify -m "bypass"
```

### JSON Schema

Full schema available at `~/.claude/hooks/schemas/settings_schema.json`.

**Key Sections:**
- `hooks` - All 13 hook types with validation
- `retryConfig` - Retry behavior configuration
- `metricsConfig` - Metrics collection settings

---

## Performance Metrics

### Automatic Collection

Metrics are collected automatically for all hooks using the `@collect_metrics` decorator.

**Collected Data:**
- Execution duration (ms)
- Success/failure status
- Timestamp (UTC)
- Error messages (if failed)

**Log Location:** `~/.claude/logs/hook_metrics.jsonl`

### Viewing Metrics

```bash
# Summary of all hooks (last 24 hours)
uv run ~/.claude/hooks/show_metrics.py

# Last 7 days
uv run ~/.claude/hooks/show_metrics.py --last 7d

# Specific hook
uv run ~/.claude/hooks/show_metrics.py --hook PreToolUse

# Recent failures
uv run ~/.claude/hooks/show_metrics.py --failures

# JSON output
uv run ~/.claude/hooks/show_metrics.py --json
```

### Programmatic Access

```python
from utils.metrics import get_hook_stats

# Get stats for all hooks
stats = get_hook_stats(hours=24)
print(f"Average duration: {stats['duration_ms']['avg']} ms")

# Get stats for specific hook
stats = get_hook_stats(hook_name="SessionStart", hours=24)
print(f"Success rate: {stats['success_rate']}%")
```

### Log Rotation

If `hook_metrics.jsonl` exceeds 10MB, implement rotation:

```bash
# Manual rotation script (create if needed)
uv run ~/.claude/hooks/rotate_logs.py
```

---

## Retry Configuration

### Overview

Critical hooks can automatically retry on transient failures using exponential backoff.

**Default Behavior:** Retries disabled (must explicitly enable).

### Enabling Retries

Add to `~/.claude/settings.json`:

```json
{
  "retryConfig": {
    "enabled": true,
    "criticalHooks": ["Setup", "SessionStart", "PreToolUse"],
    "maxAttempts": 3,
    "baseDelay": 1.0,
    "maxDelay": 10.0
  }
}
```

**Parameters:**
- `enabled` - Must be `true` to activate retries
- `criticalHooks` - Array of hook names to retry
- `maxAttempts` - Number of retry attempts (1-10)
- `baseDelay` - Initial delay in seconds (0.1-10.0)
- `maxDelay` - Maximum delay cap in seconds (1.0-60.0)

### Retry Behavior

**Exponential Backoff:**
```
Attempt 1: Delay = baseDelay (1s)
Attempt 2: Delay = baseDelay * 2 (2s)
Attempt 3: Delay = baseDelay * 4 (4s)
Max: Capped at maxDelay (10s)
```

**Logged to:** `~/.claude/logs/hook_retries.jsonl`

### Adding Retry to Custom Hooks

```python
from utils.retry import retry_on_failure, load_retry_config

@retry_on_failure(hook_name="MyHook", policy=load_retry_config())
def my_hook_function():
    # Function will auto-retry on failure
    # using settings from settings.json
    pass
```

**Custom Policy:**
```python
from utils.retry import RetryPolicy, retry_on_failure

policy = RetryPolicy(
    max_attempts=5,
    base_delay=0.5,
    max_delay=15.0,
    exceptions=(ConnectionError, TimeoutError)  # Only retry these
)

@retry_on_failure(hook_name="MyHook", policy=policy)
def my_hook_function():
    pass
```

---

## Migration Guide

### Adopting Templates in Existing Hooks

#### Step 1: Add Template Imports

```python
#!/usr/bin/env python3
import sys
from pathlib import Path

# Add this to import templates
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))
from templates import BaseHook, ContextInjectionMixin
```

#### Step 2: Convert to Class-Based Hook

**Before:**
```python
def main():
    # Hook logic here
    pass

if __name__ == '__main__':
    main()
```

**After:**
```python
class MyHook(BaseHook):
    def __init__(self):
        super().__init__(hook_name="MyHook", log_level="INFO")

    def execute(self):
        # Hook logic here
        return result

# Entry point
hook = MyHook()
sys.exit(hook.run())
```

#### Step 3: Add Context Injection (Optional)

```python
class MyHook(BaseHook, ContextInjectionMixin):
    def __init__(self):
        BaseHook.__init__(self, hook_name="MyHook")
        ContextInjectionMixin.__init__(self)

    def execute(self):
        context = self.inject_git_context()
        # Use context in hook logic
        return {"additionalContext": context}
```

### Adding Metrics to Existing Hooks

**Option 1: Use @collect_metrics Decorator**

```python
from utils.metrics import collect_metrics

@collect_metrics(hook_name="MyHook")
def main():
    # Existing hook logic
    pass
```

**Option 2: Switch to BaseHook Template**

Templates include automatic metrics collection - no decorator needed.

---

## Template API Reference

### BaseHook

**Abstract base class for all hooks.**

```python
class BaseHook(ABC):
    def __init__(self, hook_name: str, log_level: str = "INFO")

    @abstractmethod
    def execute(self) -> Any:
        """Implement hook logic here."""
        pass

    def run(self) -> int:
        """Execute with metrics & error handling. Returns exit code."""
        pass
```

**Methods:**
- `__init__(hook_name, log_level)` - Initialize hook with name and log level
- `execute()` - Abstract method - implement your hook logic
- `run()` - Execute hook with automatic metrics/error handling

**Attributes:**
- `self.hook_name` - Name of the hook
- `self.logger` - Configured Python logger

### ContextInjectionMixin

**Provides context injection methods.**

```python
class ContextInjectionMixin:
    def inject_git_context(self) -> str
    def inject_issue_context(self, limit: int = 5) -> str
    def inject_project_context(self) -> str
    def inject_all_context(self) -> str
```

**Methods:**
- `inject_git_context()` - Branch, changes, commits
- `inject_issue_context(limit)` - Recent GitHub issues
- `inject_project_context()` - README, recent changes
- `inject_all_context()` - Combines all sources

**Caching:** 5-minute TTL, thread-safe.

### AuditLoggerMixin

**Provides structured audit logging.**

```python
class AuditLoggerMixin:
    def log_audit_event(
        self,
        hook_name: str,
        event_type: str,
        severity: str = "INFO",
        tool_name: Optional[str] = None,
        parameters: Optional[Dict] = None,
        result: Optional[str] = None,
        user: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> None
```

**Methods:**
- `log_audit_event()` - Log structured audit event
- `set_pii_filter(enabled)` - Enable/disable PII filtering
- `add_sensitive_field(field_name)` - Add custom sensitive field

**Log Format:** Append-only JSONL to `~/.claude/logs/audit.jsonl`

### Metrics Utilities

```python
from utils.metrics import collect_metrics, get_hook_stats, log_metric

# Decorator for automatic metrics
@collect_metrics(hook_name="MyHook")
def my_function():
    pass

# Get aggregated stats
stats = get_hook_stats(hook_name="MyHook", hours=24)

# Manual logging
log_metric(
    hook_name="MyHook",
    duration_ms=123.45,
    success=True,
    error=None
)
```

### Retry Utilities

```python
from utils.retry import retry_on_failure, load_retry_config, RetryPolicy

# Load config from settings.json
policy = load_retry_config()

# Custom policy
policy = RetryPolicy(
    max_attempts=3,
    base_delay=1.0,
    max_delay=10.0,
    exceptions=(ConnectionError,)
)

# Apply retry decorator
@retry_on_failure(hook_name="MyHook", policy=policy)
def my_function():
    pass
```

---

## Examples

See `~/.claude/hooks/examples/` for complete examples:

- `templated_session_start.py` - SessionStart with context injection
- `custom_context_hook.py` - Custom context sources
- `audit_trail_hook.py` - Comprehensive audit logging

---

## Troubleshooting

### Metrics Not Collecting

Check log file permissions:
```bash
ls -la ~/.claude/logs/hook_metrics.jsonl
```

Ensure directory is writable:
```bash
chmod 755 ~/.claude/logs
```

### Validation Failing

Run with verbose output:
```bash
uv run ~/.claude/hooks/validate_hooks_config.py --json
```

Check schema:
```bash
cat ~/.claude/hooks/schemas/settings_schema.json | jq .
```

### Retries Not Working

Verify configuration:
```bash
cat ~/.claude/settings.json | jq '.retryConfig'
```

Check retry log:
```bash
cat ~/.claude/logs/hook_retries.jsonl
```

### Template Import Errors

Ensure hooks directory is in path:
```python
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))
```

Verify templates exist:
```bash
ls ~/.claude/hooks/templates/
```

---

## Performance Characteristics

**Metrics Overhead:** <10ms per hook (99th percentile)
**Retry Timeout:** 10 seconds max per attempt
**Context Cache TTL:** 5 minutes
**Log Rotation Threshold:** 10MB

---

## License

Part of Claude Code hooks system. See main Claude Code documentation for licensing.
