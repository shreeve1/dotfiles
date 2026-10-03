#!/usr/bin/env python3
"""Resolve wiki-update's deterministic gate without silently bypassing it."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def candidates(project_root: Path) -> list[Path]:
    home = Path.home()
    own = Path(__file__).resolve().with_name("gate.py")
    configured = os.environ.get("WIKI_UPDATE_GATE", "")
    if configured:
        return [Path(configured).expanduser()]
    return [
        own,
        home / ".agents" / "skills" / "wiki-update" / "gate.py",
        home / ".hermes" / "skills" / "wiki-update" / "gate.py",
        project_root / ".agents" / "skills" / "wiki-update" / "gate.py",
        project_root / ".hermes" / "skills" / "wiki-update" / "gate.py",
        project_root / ".claude" / "skills" / "wiki-update" / "gate.py",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", default=".", type=Path)
    args = parser.parse_args()
    root = args.project_root.expanduser().resolve()
    for candidate in candidates(root):
        if candidate.is_file():
            print(candidate.resolve())
            return 0
    print("wiki-update gate.py not found; install the companion skill or vendor it in the project", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
