---
name: symphony-restart
description: Restart symphony-host.service with a pre-sanity → restart → verify-log-lines ritual. Use when bringing the Symphony scheduler onto new code, recovering from a stale process, or after editing the unit file. Read-only sanity gate runs first; sudo restart only after James approves at the moment of action.
---

# Symphony Restart

Wraps the operational ritual James ran 3× during the 2026-06-08 multi-binding rollout: pre-restart sanity → ask-then-restart → verify the reconcile + dispatch log lines on the new process. Refuses to restart silently — the restart step is on the must-confirm list per `/home/james/plane/CLAUDE.md`.

## Prerequisites

- Host: aidev (`/home/james/plane/symphony` exists, `symphony-host.service` installed).
- Read access to journal (no sudo needed for `journalctl -u`).
- `sudo systemctl restart` requires James's typed approval at the moment of the restart.
- Optional `--with-tests` flag runs `python3 -m pytest` as part of sanity (slow ~30s; default off).

## Safety rules

- Never invoke `sudo systemctl restart symphony-host.service` without a fresh yes from James in this turn.
- Never print values from `/home/james/plane/symphony-host.env`.
- If sanity fails, stop. Do not "fix" anything from this skill — surface the failure to James.
- If the disk sha and the running sha already match AND sanity is green, point out that no restart is needed and ask James whether to proceed anyway.
- If a reconcile fails after restart, surface the error and remind James the rollback recipe (per `end-to-end-test.md`) is `git revert <head>` + restart — do not auto-rollback.

## Out of scope

- Editing code, scaffolds, `bindings.yml`, the unit file, or env files.
- Rolling back commits (`git revert`).
- Filing smoke tickets or running Plane writes (see `symphony-binding-smoke`).

## Interactive workflow

### 1. Pre-restart sanity (read-only)

Run from `/home/james/plane/symphony`:

```bash
SYMPHONY_REPO=${SYMPHONY_REPO:-/home/james/plane/symphony}
cd "$SYMPHONY_REPO"

git log --oneline -1                    # current master head sha
git status --porcelain                  # clean tree expected
systemctl show symphony-host.service \
  --property=ActiveState,SubState,MainPID,ActiveEnterTimestamp --no-pager
journalctl -u symphony-host.service --since="5 minutes ago" -n 50 --no-pager \
  | grep -E 'ERROR|Traceback|ConfigError|reconcile_startup_failed' || echo "no recent errors"
```

Capture, for the verdict block:

- `disk_sha` — first column of `git log --oneline -1`.
- `running_sha` — best-effort: if `MainPID` is recent enough that `/proc/<pid>/cwd` resolves to `$SYMPHONY_REPO`, the running code is whatever was at HEAD at `ActiveEnterTimestamp`. There is no in-process sha endpoint today; treat the comparison as "disk head vs the journal's most recent `symphony_started code_sha=...` line".
- `dirty` — true if `git status --porcelain` is non-empty (anything besides `.pi-lens/` or `.rpiv/` untracked is dirty).
- `service_state` — `active/running` expected.

If `--with-tests` was passed:

```bash
python3 -m pytest --tb=short -q | tail -3
```

Expect 426+ passing (count drifts as the suite grows; flag drift, don't gate on the exact number).

### 2. Sanity verdict

Print a compact block:

```
disk head      <sha>  <subject>
running sha    <sha from last symphony_started line>  (matches | STALE)
working tree   clean | dirty: <files>
service state  active/running | <other>
recent errors  none | <count> matches in last 5min
tests (opt-in) 426 passed | <drift>
```

If anything is red, stop. Tell James and wait. Do not proceed.

If everything is green AND `disk head == running sha`, surface "no restart needed" and ask James whether to proceed anyway (sometimes he restarts to clear in-memory state). Default: skip restart.

### 3. Ask James to approve the restart

Per `/home/james/plane/CLAUDE.md`, `systemctl restart` is on the must-confirm list. Show the exact command and wait for explicit yes:

```
About to run:
  sudo systemctl restart symphony-host.service

Reason: <stale code sha | manual restart request | unit file edit | ...>
Proceed? (y/n)
```

Do not type into the sudo prompt for James. Just run the command after his y.

### 4. Restart and capture new process

```bash
sudo systemctl restart symphony-host.service
sleep 5
systemctl show symphony-host.service \
  --property=ActiveState,SubState,MainPID,ActiveEnterTimestamp --no-pager
```

Confirm `ActiveState=active`, `SubState=running`, new `MainPID`, fresh `ActiveEnterTimestamp`. Capture the timestamp — you'll use it for the verify-log-lines filter.

If `ActiveState != active` after 5s, capture last 60 journal lines and stop:

```bash
journalctl -u symphony-host.service --since="1 minute ago" -n 60 --no-pager
```

### 5. Verify log lines (reconcile + dispatch)

Reconcile cadence is ~30s on first tick. Sleep then read:

```bash
sleep 35
journalctl -u symphony-host.service --since="@${ACTIVE_ENTER_EPOCH}" --no-pager -n 200
```

Where `ACTIVE_ENTER_EPOCH` is the timestamp from step 4 converted to epoch (or just `--since="1 minute ago"` if simpler).

Filter for these lines:

- `symphony_started service=symphony code_sha=<sha> bindings=<N>` — one line, names the new code sha and binding count.
- `reconcile_startup_begin binding=<name>` — one per binding in `bindings.yml`.
- `reconcile_startup_done binding=<name> cleaned=<N>` — one per binding, matching the begin lines.
- `dispatch_completed dispatched=false reason=<...>` (or `dispatched=true issue_id=<id>`) — proves the dispatcher loop is alive on at least one binding.

Common `reason` values for `dispatched=false`: `no-candidates` (no Todo issues), `plane-unreachable` (transient — fine if no real work pending), `binding-blocked` (a binding's reconciler bailed; investigate).

### 6. Verdict

Print:

```
restart        ok  pid=<n> started=<iso>
code_sha       <sha>  (from symphony_started line)
bindings       <N>: <name1>, <name2>, ...
reconciles     <N> begin / <N> done / 0 failed
dispatch_loop  alive (last: dispatched=<bool> reason=<...>)
errors         <count> ERROR/Traceback lines since restart
```

If any binding has `reconcile_startup_failed`, surface the binding name + error message and remind James:

> Rollback recipe (per end-to-end-test.md): `git revert <head>` then re-run this skill.

Do not auto-rollback.

### 7. Hand off

If everything is green, that's the end of the skill. The dispatcher loop is alive on the new code; any pending Todo issues will dispatch on the next tick.

If James was restarting because he scaffolded a new binding, point him at `symphony-binding-smoke` for the next step.
