# Dell Precision 5570 — Omarchy Compatibility

Last researched: September 22, 2026

## Exact configuration

- CPU: 12th Generation Intel Core i9-12900H, 24 MB cache, 14 cores, up to 5 GHz
- GPU: NVIDIA RTX A2000 Laptop GPU, 8 GB GDDR6, plus Intel integrated graphics
- Memory: 64 GB (2 x 32 GB) DDR5-4800, dual-channel
- Storage: 1 TB M.2 2280 PCIe NVMe Gen4 x4 SSD

## Overall assessment

This is a strong Omarchy workstation with good documented Linux compatibility. Its CPU, Intel graphics, RTX A2000, memory, NVMe storage, wireless, webcam, audio, fingerprint reader, and firmware-update mechanism have Linux support.

Compatibility rating: good, with moderate hybrid-NVIDIA complexity.

The principal risks are suspend/resume, external-display routing, battery life, idle GPU power, and Wayland behavior. These should be tested on the actual machine.

## Compatibility details

### CPU and Intel graphics

The i9-12900H's performance and efficiency cores are supported by current Linux kernels. Intel graphics use the in-kernel `i915` driver and Mesa. The dual-channel memory configuration enables full Iris Xe operation.

### NVIDIA RTX A2000

The RTX A2000 is an Ampere-generation GPU. Omarchy should detect it and install its current NVIDIA stack, including `nvidia-open-dkms`, `nvidia-utils`, 32-bit NVIDIA libraries, and NVIDIA video support. Omarchy configures DRM modesetting and early KMS.

Expected drivers:

- Intel GPU: `i915`
- RTX A2000: `nvidia`
- `nouveau`: not loaded

Verify after installation:

```bash
lspci -nnk | grep -A3 -E 'VGA|3D|Display'
nvidia-smi
lsmod | grep -E 'nvidia|nouveau'
```

### Memory and storage

The 64 GB DDR5 configuration needs no special driver. The PCIe Gen4 SSD uses the kernel's standard NVMe driver.

Dell may ship the storage controller in RAID On mode. AHCI is generally simpler for a clean Linux installation. Do not change RAID to AHCI without preparation if preserving Windows, because Windows may stop booting.

### Wi-Fi and Bluetooth

The commonly documented Intel AX211 configuration uses the upstream `iwlwifi` driver and `linux-firmware`. Bluetooth uses the normal kernel Bluetooth stack and BlueZ. Confirm the actual adapter with:

```bash
lspci -nnk | grep -A3 -i network
lsusb
```

### Audio

Basic audio is supported through ALSA, PipeWire, and WirePlumber. Omarchy installs Intel Sound Open Firmware when compatible Intel audio hardware is detected.

The model-specific ArchWiki page reports that only the front speakers may initially be enabled. The secondary/LFE speakers can be enabled with `alsa-tools` and `hdajackretask` using its documented Realtek ALC289 pin overrides.

Diagnostics:

```bash
wpctl status
aplay -l
systemctl --user status pipewire wireplumber
journalctl -b -k | grep -iE 'snd|sof|audio|hda'
```

### Webcam and fingerprint reader

The model-specific ArchWiki report lists the webcam as working. The reported Goodix fingerprint sensor, USB ID `27c6:63ac`, works through `fprintd`. Verify the actual IDs because component substitutions are possible:

```bash
lsusb
fprintd-list "$USER"
```

Omarchy provides fingerprint setup under Setup > Security > Fingerprint.

### Firmware

The Precision 5570 has verified LVFS/fwupd support under the same firmware family as the Dell XPS 15 9520. Omarchy's Update > Firmware function installs `fwupd` when needed and applies available updates.

```bash
fwupdmgr get-devices
fwupdmgr refresh
fwupdmgr get-updates
```

Update the BIOS before installation if practical, or through Omarchy afterward. If LVFS cannot apply an update, Dell may provide a standalone BIOS image usable from the firmware update screen with a FAT32 USB drive.

## Installation recommendations

1. Update to the latest Dell BIOS.
2. Disable Secure Boot for Omarchy's official installation path.
3. Use UEFI boot mode.
4. For a clean installation, prefer AHCI over RAID On.
5. Complete installation and the first reboot before judging NVIDIA support.
6. Verify that `nvidia`, not `nouveau`, owns the RTX A2000.
7. Run Omarchy's firmware updater.
8. Test suspend, displays, audio, Wi-Fi, camera, fingerprint, and idle power during the return window.

## Problems and mitigations

### NVIDIA black screen or graphical login failure

- Boot a previous kernel or Omarchy snapshot.
- Update Omarchy and reapply its hardware configuration.
- Confirm that `nvidia` owns the A2000 and `nouveau` is absent.
- Temporarily use Intel graphics while repairing NVIDIA.
- Disable the discrete GPU in firmware if the BIOS exposes that option.
- Inspect logs:

