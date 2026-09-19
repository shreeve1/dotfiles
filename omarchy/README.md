# Omarchy bare-metal migration

This directory is the portable, user-owned part of the Omarchy desktop setup from the trial ARM/QEMU VM. `install.sh` installs it only on Linux systems where the `omarchy` command is available.

## Managed live targets

| Repository source | Live target | What it preserves |
| --- | --- | --- |
| `omarchy/config/hypr/` | `~/.config/hypr/` | Hyprland settings, including the Super+Enter Ghostty binding, monitor behavior, input settings, autostart, and visual settings. |
| `omarchy/config/omarchy/` | `~/.config/omarchy/` | Omarchy shell bar/idle configuration, launcher settings, default agent (`hermes`), custom background, branding, and safe update hooks. |
| `omarchy/bin/hypr-deck` + `omarchy/config/systemd/user/hypr-deck.service` | `~/.local/bin/hypr-deck` + `~/.config/systemd/user/hypr-deck.service` | Focus-driven overlapping Deck layout. The unit must be enabled and running after installation. |
| `omarchy/config/chromium-flags.conf` | `~/.config/chromium-flags.conf` | Wayland/secret-store flags and the Omarchy Chromium extensions. |
| `omarchy/config/mimeapps.list` | `~/.config/mimeapps.list` | Chrome and HEY default associations. |


The installer backs up a conflicting live target with a UTC timestamp before linking it. It leaves the paths untouched on macOS or on Linux systems without Omarchy.

## Intentional exclusions

- `~/.local/share/omarchy/` is Omarchy runtime/package content, not personal configuration. Reinstall Omarchy rather than syncing it.
- `~/.config/omarchy/hooks/pre-refresh-pacman.d/restore-arm-pacman` is deliberately excluded: it restores the trial VM's Arch Linux ARM/Try Omarchy pacman configuration and must never reach x86_64 bare metal.
- Ghostty's VM-only software-rendering systemd drop-in is excluded. Bare metal should use the normal GPU path. Also exclude `~/.local/share/systemd/user/app-com.mitchellh.ghostty.service`: a VM-generated user unit can override the package unit and retain an ARM-only `Exec` path. On bare metal, keep the package-provided `/usr/lib/systemd/user/app-com.mitchellh.ghostty.service`.
- Cross-architecture native runtime trees are excluded and rebuilt on the destination: `~/.local/bin`, `~/.local/lib`, `~/.bun`, `~/.npm`, `~/.local/share/mise`, `~/.local/share/uv`, and agent runtime `node_modules`. Do not copy aarch64 executables to x86_64.
- Generated caches, backup files, systemd `*.wants` enablement symlinks, and stock-identical Kitty/Fcitx5/WirePlumber/Autostart config are excluded.

## Omapager notifications

Omapager 1.1.1 replaces Omarchy's built-in notification service. Its complete,
user-owned source snapshot is stored at
`config/omarchy/plugins/njpatel.omapager/`; source provenance is recorded in
that directory's `UPSTREAM.md`.

The shell configuration disables `omarchy.notifications` and enables
`njpatel.omapager` in the bar centre. Omapager handles notification delivery,
grouping, actions, inline replies where supported, source snoozing, and recent
history. It is the sole notification daemon, so do not re-enable the built-in
Omarchy notification plugin while Omapager is enabled.

The installer enables Omapager's Do Not Disturb mode through the compatible
`notifications` IPC target. This suppresses its toast deck while retaining
notifications in Omapager's history; open the Omapager bar widget to review
them. Turn DND off from that widget if you want Omapager's card popups.

Omapager requires Omarchy with Quickshell and Hyprland plus Python 3. Install
`python-pillow` for sender and remote website icons; this machine's package
manifest includes it. `bubblewrap` and `wl-clipboard` are also present and its
helper sandbox is operational.
Remote icon lookups are enabled by Omapager's default settings and disclose your
IP address to the source website; set `"fetchRemoteIcons": false` in the
`njpatel.omapager` entry in `shell.json` to disable them.

After a restore, validate it with:

```bash
omarchy plugin list
omarchy-shell omapager probe
hyprctl configerrors
```

## Bring-up on bare metal

