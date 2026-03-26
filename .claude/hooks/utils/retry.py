#!/usr/bin/env python3
"""
Retry logic utilities for Claude Code hooks.

Provides exponential backoff retry decorators with configurable policies.
"""

import json
import time
import functools
from pathlib import Path
from datetime import datetime
from typing import Callable, Any, Tuple, Type, Optional


RETRY_LOG = Path.home() / ".claude" / "logs" / "hook_retries.jsonl"


class RetryPolicy:
    """Configuration for retry behavior."""

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 10.0,
        exponential_base: float = 2.0,
        exceptions: Optional[Tuple[Type[Exception], ...]] = None
    ):
        """
        Initialize retry policy.

        Args:
            max_attempts: Maximum number of retry attempts (default 3)
            base_delay: Initial delay in seconds (default 1.0)
            max_delay: Maximum delay cap in seconds (default 10.0)
            exponential_base: Multiplier for exponential backoff (default 2.0)
            exceptions: Tuple of exception types to retry on (None = all exceptions)
        """
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.exceptions = exceptions

    def get_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number using exponential backoff."""
        delay = self.base_delay * (self.exponential_base ** attempt)
        return min(delay, self.max_delay)

    def should_retry(self, exception: Exception) -> bool:
        """Check if exception type should trigger retry."""
        if self.exceptions is None:
            return True
        return isinstance(exception, self.exceptions)


def retry_on_failure(
    hook_name: str,
    policy: Optional[RetryPolicy] = None
) -> Callable:
    """
    Decorator to add retry logic with exponential backoff.

    Automatically retries on failure using exponential backoff.
    Logs all retry attempts to hook_retries.jsonl.

    Args:
        hook_name: Name of the hook for logging
        policy: RetryPolicy instance (defaults to 3 attempts, 1s base delay)

    Example:
        @retry_on_failure(hook_name="SessionStart")
        def my_hook():
            # potentially flaky network call
            pass
    """
    if policy is None:
        policy = RetryPolicy()

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None

            for attempt in range(policy.max_attempts):
                try:
                    result = func(*args, **kwargs)

                    # Log successful retry if not first attempt
                    if attempt > 0:
                        log_retry(
                            hook_name=hook_name,
                            attempt=attempt + 1,
                            max_attempts=policy.max_attempts,
                            success=True,
                            error=None
                        )

                    return result

                except Exception as e:
                    last_exception = e

                    # Check if we should retry this exception type
                    if not policy.should_retry(e):
                        raise

                    # Log failed attempt
                    log_retry(
                        hook_name=hook_name,
                        attempt=attempt + 1,
                        max_attempts=policy.max_attempts,
                        success=False,
                        error=str(e)
                    )

                    # Don't sleep after last attempt
                    if attempt < policy.max_attempts - 1:
                        delay = policy.get_delay(attempt)
                        time.sleep(delay)

            # All attempts failed
            raise last_exception

        return wrapper
    return decorator


def log_retry(
    hook_name: str,
    attempt: int,
    max_attempts: int,
    success: bool,
    error: Optional[str]
) -> None:
    """
    Log a retry attempt to hook_retries.jsonl.

    Args:
        hook_name: Name of the hook
        attempt: Current attempt number
        max_attempts: Maximum attempts configured
        success: Whether this attempt succeeded
        error: Error message if failed
    """
    RETRY_LOG.parent.mkdir(parents=True, exist_ok=True)

    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hook_name": hook_name,
        "attempt": attempt,
        "max_attempts": max_attempts,
        "success": success,
    }

    if error:
        log_entry["error"] = error

    with open(RETRY_LOG, "a") as f:
        f.write(json.dumps(log_entry) + "\n")


def load_retry_config(settings_path: Optional[Path] = None) -> RetryPolicy:
    """
    Load retry configuration from settings.json.

    Args:
        settings_path: Path to settings.json (default ~/.claude/settings.json)

    Returns:
        RetryPolicy configured from settings, or default policy
    """
    if settings_path is None:
        settings_path = Path.home() / ".claude" / "settings.json"

    if not settings_path.exists():
        return RetryPolicy()

    try:
        with open(settings_path) as f:
            settings = json.load(f)

        retry_config = settings.get("retryConfig", {})

        if not retry_config.get("enabled", False):
            # Return policy with 1 attempt (no retries)
            return RetryPolicy(max_attempts=1)

        return RetryPolicy(
            max_attempts=retry_config.get("maxAttempts", 3),
            base_delay=retry_config.get("baseDelay", 1.0),
            max_delay=retry_config.get("maxDelay", 10.0),
        )

    except (json.JSONDecodeError, KeyError):
        return RetryPolicy()


if __name__ == "__main__":
    # Test the retry system
    import random

    class TestCounter:
        """Wrapper to track attempts in test."""
        def __init__(self):
            self.attempt_counter = 0

    counter = TestCounter()

    @retry_on_failure(
        hook_name="TestHook",
        policy=RetryPolicy(max_attempts=3, base_delay=0.5)
    )
    def flaky_function():
        counter.attempt_counter += 1
        print(f"Attempt {counter.attempt_counter}")

        # Fail first 2 attempts, succeed on 3rd
        if counter.attempt_counter < 3:
            raise ConnectionError("Simulated network failure")

        return "success"

    # Run test
    print("Testing retry logic (should succeed after 3 attempts)...")
    try:
        result = flaky_function()
        print(f"Result: {result}")
    except Exception as e:
        print(f"Failed: {e}")

    # Show retry log
    print("\nRetry log entries:")
    if RETRY_LOG.exists():
        with open(RETRY_LOG) as f:
            for line in f:
                print(json.dumps(json.loads(line), indent=2))
