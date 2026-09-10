#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""List large files agents should avoid reading whole."""
from __future__ import annotations

import argparse
import os
from pathlib import Path

SKIP = {".git", "node_modules", "vendor", "dist", "build", "target", ".venv", "venv", ".cache"}


def walk_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        current = Path(dirpath)
        for name in filenames:
            yield current / name


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--min-kb", type=int, default=256)
    ap.add_argument("--limit", type=int, default=50)
    args = ap.parse_args()
    root = Path(args.root).resolve()

    rows: list[tuple[int, str]] = []
    for f in walk_files(root):
        try:
            size = f.stat().st_size
        except OSError:
            continue
        if size >= args.min_kb * 1024:
            rows.append((size, str(f.relative_to(root))))

    for size, rel in sorted(rows, reverse=True)[: args.limit]:
        print(f"{size / 1024:.1f}KB\t{rel}")
    if not rows:
        print(f"none >= {args.min_kb}KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
