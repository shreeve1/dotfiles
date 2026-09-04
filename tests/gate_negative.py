#!/usr/bin/env python3
"""Prove check.sh's python syntax check is load-bearing, not decorative.

check.sh has shipped "ok" on a file it never opened three times (k520, k801).
A check that cannot fail is not a check, so this asserts the failing case
directly: break a scratch copy of bin/prune-dead-links and require the gate to
notice.

Everything happens in a mktemp copy. The real working tree is never modified --
the k525 handoff lesson: do not prove a check load-bearing by mutating or
reverting the tree you are checking. The copy includes .git (never git archive,
which strips it and makes check.sh collapse for unrelated reasons).
"""

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


def main():
    with tempfile.TemporaryDirectory() as tmp:
        scratch = Path(tmp) / "repo"
        shutil.copytree(REPO, scratch, symlinks=True)

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
