---
type: analysis
title: T3 Code ships pi as a first-party driver (v0.0.46+), but the UI offers no custom-provider path
description: T3 Code's provider drivers are compile-time and live in packages/provider-*; pi landed in v0.0.46 (2026-10-14 nightly), runs pi over the pi --mode rpc entry point (no community pi-acp adapter needed), and is disabled by default with no UI toggle — enabling it requires editing ~/.t3/userdata/settings.json directly.
status: promoted
created: 2026-10-14
updated: 2026-10-14
sources:
  - wiki/raw/sessions/2026-10-14-t3-code-pi-provider.md
  - wiki/raw/sessions/2026-10-14-t3-ssh-load-balancing.md
  - packages/provider-pi/src/settings.ts
  - packages/provider-pi/src/server.ts
  - apps/server/src/provider/builtInDrivers.ts
  - apps/server/src/provider/ModelManifest.ts
  - ~/.t3/userdata/settings.json
confidence: high
tags: [t3-code, pi, providers, drivers, custom-agents, settings]
---

# T3 Code + pi coding agent: provider architecture and wiring

As of 2026-10-14 the user asked how to set their pi coding tool up as a custom provider in the T3 Code desktop app. The answer is that T3 Code has **no runtime custom-provider mechanism**, but pi is already a **first-party built-in driver** — it just needs a newer binary than the stable channel ships, plus a direct settings.json edit because there is no UI toggle.

## Driver model is compile-time, not runtime

T3 Code's eight provider drivers ship inside the desktop binary as part of the monorepo (`apps/server/src/provider/builtInDrivers.ts:42-52`): `codex`, `claudeAgent`, `cursor`, `grok`, `opencode`, `antigravity`, `pi`, and `muse`, plus the `acpRegistry` driver for generic ACP agents pulled from a registry. The list is consumed by `ProviderInstanceRegistry` at boot; anything not in this list surfaces as an "unavailable" shadow snapshot at runtime.

The "Add provider instance" dialog is a per-driver workflow for adding **multiple instances of one already-compiled driver** (e.g. `codex_personal` + `codex_work` with independent `CODEX_HOME` paths) — it is not a custom-driver entry point. Users who want a new driver must either wait for a release that adds it or build T3 Code from the relevant branch. There is no `provider add <command>` configures, no plugin API, and no manifest file T3 Code reads at startup.

## Pi is a first-party driver; v0.0.46 is the gate

`packages/provider-pi` is a vendor package in T3 Code's main branch. Its `PiDriver` composes `PiAdapterV2Driver` (the orchestrator-v2 adapter that drives the session/turn lifecycle) and a Pi-backed text-generation path. The bundled `model-manifest.json` confirms the driver lands at **v0.0.46+** with `recommendedRange: ">=1.0.0"` and `>=0.80.5` supported. The user's installed pi v1.2.0 is comfortably in range.

v0.0.45 (the latest **stable** as of 2026-10-14) does **not** ship the pi driver — verified by extracting `/usr/lib/t3code/resources/app.asar` and grepping for `PiDriver` / `@t3tools/provider-pi` / `AcpRegistry` (all zero hits). The v0.0.46 builds are only on `nightly` and `preview` channels at the time of writing: latest nightly `v0.0.46-nightly.20261014.3132` (2026-10-14), latest preview `v0.0.46-preview.20261010.2909` (2026-10-10). After the nightly switch in this session, the new binary contained 17 `PiDriver` and 478 `provider-acp-registry` string references — confirming the driver is bundled.

## Pi driver talks to pi over RPC mode (no `pi-acp` adapter needed)

The PiDriver spawns pi via `pi --mode rpc`. A 3 s `pi --mode rpc` smoke test in this session emitted JSON-RPC events (`extension_ui_request`, `setStatus`, `setWidget`) as expected, confirming the integration path. The community `pi-acp` adapter exists for ACP clients that want to speak pi's dialect through the Agent Client Protocol layer — T3 Code is not one of those clients, so the adapter is unnecessary.

## Enabling pi requires editing `~/.t3/userdata/settings.json` directly

