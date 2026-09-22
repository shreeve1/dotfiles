---
title: Omarchy Bare-Metal Configuration and Surface Laptop Recovery
type: analysis
description: Portable Omarchy ownership, Hypr Deck and workspace policy, and the Surface Laptop 7 Intel hardware recovery runbook.
status: candidate
created: 2026-09-19
updated: 2026-09-19
sources:
  - wiki/raw/sessions/2026-09-19-omarchy-bare-metal-and-surface-recovery.md
  - omarchy/README.md
  - omarchy/HARDWARE-surface-laptop-7.md
  - omarchy/config/hypr/monitors.lua
  - omarchy/config/hypr/bindings.lua
  - install.sh
confidence: high
tags:
  - omarchy
  - hyprland
  - surface-laptop-7
  - hardware-recovery
  - workspaces
  - migration
---

# Omarchy Bare-Metal Configuration and Surface Laptop Recovery

This dotfiles repository separates portable user-owned Omarchy configuration from machine-specific Surface repairs. That boundary keeps Linux desktop preferences reproducible without pretending that kernel modules and privileged host services are ordinary dotfiles.

## Portable configuration boundary

[`install.sh`](/install.sh) installs the Omarchy layer only on Linux when the `omarchy` command exists. The managed sources live below [`omarchy/config/`](/omarchy/config/) and are linked to the user's Hyprland, Omarchy shell, Chromium, MIME, and user-systemd locations. The Hypr Deck executable is linked into `~/.local/bin`.

Packaged runtime content under `~/.local/share/omarchy/`, native runtime trees, VM-only services, and ARM-specific package restoration are intentionally excluded. Omarchy should be reinstalled normally; only user-owned configuration is synchronized. The complete restore sequence and exclusions are maintained in [`omarchy/README.md`](/omarchy/README.md).

## Hypr Deck and display policy

Hypr Deck is a focus-driven overlapping window layout implemented by [`omarchy/bin/hypr-deck`](/omarchy/bin/hypr-deck) and run through a user service. Its bindings replace native directional operations with saved-slot-aware focus and swaps; `Super+T` and `Super+O` temporarily expand or pin windows and restore their prior Deck slot on the second press.

After installation, the service must be enabled and running, then checked with:

```bash
systemctl --user enable --now hypr-deck
systemctl --user is-active hypr-deck
~/.local/bin/hypr-deck self-test
```

The current host uses a fixed workspace policy in [`monitors.lua`](/omarchy/config/hypr/monitors.lua):

- Persistent workspace 1 belongs to the laptop panel, `eDP-1`.
- Persistent workspaces 2–10 belong to the external display, `DP-4`.

This prevents Hyprland's global workspaces from changing monitor ownership during normal workspace navigation. The output names are host-specific and may need revision after dock or hardware changes.

## Surface Laptop 7 Intel host repairs

The host repair layer is intentionally not linked by `install.sh`. It contains four explicit recovery areas documented in [`HARDWARE-surface-laptop-7.md`](/omarchy/HARDWARE-surface-laptop-7.md):

1. **SAM keyboard, battery, and AC adapter.** One out-of-tree `surface_aggregator_registry` module maps ACPI hub `MSHW0551` to the SL7 SAM node group and adds battery/AC nodes. It restores the internal keyboard, `BAT1`, and `ADP1`.
2. **Touchpad.** A reviewed `iptsd` userspace build converts raw QuickSPI HID reports into a real touchpad and applies measured lift/debounce/contact thresholds. This repair is not tied to the kernel ABI.
3. **Internal audio and microphone.** A patched `snd-soc-sdw-utils` module skips an unattached RT1320 SoundWire ghost endpoint; a user UCM overlay addresses the surviving codec's sparse index.
4. **Intel Bluetooth.** A one-shot service waits for normal startup and reloads `btintel_pcie` only when `bluetoothctl list` reports no controller.

## Kernel-update runbook

The keyboard/battery and audio modules are built for an exact `linux-omarchy` kernel ABI. Rebuilding before reboot would target the old running kernel, so update order is load-bearing:

1. Finish the system update, including matching kernel and headers.
2. Reboot into the new stock kernel.
3. Run `sudo ~/dotfiles/omarchy/hardware/surface-laptop-7/restore-after-kernel-update.sh`.
4. Reboot again so the rebuilt modules and UKI are active.
5. Run `sudo ~/dotfiles/omarchy/hardware/surface-laptop-7/verify.sh`.

The full verifier checks SAM devices, power supplies and UPower, touchpad, audio/UCM/PipeWire, Voxtype, and Bluetooth recovery. Kernel-bound overrides should be removed once upstream or Omarchy provides equivalent support.

## Operational cautions

- Do not edit `/usr/share/omarchy/`; package updates replace it.
- `omarchy refresh shell` or `omarchy refresh hyprland` can replace managed symlinks. Review backups, restore the repository version, and rerun `install.sh`.
- Package inventory files are reviewable desired-state evidence, not unattended install scripts.
- The Surface repair layer contains privileged, host-specific operations and must remain opt-in.

# Citations

- [`wiki/raw/sessions/2026-09-19-omarchy-bare-metal-and-surface-recovery.md`](/raw/sessions/2026-09-19-omarchy-bare-metal-and-surface-recovery.md) — curated session evidence and accepted decisions.
- [`omarchy/README.md`](/omarchy/README.md) — portable ownership boundary, install procedure, Deck operation, and hardware overview.
- [`omarchy/HARDWARE-surface-laptop-7.md`](/omarchy/HARDWARE-surface-laptop-7.md) — detailed diagnosis, repair, rollback, kernel-update, and verification runbook.
- [`omarchy/config/hypr/monitors.lua`](/omarchy/config/hypr/monitors.lua) — persistent workspace-to-monitor rules.
- [`omarchy/config/hypr/bindings.lua`](/omarchy/config/hypr/bindings.lua) — Deck-aware focus, swap, expand, and pop bindings.
- [`install.sh`](/install.sh) — conditional Omarchy links and user-service installation.