1. Install Omarchy first, using its normal installer and the desired release channel.
2. Clone this repository to `~/dotfiles`.
3. Review `omarchy/packages/pacman-explicit.txt` and `omarchy/packages/pacman-foreign.txt`. They are inventories from the trial VM, not a blind-install script: omit VM-only packages and select equivalent packages for the new architecture. `google-chrome` is the current foreign/AUR package.
4. Install applications you want before applying defaults. At minimum, install Ghostty and Google Chrome if you intend to retain the associated binding and MIME/Chromium settings. On the destination, reinstall x86_64 tools rather than copying native VM binaries; use `omarchy pkg add <package>` for repository packages.
5. Run `bash ~/dotfiles/install.sh`. Conflicting live configuration is timestamp-backed-up automatically.
6. Activate the Deck service immediately. This is required when the installer is run after the graphical session has already started:

   ```bash
   systemctl --user daemon-reload
   systemctl --user enable --now hypr-deck
   systemctl --user is-active hypr-deck
   ~/.local/bin/hypr-deck self-test
   ```

   Expected results are `active` and `PASS: reversible orientation-aware geometry and dynamic monitor reflow`. If the unit is enabled but inactive after a migration, the installed Deck bindings/configuration will exist but focus-driven overlap will not run.
7. Restart the Omarchy shell, then log out and back in:

   ```bash
   omarchy restart shell
   ```

   Verify:

   ```bash
   hyprctl configerrors
   omarchy theme current
   omarchy font current
   omarchy menu keybindings --print
   systemctl --user is-enabled hypr-deck
   systemctl --user is-active hypr-deck
   ```
8. Tune `~/.config/hypr/monitors.lua` on the physical display. The portable baseline uses automatic monitor detection; the QEMU-only block guarded by `omarchy.qemu_virgl=1` is inert on bare metal. Choose the real panel's scale rather than copying VM scaling. On a session where `HYPRLAND_INSTANCE_SIGNATURE` is absent, use `hyprctl instances -j` and pass its instance value to `hyprctl -i <instance> configerrors`.

## Operating notes

- `shell.json` hot-reloads when edited. Its current idle values are 150 seconds to screensaver and 300 seconds to lock.
- Use `omarchy theme set <name>` and `omarchy font set <name>` to make persistent appearance changes; user themes/backgrounds live below `~/.config/omarchy/` and therefore belong here.
- Do not edit `/usr/share/omarchy/`; package updates replace it.
- `omarchy refresh shell` or `omarchy refresh hyprland` intentionally replaces live user config and can break the managed symlink. Review the generated backup, restore the desired repository version with `git`, then rerun `bash ~/dotfiles/install.sh`.
- Before changing this migration setup, run `git diff -- omarchy install.sh` and keep VM-only hardware work behind a guard or in a separate, explicitly opted-in file.

## Host hardware — Surface Laptop 7 (Intel)

Three machine-specific fixes are needed on this host and are documented in
[`HARDWARE-surface-laptop-7.md`](HARDWARE-surface-laptop-7.md), with buildable sources and
restore scripts under `hardware/surface-laptop-7/`:

- **Internal keyboard, battery and AC adapter** — one patch, four devices: the SL7 SAM node
  group needs ACPI hub id `MSHW0551` registered against `ssam_node_group_sl7` in
  `surface_aggregator_registry`, and the battery nodes (`ssam_node_bat_ac`,
  `ssam_node_bat_main`) added to that group, which is what gives UPower its `BAT1`/`ADP1`.
  Built as an out-of-tree module, so **it breaks on every kernel update** and must be
  re-applied:
  `sudo bash omarchy/hardware/surface-laptop-7/keyboard/restore-keyboard-module.sh`
- **Touchpad** — needs userspace `iptsd` (packaged locally as `iptsd-sl7`, built from a
  reviewed fork plus the LiftGraceMs patch). Userspace, so kernel updates do not affect it.
- **Internal audio and microphone** — needs the patched `snd-soc-sdw-utils` module, built
  against the exact Omarchy source recipe, plus a per-user UCM overlay. The module breaks on
  every kernel update:
  `sudo bash omarchy/hardware/surface-laptop-7/audio/restore-audio-module.sh`

None of these is linked by `install.sh`; they are host properties, recorded here so they are
recoverable rather than folklore.

## Recommended next additions

- Keep a small hardware checklist outside this config: GPU/firmware, Wi-Fi/Bluetooth, audio, fingerprint reader, display calibration, and backup encryption. Those are host properties, not portable dotfiles.
- Record explicitly installed packages after deliberate changes by refreshing the package manifests. Treat the files as reviewable desired-state evidence rather than an unattended provisioning source.
- Add custom themes or cloned Omarchy plugins under the managed `omarchy/config/omarchy/themes/` and `plugins/` paths; do not alter packaged plugins.
