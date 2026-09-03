#!/usr/bin/env python3
"""Differential path-safety harness for bin/prune-dead-links.

Enumerates every path up to DEPTH components over a small alphabet, materialises
each as a symlink under a throwaway fake $HOME, and compares the pruner's
keep/delete decision against an independent oracle: os.path.realpath(strict=False).

The oracle, not a hand-written expectation, decides. A link whose target resolves
to the repo root or below it must be deleted; anything else must survive. Exits 0
only when the pruner agrees on every dangling case.

Not wired into check.sh — run it by hand when editing bin/prune-dead-links.
"""

import os
import shutil
import subprocess
import sys
import tempfile

DEPTH = 3  # 7 names, ~400 cases; raise by hand to widen the sweep

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRUNER = os.path.join(REPO, "bin", "prune-dead-links")

# The four fixture names, a name that does not exist, and the two magic components.
NAMES = ["real", "deadout", "deadin", "relesc", "missing", ".", ".."]


def build_fixture(home):
    """A fake $HOME containing a fake repo. Never touches the real one.

    The repo must be named "dotfiles": the pruner's walker skips that directory,
    so the enumerated links have to live outside it (under .config/links) to be
    seen at all.
    """
    root = os.path.join(home, "dotfiles")
    os.makedirs(os.path.join(root, "real"))
    os.makedirs(os.path.join(home, "outside"))
    links = os.path.join(home, ".config", "links")
    os.makedirs(links)

    os.symlink(os.path.join(home, "outside", "gone"), os.path.join(root, "deadout"))
    os.symlink(os.path.join(root, "nothing"), os.path.join(root, "deadin"))
    os.symlink("../outside/nowhere", os.path.join(root, "relesc"))
    return root, links


def enumerate_targets(root):
    """Every path of 1..DEPTH components below the repo root."""
    targets = []
    combos = [[]]
    for _ in range(DEPTH):
        combos = [c + [n] for c in combos for n in NAMES]
        targets.extend(os.path.join(root, *c) for c in combos)
    return targets


def main():
    home = tempfile.mkdtemp(prefix="prune-oracle.")
    try:
        root, links = build_fixture(home)
        real_root = os.path.realpath(root)

        cases = []  # (link path, target, oracle resolution, expected decision)
        for i, target in enumerate(enumerate_targets(root)):
            link = os.path.join(links, "case-%04d" % i)
            os.symlink(target, link)
            if not (os.path.islink(link) and not os.path.exists(link)):
                continue  # only dangling links are in scope
            resolved = os.path.realpath(target, strict=False)
            inside = resolved == real_root or resolved.startswith(real_root + os.sep)
            cases.append((link, target, resolved, "delete" if inside else "keep"))

        env = dict(os.environ, HOME=home, DOTFILES_DIR=root)
        run = subprocess.run([PRUNER], env=env, capture_output=True, text=True)
        if run.returncode != 0:
            print("pruner exited %d\n%s" % (run.returncode, run.stderr), file=sys.stderr)
            return 2

        mismatches = 0
        for link, target, resolved, expected in cases:
            actual = "keep" if os.path.islink(link) else "delete"
            if actual == expected:
                continue
            mismatches += 1
            label = "SAFETY" if expected == "keep" else "completeness"
            print(
                "%s: target %s\n  oracle resolves to %s\n  expected %s, pruner chose %s"
                % (label, target, resolved, expected, actual)
            )

        print(
            "%d dangling case(s) of %d enumerated, %d mismatch(es)"
            % (len(cases), len(enumerate_targets(root)), mismatches)
        )
        return 1 if mismatches else 0
    finally:
        shutil.rmtree(home, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
