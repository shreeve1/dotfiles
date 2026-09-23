# Lenovo ThinkPad T14 Gen 5 AMD — Drivers and Firmware on Omarchy

Researched: September 22, 2026
Companion to: `lenovo-thinkpad-t14-gen5-amd-arrival.md`

## The short version

On Linux you do not download drivers from Lenovo. Lenovo's support-site driver
packages are Windows-only; do not install them. Everything this laptop needs comes
from three places:

1. The kernel (`linux-omarchy`) — the actual drivers (`amdgpu`, `ath11k`/`ath12k`,
   `r8169`, audio, touchpad, webcam, ThinkPad ACPI).
2. Firmware packages (`linux-firmware-*`) — binary blobs the drivers load
   (GPU, Wi-Fi, Bluetooth).
3. Userspace packages (Mesa, Vulkan, PipeWire, fprintd, fwupd) — installed by the
   Omarchy installer or by Omarchy helper commands.

BIOS/EC/Thunderbolt firmware comes from Lenovo through LVFS, installed with
`fwupd` (`omarchy-update-firmware`).

Omarchy's installer detects hardware and installs most of this automatically.
The work after install is mostly verification plus a few optional helpers.

Sources checked:
- Omarchy 4.0.4 install scripts on this machine: `/usr/share/omarchy/install/hardware/`
  and `/usr/share/omarchy/bin/omarchy-*`
- Arch Wiki: "Lenovo ThinkPad T14 (AMD) Gen 5" and "Lenovo ThinkPad T14 (AMD) Gen 4"
- Lenovo PSREF: `ThinkPad_T14_Gen_5_AMD_Spec.pdf` (August 28 2026)

## What Omarchy does automatically at install

From `/usr/share/omarchy/install/hardware/all.sh` and the package lists:

| Area | What Omarchy does | Relevant to this laptop? |
|---|---|---|
| GPU / Vulkan | `vulkan.sh` detects an AMD GPU via `lspci` and installs `vulkan-radeon` | Yes |
| Firmware | `linux-firmware` (includes `-amdgpu`, `-atheros`, `-realtek` splits) | Yes |
| Networking | NetworkManager with `wpa_supplicant`; `iwd` is disabled | Yes |
| Wi-Fi power save | `omarchy-settings` ships `/etc/NetworkManager/conf.d/omarchy-wifi-powersave.conf` with `wifi.powersave = 2` (off) | Yes — already applies the Arch Wiki's Qualcomm latency workaround |
| Bluetooth | `bluez`, enables `bluetooth.service` | Yes |
| Audio | PipeWire, WirePlumber, `alsa-utils`, `sof-firmware` | Yes |
| Power | `power-profiles-daemon`; `omarchy-powerprofiles-set` switches profile on AC/battery | Yes |
| Brightness | `brightnessctl` | Yes |
| Lenovo-specific | Only `lenovo/fix-yoga-pro7-bass-speakers.sh` (Yoga Pro 7 only) | No |
| Intel / NVIDIA / Surface / Apple fixes | Guarded by hardware detection | No — skipped on this machine |

There is no T14-specific Omarchy script, and none should be needed: it runs on the
generic AMD path.

## Component by component

### CPU microcode
- Package: `amd-ucode`. The installer should pick it for an AMD CPU.
- This Surface install has `intel-ucode` (explicitly installed). Do not carry that
  over; verify on the new machine:
  ```bash
  pacman -Q amd-ucode
  journalctl -k -b | grep -i microcode
  ```
- If missing: `sudo pacman -S amd-ucode` and confirm the bootloader loads it
  (check `/etc/limine-entry-tool.conf` / `limine` entries after reinstalling the kernel).

### CPU frequency / power
- Driver: `amd-pstate` (in the kernel). `power-profiles-daemon` should show
  `CpuDriver: amd_pstate` and a `PlatformDriver` from ThinkPad ACPI.
  ```bash
  cat /sys/devices/system/cpu/cpufreq/policy0/scaling_driver   # expect amd-pstate-epp
  powerprofilesctl list
  ```
- Profiles: use Omarchy's menu or `omarchy-powerprofiles-set battery power-saver`
  / `omarchy-powerprofiles-set ac balanced`.

