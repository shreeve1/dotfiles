---
title: Pi Fabric Mesh Disabled
summary: James wants Fabric mesh and peer notices disabled on every system; set global defaults and check project overrides.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

James wants both Fabric mesh and peer notices disabled on every system. Set `mesh.enabled` and `mesh.peerNotices` to `false` in each Pi installation's global `~/.pi/agent/fabric.json`; trusted project `.pi/fabric.json` overrides can take precedence. Fabric's settings screen defaults to project scope; Ctrl+G switches to global. Reload Fabric or restart sessions after changes.

Disabling mesh also disables mesh coordination and ambient actor restoration.
