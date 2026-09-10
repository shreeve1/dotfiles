#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Compact JSON summary for package/config files."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

KEYS = [
    "name", "version", "type", "private", "workspaces", "scripts", "dependencies",
    "devDependencies", "peerDependencies", "optionalDependencies", "engines",
    "compilerOptions", "include", "exclude", "extends",
]

SECRET_RES = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{16,}"),
    re.compile(r"\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}"),
    re.compile(r"(?i)\b(pass(?:word|wd)?|secret|token|api[_-]?key|access[_-]?key|auth)\b\s*[=:]\s*\S+"),
]


def redact(text: str) -> str:
    for rx in SECRET_RES:
        text = rx.sub("***REDACTED***", text)
    return text


def strip_jsonc(text: str) -> str:
    """Remove // and /* */ comments and trailing commas, ignoring string contents."""
    out: list[str] = []
    i, n = 0, len(text)
    in_str = False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if c == '"':
                in_str = False
            i += 1
        elif c == '"':
            in_str = True
            out.append(c)
            i += 1
        elif c == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
        elif c == "/" and i + 1 < n and text[i + 1] == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
        elif c in "}]":
            j = len(out) - 1
            while j >= 0 and out[j].isspace():
                j -= 1
            if j >= 0 and out[j] == ",":
                del out[j]
            out.append(c)
            i += 1
        else:
            out.append(c)
            i += 1
    return "".join(out)


def load_json(path: Path) -> Any:
    text = path.read_text()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return json.loads(strip_jsonc(text))


def brief(value: Any, max_items: int) -> Any:
    if isinstance(value, dict):
        items = list(value.items())[:max_items]
        suffix = f" ... +{len(value) - max_items}" if len(value) > max_items else ""
        return ", ".join(f"{k}: {v}" for k, v in items) + suffix
    if isinstance(value, list):
        shown = value[:max_items]
        suffix = f" ... +{len(value) - max_items}" if len(value) > max_items else ""
        return ", ".join(map(str, shown)) + suffix
    return value


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--max-items", type=int, default=20)
    args = ap.parse_args()
    path = Path(args.file)
    try:
        data = load_json(path)
    except Exception as e:
        print(f"error reading {path}: {e}")
        return 1

    print(f"file: {path}")
    if isinstance(data, dict):
        for key in KEYS:
            if key in data:
                print(f"{key}: {redact(str(brief(data[key], args.max_items)))}")
        other = [k for k in data.keys() if k not in KEYS]
        if other:
            print("other_keys: " + ", ".join(other[:30]) + (f" ... +{len(other)-30}" if len(other) > 30 else ""))
    else:
        print(redact(str(brief(data, args.max_items))))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
