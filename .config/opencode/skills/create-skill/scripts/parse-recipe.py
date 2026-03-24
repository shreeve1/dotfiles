#!/usr/bin/env python3
"""Parse a recipe.yaml and output a formatted execution plan.

Usage:
    python3 parse-recipe.py <path-to-recipe.yaml>
    python3 parse-recipe.py <path-to-recipe.yaml> --json
    python3 parse-recipe.py <path-to-recipe.yaml> --validate

Modes:
    (default)   Pretty-print the execution plan for human/agent review.
    --json      Output structured JSON (for programmatic consumption).
    --validate  Validate the recipe against the schema and report errors.

Exit codes:
    0  Success (or validation passed)
    1  File not found / YAML parse error / validation failure
"""

import json
import sys
import textwrap
from pathlib import Path

try:
    import yaml
except ImportError:
    print(
        "ERROR: PyYAML is required. Install with: pip3 install pyyaml", file=sys.stderr
    )
    sys.exit(1)


# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------

VALID_PARAM_TYPES = {"string", "number", "boolean", "select", "file"}
VALID_OUTPUT_TYPES = {"file", "intermediate", "artifact"}
VALID_VALIDATION_TYPES = {"shell", "content"}


def validate_recipe(data: dict) -> list[str]:
    """Return a list of validation error strings. Empty list means valid."""
    errors: list[str] = []

    # -- top-level required fields --
    for field in ("version", "title", "description"):
        if field not in data:
            errors.append(f"Missing required top-level field: {field}")

    if "workflow" not in data or not data["workflow"]:
        errors.append("Missing or empty required field: workflow")

    # -- parameters --
    param_keys: set[str] = set()
    for i, p in enumerate(data.get("parameters") or []):
        key = p.get("key", f"<index {i}>")
        if "key" not in p:
            errors.append(f"Parameter at index {i}: missing 'key'")
        elif p["key"] in param_keys:
            errors.append(f"Duplicate parameter key: {p['key']}")
        else:
            param_keys.add(p["key"])

        if p.get("type") not in VALID_PARAM_TYPES:
            errors.append(
                f"Parameter '{key}': invalid type '{p.get('type')}' (expected one of {VALID_PARAM_TYPES})"
            )

        if "required" not in p:
            errors.append(f"Parameter '{key}': missing 'required' field")

        if p.get("required") is False and "default" not in p:
            errors.append(
                f"Parameter '{key}': optional parameter must have a 'default'"
            )

        if p.get("type") == "select" and not p.get("options"):
            errors.append(f"Parameter '{key}': type 'select' requires 'options' list")

        if "description" not in p:
            errors.append(f"Parameter '{key}': missing 'description'")

    # -- workflow --
    expected_step = 1
    output_ids_produced: set[str] = set()
    for i, w in enumerate(data.get("workflow") or []):
        step_label = w.get("name", f"step at index {i}")
        if w.get("step") != expected_step:
            errors.append(
                f"Workflow '{step_label}': expected step {expected_step}, got {w.get('step')}"
            )
        expected_step += 1

        for field in ("name", "description"):
            if field not in w:
                errors.append(f"Workflow step {w.get('step', i)}: missing '{field}'")

        if "decision_point" not in w:
            errors.append(
                f"Workflow step {w.get('step', i)} '{step_label}': missing 'decision_point'"
            )

        for ref in w.get("requires_input") or []:
            if ref not in param_keys:
                errors.append(
                    f"Workflow step {w.get('step', i)} '{step_label}': requires_input references unknown parameter '{ref}'"
                )

        for ref in w.get("produces") or []:
            output_ids_produced.add(ref)

    # -- outputs --
    output_ids: set[str] = set()
    for i, o in enumerate(data.get("outputs") or []):
        oid = o.get("id", f"<index {i}>")
        if "id" not in o:
            errors.append(f"Output at index {i}: missing 'id'")
        elif o["id"] in output_ids:
            errors.append(f"Duplicate output id: {o['id']}")
        else:
            output_ids.add(o["id"])

        if o.get("type") not in VALID_OUTPUT_TYPES:
            errors.append(
                f"Output '{oid}': invalid type '{o.get('type')}' (expected one of {VALID_OUTPUT_TYPES})"
            )

        if o.get("type") == "file" and not o.get("pattern"):
            errors.append(f"Output '{oid}': type 'file' requires 'pattern'")

        if "required" not in o:
            errors.append(f"Output '{oid}': missing 'required' field")

        if "description" not in o:
            errors.append(f"Output '{oid}': missing 'description'")

    # cross-check: workflow produces vs declared outputs
    for ref in output_ids_produced:
        if ref not in output_ids:
            errors.append(
                f"Workflow produces '{ref}' but no matching output id is declared"
            )

    for oid in output_ids:
        if oid not in output_ids_produced:
            errors.append(
                f"Output '{oid}' is declared but never produced by any workflow step"
            )

    # -- validation checks --
    for i, v in enumerate(data.get("validation") or []):
        vname = v.get("name", f"<index {i}>")
        if "name" not in v:
            errors.append(f"Validation at index {i}: missing 'name'")

        if v.get("type") not in VALID_VALIDATION_TYPES:
            errors.append(
                f"Validation '{vname}': invalid type '{v.get('type')}' (expected one of {VALID_VALIDATION_TYPES})"
            )

        if v.get("type") == "shell" and not v.get("command"):
            errors.append(f"Validation '{vname}': type 'shell' requires 'command'")

        if v.get("type") == "content":
            if not v.get("target"):
                errors.append(f"Validation '{vname}': type 'content' requires 'target'")
            elif v["target"] not in output_ids:
                errors.append(
                    f"Validation '{vname}': target '{v['target']}' is not a declared output id"
                )
            if not v.get("contains"):
                errors.append(
                    f"Validation '{vname}': type 'content' requires 'contains'"
                )

    return errors


