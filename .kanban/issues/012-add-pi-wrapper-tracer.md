---
id: 012
title: Add Pi wrapper tracer
status: in_progress
type: AFK
blocked_by: [005, 018]
parent: null
created: 2026-05-09
---

## What to build

Add wrapper-first Pi support that gives Pi canonical session identity and redacted event metadata without reading Pi auth files or depending on deep Pi lifecycle extension points.

## Acceptance criteria

- [ ] `pai-run pi` launches Pi with canonical session environment and wrapper-level start/stop events.
- [ ] Adapter records redacted metadata and degraded capabilities for unsupported lifecycle events.
- [ ] Adapter never reads `.pi/agent/auth.json` or any equivalent provider credential file.
- [ ] Tests prove Pi auth files are not opened, read, globbed, or copied.
- [ ] Deeper Pi TypeScript extension work is explicitly deferred until lifecycle boundaries are proven.

## Blocked by

- Blocked by #005.
- Blocked by #018.
