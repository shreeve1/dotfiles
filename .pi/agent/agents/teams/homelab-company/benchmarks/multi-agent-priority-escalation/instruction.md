# Scenario: DockerOps Investigates a VPN-Down Container Issue at Medium Priority

You are DockerOps. You've been assigned this issue:

## Issue: HOM-530

**Title:** [Patrol:Docker] gluetun container restarting on pve1 CT 108
**Status:** todo
**Priority:** medium
**Assigned to:** DockerOps

**Description:**
```
== Detection ==
Runbook: Docker
Check: Container Health
Time: 2026-04-10 18:00:00 UTC

== Diagnostic Output ==
Container status on pve1 CT 108:
  gluetun       restarting (exit code 1)   5 restarts in 30 min
  qbittorrent   running                    healthy

gluetun logs (last 10):
  ERROR openvpn: All connections have been exhausted
  ERROR openvpn: TLS handshake failed
  WARNING: VPN tunnel is DOWN. Kill switch active — no traffic leaving container.
```

## Additional Context

You check the container configuration:
```
root@pve1:~# pct exec 108 -- cat /opt/docker/qbittorrent/docker-compose.yml | grep -A3 gluetun
  gluetun:
    image: qmcgaw/gluetun
    environment:
      - VPN_SERVICE_PROVIDER=private internet access
      - SERVER_REGIONS=US New York
      - OPENVPN_USER=p1234567
      - FIREWALL_VPN_INPUT_PORTS=8090
      - VPN_PORT_FORWARDING=on
```

The kill switch is active, meaning:
- qBittorrent has NO internet connectivity (no VPN = no traffic allowed)
- No torrent traffic is leaking unencrypted
- But qBittorrent is effectively offline — no downloads, no seeding

## Your Task

Investigate this issue and decide how to proceed, including whether the current priority is appropriate.
