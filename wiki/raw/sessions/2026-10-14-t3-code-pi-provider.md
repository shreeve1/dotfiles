# Session Capture: T3 Code + pi coding agent as a built-in provider

- Date: 2026-10-14
- Purpose: Document T3 Code's compile-time driver model and the path to enable pi as a first-party provider (the user asked how to set pi up as a custom provider; the answer is "it isn't custom, it's built-in starting in v0.0.46+").
- Scope: T3 Code provider architecture, version gating for pi support, settings.json wiring, and the version migration executed this session. Captures the verified contract so future sessions don't re-derive it.

## Durable Facts

- T3 Code's provider "drivers" are **compiled into the desktop binary** (`apps/server/src/provider/builtInDrivers.ts`, `BUILT_IN_DRIVERS`); there is **no runtime or UI mechanism to add a custom driver**. The "Add provider instance" dialog the user opened is per-driver — it adds multiple instances of one already-compiled driver (e.g. `codex_personal` + `codex_work` with independent `CODEX_HOME`s), never a new driver kind. — `apps/server/src/provider/builtInDrivers.ts:42-52` (the eight built-in kinds: codex, claudeAgent, cursor, grok, opencode, antigravity, pi, muse, plus acpRegistry), and verified by extracting `/usr/lib/t3code/resources/app.asar` from the v0.0.45 install and confirming zero hits for `PiDriver` / `AcpRegistry` strings.

- Pi is a first-party T3 Code driver at `packages/provider-pi`, driver-kind slug `pi`, default config `enabled: false` with `binaryPath: "pi"` and `launchArgs: ""`. — `packages/provider-pi/src/settings.ts:25-49`.

- The pi driver talks to pi via **RPC mode (`pi --mode rpc`)**, not ACP; the community `pi-acp` adapter is **not** required. — `packages/provider-pi/src/server.ts:7-9` exports `PiDriver`/`PiAdapterV2Driver`; the bundled model-manifest.json lists `pi` driver with `recommendedRange: ">=1.0.0"` and `>=0.80.5` supported. The user's pi 1.2.0 is in range.

- The pi driver landed in **T3 Code v0.0.46+** per the bundled `model-manifest.json` (`driver: "pi"`, `t3CodeRange: ">=0.0.46"`). v0.0.45 (the latest stable as of 2026-10-14) has **no pi support at all**. As of 2026-10-14 the only v0.0.46 builds are `nightly` and `preview` channels — latest nightly `v0.0.46-nightly.20261014.3132`, latest preview `v0.0.46-preview.20261010.2909`. — `apps/server/src/provider/ModelManifest.ts` (matrix), GitHub `repos/pingdotgg/t3code/releases`.

- Enabling pi in T3 Code requires editing `~/.t3/userdata/settings.json` (NOT `~/.config/t3code/`) to add `"pi": { "enabled": true }` under `providers`. The pi provider is **off by default** and no UI toggle is wired; `enabled` is hidden in the settings form (`providerSettingsForm: { hidden: true }`). — `packages/provider-pi/src/settings.ts:25-32`, `~/.t3/userdata/settings.json` before/after diff captured 2026-10-14.

- T3 Code also bundles an `AcpRegistryDriver` (8th vendor driver) for generic ACP agents via a registry; both `pi` and `acpRegistry` ship in the same `>=0.0.46` build. — `apps/server/src/provider/builtInDrivers.ts:42-52`.

- The user-managed launcher `~/.local/bin/t3` (via `~/.t3/runtime/versions/<v>/t3`) and the Omarchy-repo pacman package `t3code-bin` (both currently 0.0.45-2/0.0.45) coexist; `~/.local/bin/t3` wins in PATH. `t3 update --channel nightly` switches the user-managed launcher to a v0.0.46 nightly build and leaves the pacman package as 0.0.45-2 (shadowed). — observed 2026-10-14 during this session.

## Decisions

- Switch T3 Code from stable to nightly channel to access v0.0.46+ pi support — accepted by user. Executed via `t3 update --channel nightly -y`, transitioned 0.0.45 → 0.0.46-nightly.20261014.3132.
- Edit `~/.t3/userdata/settings.json` directly to enable pi (no UI toggle, no CLI subcommand to do it for them) — accepted by user. Backup at `settings.json.bak-2026-10-14` left in place.

## Evidence

- `/usr/lib/t3code/resources/app.asar` (v0.0.45 binary, Omarchy pacman install) — confirmed 0 hits for `PiDriver` / `AcpRegistry` / `@t3tools/provider-pi`.
- `~/.t3/runtime/versions/0.0.46-nightly.20261014.3132/t3` (new nightly build) — 17 hits for `PiDriver` and 478 hits for `provider-acp-registry`, confirming the driver is bundled.
- `~/.t3/userdata/settings.json` — JSON edit landed clean, validated with `python3 -c "import json; json.load(open(...))"`.
- `pi --mode rpc` smoke test — JSON-RPC events emitted (extension_ui_request, setStatus, etc.) within 3 s, confirming the integration path T3 Code's PiDriver will spawn.

## Exclusions

- No T3 Code version-pinning spec, auth tokens, or model credentials stored anywhere.
- No transcript-level content captured beyond the durable facts above.
- Settings.json backup retains the user's full pre-change settings (which are non-sensitive, no secrets).

## Open Questions And Follow-Ups

- When T3 Code v0.0.46 ships to stable, the user can `t3 update --channel stable` and the bundled pi driver continues to work without a settings.json change.
- If the user later wants to add a second pi instance (e.g. `pi_personal` + `pi_work` with independent `PI_*` env), T3 Code supports multi-instance for any driver marked `supportsMultipleInstances: true` (pi is). Worth noting when they ask.
- The Omarchy pacman package `t3code-bin` is now one version behind the user-managed nightly launcher; not actionable until Omarchy republishes 0.0.46.