The pi provider ships **disabled by default** (`PiSettings.enabled: false`) and the `enabled` field is hidden in the settings form (`providerSettingsForm: { hidden: true }`) — so the desktop UI does not surface a toggle. To turn pi on, edit the **userdata** settings file (NOT `~/.config/t3code/`, which is just Electron app data):

```jsonc
{
  "providers": {
    "pi": { "enabled": true }
    // other providers unchanged
  }
}
```

Defaults for the rest of the schema are sensible — `binaryPath: "pi"` resolves via the user's existing `~/.local/bin/pi` symlink, and `launchArgs: ""` is fine for a stock setup. The change is picked up on the next T3 Code launch; no service restart is needed (no systemd unit is registered by default).

## Two-channel update path: user-managed vs pacman

T3 Code installs in two parallel ways on this machine:

- `~/.local/bin/t3` → `~/.t3/runtime/versions/<v>/t3` — the user-managed launcher that supports `t3 update --channel nightly` and lives in user space.
- `/usr/bin/t3` (and `/usr/lib/t3code/`) — the Omarchy-repo `t3code-bin` package, currently `0.0.45-2`.

The user-managed launcher wins in PATH, so `t3 update --channel nightly` switches the effective version while leaving the pacman package one version behind (and 360 MB of stale shadow install). When Omarchy republishes 0.0.46, `pacman -Syu t3code-bin` will reconcile them.

## Account-free SSH environments: avoid the loopback collision

In `0.0.46-nightly.20261014.3132`, the SSH launcher adopts a running default-home server only when its persisted HTTP origin is loopback. A service bound only to its NetBird address is not adopted: **Add environment** waits on `127.0.0.1`, tries to launch another server against the same userdata, and fails with `ServerAlreadyRunningError`. Use a loopback listener for SSH-managed access; do not run a second server against the same home. This removes direct NetBird HTTP access unless a separate, deliberately configured route preserves it.

Verification: run `t3 __ssh-helper runtime-port ~/.t3/userdata/server-runtime.json` and `t3 __ssh-helper wait-ready 3773 3000 1000`, then request `/.well-known/t3/environment` through an SSH forward. SSH environments need no T3 account; the online T3 Connect hub is separate.

## Load-balancing prerequisites

- Check **the running T3 server's PATH**, not just the SSH login shell: pi can be installed under `~/.npm-global/bin` or `~/.local/bin` yet invisible to a systemd service. Provider enablement and authentication must also work on each eligible machine.
- Shared projects are grouped by repository identity, not matching titles or matching filesystem paths. Arbitrary SSH aliases remain literal hosts in this build's URL normalizer: `github-personal/owner/repo` differs from `github.com/owner/repo`. Preserve multi-account SSH authentication when aligning identity.
- Preferences are scoring weights, not percentages: Prefer=100, Normal=50, Less often=25, Manual only=0. The score is weight × CPU count × idle CPU fraction × available RAM fraction. CPU usage at least 95%, RAM availability at most 5%, and stale/invalid samples exclude a candidate.
- Placement selects a machine for a new eligible draft. It does not migrate running threads or synchronize dirty checkouts. Each selected checkout still needs its own dependencies and local configuration; manually test the provider and project commands on each machine first.

Source and runtime evidence: [SSH and load-balancing session capture](/raw/sessions/2026-10-14-t3-ssh-load-balancing.md). Per-project repairs and provider-login readiness are intentionally not claimed complete.

## Citations

- `wiki/raw/sessions/2026-10-14-t3-ssh-load-balancing.md`

- `wiki/raw/sessions/2026-10-14-t3-code-pi-provider.md`
- `packages/provider-pi/src/settings.ts:25-49`
- `packages/provider-pi/src/server.ts:7-9`
- `apps/server/src/provider/builtInDrivers.ts:42-52`
- `apps/server/src/provider/ModelManifest.ts` (compat matrix)
- `~/.t3/userdata/settings.json` (pre/post diff)
- `/usr/lib/t3code/resources/app.asar` (v0.0.45 binary — 0 pi references)
- `~/.t3/runtime/versions/0.0.46-nightly.20261014.3132/t3` (v0.0.46 binary — 17 PiDriver refs)
- GitHub releases: https://api.github.com/repos/pingdotgg/t3code/releases (latest nightly v0.0.46-nightly.20261014.3132)