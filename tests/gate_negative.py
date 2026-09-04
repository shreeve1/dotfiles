#!/usr/bin/env python3
"""Prove check.sh's python syntax check is load-bearing, not decorative.

check.sh has shipped "ok" on a file it never opened three times (k520, k801).
A check that cannot fail is not a check, so this asserts the failing case
directly: break a scratch copy of bin/prune-dead-links and require the gate to
notice.

Everything happens in a throwaway `git worktree`. The real working tree is never
modified -- the k525 handoff lesson: do not prove a check load-bearing by
mutating or reverting the tree you are checking. The scratch needs a working
.git (never git archive, which strips it and makes check.sh collapse for
unrelated reasons).

It must be a worktree, not shutil.copytree. copytree copies whatever `.git` is,
and that differs by checkout: in a linked worktree it is a 49-byte "gitdir:"
POINTER, so the copy silently shares the REAL repo's git dir and index; in a
normal clone it is a directory (858 MB here, 3.3 GB repo), so the copy takes
minutes and blew the gate budget. Both faults, opposite symptoms, one cause.
`git worktree add` is O(working tree) and gives the scratch its own git dir.
"""

import contextlib
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BROKEN = "\nthis is not valid python(((\n"


def run_gate(cwd):
    """Run ./check.sh and return (exit_code, combined_output).

    Exit code is read from the completed process directly, never through a
    pipe -- $? after a pipeline is the last command's status, not the gate's.
    """
    proc = subprocess.run(
        ["./check.sh"],
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    return proc.returncode, proc.stdout


@contextlib.contextmanager
def scratch_worktree():
    """A disposable checkout with its own git dir, removed on exit.

    `git worktree add` materialises HEAD, so the gate under test is copied in
    from the WORKING TREE afterwards. Without that overlay this harness would
    silently test the last commit and report ok on a broken uncommitted
    check.sh -- a green result for code nobody ran, which is the exact failure
    this file exists to prevent.
    """
    with tempfile.TemporaryDirectory() as tmp:
        scratch = Path(tmp) / "repo"
        subprocess.run(
            ["git", "worktree", "add", "--detach", "--quiet", str(scratch), "HEAD"],
            cwd=REPO, check=True,
        )
        try:
            shutil.copyfile(REPO / "check.sh", scratch / "check.sh")
            (scratch / "check.sh").chmod(0o755)
            yield scratch
        finally:
            subprocess.run(
                ["git", "worktree", "remove", "--force", str(scratch)],
                cwd=REPO, check=False,
            )


def main():
    with scratch_worktree() as scratch:
        code, out = run_gate(scratch)
        if code != 0:
            print("FAIL: clean scratch copy should pass the gate, got exit %d" % code)
            print(out)
            return 1

        pruner = scratch / "bin" / "prune-dead-links"
        with pruner.open("a") as fh:
            fh.write(BROKEN)

        code, out = run_gate(scratch)
        if code == 0:
            print("FAIL: gate returned 0 on a broken bin/prune-dead-links -- "
                  "the python syntax check is not load-bearing")
            print(out)
            return 1
        if "bin/prune-dead-links" not in out:
            print("FAIL: gate failed but never named bin/prune-dead-links")
            print(out)
            return 1

    print("ok: gate passes clean and fails on a broken bin/prune-dead-links")
    return 0


if __name__ == "__main__":
    sys.exit(main())
