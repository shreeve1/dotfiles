#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Extract compact import/dependency lines from common source files."""
from __future__ import annotations

import argparse
import os
import re
from collections import Counter, defaultdict
from pathlib import Path

SKIP = {".git", "node_modules", "vendor", "dist", "build", "target", ".venv", "venv", "__pycache__", ".cache"}
PATTERNS = {
    ".py": [r"^\s*import\s+([\w\.]+)", r"^\s*from\s+([\w\.]+)\s+import"],
    ".js": [r"^\s*import\s+.*?from\s+['\"]([^'\"]+)", r"require\(['\"]([^'\"]+)['\"]\)"],
    ".jsx": [r"^\s*import\s+.*?from\s+['\"]([^'\"]+)", r"require\(['\"]([^'\"]+)['\"]\)"],
    ".ts": [r"^\s*import\s+.*?from\s+['\"]([^'\"]+)", r"require\(['\"]([^'\"]+)['\"]\)"],
    ".tsx": [r"^\s*import\s+.*?from\s+['\"]([^'\"]+)", r"require\(['\"]([^'\"]+)['\"]\)"],
    ".go": [r"^\s*import\s+\(?\s*\"([^\"]+)\""],
    ".rs": [r"^\s*use\s+([^:;]+)"],
    ".java": [r"^\s*import\s+([^;]+);"],
}


def walk_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        current = Path(dirpath)
        for name in filenames:
            path = current / name
            if path.suffix in PATTERNS:
                yield path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--limit", type=int, default=200)
    args = ap.parse_args()
    root = Path(args.root).resolve()

    by_file: dict[str, list[str]] = defaultdict(list)
    counts: Counter[str] = Counter()
    for f in walk_files(root):
        try:
            text = f.read_text(errors="ignore")
        except OSError:
            continue
        for line in text.splitlines()[:400]:
            for pat in PATTERNS[f.suffix]:
                m = re.search(pat, line)
                if m:
                    dep = m.group(1).strip()
                    by_file[str(f.relative_to(root))].append(dep)
                    counts[dep.split(".")[0].split("/")[0]] += 1
                    break

    if counts:
        print("top_import_roots: " + ", ".join(f"{k}({v})" for k, v in counts.most_common(20)))
    printed = 0
    for file, deps in sorted(by_file.items()):
        if printed >= args.limit:
            print(f"... omitted files after limit {args.limit}")
            break
        unique = list(dict.fromkeys(deps))
        print(f"{file}: " + ", ".join(unique[:20]) + (f" ... +{len(unique)-20}" if len(unique) > 20 else ""))
        printed += 1
    if not by_file:
        print("no imports found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
