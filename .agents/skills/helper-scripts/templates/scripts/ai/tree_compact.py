#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Print a compact filtered tree for agent orientation."""
from __future__ import annotations

import argparse
import os
from pathlib import Path

SKIP_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "vendor", "dist", "build", "target",
    ".next", ".nuxt", ".turbo", ".cache", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", ".venv", "venv", "env", "coverage",
    ".idea", ".vscode", ".DS_Store",
}
SKIP_SUFFIXES = {".pyc", ".pyo", ".class", ".o", ".so", ".dylib", ".dll", ".exe"}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=".")
    p.add_argument("--max-files", type=int, default=200)
    args = p.parse_args()

    root = Path(args.root).resolve()
    printed = 0
    omitted = 0
    dirs_seen: set[Path] = set()

    print(root.name + "/")
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        current = Path(dirpath)
        rel_dir = current.relative_to(root)
        if rel_dir != Path(".") and len(rel_dir.parts) <= 3 and rel_dir not in dirs_seen:
            indent = "  " * (len(rel_dir.parts) - 1)
            print(f"{indent}{rel_dir.name}/")
            dirs_seen.add(rel_dir)
        for name in sorted(filenames):
            path = current / name
            rel = path.relative_to(root)
            if path.suffix in SKIP_SUFFIXES:
                omitted += 1
                continue
            if printed >= args.max_files:
                omitted += 1
                continue
            indent = "  " * (len(rel.parts) - 1)
            print(f"{indent}{rel.name}")
            printed += 1

    if omitted:
        print(f"... omitted {omitted} files (limit/noise filters)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
