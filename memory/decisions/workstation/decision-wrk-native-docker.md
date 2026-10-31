---
title: wrk Native Docker
summary: James chose native Ubuntu Docker/Compose in wrk WSL, not Docker Desktop; systemd startup still depends on WSL starting.
type: decision
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [workstation]
---

## Decision

James approved native Ubuntu `docker.io` plus `docker-compose-v2` inside wrk Ubuntu-24.04 WSL instead of Docker Desktop. This matches Linux/systemd workloads without another desktop-managed runtime. Access stays through sudo; do not add James to the root-equivalent docker group implicitly.

Docker and containerd are enabled system services. Runtime state lives on the Linux filesystem at `/var/lib/docker`, not `/mnt/c`. Docker normally installs its own bridge/firewall rules; Hyper-V policy is a separate layer.

Docker service enablement is NOT Windows boot readiness: it starts only after WSL starts. The inspected `wsl-keepalive` task has a one-time time trigger and InteractiveToken, not a boot trigger. A boot-before-sign-in mechanism and actual restart test need separate approval; do not claim they exist from systemd alone.

## Related

- [WSL port exposure](memory/docs/workstation/wrk-wsl-port-exposure.md) records the separately approved LAN firewall/routing prerequisites for Docker publishing.
