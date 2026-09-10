#!/usr/bin/env python3
# Generated from helper-scripts skill. Safe to overwrite from template.
"""Compact git status/log/diff summary."""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


def git(root: Path, *args: str) -> str:
    try:
        return subprocess.check_output(["git", *args], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    args = ap.parse_args()
    root = Path(args.root).resolve()

    if not git(root, "rev-parse", "--is-inside-work-tree"):
        print("not a git repo")
        return 0

    print("status:")
    print(git(root, "status", "--short") or "clean")

    print("\nrecent_commits:")
    print(git(root, "log", "--oneline", "-8") or "none")

    diff_stat = git(root, "diff", "--stat")
    staged_stat = git(root, "diff", "--cached", "--stat")
    if diff_stat:
        print("\nunstaged_diff_stat:")
        print(diff_stat)
    if staged_stat:
        print("\nstaged_diff_stat:")
        print(staged_stat)

    names = git(root, "diff", "--name-only")
    cached = git(root, "diff", "--cached", "--name-only")
    if names or cached:
        print("\nchanged_files:")
        for line in sorted(set((names + "\n" + cached).splitlines())):
            if line:
                print(f"- {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
