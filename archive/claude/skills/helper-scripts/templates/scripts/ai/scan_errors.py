#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Scan logs/text files for error-looking lines with compact context."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

SKIP = {".git", "node_modules", "vendor", "dist", "build", "target", ".venv", "venv", ".cache"}
ERROR_RE = re.compile(r"\b(error|exception|traceback|failed|failure|panic|segfault|fatal|timeout|denied)\b", re.I)
LOG_SUFFIXES = {".log", ".err", ".out", ".txt"}

SECRET_RES = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{16,}"),
    re.compile(r"\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}"),
    re.compile(r"(?i)\b(pass(?:word|wd)?|secret|token|api[_-]?key|access[_-]?key|auth)\b\s*[=:]\s*\S+"),
]


def redact(line: str) -> str:
    for rx in SECRET_RES:
        line = rx.sub("***REDACTED***", line)
    return line


def ignored(path: Path) -> bool:
    return any(part in SKIP for part in path.parts)


def candidate_files(root: Path, paths: list[str]) -> list[Path]:
    if paths:
        out: list[Path] = []
        for item in paths:
            p = Path(item)
            if p.is_dir():
                out.extend(x for x in p.rglob("*") if x.is_file())
            elif p.is_file():
                out.append(p)
        return out
    out = []
    for d in [root / "logs", root / "log", root / "tmp"]:
        if d.exists():
            out.extend(x for x in d.rglob("*") if x.is_file())
    out.extend(x for x in root.glob("*.log") if x.is_file())
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--root", default=".")
    ap.add_argument("--limit", type=int, default=100)
    args = ap.parse_args()
    root = Path(args.root).resolve()
    shown = 0

    for f in candidate_files(root, args.paths):
        rel = f.resolve().relative_to(root) if str(f.resolve()).startswith(str(root)) else f
        if ignored(Path(rel)) or (f.suffix and f.suffix not in LOG_SUFFIXES):
            continue
        try:
            lines = f.read_text(errors="ignore").splitlines()
        except OSError:
            continue
        for i, line in enumerate(lines, 1):
            if ERROR_RE.search(line):
                print(f"{rel}:{i}: {redact(line[:240])}")
                shown += 1
                if shown >= args.limit:
                    return 0
    if shown == 0:
        print("no error-looking lines found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
