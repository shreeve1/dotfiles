# Lenovo ThinkPad E16 Gen 2 AMD — Omarchy Compatibility

Last researched: September 22, 2026

## Configuration scope

Lenovo sells this model with configuration-dependent components. Confirm the exact machine type and hardware IDs before purchasing.

Officially listed options include:

- CPU: AMD Ryzen 3 7335U; Ryzen 5 150, 7535U, or 7535HS; Ryzen 7 170, 7735U, or 7735HS
- GPU: integrated Radeon 660M or Radeon 680M; no discrete GPU is listed
- Display: 16-inch 16:10 IPS, 60 Hz, in four variants (see "Display panel" below); optional on-cell touch
- Ports: 2x USB-A, 2x USB-C (5 Gbps and 10 Gbps, both with PD and DisplayPort 1.4), HDMI 2.1 (up to 4K60), RJ-45, 3.5 mm combo jack
- Memory: up to 64 GB DDR5-4800 across two SODIMM slots, dual-channel capable
- Storage: one supplied PCIe 4.0 NVMe SSD plus a second M.2 expansion slot; M.2 2242 and M.2 2280 slots are present
- Battery: 47 Wh or 57 Wh
- WLAN: MediaTek MT7921, Realtek RTL8852BE, Realtek RTL8852CE, or another unspecified Wi-Fi 6/6E card depending on configuration
- Ethernet: Realtek RTL8111H-CG Gigabit Ethernet
- Audio: Senary SN6141 codec, stereo speakers, and dual microphones
- Camera: 720p, 1080p, or 1080p with IR
- Fingerprint: optional match-on-chip reader integrated into the power button

## Overall assessment

The ThinkPad E16 Gen 2 AMD is a good Omarchy candidate with a simple all-AMD graphics stack. Its processor, integrated Radeon graphics, NVMe storage, Ethernet, and listed WLAN families have upstream Linux driver paths.

Compatibility rating: good, with configuration-dependent peripheral risk.

The principal unknowns are the exact WLAN card, Senary SN6141 audio behavior, optional fingerprint sensor, optional IR camera, suspend/resume behavior, and whether the particular machine's BIOS is published through LVFS.

Omarchy has no E16-specific hardware script (its only Lenovo fix, in `install/hardware/lenovo/`, targets Yoga Pro 7 bass speakers), so this machine runs on Omarchy's generic x86_64/AMD path. For a mainstream AMD laptop that is usually a good sign: nothing needs special handling.

## Compatibility details

### CPU variants

The current PSREF (July 27 2026 edition) lists seven processors, all on AMD's Zen 3+ "Rembrandt-R" platform with RDNA2 graphics. The Ryzen 5 150 and Ryzen 7 170 are rebrands of the 7535 and 7735 silicon, so Linux driver behavior should be the same across these options.

Earlier or regional E16 Gen 2 AMD listings may have used Zen 4 "Hawk Point" parts (e.g. Ryzen 5 8640HS or Ryzen 7 8840HS, with Radeon 760M/780M). The current PSREF does not list them, so they were not verified here. If a listing shows one, it is a newer, faster, more efficient platform, still on the upstream `amdgpu` path, and it would be the preferred configuration. Confirm the exact CPU from the listing or the machine type.

Nominal power class among the listed parts:

- U-series (7335U, 7535U, 7735U, 150, 170): 15–28 W
- HS-series (7535HS, 7735HS): 35–45 W, more sustained performance and more heat under load

Power class does not predict battery life on its own. Lenovo's MobileMark 25 figures are about 12.7 h for a 7735HS with the 57 Wh battery, about 11.4 h for a 7735U with 57 Wh, and about 7.75 h for a 7535U with the 47 Wh battery and a touch panel. Battery size and panel matter at least as much as the CPU suffix.

### AMD CPU and integrated graphics

The Radeon 660M and 680M use the upstream `amdgpu` kernel driver, Mesa, and AMD firmware. Omarchy includes `linux-firmware` and detects AMD graphics for the appropriate Vulkan driver.

There is no NVIDIA GPU, proprietary graphics stack, or hybrid-GPU display routing to manage. This should reduce idle-power, suspend, external-display, and Wayland complexity compared with a hybrid-NVIDIA workstation.

Verify after installation:

