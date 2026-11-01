---
title: Alerting Stack Runs on wrk
summary: Wazuh->router->alertmanager->dispatch->ops-board now serves from wrk; OpsAgentSink needs a unit drop-in env file, and wrk inbound only answers on its NetBird IP.
type: doc
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [projects]
---

## Active memory

- The homelab alerting chain serves from wrk since 2026-10-31: wazuh manager (pve3 CT 122) signs with `custom-homelab-router.py` (secret in `/etc/homelab-stack/wazuh-router.env`, per-CT copy) and POSTs to the router on wrk at **NetBird** `http://100.95.235.60:9101/webhooks/wazuh` — wrk's LAN-mirrored inbound does NOT answer; only the NetBird IP does. Router -> alertmanager (10.20.20.40:9093) -> dispatch timer -> dpi ops backend at `http://127.0.0.1:4780` (local user unit).
- `homelab-alert-dispatch.service` dispatches through **OpsAgentSink only** (ops_agent_sink.py); the `HOMELAB_OPS_*` env comes from `~/.config/homelab-stack/ops-agent.env`, which is loaded **only by the systemd drop-in** `homelab-alert-dispatch.service.d/ops-agent.conf`. A fresh install without the drop-in exits 1 every tick ("Ops sink configuration invalid") — aidev's live unit had it, copies of the unit file alone do not.
- The unit runs as `User=james` but writes its heartbeat into `/var/lib/node_exporter/textfile_collector` — that dir must be `root:james 775` or every tick logs permission-denied (ct127 liveness writes the same dir as root, so it hides the mismatch).
- Authorized path to the wazuh manager from wrk: pinned ssh root@10.20.20.53 (pve4, `~/.ssh/known_hosts.pve4-10.20.20.53`, no HostKeyAlias) -> pinned root@10.20.20.52 (HostKeyAlias=pve3, `/etc/pve/nodes/pve3/ssh_known_hosts`) -> `pct exec 122 -- bash -s` fed by stdin through both hops.
- aidev's `netbird-server` (pid on aidev, /go/bin/netbird-server) is a COMBINED management+signal+relay+STUN service: stopping it can drop relayed peer sessions (direct tunnels may persist). wrk-WSL pi sessions launched before 2026-10-31's models.json re-point to local still hold live connections to aidev 100.95.230.15:8317 — restart panes to move them onto the local cli-proxy.
- Wazuh webhook integrations fire per-alert with **no retry**: while the wrk router is down, delivery attempts are lost (accepted for reboot windows; missed alerts remain visible in wazuh's own logs).
- NPMplus (docker container, CT115, CT-side config root `/opt/npmplus`): editing a generated `proxy_host/*.conf` is live-but-fragile — NPM regenerates confs from `database.sqlite` on host-save, so a persistent change must CAS the DB row AND the conf (known drift: row 60 holds the old aidev upstream while the conf was repointed).
- Coordination state files under `~/.local/state/herdr-handoff/` must be one-owner-per-file: a shared findings annex kept losing whole sections to parallel writer panes.

## Migration window 2026-11-01 (CLOSED green)

- The aidev->wrk migration change window (.10 NetBird repoint of NPM rows 51+60 + Windows reboot) closed 2026-11-01T03:24Z with all postboot probes PASS: ops.testytech.net 200 via .10, real-relayed SSH banner, external STUN/LAN/hairpin, dispatch 201s, NPM 51/60/stream unchanged. NPM row ownership returned to pX (me) at close. pV's NetBird cold backups: /var/lib/netbird-lan10-recovery/20261101-{021706,031500}. Nonsecret recovery guides: aidev /home/james/.local/state/wrk-recovery/. My window scripts + final runbook: wrk /home/james/.local/state/herdr-handoff/window-scripts/ + 20261101-window-recovery-runbook.md.
- **systemd exit-metadata gotcha (cost two HALT cycles):** after a clean manual stop of a long-running service, `systemctl show` reports ExecMainCode=0 ExecMainStatus=0 with MainPID=0 and cleared timestamps (metadata RESET), while a completed oneshot keeps Code=1/Status=0. A strict "must be 1/exited + 0|143" gate always HALTs on clean stops of long-runners. Arbitration-satisfying proof: Result=success + NRestarts=0 + PID-gone + cursor-scoped privileged manager journal (--after-cursor from a pre-stop cursor, filtered PID/InvocationID) showing "Deactivated successfully"/"Stopped". Use `InvocationID` (populated) not ExecMainInvocationID (blank on this systemd).
- **/proc census TOCTOU:** iterating /proc/[0-9]*/cgroup races with process teardown; a vanished-mid-scan entry must skip (dir absent at recheck), persistent-unreadable stays fail-closed. Self-spawned scanner children (grep/cat) make the race near-certain otherwise.
- Router unit is disabled-by-design but runtime-started: after any reboot it needs `systemctl start` (NEVER enable); the 3 liveness/dispatch timers are enabled and auto-start.
