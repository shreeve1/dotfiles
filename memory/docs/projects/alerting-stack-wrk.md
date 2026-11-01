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