### Graphics (Radeon 780M)
- Kernel driver: `amdgpu`. Firmware: `linux-firmware-amdgpu`.
- Userspace: `mesa`, `vulkan-radeon` (Omarchy installs on AMD detection).
- Arch Wiki (Gen 5): GPU `1002:1900` works.
- Verify:
  ```bash
  lspci -nnk | grep -A3 -E 'VGA|Display'   # driver in use: amdgpu
  omarchy-hw-vulkan && echo vulkan-ok
  ```
- Optional video decode check: `sudo pacman -S libva-utils && vainfo`
  (Mesa provides the AMD VA-API driver; no extra package needed).

### Wi-Fi and Bluetooth (Qualcomm)
- PSREF options: Qualcomm Wi-Fi 6E NFA725A or Qualcomm Wi-Fi 7 NCM825.
  Identify which one you got:
  ```bash
  lspci -nnk | grep -A3 -i network
  ```
  Arch Wiki Gen 5 lists Wi-Fi `17CB:1103` (driver `ath11k_pci`) and Bluetooth
  `10AB:9309`. A Wi-Fi 7 card would use `ath12k_pci`.
- Firmware: `linux-firmware-atheros`.
- Known issues from the Arch Wiki (T14/P14s AMD Gen 4/5 pages):
  1. iwd needs `ControlPortOverNL80211=false` for the Wi-Fi 7 chip.
     Not relevant by default: Omarchy uses NetworkManager + wpa_supplicant and
     disables iwd. Only apply this if you switch to iwd.
  2. High latency / packet loss with power save on: already handled by Omarchy's
     `wifi.powersave = 2` config.
  3. After some suspend/resume cycles the card can stop transmitting.
     Manual fix (replace the PCI address with yours from `lspci`):
     ```bash
     echo 1 | sudo tee /sys/bus/pci/devices/0000:02:00.0/remove
     echo 1 | sudo tee /sys/bus/pci/rescan
     ```
     Automated option from the wiki: AUR `p14s-wifi-reset-git`, then enable
     `p14s-wakeup-wifi-reset.service`. Omarchy's `omarchy-restart-wifi` may also help.
     Only install this if you actually see the problem.
  4. Hibernation resume can fail with `ath11k`. Omarchy defaults to suspend, not
     hibernate, so avoid hibernation unless you test it.

### Ethernet
- Realtek RTL8111EPV (`10EC:8168`), kernel driver `r8169`. Works out of the box
  per the Arch Wiki. No extra package.

### Audio (Realtek ALC3287 on AMD ACP)
- Kernel HDA/ACP drivers + PipeWire. Arch Wiki Gen 5: audio `1002:1640` works.
- Speakers work but sound thinner than on Windows (no Dolby processing). Optional
  improvement from the Arch Wiki Gen 4 page: EasyEffects with a convolver impulse
  captured on the P14s Gen 4 AMD (same chassis family). Treat those third-party
  presets as optional and unverified for Gen 5.
- Mic mute LED: the Gen 4 page links a "Mic LED always on" fix on the Gen 3 page;
  only look into it if the LED misbehaves.

### Webcam
- USB UVC camera, kernel driver `uvcvideo`, no extra driver.
  Arch Wiki Gen 5: webcam `5986:1199` works.
- Verify: `omarchy-hw-webcam && echo webcam-ok`, then test in a browser video call.
- IR camera (only if your unit has one): face unlock via `howdy` is possible but
  optional.

### Fingerprint reader
- Arch Wiki Gen 4 lists a Goodix reader (`27c6:6594`) working with `fprint`.
  Goodix vendor `27c6` is in Omarchy's `omarchy-hw-fingerprint` detection list.
  Confirm the Gen 5 reader ID with `lsusb` (install `usbutils` first).
- Setup: run `omarchy-setup-security-fingerprint`. It installs `libfprint-git`,
  `fprintd`, and `usbutils`, enrolls a finger, verifies it, then enables
  fingerprint for sudo, polkit, and the lock screen, with a password fallback
  when the lid is closed.
- Remove later with `omarchy-remove-security-fingerprint`.

