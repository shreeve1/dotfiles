#!/usr/bin/env python3
"""Validate an OpenCode SKILL.md file.

Checks:
- Frontmatter is valid YAML with required fields
- name matches ^[a-z0-9]+(-[a-z0-9]+)*$ and is 1-64 chars
- name matches the parent directory name
- description is 1-1024 chars
- No common formatting issues
- Body has at minimum a title heading

Usage:
    python validate_skill.py <path-to-SKILL.md>
    python validate_skill.py <path-to-skill-directory>
"""

import sys
import os
import re


def parse_frontmatter(content: str) -> tuple[dict | None, str, list[str]]:
    """Parse YAML frontmatter from markdown content.

    Returns (frontmatter_dict, body, errors).
    Uses basic parsing to avoid yaml dependency.
    """
    errors = []

    if not content.startswith("---"):
        errors.append("File must start with YAML frontmatter delimiter '---'")
        return None, content, errors

    # Find closing delimiter
    second_delim = content.find("---", 3)
    if second_delim == -1:
        errors.append("Missing closing frontmatter delimiter '---'")
        return None, content, errors

    fm_text = content[3:second_delim].strip()
    body = content[second_delim + 3 :].strip()

    # Simple YAML parser for flat key-value pairs
    fm = {}
    current_key = None
    for line in fm_text.split("\n"):
        line_stripped = line.strip()
        if not line_stripped or line_stripped.startswith("#"):
            continue

        # Check for key: value
        match = re.match(r"^(\w[\w-]*):\s*(.*)", line_stripped)
        if match:
            key = match.group(1)
            value = match.group(2).strip()
            # Remove quotes if present
            if value and value[0] in ('"', "'") and value[-1] == value[0]:
                value = value[1:-1]
            fm[key] = value
            current_key = key
        elif current_key and line.startswith("  "):
            # Continuation of previous value (e.g., multiline description)
            if isinstance(fm[current_key], str) and fm[current_key]:
                fm[current_key] += " " + line_stripped
            else:
                fm[current_key] = line_stripped

    return fm, body, errors


def validate_name(name: str, skill_path: str) -> list[str]:
    """Validate the skill name."""
    errors = []

    if not name:
        errors.append("FAIL: 'name' field is missing or empty")
        return errors

    if len(name) < 1 or len(name) > 64:
        errors.append(f"FAIL: name must be 1-64 characters, got {len(name)}: '{name}'")

    pattern = r"^[a-z0-9]+(-[a-z0-9]+)*$"
    if not re.match(pattern, name):
        errors.append(
            f"FAIL: name '{name}' does not match pattern {pattern}. "
            "Must be lowercase alphanumeric with single hyphen separators."
        )

    if "--" in name:
        errors.append(f"FAIL: name '{name}' contains consecutive hyphens '--'")

    if name.startswith("-") or name.endswith("-"):
        errors.append(f"FAIL: name '{name}' starts or ends with a hyphen")

    # Check directory name matches
    parent_dir = os.path.basename(os.path.dirname(os.path.abspath(skill_path)))
    if parent_dir != name:
        errors.append(
            f"WARN: name '{name}' does not match parent directory '{parent_dir}'. "
            "The directory containing SKILL.md should match the name field."
        )

    return errors


def validate_description(description: str) -> list[str]:
    """Validate the skill description."""
    errors = []

    if not description:
        errors.append("FAIL: 'description' field is missing or empty")
        return errors

    if len(description) < 1:
        errors.append("FAIL: description must be at least 1 character")

    if len(description) > 1024:
        errors.append(
            f"FAIL: description must be <= 1024 characters, got {len(description)}"
        )

    # Warn if description is very short
    if 0 < len(description) < 20:
        errors.append(
            f"WARN: description is only {len(description)} chars — "
            "consider being more specific about when to trigger this skill"
        )

    return errors


def validate_body(body: str) -> list[str]:
    """Validate the skill body content."""
    errors = []

    if not body.strip():
        errors.append("FAIL: skill body is empty — must have at least a title heading")
        return errors

    # Check for title heading
    if not re.search(r"^#\s+", body, re.MULTILINE):
        errors.append("WARN: no top-level heading (# Title) found in body")

    # Count lines
    lines = body.split("\n")
    if len(lines) > 500:
        errors.append(
            f"WARN: body is {len(lines)} lines — "
            "consider keeping under 500 lines and using reference files for details"
        )

    return errors


def validate_skill(path: str) -> tuple[bool, list[str]]:
    """Validate a SKILL.md file. Returns (all_passed, messages)."""
    messages = []

    # Resolve path
    if os.path.isdir(path):
        skill_path = os.path.join(path, "SKILL.md")
    else:
        skill_path = path

    if not os.path.exists(skill_path):
        return False, [f"FAIL: File not found: {skill_path}"]

    # Check filename
    if os.path.basename(skill_path) != "SKILL.md":
        messages.append(
            f"WARN: filename is '{os.path.basename(skill_path)}', expected 'SKILL.md'"
        )

    # Read content
    with open(skill_path, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.strip():
        return False, ["FAIL: file is empty"]

    # Parse frontmatter
    fm, body, parse_errors = parse_frontmatter(content)
    messages.extend(parse_errors)

    if fm is None:
        return False, messages

    # Validate fields
    name = fm.get("name", "")
    messages.extend(validate_name(name, skill_path))

    description = fm.get("description", "")
    messages.extend(validate_description(description))

    # Validate body
    messages.extend(validate_body(body))

    # Check for optional but recognized fields
    recognized = {"name", "description", "license", "compatibility", "metadata"}
    for key in fm:
        if key not in recognized:
            messages.append(
                f"INFO: unrecognized frontmatter field '{key}' (will be ignored)"
            )

    # Determine overall result
    has_failures = any(msg.startswith("FAIL:") for msg in messages)

    return not has_failures, messages


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_skill.py <path-to-SKILL.md-or-directory>")
        print()
        print("Validates an OpenCode SKILL.md file for correct format.")
        sys.exit(1)

    path = sys.argv[1]
    passed, messages = validate_skill(path)

    # Print results
    print(f"Validating: {path}")
    print("-" * 60)

    if not messages:
        print("PASS: All checks passed")
    else:
        for msg in messages:
            print(f"  {msg}")

    print("-" * 60)

    if passed:
        print("Result: PASS")
        # Print summary of skill
        if os.path.isdir(path):
            skill_path = os.path.join(path, "SKILL.md")
        else:
            skill_path = path

        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()

        fm, body, _ = parse_frontmatter(content)
        if fm:
            print(f"  Name: {fm.get('name', '?')}")
            desc = fm.get("description", "?")
            if len(desc) > 80:
                desc = desc[:77] + "..."
            print(f"  Description: {desc}")
            line_count = len(body.split("\n"))
            print(f"  Body: {line_count} lines")
    else:
        print("Result: FAIL — fix the issues above")
        sys.exit(1)


if __name__ == "__main__":
    main()