```bash
lspci -nnk | grep -A3 -E 'VGA|3D|Display'
lsmod | grep amdgpu
glxinfo -B    # or eglinfo -B; both are in the mesa-utils package
```

Expected graphics driver: `amdgpu`.

### Display panel

PSREF lists four 16-inch 16:10 IPS panels, all 60 Hz:

| Resolution | Touch | Brightness | Color gamut | Contrast |
|---|---|---|---|---|
| 1920x1200 (WUXGA) | No | 300 nits | 45% NTSC | 800:1 |
| 1920x1200 (WUXGA) | Yes, on-cell | 300 nits | 45% NTSC | 800:1 |
| 1920x1200 (WUXGA) | No | 400 nits | 100% sRGB | 1000:1 |
| 2560x1600 (WQXGA) | No | 400 nits | 100% sRGB | 1200:1 |

The 45% NTSC panels are noticeably dim and washed out. Prefer either 100% sRGB panel. The 2560x1600 panel looks sharper at 1.25x–1.5x Hyprland scaling. The 400-nit 1920x1200 panel runs at 1x scaling and is easier on battery.

On-cell touch uses standard HID multitouch and should work in Hyprland. Omarchy also ships an `omarchy-hw-touchscreen` helper.

### External displays

The laptop can drive up to three external monitors plus the internal panel:

- USB-C 10 Gbps: DisplayPort 1.4, up to 5K60
- USB-C 5 Gbps: DisplayPort 1.4, up to 4K60
- HDMI 2.1: up to 4K60

Check the detected outputs with `hyprctl monitors all`.

### Memory and storage

The system supports up to 64 GB DDR5-4800 with two replaceable SODIMMs. Dual-channel memory is preferred because the integrated GPU shares system memory.

Linux supports the PCIe Gen4 NVMe storage through the standard NVMe driver. The two M.2 slots make storage expansion straightforward, subject to Lenovo's supported drive dimensions and thermal clearances.

Useful checks:

```bash
lsblk -o NAME,MODEL,SIZE,TYPE,FSTYPE,MOUNTPOINTS
lspci -nnk | grep -A3 -i 'non-volatile memory'
```

### Wi-Fi and Bluetooth

The exact WLAN card is the most important configuration variable.

Preferred order for Omarchy:

1. MediaTek MT7921 — supported by the upstream `mt7921e` driver and `linux-firmware`
2. Realtek RTL8852BE — supported by the upstream `rtw89` driver, but may be more sensitive to power management
3. Realtek RTL8852CE — supported by newer `rtw89` kernels and firmware, but is the least preferred listed option
4. Any unspecified Wi-Fi 6/6E card — verify its PCI ID before purchase

Bluetooth support is provided through the card's USB interface, the kernel Bluetooth stack, firmware, and BlueZ.

Confirm the actual hardware and active drivers:

```bash
lspci -nnk | grep -A3 -i network
lsusb
```

The WLAN card is an M.2 module. If a Realtek card proves unreliable, replacement with a supported conventional PCIe/USB M.2 WLAN card is a practical fallback. Do not purchase an Intel CNVio/CNVio2-only module for an AMD laptop.

### Ethernet

The Realtek RTL8111H-CG Gigabit Ethernet controller is supported by the in-kernel `r8169` driver.

```bash
lspci -nnk | grep -A3 -i ethernet
```

### Audio

Lenovo specifies a Senary SN6141 audio codec. It is an HDA codec with an in-kernel driver, `snd-hda-codec-senarytech`, which ships in the Omarchy kernel; it is not a SoundWire/SOF design like the Surface Laptop 7. Linux should expose the audio path through ALSA, PipeWire, and WirePlumber, but model-specific evidence for the speakers, internal microphone, and headset detection is limited. Audio should therefore be tested during the return window rather than assumed perfect.

Expected driver check:

```bash
cat /proc/asound/card*/codec#* 2>/dev/null | grep -i codec
lsmod | grep -i senary
```

Diagnostics:

```bash
wpctl status
aplay -l
arecord -l
systemctl --user status pipewire wireplumber
journalctl -b -k | grep -iE 'snd|audio|hda|acp|senary'
```

### Camera and IR

The normal RGB camera is likely to use the standard `uvcvideo` driver. The optional IR camera should not be assumed to provide Linux facial authentication even if ordinary camera video works.

Check the available video devices:

```bash
lsusb
v4l2-ctl --list-devices
```