### Touchscreen and touchpad
- Touchpad: Synaptics `06CB:00f9`, works (Arch Wiki Gen 5).
- Touchscreen: standard HID multitouch, no driver needed.
  Check detection: `omarchy-hw-touchscreen` should print the device name.

### Keyboard and function keys
- Handled by `thinkpad_acpi`. Fn+Esc toggles Fn lock; Fn+Space toggles the
  keyboard backlight. Per the Arch Wiki Gen 5 table, media, brightness, and
  mic-mute keys emit standard XF86 keys, which Omarchy binds.

### Suspend
- Only `s2idle` (Modern Standby) is supported; there is no BIOS S3 option
  (Arch Wiki Gen 4 and Gen 5). This is normal and works on this platform, but
  measure overnight drain in the arrival checklist.
  ```bash
  cat /sys/power/mem_sleep   # expect [s2idle]
  ```

### Thunderbolt / USB4 docks
- Kernel `thunderbolt` driver. If a dock is not recognized, it may need
  authorization via `bolt`: `boltctl list`, then
  `boltctl enroll --policy=auto <uuid>` (Arch Wiki Gen 4).

### Battery charge thresholds (optional, for battery longevity)
- ThinkPads expose charge limits through `thinkpad_acpi`:
  ```bash
  ls /sys/class/power_supply/BAT0/ | grep charge_control
  echo 80 | sudo tee /sys/class/power_supply/BAT0/charge_control_end_threshold
  ```
  This resets on reboot. Omarchy does not ship a helper for this; making it
  persistent (udev rule or systemd unit) is a follow-up, not a requirement.

### Fan
- The Arch Wiki Gen 4 page reports the fan is fairly loud during light use.
  `thinkfan` is an option, but try the power-saver profile first; do not install
  fan control unless it is actually bothersome.

### WWAN (only if a modem is installed)
- The listing does not mention a 4G/5G modem; most units ship without one.
  Skip unless `lspci`/`mmcli -L` shows a modem.

## BIOS, EC, and Thunderbolt firmware (LVFS / fwupd)

Lenovo publishes ThinkPad firmware to LVFS, and `fwupd` installs it from Linux.
I did not confirm the T14 Gen 5 AMD's LVFS listing directly (the LVFS site blocked
automated lookups), so check on the machine:

```bash
omarchy-update-firmware        # installs fwupd if missing, copies the EFI helper, runs updates
fwupdmgr get-devices           # lists updatable devices (System Firmware, EC, etc.)
fwupdmgr get-updates
```

`omarchy-update-firmware` installs `fwupd`, copies `fwupdx64.efi` to
`/boot/EFI/arch/`, runs `fwupdmgr refresh --force`, then `sudo fwupdmgr update`.
Plug into AC before running BIOS updates.

If System Firmware does not appear in `fwupdmgr get-devices`, fall back to a Lenovo
BIOS update from Windows (before wiping it) or Lenovo's bootable BIOS update ISO
from the support site. Those are firmware updaters, not Windows drivers, and are
fine to use.

## Post-install run order

1. `pacman -Q amd-ucode linux-firmware-amdgpu linux-firmware-atheros vulkan-radeon`
2. Hardware identity and drivers:
   `lspci -nnk | grep -A3 -Ei 'vga|display|network|ethernet|audio'`
3. `omarchy-update-firmware` (on AC power)
4. `omarchy-setup-security-fingerprint`
5. Work through the test table in `lenovo-thinkpad-t14-gen5-amd-arrival.md`
6. Only if a problem shows up: apply the matching fix above (Wi-Fi resume
   script, dock authorization, speaker convolver, charge threshold).

If a hardware helper seems not to have run, Omarchy can rerun its idempotent
hardware setup:

```bash
sudo omarchy-apply-hardware --install-user "$USER"
```

## Things not to do

- Do not install Lenovo's Windows driver packages or "Lenovo Vantage" equivalents.
- Do not copy the Surface-specific setup from `HARDWARE-surface-laptop-7.md`
  (linux-surface, keyboard module, Bluetooth recovery) to this machine.
- Do not switch NetworkManager to iwd without adding the
  `ControlPortOverNL80211=false` setting.
- Do not install `p14s-wifi-reset-git`, `thinkfan`, or speaker presets
  preemptively; add them only if the matching problem appears.
