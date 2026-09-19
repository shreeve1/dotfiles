# Session Capture: Omarchy Bare-Metal Configuration and Surface Recovery

- Date: 2026-09-19
- Purpose: Preserve the durable operating model established while moving Omarchy from an ARM/QEMU trial into portable dotfiles and repairing the Surface Laptop 7 Intel host.
- Scope: Portable Omarchy ownership, Hypr Deck and display policy, Surface hardware recovery, verification, and repository hygiene decisions.

## Durable Facts

- The portable, user-owned Omarchy configuration lives under `omarchy/` and `install.sh` links it only on Linux when the `omarchy` command is available. Packaged runtime content under `~/.local/share/omarchy/` is intentionally excluded. — Evidence: `install.sh:210-220`, `omarchy/README.md:1-24`
- Hypr Deck is installed as a user service and provides focus-driven overlapping windows with reversible saved geometry. It must be enabled and running after installation. — Evidence: `omarchy/README.md:5-16,60-101`, `omarchy/config/systemd/user/hypr-deck.service`, `omarchy/bin/hypr-deck`
- The physical two-monitor policy binds persistent workspace 1 to built-in output `eDP-1` and persistent workspaces 2–10 to external output `DP-4`. — Evidence: `omarchy/config/hypr/monitors.lua:10-20`; verified live with `hyprctl workspacerules -j` and `hyprctl workspaces -j`
- Surface Laptop 7 Intel recovery covers four host-specific areas: SAM keyboard/battery/AC registration, userspace IPTS touchpad support, patched SoundWire audio plus UCM, and conditional Intel Bluetooth recovery. — Evidence: `omarchy/README.md:107-132`, `omarchy/HARDWARE-surface-laptop-7.md`
- Kernel-bound keyboard/battery and audio modules must be rebuilt only after rebooting into the newly installed kernel; the touchpad fix is userspace and survives kernel updates. — Evidence: `omarchy/HARDWARE-surface-laptop-7.md:161-172,238-241,397-438`

## Decisions

- Keep portable desktop configuration and host hardware repair separate: `install.sh` links the former, while Surface repair scripts remain explicit privileged operations. — Evidence: `omarchy/README.md:1-24,107-132`
- Treat workspace numbers as fixed display policy on this host: workspace 1 belongs to the laptop and workspaces 2–10 belong to the external monitor. — Evidence: `omarchy/config/hypr/monitors.lua:10-20`; accepted and committed as `5659435a`
- Keep retired Claude/OpenCode archives and generated Graphify output deleted, while timestamped backups and Python caches remain local but ignored. — Evidence: commits `c8d54c73`, `2a72f7bc`, `cc06f45e`, `4ab1586b`

## Evidence

- `omarchy/README.md` — migration boundaries, managed targets, Deck activation, operating notes, and hardware overview.
- `omarchy/HARDWARE-surface-laptop-7.md` — symptoms, causes, repairs, rollback, kernel-update order, and verification.
- `omarchy/config/hypr/monitors.lua` — persistent monitor-to-workspace assignment.
- `omarchy/config/hypr/bindings.lua` — Deck-aware navigation and push-to-talk bindings.
- `omarchy/bin/hypr-deck` — overlapping layout implementation and self-test.
- `install.sh` — Linux/Omarchy-gated symlink installation.
- Commits `02b18771` through `542dac3e` — implementation history summarized by the candidate analysis.

## Exclusions

- No full conversation transcript, credentials, machine serial numbers, Bluetooth address, or unrelated terminal/agent configuration was captured.
- Failed command syntax used while rearranging live workspaces was omitted because it did not affect the verified final state.
- Package inventories are referenced as reviewable evidence, not promoted as a blind provisioning procedure.

## Open Questions And Follow-Ups

- Candidate analysis requires James's promote/discard decision.
- The monitor names `eDP-1` and `DP-4` are host-specific; a different dock or hardware enumeration may require updating `monitors.lua`.
- Kernel-bound Surface patches should be retired when upstream or Omarchy ships equivalent fixes.
