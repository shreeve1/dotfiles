# k745 — Commit the differential path-safety harness for prune-dead-links

**Goal:** The exhaustive sweep that found the defects `prune-dead-links --selftest`
could not is committed to the repo instead of living in `/tmp`, so a future edit
to the pruner can be checked against an independent oracle rather than against
fixtures whose author shares the code's blind spots.

**Repo:** /home/james/dotfiles   **Branch:** auto/k745

```yaml
gate:
  cwd:  .
  argv: [./check.sh]
```

## Background — why a second test file, when a selftest already exists

`bin/prune-dead-links --selftest` has 31 fixtures and passes. It is worth
keeping. It is also not sufficient, and the history says so plainly: five
consecutive review rounds each found a case where the previous shell
implementation **deleted a symlink resolving outside the repo** — the one thing
the script promises never to do — and every one of those defects passed a green
`--selftest` and a green `./check.sh` at the time. Each new fixture was written
by the same author as the code, so it tested the branch that was already right.

The difference here is the **oracle**. Instead of asserting an expected outcome
per fixture, the harness enumerates paths mechanically and asks
`os.path.realpath` where each one actually resolves, then compares that against
the pruner's keep/delete decision. The author's imagination is out of the loop.

Its value is measurable, not asserted. Replayed against k551's own commits it
reports:

| commit | mismatches |
|---|---|
| `d017b01d` | 72 |
| `6aab6084` | 18 |
| `60527f36` | 6 |
| `42138bb3` | 8 |
| `0737a11a` | 0 |
| `b74d6cdc` (python) | 0 |

It fails on the code that was broken and passes only on the code that is right.
That is the property the selftest lacked.

## Items

### 1. Commit the harness as `tests/prune-oracle.py`

**Delivers:** a runnable, committed differential test. `tests/prune-oracle.py`
enumerates every path up to a bounded depth over a component alphabet, scores
each dangling result against `os.path.realpath`, and exits non-zero if the
pruner's decision disagrees with the oracle in either direction.

**Blocked by:** none.

```yaml
survey:
  cwd:  .
  argv: [test, -x, tests/prune-oracle.py]
acceptance:
  cwd:  .
  argv: [tests/prune-oracle.py]
scope:
  writes:   [tests/prune-oracle.py]
  protects: [bin/prune-dead-links, check.sh, install.sh, docs/specs/]
```

**Notes:**

`tests/prune-oracle.py` is **(new)**; the `tests/` directory does not exist yet
either. Nothing else in the repo changes — in particular **`bin/prune-dead-links`
must not be touched**. It is freshly merged, verified, and outside this item's
write scope. If the harness reports a mismatch, that is a finding to report, not
a licence to edit the pruner.

Required behaviour:

- Build a fixture tree under `mktemp` containing, inside a fake repo: a real
  directory, a dangling symlink pointing **outside** the repo, a dangling symlink
  pointing **inside**, and a relative symlink that escapes via `..`.
- Enumerate every path up to depth 3 over the alphabet {those four names,
  a missing name, `.`, `..`}. Depth 3 is 361 cases and runs in seconds; make the
  depth a constant at the top so it can be raised by hand.
- Score only links that are actually dangling. For each, the oracle is
  `os.path.realpath(target, strict=False)`, and the expected decision is *delete*
  when that resolves to the repo root or a path under it, *keep* otherwise.
- Print each mismatch with the target, the oracle's answer, and both decisions,
  labelled **SAFETY** when a link resolving outside was deleted and
  **completeness** when repo residue survived. Exit 0 only when there are none.
- Run the pruner as `bin/prune-dead-links` with `HOME` and `DOTFILES_DIR` pointed
  into the fixture. **Never touch the real `$HOME`.**

Python 3 is already this repo's choice for exactly this problem — `check.sh`
selects it by shebang, so the file needs `#!/usr/bin/env python3`, `chmod +x`,
and it will be syntax-checked by the gate automatically.

Do **not** wire this into `check.sh`. The gate runs on every card in Verify and
must stay fast and repo-scoped; this harness is for whoever edits the pruner.
Naming it in this spec is what makes it discoverable.
