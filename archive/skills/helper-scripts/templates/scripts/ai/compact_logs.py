#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Compact noisy logs by keeping matches and nearby context."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

DEFAULT_RE = r"\b(error|exception|traceback|failed|failure|panic|segfault|fatal|timeout|denied|warning)\b"

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


def read_lines(paths: list[str]) -> list[tuple[str, int, str]]:
    rows: list[tuple[str, int, str]] = []
    if not paths:
        for i, line in enumerate(sys.stdin.read().splitlines(), 1):
            rows.append(("stdin", i, line))
        return rows
    for name in paths:
        p = Path(name)
        try:
            lines = p.read_text(errors="ignore").splitlines()
        except OSError as e:
            rows.append((name, 0, f"<read error: {e}>"))
            continue
        for i, line in enumerate(lines, 1):
            rows.append((name, i, line))
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--pattern", default=DEFAULT_RE)
    ap.add_argument("--context", type=int, default=2)
    ap.add_argument("--limit", type=int, default=160)
    args = ap.parse_args()

    rows = read_lines(args.paths)
    rx = re.compile(args.pattern, re.I)
    keep: set[int] = set()
    for idx, (_, _, line) in enumerate(rows):
        if rx.search(line):
            for j in range(max(0, idx - args.context), min(len(rows), idx + args.context + 1)):
                keep.add(j)

    last = -2
    shown = 0
    for idx in sorted(keep):
        if shown >= args.limit:
            print(f"... truncated at {args.limit} lines")
            break
        if idx != last + 1:
            print("---")
        src, num, line = rows[idx]
        print(f"{src}:{num}: {redact(line[:260])}")
        last = idx
        shown += 1
    if not keep:
        print("no matching log lines")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
