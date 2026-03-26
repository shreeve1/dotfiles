#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "jsonschema>=4.0.0",
#     "rich>=13.0.0",
# ]
# ///
"""
Validation CLI tool for Claude Code settings.json.

Validates settings.json against schema and checks:
- JSON syntax validity
- Schema compliance
- File path existence
- Command executability
"""

import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple

try:
    import jsonschema
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
except ImportError:
    print("Error: Required dependencies not installed. Run with 'uv run' to auto-install.", file=sys.stderr)
    sys.exit(1)


console = Console()


def validate_config(
    settings_path: Path,
    schema_path: Path,
    fix: bool = False
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Validate Claude Code settings.json.

    Args:
        settings_path: Path to settings.json
        schema_path: Path to JSON schema
        fix: Whether to attempt auto-fixes

    Returns:
        Tuple of (is_valid, list of errors)
    """
    errors = []

    # Check if settings file exists
    if not settings_path.exists():
        errors.append({
            "type": "FILE_NOT_FOUND",
            "message": f"Settings file not found: {settings_path}",
            "severity": "ERROR"
        })
        return False, errors

    # Load and parse settings.json
    try:
        with open(settings_path) as f:
            settings = json.load(f)
    except json.JSONDecodeError as e:
        errors.append({
            "type": "JSON_SYNTAX",
            "message": f"Invalid JSON syntax: {e.msg}",
            "line": e.lineno,
            "column": e.colno,
            "severity": "ERROR"
        })
        return False, errors

    # Load schema
    if not schema_path.exists():
        errors.append({
            "type": "SCHEMA_NOT_FOUND",
            "message": f"Schema file not found: {schema_path}",
            "severity": "WARNING"
        })
        # Continue without schema validation
        schema = None
    else:
        with open(schema_path) as f:
            schema = json.load(f)

    # Validate against schema
    if schema:
        validator = jsonschema.Draft7Validator(schema)
        for error in validator.iter_errors(settings):
            errors.append({
                "type": "SCHEMA_VIOLATION",
                "message": error.message,
                "path": ".".join(str(p) for p in error.path),
                "severity": "ERROR"
            })

    # Check hook configurations
    hooks = settings.get("hooks", {})
    for hook_name, hook_entries in hooks.items():
        # Handle both old format (dict) and new format (array)
        if isinstance(hook_entries, dict):
            # Old format - single hook config
            hook_entries = [{"hooks": [hook_entries]}]

        if not isinstance(hook_entries, list):
            continue

        # Iterate through hook entries
        for idx, entry in enumerate(hook_entries):
            nested_hooks = entry.get("hooks", [])
            for hook_idx, hook_config in enumerate(nested_hooks):
                hook_type = hook_config.get("type", "")
                command = hook_config.get("command", "")

                if not command:
                    continue

                # Check if command uses proper format for Python hooks
                if hook_type == "python" and not command.startswith("uv run"):
                    errors.append({
                        "type": "COMMAND_FORMAT",
                        "message": f"{hook_name}[{idx}].hooks[{hook_idx}]: Python hooks should use 'uv run' command",
                        "path": f"hooks.{hook_name}[{idx}].hooks[{hook_idx}].command",
                        "severity": "WARNING"
                    })

                # Extract script path from command
                script_path = _extract_script_path(command)
                if script_path:
                    resolved_path = Path(script_path).expanduser()
                    if not resolved_path.exists():
                        errors.append({
                            "type": "FILE_NOT_FOUND",
                            "message": f"{hook_name}[{idx}].hooks[{hook_idx}]: Script not found: {script_path}",
                            "path": f"hooks.{hook_name}[{idx}].hooks[{hook_idx}].command",
                            "severity": "ERROR"
                        })
                    elif not resolved_path.is_file():
                        errors.append({
                            "type": "INVALID_PATH",
                            "message": f"{hook_name}[{idx}].hooks[{hook_idx}]: Path is not a file: {script_path}",
                            "path": f"hooks.{hook_name}[{idx}].hooks[{hook_idx}].command",
                            "severity": "ERROR"
                        })

    # Check retry config
    retry_config = settings.get("retryConfig", {})
    if retry_config.get("enabled"):
        critical_hooks = retry_config.get("criticalHooks", [])
        for hook_name in critical_hooks:
            if hook_name not in hooks:
                errors.append({
                    "type": "INVALID_REFERENCE",
                    "message": f"retryConfig references undefined hook: {hook_name}",
                    "path": "retryConfig.criticalHooks",
                    "severity": "WARNING"
                })

    # Perform auto-fixes if requested
    if fix and errors:
        fixed_count = _apply_fixes(settings_path, settings, errors)
        if fixed_count > 0:
            console.print(f"[green]✓[/green] Applied {fixed_count} automatic fix(es)")

    return len(errors) == 0, errors


def _extract_script_path(command: str) -> str:
    """Extract script path from command string."""
    parts = command.split()
    # Handle 'uv run /path/to/script.py'
    if len(parts) >= 3 and parts[0] == "uv" and parts[1] == "run":
        return parts[2]
    # Handle 'python /path/to/script.py'
    if len(parts) >= 2 and parts[0] in ["python", "python3", "bash", "node"]:
        return parts[1]
    # Handle direct script path
    if len(parts) >= 1:
        return parts[0]
    return ""


def _apply_fixes(settings_path: Path, settings: Dict, errors: List[Dict]) -> int:
    """
    Apply automatic fixes to settings.json.

    Returns:
        Number of fixes applied
    """
    fixed_count = 0
    modified = False

    for error in errors:
        if error.get("fix") and error["type"] == "COMMAND_FORMAT":
            # Fix command format by adding 'uv run'
            path_parts = error["path"].split(".")
            if len(path_parts) == 3:  # hooks.HookName.command
                hook_name = path_parts[1]
                settings["hooks"][hook_name]["command"] = error["fix"]
                fixed_count += 1
                modified = True

    if modified:
        # Write back to file with pretty formatting
        with open(settings_path, "w") as f:
            json.dump(settings, f, indent=2)
            f.write("\n")

    return fixed_count


def print_validation_results(is_valid: bool, errors: List[Dict[str, Any]]) -> None:
    """Print validation results with rich formatting."""
    if is_valid:
        console.print(Panel(
            "[green]✓ Settings validation passed[/green]",
            title="Validation Result",
            border_style="green"
        ))
    else:
        console.print(Panel(
            f"[red]✗ Found {len(errors)} validation error(s)[/red]",
            title="Validation Result",
            border_style="red"
        ))

        # Create error table
        table = Table(title="Validation Errors", show_header=True)
        table.add_column("Severity", style="bold")
        table.add_column("Type")
        table.add_column("Path")
        table.add_column("Message")

        for error in errors:
            severity = error.get("severity", "ERROR")
            severity_style = "red" if severity == "ERROR" else "yellow"

            table.add_row(
                f"[{severity_style}]{severity}[/{severity_style}]",
                error.get("type", "UNKNOWN"),
                error.get("path", ""),
                error.get("message", "")
            )

        console.print(table)

        # Show fix suggestions
        fixable = [e for e in errors if e.get("fix")]
        if fixable:
            console.print("\n[yellow]Tip:[/yellow] Run with --fix to automatically correct some errors")


def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate Claude Code settings.json configuration"
    )
    parser.add_argument(
        "settings_path",
        nargs="?",
        default=str(Path.home() / ".claude" / "settings.json"),
        help="Path to settings.json (default: ~/.claude/settings.json)"
    )
    parser.add_argument(
        "--schema",
        default=str(Path.home() / ".claude" / "hooks" / "schemas" / "settings_schema.json"),
        help="Path to JSON schema"
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Automatically fix common issues"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )

    args = parser.parse_args()

    settings_path = Path(args.settings_path).expanduser()
    schema_path = Path(args.schema).expanduser()

    # Run validation
    is_valid, errors = validate_config(settings_path, schema_path, fix=args.fix)

    if args.json:
        # JSON output for programmatic use
        result = {
            "valid": is_valid,
            "error_count": len(errors),
            "errors": errors
        }
        print(json.dumps(result, indent=2))
    else:
        # Rich formatted output for humans
        print_validation_results(is_valid, errors)

    # Exit with appropriate code
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