# ---------------------------------------------------------------------------
# Formatted output
# ---------------------------------------------------------------------------


def format_plan(data: dict) -> str:
    """Return a human-readable execution plan."""
    lines: list[str] = []
    title = data.get("title", "Untitled Recipe")
    desc = data.get("description", "")
    version = data.get("version", "?")

    lines.append(f"{'=' * 60}")
    lines.append(f"  EXECUTION PLAN: {title}")
    lines.append(f"  Version {version}")
    lines.append(f"{'=' * 60}")
    if desc:
        lines.append(f"\n  {desc}\n")

    # Parameters
    params = data.get("parameters") or []
    if params:
        lines.append(f"{'─' * 60}")
        lines.append("  PARAMETERS")
        lines.append(f"{'─' * 60}")
        for p in params:
            req = (
                "required"
                if p.get("required")
                else f"optional (default: {p.get('default', '?')})"
            )
            lines.append(f"  [{p.get('type', '?')}] {p.get('key', '?')} — {req}")
            lines.append(f"         {p.get('description', '')}")
            if p.get("options"):
                lines.append(
                    f"         options: {', '.join(str(o) for o in p['options'])}"
                )
        lines.append("")

    # Workflow
    steps = data.get("workflow") or []
    if steps:
        lines.append(f"{'─' * 60}")
        lines.append("  WORKFLOW")
        lines.append(f"{'─' * 60}")
        for w in steps:
            dp = " [DECISION POINT]" if w.get("decision_point") else ""
            lines.append(f"  Step {w.get('step', '?')}: {w.get('name', '?')}{dp}")
            desc_text = w.get("description", "")
            for wrapped in textwrap.wrap(desc_text, width=54):
                lines.append(f"         {wrapped}")
            if w.get("requires_input"):
                lines.append(f"         inputs:  {', '.join(w['requires_input'])}")
            if w.get("produces"):
                lines.append(f"         outputs: {', '.join(w['produces'])}")
            lines.append("")

    # Outputs
    outputs = data.get("outputs") or []
    if outputs:
        lines.append(f"{'─' * 60}")
        lines.append("  OUTPUTS")
        lines.append(f"{'─' * 60}")
        for o in outputs:
            req = "required" if o.get("required") else "optional"
            lines.append(f"  [{o.get('type', '?')}] {o.get('id', '?')} — {req}")
            lines.append(f"         {o.get('description', '')}")
            if o.get("pattern"):
                lines.append(f"         pattern: {o['pattern']}")
        lines.append("")

    # Validation
    checks = data.get("validation") or []
    if checks:
        lines.append(f"{'─' * 60}")
        lines.append("  VALIDATION CHECKS")
        lines.append(f"{'─' * 60}")
        for v in checks:
            lines.append(f"  [{v.get('type', '?')}] {v.get('name', '?')}")
            if v.get("command"):
                lines.append(f"         $ {v['command']}")
            if v.get("target"):
                lines.append(f"         target: {v['target']}")
            if v.get("contains"):
                lines.append(f"         contains: {', '.join(v['contains'])}")
        lines.append("")

    lines.append(f"{'=' * 60}")
    summary_parts = [
        f"{len(params)} params",
        f"{len(steps)} steps",
        f"{len(outputs)} outputs",
        f"{len(checks)} checks",
    ]
    dp_count = sum(1 for w in steps if w.get("decision_point"))
    summary_parts.append(f"{dp_count} decision points")
    lines.append(f"  Summary: {' | '.join(summary_parts)}")
    lines.append(f"{'=' * 60}")

    return "\n".join(lines)


def to_json(data: dict) -> dict:
    """Return a structured JSON execution plan."""
    return {
        "title": data.get("title"),
        "version": data.get("version"),
        "description": data.get("description"),
        "summary": {
            "parameter_count": len(data.get("parameters") or []),
            "step_count": len(data.get("workflow") or []),
            "output_count": len(data.get("outputs") or []),
            "validation_count": len(data.get("validation") or []),
            "decision_points": sum(
                1 for w in (data.get("workflow") or []) if w.get("decision_point")
            ),
        },
        "parameters": data.get("parameters") or [],
        "workflow": data.get("workflow") or [],
        "outputs": data.get("outputs") or [],
        "validation": data.get("validation") or [],
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        sys.exit(1)

    path = Path(sys.argv[1])
    mode = sys.argv[2] if len(sys.argv) > 2 else "--plan"

    if not path.exists():
        print(f"ERROR: File not found: {path}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(path) as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"ERROR: Invalid YAML: {e}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, dict):
        print("ERROR: Recipe must be a YAML mapping at the top level", file=sys.stderr)
        sys.exit(1)

    if mode == "--validate":
        errors = validate_recipe(data)
        if errors:
            print(f"VALIDATION FAILED — {len(errors)} error(s):\n")
            for i, err in enumerate(errors, 1):
                print(f"  {i}. {err}")
            sys.exit(1)
        else:
            print("VALIDATION PASSED — recipe conforms to schema.")
            sys.exit(0)

    elif mode == "--json":
        errors = validate_recipe(data)
        output = to_json(data)
        output["validation_errors"] = errors
        print(json.dumps(output, indent=2))

    else:
        print(format_plan(data))


if __name__ == "__main__":
    main()
