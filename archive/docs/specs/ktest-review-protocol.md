# ktest — Throwaway card to exercise the Review verdict protocol

**Goal:** A disposable, low-risk card whose only purpose is to prove the board
carries a spec unattended through the fixed Review stage — a real reviewer
claims its task, records a durable verdict via `agent_teams_update_task`, and
the reconcile promotes on that verdict. Delivers a single marker file plus a
guard that checks it. Safe to delete after the run.

**Repo:** /home/james/dotfiles   **Branch:** auto/ktest

```yaml
gate:
  cwd:  .
  argv: [bash, check.sh]
```

## Items

### 1. Add a marker file and a guard that checks it

**Delivers:** a new file `docs/specs/ktest-marker.txt` containing the single
line `review-protocol-probe`, and a new executable guard
`docs/specs/check-ktest-marker.sh` that exits 0 only when the marker file
exists and contains that exact line.

**Blocked by:** none.

```yaml
survey:                       # exit 0 means already done
  cwd:  .
  argv: [test, -x, docs/specs/check-ktest-marker.sh]
acceptance:                   # exit 0 means correctly done
  cwd:  .
  argv: [bash, docs/specs/check-ktest-marker.sh]
scope:
  writes:
    - docs/specs/ktest-marker.txt
    - docs/specs/check-ktest-marker.sh
  protects:
    - check.sh
    - install.sh
```

**Notes:**

- The guard must be a single self-contained bash file with `set -euo pipefail`
  (the board runs one argv, no `&&` chaining). Assert the marker file exists
  and `grep -Fxq 'review-protocol-probe'` matches it.
- `survey` is the guard's existence (`test -x`), non-zero today (script does not
  exist yet), 0 once the item lands.

## Explicitly out of scope for this board

- Anything beyond the two named files. This card exists only to exercise the
  pipeline; it changes no real behaviour.
