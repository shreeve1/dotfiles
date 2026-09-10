# Orca topology, docs, and runbook

Treat all observed Orca versions, paths, and hostnames as mutable; verify live before acting. State date of every observation.

## Identity map

Each runtime host runs the same `orca-serve.service` unit but with a distinct service user and profile path. Verify live before assuming; see [Known issues](#known-issues) for the single-source crash fact and [Live version and status checks](#live-version-and-status-checks) for exact commands.

- **Orca Mac client** (observed 2026-07-26): user `james`, `/Applications/Orca.app`, profile `/Users/james/Library/Application Support/orca`. Bundle version **v1.4.156**. Client **Active Server** preference set to `itan8n` on 2026-07-26; this controls the host used by server-routed Add Project, terminals, and provider checks.
- **aidev (Orca runtime host)** (observed 2026-07-25): SSH `james@100.95.230.15`, Ubuntu 24.04 x86_64, private tailnet, fixed port 6768. Binary `/opt/orca/orca-linux.AppImage`, version file `/opt/orca/VERSION`, unit `/etc/systemd/system/orca-serve.service`. Service runs as `james`, HOME `/home/james`, shell `/usr/bin/zsh`. Flags: `--port 6768 --pairing-address 100.95.230.15 --json --mobile-pairing`. Profile `/home/james/.config/orca`. **aidev observed v1.4.156 on 2026-07-25**. Pi at `/home/james/.npm-global/bin/pi`, herdr at `/home/james/.local/bin/herdr` (observed 2026-07-25).
- **aidev CLI wrapper** (observed 2026-07-25): `/home/james/.local/bin/orca` is a deliberate minimal wrapper executing `/opt/orca/orca-linux.AppImage`. `orca status` and orchestration work. See [Known issues](#known-issues) for the CLI crash observed 2026-07-25.
- **n8n (Orca runtime host)** (observed 2026-07-26): SSH `itadmin@100.95.224.218`, Ubuntu 24.04 x86_64, private tailnet, port 6768, **v1.4.156 observed 2026-07-26**. Same main paths as aidev; service `User=itadmin`, `Group=itadmin`, HOME and working directory `/home/itadmin`, shell `/usr/bin/zsh`, profile `/home/itadmin/.config/orca`. Uses `xvfb-run` plus `APPIMAGE_EXTRACT_AND_RUN=1`; mobile pairing enabled. Service identity changed from `orca` to `itadmin` on 2026-07-26; the profile was migrated with pairing-identity digest equality verified. Pi and herdr resolve from `/home/itadmin/.local/bin`. Do not assume it shares aidev's user environment.

Both are remote Orca servers, not bare SSH worktrees.

## Frontend development strategy

Recorded 2026-07-25 from the user's graphical-iteration requirement and the official [Ways to run](https://www.onorca.dev/docs/ways-to-run), [SSH worktrees](https://www.onorca.dev/docs/ssh), and [Remote Orca Servers](https://www.onorca.dev/docs/remote-servers) documentation:

- For browser frontend work, prefer a laptop-owned Orca SSH worktree targeting `aidev`. Files, Git worktrees, dev servers, and agents run on `aidev`; the Orca UI, editor, diff, and browser remain on the Mac. Forward the remote dev-server port through Orca's Ports pane for local HMR, screenshots, and graphical iteration.
- Start long-lived Pi work inside `tmux` or `herdr` on `aidev` when it must outlive Orca's SSH relay reconnect grace period (five minutes by default, configurable per target). Reattach instead of attempting host migration.
- Use the `aidev` Remote Orca Server for server-owned sessions, unattended work, mobile access, and automation—not as the default tight frontend loop.
- Orca documents host-specific persistence and reattachment, not live migration of a running local terminal or agent process into another runtime. For genuinely local or Mac-native work such as iOS Simulator or macOS platform behavior, transfer at a Git checkpoint; do not use bidirectional filesystem synchronization or SSHFS for concurrently edited worktrees.

## Primary docs

- Docs root: https://www.onorca.dev/docs
- Ways to run: https://www.onorca.dev/docs/ways-to-run
- Remote servers: https://www.onorca.dev/docs/remote-servers
- Terminal: https://www.onorca.dev/docs/terminal
- Install and updates: https://www.onorca.dev/docs/install
- CLI overview: https://www.onorca.dev/docs/cli/overview
- CLI orchestration: https://www.onorca.dev/docs/cli/orchestration
- CLI skills: https://www.onorca.dev/docs/cli/skills
- Headless Linux server: https://github.com/stablyai/orca/blob/main/docs/reference/headless-linux-server.md
- Releases: https://github.com/stablyai/orca/releases
- Latest release API: https://api.github.com/repos/stablyai/orca/releases/latest
- Issues and PRs: https://github.com/stablyai/orca/issues and https://github.com/stablyai/orca/pulls

## Known issues

Single-source crash fact (observed 2026-07-25): `orca skills get orchestration --full` exits 139 on aidev v1.4.156. Do not call cached/observed Orca versions current; use official web docs or the installed skill until rechecked after upgrade. The identity map and CLI checks above reference this fact; they do not restate it.

- `No renderer window available` on paired structured-agent launch in 1.4.155; fixed client-side in 1.4.156 by PR [#10193](https://github.com/stablyai/orca/pull/10193). Keep Orca client and server version-aligned.
- Remote-host agent detection and list in 1.4.156 fixed by PR [#9790](https://github.com/stablyai/orca/pull/9790).
- `APPIMAGE_EXTRACT_AND_RUN=1` reuses deterministic `/tmp/appimage_extracted_*` directories. After changing the systemd service user, old mode-`0700` extraction directories can cause `fopen error: Permission denied` and `Failed to extract AppImage`; move them aside while the service is stopped so the new user can re-extract (observed on n8n 2026-07-26).
- `{{path}} was checked on {{hostName}}, but that host did not report a usable folder` means Add Project used the client **Active Server** named in the error, not necessarily the host that owns the path. Verify Settings → Remote Orca Servers → Advanced → Active Server before changing either server (observed 2026-07-26).

## Live version and status checks

All paths and users below are exact; resolve live before relying on them. These checks are read-only and do not prove non-public exposure — see [Exposure caveat](#exposure-caveat).

### Local Orca bundle (Mac)

```bash
defaults read /Applications/Orca.app/Contents/Info.plist CFBundleShortVersionString
ls -l /Applications/Orca.app
```

### aidev (runtime host)

```bash
# exact unit name; do not guess variants
sudo systemctl status orca-serve.service --no-pager
cat /opt/orca/VERSION
# exact port filter; ss does not require sudo when the user can read /proc/net/tcp
ss -ltnH 'sport = :6768'
ls -l /home/james/.config/orca/
```

User, environment, and exec start (read-only; never paste contents into chat):

```bash
sudo systemctl show orca-serve.service -p User -p Environment -p ExecStart --no-pager
```

aidev Pi, herdr, PATH (logged-in interactive zsh only; do not assume n8n has these):

```bash
sudo -u james /usr/bin/zsh -lic 'command -v pi; command -v herdr; print -r -- $PATH'
```

Logs: `/home/james/.config/orca/logs/`.

### n8n (runtime host)

Resolve the actual Orca service user live; do not assume `james`. The unit is still `orca-serve.service`.

```bash
sudo systemctl status orca-serve.service --no-pager
sudo systemctl show orca-serve.service -p User -p Environment -p ExecStart --no-pager
cat /opt/orca/VERSION
ss -ltnH 'sport = :6768'
SERVICE_USER=$(sudo systemctl show orca-serve.service -p User --value)
SERVICE_HOME=$(getent passwd "$SERVICE_USER" | cut -d: -f6)
sudo ls -ld "$SERVICE_HOME/.config/orca"
```

Then, as the resolved Orca service user (substitute the value of `User=` above):

```bash
sudo -u <SERVICE_USER> /usr/bin/zsh -lic 'command -v pi; command -v herdr; print -r -- $PATH' || true
```

Logs: `/home/itadmin/.config/orca/logs/`.

### Mac Orca logs

`/Users/james/Library/Application Support/orca/logs/daemon.log` and `/Users/james/Library/Application Support/orca/logs/main.trace.ndjson`.

### Orca CLI

```bash
orca status
orca orchestration --help
```

For `skills get orchestration --full`, follow [Known issues](#known-issues) instead of relying on the local CLI.

### Targeted local journal inspection

Raw journals and logs can contain pairing URLs and other secrets. Inspect them only locally and redact before any output. Search only for an exact error string supplied by the user:

```bash
read -r -p 'Exact error string: ' ERROR_STRING
sudo journalctl -u orca-serve.service -o cat --no-pager | grep -F -- "$ERROR_STRING"
unset ERROR_STRING
```

### Filtered readiness (never prints pairing URL/code/QR/device/runtime identifiers)

The service does not expose an HTTP readiness endpoint; readiness is emitted as a single-line JSON event in the unit journal because `ExecStart` includes `--json`. Use this exact filtered pipeline, restricted to the documented allow-list:

```bash
LINE=$(sudo journalctl -u orca-serve.service -o cat --no-pager \
  | jq -Rrc 'fromjson? | select(.type == "orca_server_ready" and .schemaVersion == 1) | {type: .type, schemaVersion: .schemaVersion, boundEndpoint: .boundEndpoint, advertisedEndpoint: .advertisedEndpoint, pairingAvailable: .pairing.available, scope: .pairing.scope}' \
  | tail -1)
test -n "$LINE"
printf '%s\n' "$LINE"
```

`fromjson?` swallows non-JSON lines; `tail -1` selects the latest matching event, and `test -n "$LINE"` fails if none exists. The output is limited to `type`, `schemaVersion`, `boundEndpoint`, `advertisedEndpoint`, `pairingAvailable`, and `scope`; any field that could carry pairing URLs, codes, QR payloads, tokens, or device/runtime identifiers is intentionally omitted.

### Pairing-identity preservation (compare, never print)

When the service profile contains `orca-e2ee-keypair.json`, capture pre and post digests into process-local variables and compare them with `test`. Never echo the digest and never read the keypair contents. Substitute the resolved service user's profile path (currently `/home/itadmin/.config/orca/...` on n8n).

```bash
KEYPAIR=/home/james/.config/orca/orca-e2ee-keypair.json
if test -f "$KEYPAIR"; then
  BEFORE_KEY_DIGEST=$(sha256sum "$KEYPAIR" | awk '{print $1}')
  # ... change window (upgrade or rollback) ...
  test -f "$KEYPAIR" && AFTER_KEY_DIGEST=$(sha256sum "$KEYPAIR" | awk '{print $1}')
  test "$BEFORE_KEY_DIGEST" = "$AFTER_KEY_DIGEST"
  unset BEFORE_KEY_DIGEST AFTER_KEY_DIGEST
else
  false
fi
```

These digests live only in process memory; they must never be echoed, logged, or returned from the shell. Equality of the digests confirms identity preservation; equality does not detect profile schema evolution, so a digest match alone is not sufficient to permit binary-only rollback. The file contents themselves are never read or printed.

## Exposure caveat

A bound listener on port 6768 does not prove the port is private. Before declaring an Orca runtime non-public, confirm in one place each:

- No router, cloud security group, NAT, or host firewall rule forwards 6768 inbound from the public internet.
- Tailnet ACL path: only the intended tailnet peers can reach the host.
- A client on the same network can reach the listener:

```bash
nc -zvw5 100.95.230.15 6768   # aidev
nc -zvw5 100.95.224.218 6768  # n8n
```

If any of the three checks is uncertain, the deployment is not confirmed private; do not paste pairing links or readiness output anywhere that could be public.

## Security rule

Never print, log, or commit any Orca auth material: pairing URLs and codes, session tokens, cookies, credentials, private keys, QR payloads, device/runtime identifiers, or any profile contents. Profile checks compare digests; they never print profile data. See [Pairing-identity preservation](#pairing-identity-preservation-compare-never-print) for the compare-only pattern and [Exposure caveat](#exposure-caveat) for the non-public-exposure rule.

## Upgrade safety

Use [UPGRADE.md](UPGRADE.md) only as a safety gate. The single upgrade source of truth is the current official [Headless Linux server guide](https://github.com/stablyai/orca/blob/main/docs/reference/headless-linux-server.md); fetch it at execution time and read its Upgrade and Roll back sections completely. Non-negotiable rules:

- Stage the new AppImage as a uniquely named temporary file on the `/opt/orca` filesystem; verify the current release API asset URL, SHA-256 digest, expected size, and x86-64 ELF structure before any service stop.
- Never overwrite a live AppImage in place; never expose port 6768; never record pairing links or any auth material.
- Capture the rollback bundle only while the Orca service is stopped; verify journal-based filtered readiness and pairing-identity digest equality before declaring the upgrade complete.