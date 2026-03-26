#!/usr/bin/env python3
"""
Metrics collection framework for Claude Code hooks.

Provides timing decorators and aggregation utilities for observing hook performance.
"""

import json
import time
import functools
from pathlib import Path
from datetime import datetime, timedelta
from typing import Callable, Any, Dict, List, Optional


METRICS_LOG = Path.home() / ".claude" / "logs" / "hook_metrics.jsonl"


def collect_metrics(hook_name: str) -> Callable:
    """
    Decorator to collect execution metrics for hooks.

    Logs timing, success/failure, and timestamp to hook_metrics.jsonl.
    Non-blocking - failures are logged but don't affect hook execution.

    Args:
        hook_name: Name of the hook being timed

    Example:
        @collect_metrics(hook_name="PreToolUse")
        def my_hook():
            # hook logic here
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            success = False
            error_msg = None

            try:
                result = func(*args, **kwargs)
                success = True
                return result
            except Exception as e:
                error_msg = str(e)
                raise
            finally:
                duration_ms = (time.time() - start_time) * 1000

                # Log metrics (non-blocking)
                try:
                    log_metric(
                        hook_name=hook_name,
                        duration_ms=duration_ms,
                        success=success,
                        error=error_msg
                    )
                except Exception:
                    # Swallow metrics logging errors - don't break hook
                    pass

        return wrapper
    return decorator


def log_metric(
    hook_name: str,
    duration_ms: float,
    success: bool,
    error: Optional[str] = None
) -> None:
    """
    Log a single metric event to hook_metrics.jsonl.

    Args:
        hook_name: Name of the hook
        duration_ms: Execution time in milliseconds
        success: Whether the hook succeeded
        error: Error message if failed
    """
    METRICS_LOG.parent.mkdir(parents=True, exist_ok=True)

    metric = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hook_name": hook_name,
        "duration_ms": round(duration_ms, 2),
        "success": success,
    }

    if error:
        metric["error"] = error

    with open(METRICS_LOG, "a") as f:
        f.write(json.dumps(metric) + "\n")


def get_hook_stats(hook_name: Optional[str] = None, hours: int = 24) -> Dict[str, Any]:
    """
    Aggregate metrics for a hook over a time window.

    Args:
        hook_name: Specific hook to filter (None = all hooks)
        hours: Time window in hours (default 24)

    Returns:
        Dictionary with aggregated statistics
    """
    if not METRICS_LOG.exists():
        return {"error": "No metrics collected yet"}

    from datetime import timezone
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

    metrics: List[Dict] = []
    with open(METRICS_LOG, "r") as f:
        for line in f:
            try:
                metric = json.loads(line.strip())
                timestamp = datetime.fromisoformat(metric["timestamp"].replace("Z", "+00:00"))

                if timestamp >= cutoff_time:
                    if hook_name is None or metric["hook_name"] == hook_name:
                        metrics.append(metric)
            except (json.JSONDecodeError, KeyError):
                continue

    if not metrics:
        return {"error": f"No metrics found for last {hours} hours"}

    # Compute statistics
    durations = [m["duration_ms"] for m in metrics]
    successes = sum(1 for m in metrics if m["success"])
    failures = len(metrics) - successes

    stats = {
        "hook_name": hook_name or "all_hooks",
        "time_window_hours": hours,
        "total_executions": len(metrics),
        "successes": successes,
        "failures": failures,
        "success_rate": round(successes / len(metrics) * 100, 2),
        "duration_ms": {
            "min": round(min(durations), 2),
            "max": round(max(durations), 2),
            "avg": round(sum(durations) / len(durations), 2),
            "p50": round(sorted(durations)[len(durations) // 2], 2),
            "p95": round(sorted(durations)[int(len(durations) * 0.95)], 2),
        }
    }

    # Group by hook name if showing all
    if hook_name is None:
        by_hook = {}
        for metric in metrics:
            name = metric["hook_name"]
            if name not in by_hook:
                by_hook[name] = []
            by_hook[name].append(metric["duration_ms"])

        stats["by_hook"] = {
            name: {
                "count": len(durations),
                "avg_ms": round(sum(durations) / len(durations), 2)
            }
            for name, durations in by_hook.items()
        }

    return stats


if __name__ == "__main__":
    # Test the metrics system
    @collect_metrics(hook_name="TestHook")
    def test_function():
        time.sleep(0.05)  # Simulate work
        return "success"

    # Run test
    print("Running test function...")
    test_function()

    # Show stats
    print("\nMetrics collected:")
    stats = get_hook_stats(hook_name="TestHook", hours=1)
    print(json.dumps(stats, indent=2))