```bash
journalctl -b -k | grep -iE 'nvidia|nouveau|drm'
```

### Suspend or resume failure

- Update the BIOS, Omarchy, kernel, and NVIDIA driver.
- Check whether firmware exposes `s2idle`, `deep`, or both.
- Try the alternate mode when both are available.
- Test without docks, USB devices, and external displays.
- Check whether the NVIDIA GPU remains active.
- Adjust NVIDIA runtime power management.
- Use Intel-only operation if supported by BIOS.
- Use hibernation if suspend remains unreliable.
- Retain a known-good kernel.

```bash
cat /sys/power/mem_sleep
journalctl -b -1 -k
```

Suspend behavior can be constrained by firmware or hardware, so a complete software fix is not guaranteed.

### External display or dock problems

- Ensure the NVIDIA driver is loaded.
- Update dock firmware through `fwupd` when supported.
- Test every USB-C/Thunderbolt port because routing may differ.
- Try a direct USB-C-to-DisplayPort connection instead of a dock.
- Try another cable or lower refresh rate.
- Disable HDR, variable refresh rate, or Display Stream Compression while diagnosing.
- Correct the Hyprland monitor configuration.

Some outputs may be physically wired to the RTX A2000. Such a port cannot normally be rerouted to Intel in software and requires a working NVIDIA stack.

### Excessive battery drain or heat

- Use `nvidia-smi` to identify applications keeping the A2000 awake.
- Run ordinary desktop applications on Intel graphics.
- Check NVIDIA runtime power management and PCI runtime state.
- Use a balanced or power-saver profile.
- Reduce brightness and refresh rate.
- Disable the A2000 in BIOS when maximum battery life is needed, if supported.

The RTX A2000 configuration will not match an integrated-only laptop's battery life.

### Secondary speakers silent

Use the model-specific `hdajackretask` procedure on the ArchWiki Precision 5570 page. It documents the `alsa-tools`, Realtek ALC289, and speaker-pin configuration.

### Wi-Fi instability

- Update BIOS, kernel, and `linux-firmware`.
- Set the correct regulatory domain.
- Disable Wi-Fi power saving as a diagnostic step.
- Temporarily use 5 GHz instead of 6 GHz/Wi-Fi 6E.
- Recreate the NetworkManager connection.
- Use Ethernet or a supported USB adapter while diagnosing.

### Fingerprint problems

Verify that the sensor is the documented Goodix `27c6:63ac`. If supported but malfunctioning, re-enroll it, reset stale enrollment data, and rerun Omarchy's fingerprint setup. If Dell substituted an unsupported sensor, use password or FIDO2 authentication.

## Return-window checklist

- Complete at least three lid-close suspend/resume cycles.
- Repeat suspend with the intended dock or external display.
- Test every USB-C/Thunderbolt/display output.
- Test all speakers, microphone, headphones, and display audio.
- Verify Wi-Fi reconnection after resume.
- Test Bluetooth with a peripheral.
- Test webcam video and fingerprint enrollment.
- Confirm the A2000 runs a workload through `nvidia-smi`.
- Confirm the A2000 becomes idle afterward.
- Check idle battery drain and fan behavior.
- Confirm `fwupdmgr` detects system firmware.

## Diagnostic bundle

```bash
inxi -Fxxxz
lspci -nnk
lsusb
fwupdmgr get-devices
cat /sys/power/mem_sleep
wpctl status
nvidia-smi
journalctl -b -p warning
journalctl -b -1 -k
```

Review output before sharing it publicly because it may contain serial numbers, MAC addresses, usernames, and other identifiers.

## Recovery strategy

- Use an Omarchy/Btrfs snapshot if an update introduces a regression.
- Boot a previous kernel when the current kernel fails.
- Use a text console if the graphical session does not start.
- Reapply Omarchy's hardware configuration before installing unrelated AUR drivers.
- Change one workaround at a time and record kernel parameters or overrides.

## Sources

- ArchWiki: https://wiki.archlinux.org/title/Dell_Precision_5570
- Ubuntu certification, Intel graphics: https://ubuntu.com/certified/202112-29760
- Ubuntu certification, RTX A1000: https://ubuntu.com/certified/202112-29759
- Ubuntu certification, RTX A2000: https://ubuntu.com/certified/202112-29758
- LVFS firmware record: https://fwupd.org/lvfs/device/com.dell.uefi398c4c37.firmware
- Omarchy releases: https://github.com/omacom/omarchy/releases
- Omarchy NVIDIA installer: https://github.com/omacom/omarchy/blob/quattro/install/hardware/nvidia.sh
- Omarchy firmware updater: https://github.com/omacom/omarchy/blob/quattro/bin/omarchy-update-firmware
- Omarchy firmware documentation: https://github.com/omacom/omarchy/blob/quattro/manual/30-updates.md
- Omarchy hardware authentication: https://github.com/omacom/omarchy/blob/quattro/manual/37-hardware-authentication.md
