#!/usr/bin/env python3
"""Prepare context/SOUL router candidates for human approval.

The candidate prep tool never writes to a protected file. It walks the
project directory looking for an *active* project context under Hermes
precedence, then stages two artifacts in a non-loaded staging directory:

- A bounded, marked router-section merge patch that the operator can
  apply themselves. If the active context file already has a marked
  projectlean section, the candidate is skipped to preserve content.
- A SOUL candidate that mirrors the vendored SOUL template.

If no active context exists, a recommended target file (``.hermes.md``
by default) is suggested along with an explanation. The staging
directory is created in private XDG state by default, outside both the
package and project tree.

Hermes precedence for finding the active context, walked from the
project root upward:

1. ``.hermes.md``
2. ``HERMES.md``

then inside the project root itself:

3. ``AGENTS.md``
4. ``CLAUDE.md``
5. ``.cursorrules``
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
ROUTER_TEMPLATE = TEMPLATES / "project-hermes-router.md.template"
SOUL_TEMPLATE = TEMPLATES / "projectlean-soul.md.template"

CONTEXT_FILENAMES = (".hermes.md", "HERMES.md", "AGENTS.md",
                     "CLAUDE.md", ".cursorrules")
PRECEDENCE = (".hermes.md", "HERMES.md", "AGENTS.md",
              "CLAUDE.md", ".cursorrules")
HERMES_PRECEDENCE = (".hermes.md", "HERMES.md")

ROUTER_MARKER_BEGIN = "<!-- projectlean:router:begin -->"
ROUTER_MARKER_END = "<!-- projectlean:router:end -->"
STAGING_NAME_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}\Z")


def _die(msg: str, code: int = 1) -> "None":
    print(f"projectlean prepare: {msg}", file=sys.stderr)
    raise SystemExit(code)


def _project_root_arg(value: str) -> Path:
    p = Path(value).expanduser().resolve()
    if not p.exists() or not p.is_dir():
        _die(f"--repo target is not a directory: {p}")
    return p


def _is_beneath(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _overlaps(path: Path, other: Path) -> bool:
    """Return whether either resolved path contains the other."""
    return _is_beneath(path, other) or _is_beneath(other, path)


def _staging_root(value: Optional[Path], project: Path) -> Path:
    state_home = Path(os.environ.get("XDG_STATE_HOME", "~/.local/state"))
    stage = (value or state_home.expanduser() / "hermes" / "projectlean" /
             "context-candidates").expanduser().resolve()
    if _overlaps(stage, ROOT):
        _die("staging directories must not overlap the package or target repo")
    if _overlaps(stage, project):
        _die("output directory must be outside the package and target repo")
    return stage


def _staging_name(value: str) -> str:
    """Accept a conservative, portable single-component staging name."""
    if (not value or value in (".", "..") or Path(value).is_absolute() or
            "/" in value or "\\" in value or not STAGING_NAME_RE.fullmatch(value)):
        _die("--staging-name must be a single identifier: letters, digits, "
             "hyphens, or underscores (1-64 characters, starting with a letter or digit)")
    return value


def _staging_dir(stage_root: Path, name: str, project: Path) -> Path:
    """Return an external staging directory only when it cannot escape or overlap."""
    candidate = stage_root / _staging_name(name)
    resolved_root = stage_root.resolve()
    resolved_candidate = candidate.resolve()
    if resolved_candidate == resolved_root or not _is_beneath(
            resolved_candidate, resolved_root):
        _die("--staging-name resolves outside the staging root")
    if _overlaps(resolved_candidate, ROOT):
        _die("staging directories must not overlap the package or target repo")
    if _overlaps(resolved_candidate, project):
        _die("candidate directory must not overlap the target repo")
    return candidate


def _find_active_context(project: Path) -> tuple:
    """Hermes precedence: walk parents for .hermes.md/HERMES.md, then cwd
    for AGENTS.md/CLAUDE.md/.cursorrules.
    """
    # Walk upward from project looking for the two highest-precedence names.
    cursor = project
    while True:
        for name in HERMES_PRECEDENCE:
            candidate = cursor / name
            if candidate.is_file():
                return candidate, "hermes-precedence-upward"
        if cursor.parent == cursor:
            break
        cursor = cursor.parent
    # Then inside the project root itself for the lower-precedence names.
    for name in PRECEDENCE:
        candidate = project / name
        if candidate.is_file():
            return candidate, "project-root"
    return None, "none"


def _render_router_patch(router_body: str) -> str:
    bounded = router_body.strip()
    return (
        f"{ROUTER_MARKER_BEGIN}\n"
        f"{bounded}\n"
        f"{ROUTER_MARKER_END}\n"
    )


def _build_router_candidate(active: Path, router_body: str) -> dict:
    existing = active.read_text()
    if ROUTER_MARKER_BEGIN in existing and ROUTER_MARKER_END in existing:
        return {
            "applied_to": str(active),
            "action": "skip-existing-marker",
            "explanation": (
                "Active context already contains a marked projectlean "
                "router section; candidate not regenerated to preserve "
                "operator edits inside the markers."
            ),
        }
    patch = _render_router_patch(router_body)
    proposed = existing
    if proposed and not proposed.endswith("\n"):
        proposed += "\n"
    if proposed:
        proposed += "\n"
    proposed += patch
    return {
        "applied_to": str(active),
        "action": "stage-merge-patch",
        "explanation": (
            "Stage a bounded, marked projectlean router section appended "
            "to the active context file. The marker delimiters let a "
            "future installer replace the section without disturbing "
            "the rest of the file."
        ),
        "preview_bytes": len(proposed.encode()),
        "preview_sha256": hashlib.sha256(proposed.encode()).hexdigest(),
    }


def _build_recommended_candidate(project: Path, router_body: str) -> dict:
    body = _render_router_patch(router_body)
    proposed = (
        f"# Project Hermes Router\n\n"
        f"Use this project context only as a router. Keep "
        f"project-specific instructions thin.\n\n"
        f"{body}"
    )
    return {
        "applied_to": "<none-active>",
        "action": "stage-recommended-target",
        "explanation": (
            "No active project context file was found under Hermes "
            "precedence. The recommended target is `.hermes.md` at the "
            "project root; staging the candidate file lets the operator "
            "review it before a manual, human-approved copy."
        ),
        "recommended_target": str(project / ".hermes.md"),
        "preview_bytes": len(proposed.encode()),
        "preview_sha256": hashlib.sha256(proposed.encode()).hexdigest(),
    }


def _build_soul_candidate() -> dict:
    body = SOUL_TEMPLATE.read_bytes()
    return {
        "applied_to": "<profile-SOUL.md>",
        "action": "stage-soul-candidate",
        "explanation": (
            "Stage the vendored SOUL template as a non-loaded candidate. "
            "Materialising it into the live profile SOUL.md is the "
            "operator's separate, human-approved step."
        ),
        "preview_bytes": len(body),
        "preview_sha256": hashlib.sha256(body).hexdigest(),
    }


def _write_stage(stage_dir: Path, items: list) -> list:
    stage_dir.mkdir(parents=True, exist_ok=True)
    if os.name == "posix":
        stage_dir.chmod(0o700)
    for name, _ in items:
        try:
            (stage_dir / name).lstat()
        except FileNotFoundError:
            continue
        _die(f"staged artifact already exists: {name}")
    paths = []
    for name, payload in items:
        path = stage_dir / name
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            _die(f"staged artifact already exists: {name}")
        else:
            with os.fdopen(fd, "w", encoding="utf-8") as artifact:
                artifact.write(payload)
        if os.name == "posix":
            path.chmod(0o600)
        paths.append(str(path))
    return paths


def _list_stage_artifacts(stage_dir: Path) -> list:
    return [str(p) for p in sorted(stage_dir.rglob("*")) if p.is_file()]


def main(argv: list = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", default=".", type=Path,
                        help="project repo to inspect (default: cwd)")
    parser.add_argument("--staging-name", default=None,
                        help="override staging subdir name (default: UTC timestamp)")
    parser.add_argument("--output-dir", type=Path, default=None,
                        help="private candidate directory outside package and repo "
                             "(default: XDG state directory)")
    parser.add_argument("--dry-run", action="store_true",
                        help="print the would-be staging summary and exit")
    args = parser.parse_args(argv)

    project = _project_root_arg(args.repo)

    if not ROUTER_TEMPLATE.is_file() or not SOUL_TEMPLATE.is_file():
        _die("router/SOUL templates missing in package")
    router_body = ROUTER_TEMPLATE.read_text()
    soul_bytes = SOUL_TEMPLATE.read_bytes()

    active, source = _find_active_context(project)
    run_id = (args.staging_name if args.staging_name is not None else
              _dt.datetime.now(_dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    stage_root = _staging_dir(_staging_root(args.output_dir, project), run_id,
                              project)

    candidates = []
    if active is not None:
        candidates.append(_build_router_candidate(active, router_body))
    else:
        candidates.append(_build_recommended_candidate(project, router_body))
    candidates.append(_build_soul_candidate())

    summary = {
        "run_id": run_id,
        "staging_dir": str(stage_root),
        "project_root": str(project),
        "active_context": str(active) if active else None,
        "context_source": source,
        "candidates": candidates,
        "no_protected_writes": True,
    }

    if args.dry_run:
        summary["dry_run"] = True
        print(json.dumps(summary, indent=2, sort_keys=True))
        return 0

    stage_root.mkdir(parents=True, exist_ok=True)
    if active is not None:
        context_preview = active.read_text()
        if candidates[0]["action"] == "stage-merge-patch":
            if context_preview and not context_preview.endswith("\n"):
                context_preview += "\n"
            if context_preview:
                context_preview += "\n"
            context_preview += _render_router_patch(router_body)
    else:
        context_preview = (
            "# Project Hermes Router\n\nUse this project context only as a router. "
            "Keep project-specific instructions thin.\n\n" +
            _render_router_patch(router_body))
    paths = _write_stage(stage_root, [
        ("context-candidate.json", json.dumps(candidates[0], indent=2,
                                             sort_keys=True)),
        ("soul-candidate.json", json.dumps(candidates[1], indent=2,
                                           sort_keys=True)),
        ("context-preview.md", context_preview),
        ("soul-preview.md", soul_bytes.decode("utf-8")),
    ])
    summary["written"] = paths
    summary["artifacts"] = _list_stage_artifacts(stage_root)
    print(json.dumps(summary, indent=2, sort_keys=True))
    print(
        "Staging complete. No protected file was written. Review the "
        "artifacts under the listed staging_dir and apply the router "
        "section or SOUL.md only after explicit human approval.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
