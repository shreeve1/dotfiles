#!/usr/bin/env python3
"""
Example: Custom context hook with external data.

Shows how to extend ContextInjectionMixin to add custom context sources
(e.g., weather, stock prices, API data).

Usage:
    Modify this file to add your custom context sources, then use in settings.json.
"""

import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Add hooks directory to path
sys.path.insert(0, str(Path.home() / ".claude" / "hooks"))

from templates import BaseHook, ContextInjectionMixin


class CustomContextHook(BaseHook, ContextInjectionMixin):
    """
    Hook with custom context injection.

    Extends standard context injection with custom data sources.
    """

    def __init__(self, input_data: dict):
        """Initialize hook."""
        BaseHook.__init__(self, hook_name="CustomContext", log_level="INFO")
        ContextInjectionMixin.__init__(self)

        self.input_data = input_data

    def inject_system_status(self) -> str:
        """
        Inject system status information.

        Example custom context: system uptime, disk usage, etc.
        """
        context_parts = ["**System Status:**"]

        # Get system uptime
        try:
            uptime = subprocess.run(
                ["uptime"],
                capture_output=True,
                text=True,
                timeout=3
            )
            if uptime.returncode == 0:
                context_parts.append(f"  - {uptime.stdout.strip()}")
        except Exception:
            pass

        # Get disk usage for current directory
        try:
            df = subprocess.run(
                ["df", "-h", "."],
                capture_output=True,
                text=True,
                timeout=3
            )
            if df.returncode == 0:
                lines = df.stdout.strip().split("\n")
                if len(lines) > 1:
                    context_parts.append(f"  - Disk: {lines[1]}")
        except Exception:
            pass

        return "\n".join(context_parts)

    def inject_time_context(self) -> str:
        """
        Inject time-based context.

        Example: current time, timezone, working hours.
        """
        now = datetime.now()

        context_parts = ["**Time Context:**"]
        context_parts.append(f"  - Current time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
        context_parts.append(f"  - Day of week: {now.strftime('%A')}")

        # Check if it's during working hours
        hour = now.hour
        if 9 <= hour < 17:
            context_parts.append("  - Status: During working hours")
        else:
            context_parts.append("  - Status: Outside working hours")

        return "\n".join(context_parts)

    def inject_custom_api_data(self) -> str:
        """
        Inject data from external APIs.

        Placeholder for custom API integration.
        Replace with your actual API calls.
        """
        context_parts = ["**External Data:**"]

        # Example: You could call a weather API, stock API, etc.
        # For now, just a placeholder
        context_parts.append("  - Note: Add your custom API integrations here")

        # Example pattern for API call:
        # try:
        #     response = requests.get("https://api.example.com/data", timeout=5)
        #     if response.status_code == 200:
        #         data = response.json()
        #         context_parts.append(f"  - Data: {data['value']}")
        # except Exception as e:
        #     self.logger.warning(f"Failed to fetch API data: {e}")

        return "\n".join(context_parts)

    def execute(self):
        """Main hook logic - inject all custom context."""
        self.logger.info("Injecting custom context")

        # Combine standard and custom context
        sections = [
            "# Custom Context\n",
            self.inject_git_context(),
            "\n\n",
            self.inject_time_context(),
            "\n\n",
            self.inject_system_status(),
            "\n\n",
            self.inject_custom_api_data(),
        ]

        full_context = "".join(sections)

        return {
            "hookSpecificOutput": {
                "hookEventName": "CustomContext",
                "additionalContext": full_context
            }
        }


def main():
    """Entry point for hook execution."""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        # Create and run hook
        hook = CustomContextHook(input_data)
        result = hook.run()

        # If successful, output result
        if result == 0:
            output = hook.execute()
            print(json.dumps(output))

        sys.exit(result)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"Error in custom context hook: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
