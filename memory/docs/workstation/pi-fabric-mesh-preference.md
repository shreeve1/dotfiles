---
title: Pi Fabric Mesh On, Peer Notices Off
summary: Fabric mesh stays on so the auto-start reviewers get events; peer notices stay off fleet-wide. Project settings can override global defaults.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-11-03
topics: [workstation]
---

James chose on 2026-11-03 to keep Fabric mesh enabled and peer notices disabled on every system, replacing his 2026-10-30 preference for both off. Reason: pi-fabric 0.131.4 delivers host events to actors only while `mesh.enabled` is true, so turning mesh off silences the advisor, supervisor and specialist that `.pi/agent/extensions/fabric-auto-start.ts` starts. Peer notices (join/leave messages in the transcript) are independent of that and stay off.

Set `mesh.enabled: true` and `mesh.peerNotices: false` in each Pi installation's global `~/.pi/agent/fabric.json`; trusted project `.pi/fabric.json` overrides can take precedence. Fabric's settings screen defaults to project scope; Ctrl+G switches to global. Reload Fabric or restart sessions after changes.

If mesh ever goes off, also disable fabric-auto-start and its `tests/pi-verify-final-disabled.test.sh` guard, since the reviewers would idle.
