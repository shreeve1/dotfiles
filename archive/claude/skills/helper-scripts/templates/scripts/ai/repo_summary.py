#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Summarize repo languages, manifests, and likely entrypoints."""
from __future__ import annotations

import argparse
import os
from collections import Counter
from pathlib import Path

SKIP = {".git", "node_modules", "vendor", "dist", "build", "target", ".venv", "venv", "__pycache__", ".cache"}
EXT_LANG = {
    ".py": "Python", ".js": "JavaScript", ".jsx": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
    ".go": "Go", ".rs": "Rust", ".java": "Java", ".kt": "Kotlin", ".cs": "C#", ".rb": "Ruby",
    ".php": "PHP", ".swift": "Swift", ".c": "C", ".h": "C/C++", ".cpp": "C++", ".hpp": "C++",
    ".sh": "Shell", ".lua": "Lua", ".nix": "Nix", ".tf": "Terraform",
}
MANIFESTS = [
    "package.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "pyproject.toml", "requirements.txt",
    "go.mod", "Cargo.toml", "pom.xml", "build.gradle", "settings.gradle", "Gemfile", "composer.json",
    "Dockerfile", "docker-compose.yml", "compose.yml", "Makefile", "justfile", "Taskfile.yml",
]
ENTRY_NAMES = {"main.py", "app.py", "server.py", "index.js", "index.ts", "main.go", "main.rs", "Program.cs"}
ENTRY_DIRS = {"src", "app", "cmd", "bin", "server", "api", "pages"}


def walk_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        current = Path(dirpath)
        for name in filenames:
            yield current / name


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    args = ap.parse_args()
    root = Path(args.root).resolve()

    langs: Counter[str] = Counter()
    files = 0
    entries: list[str] = []
    for f in walk_files(root):
        rel = f.relative_to(root)
        files += 1
        lang = EXT_LANG.get(f.suffix.lower())
        if lang:
            langs[lang] += 1
        if len(entries) < 20 and (f.name in ENTRY_NAMES or (rel.parts and rel.parts[0] in ENTRY_DIRS and f.name in ENTRY_NAMES)):
            entries.append(str(rel))

    print(f"files_indexed: {files}")
    if langs:
        print("languages: " + ", ".join(f"{k}({v})" for k, v in langs.most_common(8)))

    found = [m for m in MANIFESTS if (root / m).exists()]
    if found:
        print("manifests: " + ", ".join(found))

    if entries:
        print("likely_entrypoints:")
        for e in entries:
            print(f"- {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