Also verify that the physical privacy shutter is open and that the camera is enabled in firmware.

### Fingerprint reader

The optional fingerprint reader is a match-on-chip unit integrated into the power button. Lenovo's PSREF does not publish the USB vendor/product ID, so `libfprint` compatibility cannot be guaranteed from the model name alone.

```bash
lsusb
fprintd-list "$USER"
```

If the sensor is supported, Omarchy provides setup under Setup > Security > Fingerprint. If it is unsupported, password or FIDO2 authentication is the practical fallback.

### ThinkPad platform features (`thinkpad_acpi`)

The in-kernel `thinkpad_acpi` driver provides the ThinkPad-specific features: Fn hotkeys, mute and mic-mute LEDs, keyboard backlight, fan reporting, platform profiles, and battery charge thresholds. These are long-standing upstream features and a major reason ThinkPads are low-risk on Linux.

```bash
lsmod | grep thinkpad_acpi
cat /proc/acpi/ibm/fan
ls /sys/class/leds | grep -iE 'tpacpi|kbd'
cat /sys/firmware/acpi/platform_profile_choices
```

Battery charge thresholds help battery longevity on a laptop that stays plugged in most of the time:

```bash
cat /sys/class/power_supply/BAT0/charge_control_start_threshold
cat /sys/class/power_supply/BAT0/charge_control_end_threshold
echo 80 | sudo tee /sys/class/power_supply/BAT0/charge_control_end_threshold
```

The threshold resets at boot unless it is made persistent, for example with a udev rule or a small systemd unit.

### Keyboard and touchpad

The keyboard is a standard i8042/AT keyboard. The touchpad is typically an I2C-HID precision touchpad from ELAN or Synaptics, handled by `i2c_hid_acpi` and `hid_multitouch` through libinput. Omarchy's generic touchpad and F-key fixes (`fix-synaptic-touchpad.sh`, `fix-fkeys.sh`) run automatically at install. Unlike on the Surface, no out-of-tree keyboard or touchpad driver is expected.

The TrackPoint and its three physical buttons appear as a separate PS/2 device.

```bash
libinput list-devices | grep -iE -A2 'touchpad|trackpoint|keyboard'
journalctl -b -k | grep -iE 'i2c_hid|elan|synaptics|psmouse'
```

Also test palm rejection, disable-while-typing, and two-finger scrolling, and that the Fn-lock toggle (Fn+Esc) and the brightness, volume, and mic-mute keys work.

### Battery and power

The 57 Wh battery is preferred over the 47 Wh option. Battery life also depends materially on the processor variant, display resolution and brightness, WLAN card, firmware, and workload.

The integrated-only AMD graphics stack should make idle power more predictable than on a hybrid-NVIDIA laptop. Use Omarchy's balanced or power-saver profile when operating unplugged.

Useful checks:

```bash
powerprofilesctl get
upower -i "$(upower -e | grep BAT | head -n1)"
```

### Firmware

Omarchy's Update > Firmware function installs `fwupd` when necessary and checks LVFS. However, a definitive LVFS firmware record was not verified for every E16 Gen 2 AMD machine type. Check the actual laptop rather than assuming coverage:

```bash
fwupdmgr get-devices
fwupdmgr refresh
fwupdmgr get-updates
```

If the system firmware is not available through LVFS, use Lenovo's supported bootable or Windows-based BIOS update method. Verify the available update path before removing Windows completely.

## Installation recommendations

1. Record the full Lenovo machine type and current BIOS version.
2. Identify the WLAN and fingerprint hardware if possible.
3. Update to the latest Lenovo BIOS.
4. Disable Secure Boot for Omarchy's official installation path.
5. Use UEFI boot mode.
6. Install Omarchy and complete its first update.
7. Verify `amdgpu`, WLAN, Ethernet, audio, camera, and firmware detection.
8. Test suspend, audio, Wi-Fi, external displays, camera, fingerprint, and battery drain during the return window.

## Problems and mitigations

### Wi-Fi instability

- Update the BIOS, Omarchy kernel, and `linux-firmware`.
- Set the correct wireless regulatory domain.
- Disable WLAN power saving as a diagnostic step.
- Temporarily use 5 GHz rather than 6 GHz/Wi-Fi 6E.
- Recreate the NetworkManager connection.
- Test driver-specific `mt7921e` or `rtw89` options only after identifying the exact card and error.
- Use Ethernet or a supported USB WLAN adapter while diagnosing.
- Replace a persistently unreliable M.2 WLAN card with a compatible PCIe/USB model.

