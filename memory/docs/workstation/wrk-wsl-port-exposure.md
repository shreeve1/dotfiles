---
title: wrk WSL Port Exposure
summary: Scoped Hyper-V rules and deselecting the overlapping NetBird LAN route enable WSL/Docker LAN ingress; mesh exposure remains separate.
type: doc
status: promoted
created: 2026-10-26
updated: 2026-10-31
topics: [workstation]
---

## Active memory

wrk uses WSL2 mirrored networking with Hyper-V inbound Block. NetBird runs on Windows. Two independent layers matter: ingress firewall and return routing.

- **Overlapping LAN route:** NetBird network `My Subnet` advertises `10.20.20.0/24`. When selected on wrk, Windows wt0 metric1 beat physical Ethernet256; WSL chose eth1, source100.95.235.60, for physical LAN hosts. TCP LAN replies failed and UDP replies used the mesh source even after scoped firewall allows. An eth0-bound diagnostic listener worked. James approved `netbird networks deselect 'My Subnet'` on wrk only on2026-10-31. Ordinary WSL and Docker bridge TCP/UDP LAN ingress then passed. Keep the physical LAN route local; rollback is `netbird networks select -a 'My Subnet'` but restores the conflict. Do not change other peers or server policy implicitly.
- **Scoped Hyper-V rules:** `NetBirdPrep-WSL-Recovery-2222` permits TCP2222 from aidev10.20.20.16; `NetBirdPrep-WSL-HTTP-8080-8081` permits those TCP ports from aidev and NPM10.20.20.72; `NetBirdPrep-WSL-STUN-3478` permits UDP3478 from the same two. All restrict LocalAddresses to10.20.20.176 and WSL creator `{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}`. Default Block remains. Actual NPM/aidev Docker ingress passed; non-allowlisted pve4.53 and control8082 stayed blocked. These are LAN prep rules, NOT WAN STUN approval. Any future .10 address change must update their local-address restriction.
- **Mesh exposure is separate:** wildcard WSL listeners can remain reachable from allowed NetBird peers without new port rules. Tested before route change:8082 reachable over mesh although blocked over LAN. A LAN rule is not an app-level mesh restriction.
- **Independent recovery:** aidev can authenticate to Windows LAN.176:22 using strict pinned `HostKeyAlias=100.95.235.60`; that elevated shell can invoke WSL. WSL LAN.176:2222 uses a DIFFERENT key: `HostKeyAlias='[100.95.235.60]:2222'`. Mixing aliases gives a real host-key mismatch; do not disable checking or overwrite keys.
- **Windows to WSL:** use127.0.0.1. Earlier probes found PowerShell localhost timed out while Chrome worked. If a mesh peer cannot reach a WSL listener, check whether it bound127.0.0.1 rather than0.0.0.0.

## Related

- [Native Docker choice](memory/decisions/workstation/decision-wrk-native-docker.md) records runtime ownership; Docker publishing was tested through the network layers above.
- [Herdr direct attach](memory/docs/workstation/herdr-wsl-direct-attach.md) describes why WSL connectivity must not be interrupted casually.

Changed2026-10-31: LAN failure required both scoped ingress rules and removing the overlapping client route; firewall alone was not sufficient.
