---
title: Hermes Media SQLite Runtime
summary: Wrk Hermes media uses a uv-managed Python with fixed SQLite; runtime rollback does not roll back WAL data.
type: doc
status: promoted
created: 2026-11-01
updated: 2026-11-01
topics: [workstation]
---

## Active memory

Wrk `hermes-gateway-media.service` uses `~/.hermes/hermes-agent/venv`, rebuilt 2026-11-01 on uv CPython 3.12.15 with SQLite 3.53.1 to address the WAL-reset warning from system SQLite 3.45.1. Verify the actual running interpreter and `sqlite3.sqlite_version` after future runtime updates; `hermes update` does not guarantee a fixed SQLite.

The verified cold copy is `~/migration-aidev/hermes-rebuild-20261101-0354Z` (private); it includes the media profile and root-level `~/.hermes/shared-state.db` and `~/.hermes/state.db`, not just the profile. It contains sensitive data. The old environment is retained as `~/.hermes/hermes-agent/venv.pre-sqlite`. A runtime rollback does not roll back database writes or WAL mode; restoring the cold data would lose later messages. Do not delete backups or change the live gateway without approval.

The gateway restarted and Slack, Discord and WhatsApp connected. The old SQLite warning was absent; DELETE-to-WAL notices were expected. Message delivery was not tested. Evidence: `/home/james/.local/state/herdr-handoff/20261101-030500-hermes-sqlite-report.md` and the service owner's rebuild receipt in the cold backup.