```bash
journalctl -b -k | grep -iE 'mt7921|rtw89|wifi|wlan|firmware'
```

### Audio, microphone, or headset failure

- Update the BIOS, kernel, ALSA UCM profiles, PipeWire, and WirePlumber.
- Inspect `wpctl status` and select the correct profile and default devices.
- Determine whether speakers, headphones, microphone, or jack detection are affected independently.
- Check for a model-specific ALSA quirk or UCM update after identifying the codec path.
- Use a USB audio adapter or Bluetooth headset as a fallback.

A speaker-amplifier or microphone-routing problem may require a future kernel or UCM update, so an immediate complete software fix is not guaranteed.

### Suspend or resume failure

- Update the Lenovo BIOS and Omarchy kernel.
- Check which modes `/sys/power/mem_sleep` exposes. AMD laptops of this generation normally offer only `s2idle` (Modern Standby); S3 `deep` usually is not available and cannot be enabled from Linux.
- Run AMD's `amd-s2idle` test from the `amd-debug-tools` package (in Arch's `extra` repo). It checks firmware, kernel, and device state and reports what blocked the hardware sleep state.
- Test without docks, USB devices, and external displays.
- Disable wakeup for a device that repeatedly wakes the system.
- Use hibernation if ordinary suspend remains unreliable.
- Retain a known-good kernel.

```bash
cat /sys/power/mem_sleep
sudo pacman -S --needed amd-debug-tools
sudo amd-s2idle test
journalctl -b -1 -k    # previous boot; needs at least one earlier boot in the persistent journal
```

Suspend failures can be firmware-dependent, so hibernation or disabling the problematic peripheral may be the practical fallback.

### Black screen, display corruption, or external-display trouble

- Update the BIOS, kernel, Mesa, and AMD firmware.
- Confirm that `amdgpu` owns the display controller.
- Test each USB-C port, a direct USB-C-to-DisplayPort connection, and the HDMI port separately.
- Remember HDMI is limited to 4K60; use USB-C DisplayPort for 5K or high-refresh monitors.
- Try another cable or lower refresh rate.
- Disable HDR, variable refresh rate, or Display Stream Compression while diagnosing.
- Correct the Hyprland monitor configuration.
- Boot a previous kernel or Omarchy snapshot if an update introduced the regression.

```bash
journalctl -b -k | grep -iE 'amdgpu|drm|display'
```

### Camera unavailable

- Open the physical privacy shutter.
- Check the camera function key and firmware setting.
- Confirm that `uvcvideo` loaded and identify the correct `/dev/video*` device.
- Test the RGB and IR interfaces separately.
- Update the kernel if the camera has an unusual USB interface.
- Use an external USB webcam if the integrated device remains unsupported.

### Fingerprint reader unavailable

- Identify the sensor with `lsusb`.
- Compare the USB ID with the current `libfprint` supported-device list.
- Re-enroll the fingerprint and rerun Omarchy's fingerprint setup if the sensor is supported.
- Use password or FIDO2 authentication if the sensor is unsupported.

An unsupported integrated fingerprint sensor is generally not practical to replace.

### Firmware updates unavailable through fwupd

- Confirm that the machine is booted in UEFI mode and that the EFI System Partition is mounted correctly.
- Refresh LVFS metadata and inspect `fwupdmgr get-devices`.
- Check Lenovo Support using the full machine type.
- Use Lenovo's bootable update image or temporarily use Windows if that is the only supported update route.

### Poor battery life

- Confirm whether the laptop has the 47 Wh or 57 Wh battery.
- Use a balanced or power-saver profile.
- Reduce display brightness and refresh rate.
- Disable keyboard backlighting when unnecessary.
- Check for a process preventing CPU idle states.
- Test whether WLAN power management improves consumption without harming stability.
- Review battery health and charge capacity with `upower`.

## Return-window checklist

