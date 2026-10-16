# Writer freeze

herdr has no `agent stop` or `agent freeze` command. `pane close` kills processes in the pane's Unix session. A child that used `setsid` can escape that session. Enroll the initial pane shell in an owned process boundary before starting the agent.

## Contain the initial shell

On a Linux target with a user systemd manager, use the newly created Offload pane's original shell. Read `herdr --machine MACHINE_ID pane process-info --pane PANE`. Capture its actual initial shell PID. Require an available shell with that initial PID owning the foreground. A nested scoped shell is not available to `agent start` and must not replace it.

Use a validated slug and a decimal positive `INITIAL_PID`. Refuse an occupied pane or an existing unit named `offload-<slug>.scope`. Run this source-side block through the verified SSH host as the pane's owning user. It enrolls the original shell and collects the pre-start properties and membership in one target call. Keep `SCOPE_BEFORE` and `SCOPE_BEFORE_ERR` as fresh mode-0600 captures.

```sh
umask 077
ENROLL_COMMAND=$(python3 -c 'import shlex,sys; print(shlex.join(["sh","-s","--",*sys.argv[1:]]))' "$UNIT" "$INITIAL_PID")
ssh -T -- "$HOST" "$ENROLL_COMMAND" > "$SCOPE_BEFORE" 2> "$SCOPE_BEFORE_ERR" <<'SH'
set -eu
UNIT=$1
INITIAL_PID=$2
busctl --user call org.freedesktop.systemd1 /org/freedesktop/systemd1 \
  org.freedesktop.systemd1.Manager StartTransientUnit 'ssa(sv)a(sa(sv))' \
  "$UNIT" fail 4 PIDs au 1 "$INITIAL_PID" KillMode s control-group \
  Delegate b false TimeoutStopUSec t 5000000 0
systemctl --user show "$UNIT" --property=ActiveState --property=ControlGroup \
  --property=KillMode --property=TimeoutStopUSec --property=InvocationID
GROUP=$(systemctl --user show "$UNIT" --property=ControlGroup --value)
test -n "$GROUP"
cat "/proc/$INITIAL_PID/cgroup"
cat "/sys/fs/cgroup$GROUP/cgroup.procs"
SH
```

Gate. Require an active scope, `KillMode=control-group`, a five-second stop timeout, an InvocationID and a concrete ControlGroup. The initial shell's `/proc` cgroup and the exact group's `cgroup.procs` must prove its membership. Save the PID, unit, InvocationID and ControlGroup beside the source receipt.

Continue [the ordered startup](commands.md#ordered-startup) for original-shell PATH preparation, optional focus and fresh pi startup. The SSH control command above does not replace the pane shell.

## Check agent membership

After interactive readiness, obtain the unchanged initial shell PID and actual `AGENT_PID` from the pane's current process-info. Run this separate source-side block once. Keep `SCOPE_AFTER` and `SCOPE_AFTER_ERR` as fresh mode-0600 captures.

```sh
umask 077
MEMBERSHIP_COMMAND=$(python3 -c 'import shlex,sys; print(shlex.join(["sh","-s","--",*sys.argv[1:]]))' "$UNIT" "$INITIAL_PID" "$AGENT_PID")
ssh -T -- "$HOST" "$MEMBERSHIP_COMMAND" > "$SCOPE_AFTER" 2> "$SCOPE_AFTER_ERR" <<'SH'
set -eu
UNIT=$1
INITIAL_PID=$2
AGENT_PID=$3
systemctl --user show "$UNIT" --property=ActiveState --property=ControlGroup \
  --property=KillMode --property=TimeoutStopUSec --property=InvocationID
GROUP=$(systemctl --user show "$UNIT" --property=ControlGroup --value)
test -n "$GROUP"
cat "/proc/$INITIAL_PID/cgroup" "/proc/$AGENT_PID/cgroup"
cat "/sys/fs/cgroup$GROUP/cgroup.procs"
SH
```

Gate. The scope is active with the recorded InvocationID and ControlGroup, `KillMode=control-group`, and the five-second stop timeout. Both actual PIDs belong to that exact cgroup. Store these observations beside the receipt before prompting. Read status and pane output on failure. Refuse safe-to-close unless readiness and membership pass. Pre-start evidence cannot satisfy this post-start gate.

Keep every task writer/tool in this scope. The only return exception is a user-requested fresh herdr controller with immutable intent and proved process separation. That controller performs lifecycle, review and delivery, not task work. Other units, containers, remote workers, scheduled jobs or external task writers require separately approved containment before dispatch. Unknown external writers block return. Existing services are read-only dependencies, not members to stop.

Each actual dispatch must check initial-shell enrollment, scope properties and pi membership. On another OS, use an existing supervisor only after proving its process-tree containment and stop behavior. Idle, stable git SHAs and a lockfile are not substitutes.

## Stop before return

Invoke stop only from the independently recorded controller, never from the worker scope. Check the actual control command's `/proc/self/cgroup` as well as controller shell/pi membership. Each must be outside the recorded worker group and every descendant. Different panes or workspaces alone do not prove it.

Use the complete private dispatch record for boot ID, PID birth identities, scope InvocationID/ControlGroup and target-local herdr session. A changed incarnation or reused PID is not a kill target. After a controller crash, reconcile a durable freeze proof and immutable pin before choosing any action. A pinned retry does not stop another scope or reselect the worker branch tip.

1. Require a separate `complete` Result or user-requested `paused` checkpoint. Before Result, route this worker's own journals and summaries to approved private metadata. Keep the checkout unchanged afterward. Inspect the recorded worker agent through its target-local session. Omit `--session` for observed null, or use the exact recorded named selector.
2. Run `return_state.py freeze` through [the return control recipe](commands.md#return-control). It publishes outside-scope acceptance and captured writer identities before stop. Captured initial-shell and pi births must match dispatch. Under its fail-fast lock it checks immutable boot/PID/scope ownership and freshly verifies the expected incarnation before each control command. It performs the bounded owned-scope stop, proves descendant-cgroup and captured-process exit, rereads the clean exact branch and publishes proof, creation-only ref and pin.
   It accepts inactive, terminal failed or absent scope only with complete exit proof. A loaded terminal unit may clear ControlGroup. The helper still proves the saved group's descendants empty and its captured writers exited. It requires the recorded InvocationID and rejects any differing nonempty group. Cleared terminal properties never authorize another signal. A refusal never authorizes a manual stop or a different PID/unit.
3. After successful freeze, close only the recorded worker pane through that same target-local session if it remains. Scope shutdown may already remove its last-pane workspace. Already-absent pane, workspace and worker agent are acceptable after exit proof. Keep the registered worktree and branch. Do not stop shared herdr or recreate the worker.
4. For interrupted or repeated return, let the helper reconcile the saved operation, proof, ref and pin. Existing pin identity wins over mutable HEAD. A changed ref or inconsistent proof refuses rather than selecting another Result.
5. Keep receiving editors and agents quiescent on affected files across source scan, review and apply. Record actual ownership evidence or explicit user pause assurance. A Git lock is only serialization between cooperating applies, not editor containment. Unproved quiescence leaves delivery pending.

The receipt records observations. It is not itself a lock. Refuse return if actual containment, member exit, exact branch or a clean worker tree cannot be established.
