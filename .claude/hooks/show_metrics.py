#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "rich>=13.0.0",
# ]
# ///
"""
Display hook metrics summary.

Shows performance statistics and execution history for Claude Code hooks.
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
except ImportError:
    print("Error: rich not installed. Run with 'uv run' to auto-install.", file=sys.stderr)
    sys.exit(1)

# Import metrics utilities
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))
try:
    from utils.metrics import get_hook_stats, METRICS_LOG
except ImportError:
    print("Error: metrics utilities not found.", file=sys.stderr)
    sys.exit(1)


console = Console()


def show_summary(hours: int = 24):
    """Show summary of all hooks."""
    stats = get_hook_stats(hours=hours)

    if "error" in stats:
        console.print(f"[yellow]{stats['error']}[/yellow]")
        return

    # Create summary panel
    console.print(Panel(
        f"[bold]Hook Performance Summary[/bold]\n"
        f"Time window: Last {hours} hours\n"
        f"Total executions: {stats['total_executions']}\n"
        f"Success rate: {stats['success_rate']}%",
        title="Metrics Overview",
        border_style="blue"
    ))

    # Show stats by hook
    if "by_hook" in stats:
        table = Table(title=f"Performance by Hook (Last {hours}h)", show_header=True)
        table.add_column("Hook Name", style="cyan")
        table.add_column("Executions", justify="right")
        table.add_column("Avg Duration (ms)", justify="right", style="yellow")

        for hook_name, hook_stats in sorted(stats["by_hook"].items()):
            table.add_row(
                hook_name,
                str(hook_stats["count"]),
                f"{hook_stats['avg_ms']:.2f}"
            )

        console.print(table)

    # Show overall duration stats
    console.print("\n[bold]Duration Statistics (All Hooks)[/bold]")
    duration_table = Table(show_header=False)
    duration_table.add_column("Metric")
    duration_table.add_column("Value (ms)", justify="right")

    duration_table.add_row("Min", f"{stats['duration_ms']['min']:.2f}")
    duration_table.add_row("Average", f"{stats['duration_ms']['avg']:.2f}")
    duration_table.add_row("Median (p50)", f"{stats['duration_ms']['p50']:.2f}")
    duration_table.add_row("95th percentile", f"{stats['duration_ms']['p95']:.2f}")
    duration_table.add_row("Max", f"{stats['duration_ms']['max']:.2f}")

    console.print(duration_table)


def show_hook_details(hook_name: str, hours: int = 24):
    """Show detailed stats for a specific hook."""
    stats = get_hook_stats(hook_name=hook_name, hours=hours)

    if "error" in stats:
        console.print(f"[yellow]{stats['error']}[/yellow]")
        return

    # Create details panel
    console.print(Panel(
        f"[bold]{hook_name}[/bold]\n"
        f"Time window: Last {hours} hours\n"
        f"Total executions: {stats['total_executions']}\n"
        f"Successes: {stats['successes']}\n"
        f"Failures: {stats['failures']}\n"
        f"Success rate: {stats['success_rate']}%",
        title="Hook Details",
        border_style="green" if stats['success_rate'] > 95 else "yellow"
    ))

    # Duration stats table
    table = Table(title="Duration Statistics", show_header=True)
    table.add_column("Metric")
    table.add_column("Value (ms)", justify="right")

    table.add_row("Min", f"{stats['duration_ms']['min']:.2f}")
    table.add_row("Average", f"{stats['duration_ms']['avg']:.2f}")
    table.add_row("Median (p50)", f"{stats['duration_ms']['p50']:.2f}")
    table.add_row("95th percentile", f"{stats['duration_ms']['p95']:.2f}")
    table.add_row("Max", f"{stats['duration_ms']['max']:.2f}")

    console.print(table)


def show_recent_failures(limit: int = 10):
    """Show recent hook failures."""
    if not METRICS_LOG.exists():
        console.print("[yellow]No metrics collected yet[/yellow]")
        return

    failures = []
    with open(METRICS_LOG) as f:
        for line in f:
            try:
                metric = json.loads(line.strip())
                if not metric.get("success", True):
                    failures.append(metric)
            except json.JSONDecodeError:
                pass

    if not failures:
        console.print("[green]No failures found![/green]")
        return

    # Show most recent failures
    recent_failures = failures[-limit:]
    table = Table(title=f"Recent Failures (Last {limit})", show_header=True)
    table.add_column("Timestamp", style="dim")
    table.add_column("Hook")
    table.add_column("Error", style="red")

    for failure in reversed(recent_failures):
        timestamp = failure.get("timestamp", "unknown")
        hook_name = failure.get("hook_name", "unknown")
        error = failure.get("error", "Unknown error")

        # Truncate long errors
        if len(error) > 60:
            error = error[:57] + "..."

        table.add_row(timestamp[:19], hook_name, error)

    console.print(table)


def main():
    parser = argparse.ArgumentParser(
        description="Display Claude Code hook metrics"
    )
    parser.add_argument(
        "--last",
        default="24h",
        help="Time window (e.g., 1h, 24h, 7d)"
    )
    parser.add_argument(
        "--hook",
        help="Show details for specific hook"
    )
    parser.add_argument(
        "--failures",
        action="store_true",
        help="Show recent failures"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )

    args = parser.parse_args()

    # Parse time window
    time_str = args.last
    if time_str.endswith('h'):
        hours = int(time_str[:-1])
    elif time_str.endswith('d'):
        hours = int(time_str[:-1]) * 24
    else:
        hours = 24

    if args.failures:
        show_recent_failures()
    elif args.hook:
        if args.json:
            stats = get_hook_stats(hook_name=args.hook, hours=hours)
            print(json.dumps(stats, indent=2))
        else:
            show_hook_details(args.hook, hours=hours)
    else:
        if args.json:
            stats = get_hook_stats(hours=hours)
            print(json.dumps(stats, indent=2))
        else:
            show_summary(hours=hours)


if __name__ == "__main__":
    main()