- Confirm the exact processor, battery size, display, WLAN card, and fingerprint sensor.
- Complete at least three lid-close suspend/resume cycles.
- Repeat suspend with the intended dock or external display.
- Test both USB-C display outputs and HDMI at the intended resolution and refresh rate, including the intended multi-monitor setup.
- Test touchpad gestures, palm rejection, TrackPoint, Fn keys, keyboard backlight, and the mic-mute LED.
- Set a battery charge threshold and confirm it takes effect.
- Run `sudo amd-s2idle test` and confirm the hardware sleep state is reached.
- Test speakers, internal microphone, headphones, and jack detection.
- Verify Wi-Fi reconnection after resume.
- Test Ethernet and Bluetooth with real peripherals.
- Test normal webcam video and identify any separate IR interface.
- Attempt fingerprint enrollment if the feature matters.
- Check idle battery drain, temperatures, and fan behavior.
- Confirm that `fwupdmgr` detects the system firmware or document Lenovo's alternative update route.

## Diagnostic bundle

```bash
inxi -Fxxxz
lspci -nnk
lsusb
lsblk -o NAME,MODEL,SIZE,TYPE,FSTYPE,MOUNTPOINTS
fwupdmgr get-devices
cat /sys/power/mem_sleep
wpctl status
v4l2-ctl --list-devices
powerprofilesctl get
journalctl -b -p warning
journalctl -b -1 -k    # fails on first boot or without a persistent journal
```

Review output before sharing it publicly because it may contain serial numbers, MAC addresses, usernames, and other identifiers.

## Recovery strategy

- Use an Omarchy/Btrfs snapshot if an update introduces a regression.
- Boot a previous kernel when the current kernel fails.
- Use a text console if the graphical session does not start.
- Prefer Omarchy's own hardware helpers (`omarchy-hw-*` in `/usr/share/omarchy/bin`) and upstream kernel or firmware updates before installing unrelated AUR drivers.
- Change one workaround at a time and record kernel parameters or overrides.
- Keep a supported USB network or audio adapter available while diagnosing uncertain internal hardware.

## Purchasing recommendation

Prefer a configuration with:

- The 57 Wh battery
- A Zen 4 Ryzen 8640HS/8840HS configuration if one is actually offered and verified; otherwise a Ryzen 7 (7735U/7735HS/170) for the Radeon 680M
- MediaTek MT7921 WLAN, or another explicitly identified and verified adapter
- Dual-channel memory (2 SODIMMs), at least 16 GB
- A 100% sRGB, 400-nit panel; avoid the 300-nit 45% NTSC panels
- No dependency on fingerprint or IR authentication unless the exact devices can be tested
- A return window long enough to validate audio, suspend, WLAN, and firmware updates

## Sources

- Lenovo PSREF: https://psref.lenovo.com/syspool/Sys/PDF/ThinkPad/ThinkPad_E16_Gen_2_AMD/ThinkPad_E16_Gen_2_AMD_Spec.pdf
- Lenovo product reference: https://psref.lenovo.com/Product/ThinkPad/ThinkPad_E16_Gen_2_AMD
- Linux AMDGPU documentation: https://docs.kernel.org/gpu/amdgpu/index.html
- Linux thinkpad_acpi documentation: https://docs.kernel.org/admin-guide/laptops/thinkpad-acpi.html
- AMD debug tools (amd-s2idle): https://git.kernel.org/pub/scm/linux/kernel/git/superm1/amd-debug-tools.git
- Linux hardware probes (real-world reports; search "ThinkPad E16 Gen 2"): https://linux-hardware.org
- Linux MediaTek MT76 driver source: https://github.com/torvalds/linux/tree/master/drivers/net/wireless/mediatek/mt76
- Linux Realtek rtw89 driver source: https://github.com/torvalds/linux/tree/master/drivers/net/wireless/realtek/rtw89
- Linux Realtek r8169 Ethernet driver source: https://github.com/torvalds/linux/tree/master/drivers/net/ethernet/realtek
- Linux USB Video Class driver source: https://github.com/torvalds/linux/tree/master/drivers/media/usb/uvc
- ArchWiki fwupd documentation: https://wiki.archlinux.org/title/Fwupd
- Omarchy releases: https://github.com/omacom/omarchy/releases
- Omarchy firmware updater: https://github.com/omacom/omarchy/blob/quattro/bin/omarchy-update-firmware
- Omarchy firmware documentation: https://github.com/omacom/omarchy/blob/quattro/manual/30-updates.md
- Omarchy hardware authentication: https://github.com/omacom/omarchy/blob/quattro/manual/37-hardware-authentication.md
