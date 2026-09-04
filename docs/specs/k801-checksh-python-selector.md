# k801 — check.sh has no Python selector

**Goal:** `./check.sh` syntax-checks the repo's tracked Python files the same way
it already syntax-checks its shell files, so a syntax error in
`bin/prune-dead-links` — the script that calls `os.remove` on symlinks under
`$HOME` — makes the gate exit 1 instead of printing `ok`. The check is guarded by
a coverage assertion naming the two files it exists for, so a future selector
typo fails loudly instead of silently shrinking coverage to zero, and it is
proved by a committed negative test that breaks a scratch copy of the pruner and
asserts the gate *fails*.

**Repo:** /home/james/dotfiles   **Branch:** auto/k801

```yaml
gate:
  cwd:  .
  argv: [./check.sh]
```

## Background — this is the third instance of one defect

`check.sh` has now shipped `ok` on a file it never opened three times:

| card | selector at the time | what it missed |
|---|---|---|
| k520 | glob `*.sh` | extension-less `bin/` scripts (`bin/pi-delegate`) |
| — | (k520's fix) shebang `bash\|sh\|dash` | `.bashrc` / `.zshrc`, which have no shebang — fixed by adding them to the `git ls-files` half |
| **k801** | same shebang set | `#!/usr/bin/env python3` is none of `bash`, `sh`, `dash` |

k520's fix moved selection from extension to shebang content. Rewriting the
pruner from bash to python3 (k551) moved it straight back out of coverage. The
selector was never wrong for the files it knew about; it was wrong about which
files exist.

**Demonstrated, not theorised** (re-confirmed at spec time, 2026-09-04, in a
scratch clone at `/tmp` — the working tree was never modified):

```
$ echo 'this is not valid python(((' >> bin/prune-dead-links
$ ./check.sh ; echo $?
checked: 31 tracked install sources (3 untracked skipped), 62 shell files, 87 json files, 0 dangling links
ok
0
```

The same file, through the prototype selector this spec specifies:

```
FAIL: python syntax: bin/prune-dead-links: SyntaxError: '(' was never closed
```

37 tracked Python files match the selector today and all 37 compile clean, so
this item turns green on a correct repo and red on a broken one — the property
`--selftest` lacked through five review rounds of k551.

## The `tests/` blind spot, and the rule that does *not* fix it

`.gitignore:200` is `/tests/`. `tests/prune-oracle.py` is tracked only because it
was force-added. Any **new** file under `tests/` is invisible to git, therefore
invisible to `git ls-files`, therefore invisible to the gate — a Build task can
report success having committed nothing.

The obvious repair, `!tests/*.py` appended under `/tests/`, **does not work**.
Git does not descend into a directory excluded by a rule ending in `/`, so the
negation is never consulted. Verified in a scratch repo at spec time:

```
.gitignore = "/tests/"  + "!tests/*.py"   →  tests/a.py IGNORED  (rule /tests/)
.gitignore = "/tests/*" + "!/tests/*.py"  →  tests/a.py TRACKABLE
```

The directory rule must become the glob form `/tests/*` for the negation to have
anything to override. That is why item 1 exists and why item 2 depends on it:
item 2's negative test is a `.py` file under `tests/`, so it can only be
committed without `git add -f` once item 1 has landed correctly. **Item 2 being
committable is item 1's real proof.**

## Items

### 1. Make `tests/*.py` trackable without `git add -f`

**Delivers:** a new `.py` file created under `tests/` is visible to git, to
`git ls-files`, and therefore to the gate, with no force-add. Non-Python scratch
under `tests/` (the vendored clone the rule was written for) stays ignored.

**Blocked by:** none.

```yaml
survey:
  cwd:  .
  argv: [grep, -qxF, "!/tests/*.py", .gitignore]
acceptance:
  cwd:  .
  argv: [grep, -qxF, "/tests/*", .gitignore]
scope:
  writes:   [.gitignore]
  protects: [check.sh, install.sh, bin/, tests/prune-oracle.py, docs/specs/]
```

**Notes:**

Replace the single line `/tests/` with exactly two lines, in this order:

```
/tests/*
!/tests/*.py
```

Order matters and the trailing-slash removal matters — see the table above. The
survey checks the negation line, the acceptance checks the glob line; both must
be present, which is why they probe different lines rather than the same one.

Do **not** widen this to `!tests/**` or add other extensions. The rule exists to
keep a vendored clone and scratch output out of git; only `.py` is being
re-included, because only `.py` is what the gate needs to see.

`tests/prune-oracle.py` is already tracked and must stay tracked — confirm with
`git ls-files tests/` before and after; the file list must not shrink.

### 2. Add the Python selector, syntax check and coverage guard to `check.sh`

**Delivers:** `./check.sh` exits 1 with `FAIL: python syntax: <file>: <error>`
when any tracked Python file does not compile, and exits 1 with a distinct
selector-broken message if the scan stops reaching `bin/prune-dead-links` or
`tests/prune-oracle.py`. `tests/gate_negative.py` **(new)** proves both, by
breaking a scratch copy and asserting the gate fails.

**Blocked by:** item 1.

```yaml
survey:
  cwd:  .
  argv: [test, -x, tests/gate_negative.py]
acceptance:
  cwd:  .
  argv: [tests/gate_negative.py]
scope:
  writes:   [check.sh, tests/gate_negative.py]
  protects: [.gitignore, install.sh, bin/prune-dead-links, tests/prune-oracle.py, docs/specs/]
```

**Notes:**

`tests/gate_negative.py` is **(new)**. `bin/prune-dead-links` is in `protects`
deliberately: this item proves the gate catches a broken pruner, and it does that
against a **scratch copy under `mktemp`**, never by editing the working tree. The
handoff lesson applies directly — do not prove a check load-bearing by reverting
or mutating the real tree.

**`check.sh` must stay read-only.** `python3 -m py_compile` writes `__pycache__`
next to the source. Use `python3 -c` with `compile()` instead; verified at spec
time to leave `git status --porcelain` clean across all 37 files.

Mirror `shell_files()` at `check.sh` §2 exactly, including its comment about why
two copies of a selector must never exist — **one list, built once, used for both
the check and its own coverage guard.** The prototype below was run against this
repo at spec time: 37 files, 0 failures, no `__pycache__`, clean `git status`.

```bash
python_files() {
  {
    git ls-files '*.py'
    git grep -l -I -E '^#!.*\bpython[0-9.]*\b' -- ':!*.md' 2>/dev/null
  } | sort -u
}
```

Both halves are needed for the same reason the shell block needs both:
`bin/prune-dead-links` has no `.py` extension (shebang half finds it), and a
`.py` library with no shebang is not executable (`git ls-files` half finds it).
`[0-9.]*` matches `python3`, `python3.12` and bare `python`.

The coverage guard names, in the `shell_files` guard's `<<'MUST'` style:

```
bin/prune-dead-links
tests/prune-oracle.py
```

Verified at spec time that replacing the selector with a deliberately wrong one
(`git ls-files '*.pyx'`) makes the guard emit 2 failures rather than passing
silently.

Print the Python count in the existing `checked:` summary line alongside the
shell and JSON counts, and place the whole block as a new §3 after the shell
check, renumbering the JSON and link sections.

`tests/gate_negative.py` must, at minimum:

- copy the repo into `mktemp` (use `git worktree` or a plain copy that includes
  `.git`; the gate needs git to run — **never `git archive`**, which strips
  `.git` and makes `check.sh` collapse for unrelated reasons, per k525),
- run `./check.sh` in the scratch copy and assert exit **0**,
- append invalid Python to the scratch copy's `bin/prune-dead-links`, re-run, and
  assert exit **non-zero** and that the output names `bin/prune-dead-links`,
- exit 0 only if both hold; print which assertion failed otherwise.

Capture the exit code by redirecting to a file and reading it directly — do not
read `$?` through a pipe, it yields the last command's status.
