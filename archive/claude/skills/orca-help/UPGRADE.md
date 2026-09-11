# Orca headless upgrade safety gate

This file is **NOT the upgrade source of truth** and intentionally contains no executable upgrade or rollback procedure. The single authoritative upgrade source is the current official [Headless Linux server guide](https://github.com/stablyai/orca/blob/main/docs/reference/headless-linux-server.md). Do not cache, copy, or maintain the full upstream script here.

## Execution-time gate

Before changing a host:

1. Fetch the current official guide at execution time and read its **Upgrade** and **Roll back** sections completely. Use those exact current blocks, adapted only for the live service user and profile. Any locally reconstructed script must be reviewed against current upstream before execution.
2. Discover the live unit, service user, HOME/profile, binary path, unit path, VERSION path, architecture, installed version, and client version. Do not trust the observations below without rechecking.
3. Query the current release API and verify the selected release asset's official URL, SHA-256 digest, byte size, and host architecture. Keep client and server versions aligned.
4. Confirm every non-negotiable gate below is represented by the current upstream procedure before execution. If a gate is missing or ambiguous, stop and fail closed; do not improvise.

## Observed local deltas (verify live)

- **aidev** (observed 2026-07-25): service user `james`; profile `/home/james/.config/orca`; binary `/opt/orca/orca-linux.AppImage`; unit `/etc/systemd/system/orca-serve.service`; version `/opt/orca/VERSION`.
- **n8n** (observed 2026-07-25): service user `orca`; profile `/home/orca/.config/orca`; binary `/opt/orca/orca-linux.AppImage`; unit `/etc/systemd/system/orca-serve.service`; version `/opt/orca/VERSION`.

These are observations, not inputs. Discover all values live and adapt the official blocks only for the resolved service user/profile.

## Non-negotiable ordered gates

1. Stage the uniquely named asset on the `/opt` target filesystem.
2. Before stopping the service, verify the current release API asset URL, digest, byte size, and architecture.
3. Set and verify required root ownership and safe modes.
4. Stop the service before archiving the profile.
5. Create one complete, root-owned, mode-`0700` `.ready` rollback directory; do not use a separate marker.
6. Bundle the binary, `VERSION`, and stopped-service profile together.
7. Promote atomically; never overwrite the live binary in place.
8. Provide automatic recovery on failure and otherwise fail closed.
9. Verify readiness from the structured JSON service journal as documented in [REFERENCE.md](REFERENCE.md#filtered-readiness-never-prints-pairing-urlcodeqrdeviceruntime-identifiers).
10. Preserve pairing identity using compare-only, in-memory checks.
11. Roll back the full profile, binary, and `VERSION` together. Binary-only rollback is unsafe because a newer binary may have changed profile schema; a key digest does not detect schema evolution.
12. Confirm client/server version alignment before declaring success.

Never print, log, or commit pairing URLs or codes, QR payloads, session tokens, cookies, credentials, private keys, device/runtime identifiers, or profile contents. Inspect raw journals and logs only locally and redact them before any output.
