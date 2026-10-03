---
type: analysis
title: Projectlean Wiki-First SOUL Staging
description: Portable SOUL contract and protected installation boundary for projectlean.
status: promoted
created: 2026-09-19
updated: 2026-10-03
promoted: 2026-10-03
sources:
  - wiki/raw/sessions/2026-09-19-projectlean-wiki-first-soul.md
  - wiki/raw/sessions/2026-09-19-projectlean-soul-final-apply.md
  - wiki/raw/sessions/2026-09-19-projectlean-query-skill-repair.md
  - .hermes/templates/projectlean-soul.md.template
  - .hermes/bin/install-projectlean.py
  - .hermes/bin/verify-projectlean.py
confidence: high
tags:
  - hermes
  - projectlean
  - wiki
  - soul
---

# Projectlean Wiki-First SOUL Staging

`projectlean` now has a portable, concise SOUL template that preserves the stock communication contract while routing project-context work through `wiki/index.md`, then routed pages and primary sources. It delegates wiki setup/refactoring to `llm-wiki-setup` and durable session capture to `wiki-update`; live state and primary sources remain authoritative.

The installer records the template's SHA-256 but does not create, remove, or overwrite `SOUL.md`. James approved the protected projectlean-only backup/copy; final verification passed with exact byte parity, 12 tool schemas / 16,215 schema bytes, and a real wiki-backed query. `kanban` and `messaging` remain excluded. Substantial follow-up work uses the documented/native project issue system; never invent an issue backend or silently create external issues.

The SOUL and project router have separate roles: the SOUL is universal discipline; the router stays project-local and thin. The live template is 1,886 bytes (within the accepted 2,100-byte cap), SHA-256 `8662733d6b4141e10f70b2c3ff9109392500ea4c7c9f2e7fe4279fa5733edaa5`; the stock SOUL backup is retained for rollback.

The real query temporarily left extra profile skill directories, which final post-apply correctly rejected. Re-running the idempotent installer restored exactly the six vendored trees without changing the live SOUL; final post-apply verification passed.

# Citations

- [Session capture](/raw/sessions/2026-09-19-projectlean-wiki-first-soul.md)
- [Final apply capture](/raw/sessions/2026-09-19-projectlean-soul-final-apply.md)
- [Query skill repair capture](/raw/sessions/2026-09-19-projectlean-query-skill-repair.md)
- `.hermes/templates/projectlean-soul.md.template`
- `.hermes/bin/install-projectlean.py`
- `.hermes/bin/verify-projectlean.py`
