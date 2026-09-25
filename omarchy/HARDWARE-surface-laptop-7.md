# Surface Laptop 7 (Intel) — host hardware fixes

Host properties, not portable config. These five fixes are machine-specific work done
after the Omarchy bare-metal bring-up; the buildable sources and scripts live in
`omarchy/hardware/surface-laptop-7/` so the kernel and service fixes are reproducible on a fresh install and
recoverable after a kernel update. The §1 module carries the internal keyboard, the ALS,
and the battery/AC adapter — one patch, four devices.

    Machine:  Microsoft "Surface Laptop for Business 7th Edition with Intel"
    Kernel:   7.2.5-3-omarchy (linux-omarchy)
    Boot:     Limine, unified kernel image /boot/EFI/Linux/omarchy_linux-omarchy.efi
    Root:     LUKS (nvme0n1p2 -> /dev/mapper/root, btrfs)   <- needs a keyboard in initramfs
    Session:  Wayland / Hyprland

All fixes were verified live before being written down: keyboard at the boot log level
(module loads pre-switch-root, device registers ~5 s before the greeter), touchpad at
the event level (see the measurement table below), and audio with a non-silent PipeWire
capture plus a live Voxtype recording/OSD test. Bluetooth recovery was tested by removing
`btintel_pcie` and confirming that the new boot service restored a usable controller. The
internal camera was tested through both a 1280x720 V4L2 bridge capture and Slack's native
PipeWire camera path.

---

## 1. SAM node group — internal keyboard, ALS, battery and AC adapter

One patch, one out-of-tree module. The keyboard and the battery are the same defect: the
SL7 SAM node group is incomplete, and upstream only reaches that group through ARM
device-tree compatibles. The keyboard is documented first, then the battery/AC adapter,
then the plumbing and boot ordering they share.

### Symptom
No internal keyboard at all; only a USB keyboard appeared. `/sys/bus/surface_aggregator/devices/`
was empty and `surface_kbd` was loaded but bound to nothing.

### Cause
Upstream `drivers/platform/surface/surface_aggregator_registry.c` maps the SAM node group
`ssam_node_group_sl7` (which contains `ssam_node_hid_sam_keyboard`) only to device-tree
compatibles (`microsoft,romulus13/15` = the ARM variant). The Intel model is ACPI and its
hub is `MSHW0551`, which had no entry — so no SAM nodes were created at all.

Confirmed: the machine exposes ACPI `MSHW0551:00`, and the stock module's ACPI table jumps
`MSHW0530` -> `MSHW0583` with no `MSHW0551` string anywhere in it.

### Fix
Two-line addition, built as an out-of-tree module into `/lib/modules/<ver>/updates/` (which
takes precedence over the stock module):

```c
{ "MSHW0551", (unsigned long)ssam_node_group_sl7 }   /* Surface Laptop 7 (Intel) */
&ssam_node_hid_sam_sensors,                          /* in ssam_node_group_sl7 (ALS) */
```

Verified equivalent to upstream build config: an unpatched build reproduces the shipped
module exactly (`srcversion 6497C70A96A8F43580B6E3E`, identical ACPI aliases and undefined
symbols).

Result: 4 SAM nodes appear (`surface_platform_profile`, `surface_fan`, 2x `surface_hid`) -
6 once the battery nodes below are included - keyboard registers as
`Microsoft Surface 045E:0C9A Keyboard`, and the
`surface_serial_hub ... dropping unexpected command message (rqid = 0x0101)` dmesg flood
stops entirely (was dozens per second).

### Battery and AC adapter — the same node group, same module

#### Symptom
No battery anywhere on the system:

    /sys/class/power_supply/          empty
    upower -e                         only .../DisplayDevice — synthetic, 0%,
                                      icon battery-missing-symbolic
    powerprofilesctl get              performance (the AC profile) while unplugged

Omarchy's built-in power widget was blank, the low-battery service could never fire, and
`omarchy-powerprofiles-set autodetect` resolved to `ac` on every call.

#### Cause
`ssam_node_group_sl7` contained no battery nodes. Every other Surface laptop group (`sl3`,
`sl5`, `sl6`) starts with `ssam_node_bat_ac` + `ssam_node_bat_main`; the SL7 group went
straight from `ssam_node_root` to the fan/profile nodes. With the group's ACPI mapping in
place from the keyboard fix, the SAM bus came up with only four nodes — none in target
category `0x02` — so the two drivers wanting a battery had nothing to bind to:

    surface_battery   matches ssam:01:02:01:01:00  (ssam_node_bat_main) -> supplies BAT1
    surface_charger   matches ssam:01:02:01:01:01  (ssam_node_bat_ac)   -> supplies ADP1 (MAINS)

There is no ACPI fallback: the battery's ACPI device `MSHW0005:00` is present and enabled
but unbound, because mainline `drivers/acpi/battery.c` accepts only `PNP0C0A` and
`MSHW0146` (Surface Go 3), and this device reports `PNP0C60`.

#### Fix
Two more lines in the same patch, so one module supplies keyboard, ALS, battery and AC:

```c
&ssam_node_bat_ac,     /* -> surface_charger -> power_supply ADP1 (MAINS) */
&ssam_node_bat_main,   /* -> surface_battery -> power_supply BAT1         */
```

#### Verified before install
Built against pristine `v7.2.5` source in a scratch directory (nothing installed):

    patch applies clean
    module compiles; vermagic 7.2.5-3-omarchy; acpi alias MSHW0551 present
    readelf -sW ... ssam_node_group_sl7 -> 64 bytes = 8 pointers:
      root, bat_ac, bat_main, tmp_perf_profile_with_fan, fan_speed,
      hid_sam_keyboard, hid_sam_sensors, NULL
    other groups untouched (sl3 64 B, sl6 96 B, identical in both builds)

Note: grepping the built `.ko` for the battery node strings proves nothing — they are in
the stock module too, via `sl3`/`sl5`. In pristine source `ssam_node_group_sl7` is not
emitted at all on x86 (the device-tree match table is compiled out), which is the whole
defect. The load-time check is `/sys/class/power_supply`.

#### Expected after reboot

    ls /sys/class/power_supply/               BAT1  ADP1
    upower -e                                 .../battery_BAT1, .../line_power_ADP1
    ls /sys/bus/surface_aggregator/devices/   6 (was 4)
    powerprofilesctl get                      balanced while unplugged

Restoring UPower to full function also brings back Omarchy's built-in power widget, the
low-battery service, and AC/battery power-profile switching — all of which read UPower.

#### Interim userspace workaround — retire once the above verifies
Before this kernel fix the battery was supplied from userspace, because the SAM EC stays
reachable through `/dev/surface/aggregator` even when no driver binds. A root service
(`surface-battery-poller.service`) polled it into `/run/surface-battery/state.json`, and the
`surface-battery` Omarchy plugin consumed that: a bar widget plus a service that drove the
power-profile switch and the 20% warning by hand. With BAT1/ADP1 present this is redundant.

    sudo systemctl disable --now surface-battery-poller.service
    sudo rm /usr/local/bin/surface-battery-poller \
            /etc/systemd/system/surface-battery-poller.service \
            /etc/modules-load.d/surface-aggregator-cdev.conf
    sudo systemctl daemon-reload
    # then drop "surface-battery" from the bar layout in ~/.config/omarchy/shell.json
    # and disable the plugin:  omarchy plugin disable surface-battery

### Boot ordering (why this also works at the LUKS passphrase prompt)
Observed on the encrypted-root boot after the fix:

    16:39:04  patched module loads, keyboard device registers   <- inside the initramfs
    16:39:06  journald flushes the runtime journal              <- root is up
    16:39:09  Reached target Graphical Interface
    16:39:12  Hyprland starts

The keyboard registers two seconds before switch-root and ~5 s before the greeter. Two
separate mechanisms are responsible, and both are needed — they are not interchangeable:

  - The LUKS passphrase prompt is answered *before root exists*, so the SAM stack has to be
    inside the initramfs. That is the `MODULES` entry in the table below.
  - The greeter race is about module load *ordering within the real root*. That is what the
    `modules-load.d` file below is for; without it the keyboard can still come up dead at the
    login screen (a USB keyboard hotplug is what revives it).

### Files
    /lib/modules/<ver>/updates/surface_aggregator_registry.ko   the patched module
    /etc/modules-load.d/surface-sam.conf                        early load (greeter race)
    /etc/mkinitcpio.conf  MODULES=(8250_dw surface_aggregator surface_aggregator_hub
                           surface_aggregator_registry surface_hid surface_hid_core
                           surface_kbd)                          keyboard in initramfs

### After a kernel update — THIS WILL BREAK
The module is compiled for one exact kernel version, so a new `linux-omarchy` silently
gives you the unpatched stock module back. Rerun:

    sudo bash ~/dotfiles/omarchy/hardware/surface-laptop-7/keyboard/restore-keyboard-module.sh

It fetches the one upstream source file for the running kernel, applies the patch, rebuilds,
installs, depmods, and regenerates the initramfs/UKI; if upstream ever merges MSHW0551 it
removes the override instead of patching.

Do not rebuild this from a post-transaction pacman hook: before reboot, `uname -r` still
names the old running kernel. Use the ordered post-update procedure in §8 instead.

### Rollback
    sudo rm /lib/modules/$(uname -r)/updates/surface_aggregator_registry.ko
    sudo depmod -a && sudo limine-mkinitcpio
    sudo rm /etc/modules-load.d/surface-sam.conf
    sudo cp /etc/mkinitcpio.conf.bak /etc/mkinitcpio.conf

---

## 2. Touchpad — needs iptsd (no kernel-side fix exists)

### Symptom
Cursor moved, but no scrolling, no right-click, no gestures. Captured proof: the relative
"Mouse" node emitted only REL_X/REL_Y and BTN_LEFT; the precision-touchpad node emitted
**zero** events in a 90 s capture; no REL_WHEEL, no BTN_RIGHT.

### Cause
The QuickSPI pad (`045E:0C9F`) stays in a dumb relative-mouse fallback mode. Its descriptor
declares the PTP collection and a vendor feature-report channel (`0x0BFF` page, report IDs
`0x48`-`0x35`) — the mode-switching interface — and nothing in the kernel ever writes to it.
This is the still-open upstream issue `linux-surface/iptsd#192` for this device class; there
is no upstream or packaged kernel-side fix.

### Fix
`iptsd` reads raw HID reports from `/dev/hidraw2` and publishes a real touchpad via uinput.
Built from **alex-lentz/iptsd** — a personal fork of linux-surface/iptsd v3.1.0 (pinned
commit `3663e96`), reviewed before use: 444 diff lines over 15 files, no network/exec/
privilege escalation. It adds physical Sensel click via IPTS frame type `0x94`, standalone
HID button report handling, button debounce + palm suppression, a tracker reposition
ceiling, and a resume-recovery sleep hook. Plus the community **LiftGraceMs** patch and the
measured contact-threshold tuning. Packaged as `iptsd-sl7` (deliberately not `iptsd`, so it
does not claim the official package name).

### Measurements (why these thresholds)
Baseline without iptsd: 99 touches / 100 lifts in 120 s, with 60 lift->touch gaps of exactly
8 ms. libinput reads those as tap-then-drag — that is the phantom click-drag.

    config                     flicker(<20ms)   median lift->touch   lift latency
    20/16 alone                     5              208 ms               8 ms
    20/16 + LiftGraceMs 80          0              272 ms              88 ms (floor 80)

Thresholds alone cut flicker ~8x but still flickered; the 80 ms lift-latency floor proves
the grace period is live. Then, for two fingertips held close together (which merged into
one blob, so two-finger scroll/tap did not register), thresholds were raised 20/16 -> 24/20.
The cluster-span algorithm only separates peaks at `value <= deactivation` or a rising edge
with `previous <= activation`, so higher thresholds separate better — and LiftGraceMs now
absorbs the resulting dropouts. A/B capture (close vs spread): 30 two-finger registrations
with fingers close, flicker still 0.

Note: zero `BTN_RIGHT` at the device level is correct — libinput synthesises the right-click
from a two-finger tap.

### Files
    iptsd-sl7 (pacman)                     /usr/bin/iptsd, udev rule, systemd unit
    /etc/udev/rules.d/50-iptsd.rules       packaged rule + ACTION=="add|change"
                                           (shadows the /usr/lib copy; see below)
    /etc/iptsd.d/99-surface-laptop-7-touchpad.conf
        [Device] Vendor=0x045E Product=0x0C9F   (optional; without it a file applies
                                                to every device - config-loader seeds
                                                the match from the current device)
        ActivationThreshold   = 24
        DeactivationThreshold = 20
        ButtonDebounceMs      = 30
        LiftGraceMs           = 80
    /etc/libinput/local-overrides.quirks   AttrPalmSizeThreshold=1400
                                           (fingertips ~850-1100, palm/thumb ~1550-1650)

### Restore / rebuild
    sudo bash ~/dotfiles/omarchy/hardware/surface-laptop-7/touchpad/restore-touchpad.sh

Kernel updates do **not** break this (userspace), unlike the keyboard.

### Service behaviour (easy to misread)
`iptsd@dev-hidraw2.service` is `StopWhenUnneeded` + `BindsTo` the device, so it is
deliberately not enabled the normal way and a bare `systemctl start` stops again
immediately. It is pulled in by udev tagging the hidraw node:

    /dev/hidraw2 -> SYSTEMD_WANTS=iptsd@dev-hidraw2.service

Restart by hand:

    sudo systemctl stop iptsd@dev-hidraw2.service
    sudo udevadm trigger --action=add --sysname-match=hidraw2

### Failure mode — a pacman transaction can kill the pad mid-session
Observed 2026-09-24 15:39: the AUR claude-desktop upgrade pulled in qemu/edk2-ovmf/virtiofsd,
and the touchpad lost scrolling and right-click without a reboot. The §2 symptom came back
exactly, and the cause was not the pad:

    journalctl -b -u iptsd@dev-hidraw2.service
      15:39:30 Stopping Intel Precise Touch & Stylus Daemon ... Stopped   <- never restarted
    hyprctl devices          -> only quickspi-hid-045e:0c9f-touchpad (the fallback mouse)

Cause: the packaged `/usr/lib/udev/rules.d/50-iptsd.rules` matches `ACTION=="add"` only, but
pacman's `35-systemd-udev-reload.hook` -> `/usr/share/libalpm/scripts/systemd-hook
udev-reload` runs `udevadm trigger -c change` after **any** transaction that installs,
upgrades or removes `/usr/lib/udev/rules.d/*`. On a change event the add-only rule does not
re-set `SYSTEMD_WANTS`, the device unit is re-created without a want, and `BindsTo` +
`StopWhenUnneeded` stop iptsd — with no add event left to start it again. So it stays dead
until reboot, while the cursor still moves (fallback relative-mouse mode).

Fix: `/etc/udev/rules.d/50-iptsd.rules`, a copy of the packaged rule with
`ACTION=="add|change"`; the identical filename makes `/etc` win over `/usr/lib`. A systemd
drop-in `StopWhenUnneeded=no` does **not** work — the stop comes from `BindsTo` on the device
unit going inactive, not from the want merely being unset (tested, still stopped).

Repro / regression check — fails without the override, passes with it (`verify.sh` runs it):

    sudo udevadm trigger --action=change --sysname-match=hidraw2
    systemctl is-active iptsd@dev-hidraw2.service      # must stay active
    sudo /usr/share/libalpm/scripts/systemd-hook udev-reload   # the real hook

### Tuning knobs (config only; `restore-touchpad.sh` instructions repeat these)
    LiftGraceMs       80 daily; 70 still let rare ghosts through, 110 was fully clean
    ButtonDebounceMs  30; ~45 catches short (32-48 ms) firmware ghost clicks
    Thresholds        24/20 separates close fingers; 20/16 merges them but tolerates flicker
    Do NOT enable PeakSuppressionRadius >= 2 — it suppresses the real second finger

### Rollback
    sudo pacman -R iptsd-sl7
    sudo rm /etc/iptsd.d/99-surface-laptop-7-touchpad.conf /etc/libinput/local-overrides.quirks
    sudo rm /etc/udev/rules.d/50-iptsd.rules && sudo udevadm control --reload

---

## 3. Internal audio and microphone — SoundWire ghost device and sparse UCM index

### Symptom
Only PipeWire's `Dummy Output` existed; ALSA reported no cards, Voxtype could enter its
`recording` state but could not build an audio stream, and its waveform OSD never appeared.

### Cause
ACPI declares two RT1320 SoundWire functions on link 0, but class `00` is a ghost and only
class `01` is attached:

    sdw:0:0:025d:1320:00  UNATTACHED
    sdw:0:0:025d:1320:01  Attached
    sdw:0:3:025d:0721:01  Attached

The generic SOF/SoundWire function-topology path created a SmartMic endpoint for both RT1320
entries. Both were named `SDW0-Capture-SmartMic`, so ALSA card registration failed with a
duplicate sysfs filename and `sof_sdw ... probe ... error -12`.

After filtering the ghost, the real codec retains firmware index 2 (`rt1320-2`). Upstream
`alsa-ucm-conf` assumes a one-RT1320 card uses index 1, so WirePlumber then failed its HiFi
verb while looking for `rt1320-1 FU Capture Switch`. A small per-user UCM overlay points the
one-amp/one-mic controls at the attached `rt1320-2` instance.

### Fix
The out-of-tree `snd-soc-sdw-utils` module skips ACPI-described SoundWire peripherals whose
runtime status is `SDW_SLAVE_UNATTACHED` and deducts their endpoints from the machine-driver
count. It is built against the exact Omarchy source recipe, including Omarchy's three sound
backport bundles, rather than against plain stable-kernel source.

    sudo ~/dotfiles/omarchy/hardware/surface-laptop-7/audio/restore-audio-module.sh

The UCM installer creates a symlink overlay of the packaged UCM tree, patches only the two
RT1320 files, and gives WirePlumber the overlay through a user-service drop-in:

    ~/dotfiles/omarchy/hardware/surface-laptop-7/audio/install-ucm-override.sh

### Files
    /lib/modules/<ver>/updates/snd-soc-sdw-utils.ko
    ~/.local/share/sl7-ucm2/
    ~/.config/systemd/user/wireplumber.service.d/sl7-ucm.conf
    hardware/surface-laptop-7/audio/0001-sdw-utils-skip-unattached-sdca-endpoints.patch
    hardware/surface-laptop-7/audio/0002-ucm-rt1320-use-attached-instance.patch
    hardware/surface-laptop-7/audio/restore-audio-module.sh
    hardware/surface-laptop-7/audio/install-ucm-override.sh

### Verified result
ALSA card `sof-soundwire` registers with capture PCM 4 (`Microphone`); PipeWire exposes
`HiFi__Mic__source` as the default source. A three-second 48 kHz stereo PipeWire capture had
287402/288000 non-zero samples. Voxtype successfully opened the default device and Hyprland
showed namespace `voxtype-osd` at `400x48` while recording.

### Bluetooth headset disconnect can expose a stale UCM overlay

WirePlumber normally remembers a Bluetooth headset as the configured default source and falls
back to the internal microphone when the headset disconnects. Do not clear that saved default
merely because `wpctl status` still lists a disconnected `bluez_input` under **Default
Configured Devices**; the currently selected source is the starred entry under **Sources** and
is also reported by `pactl get-default-source`.

If the per-user RT1320 overlay is stale or was generated before the current patch, that fallback
fails: the headset disappears, the internal card remains on profile `off`, and PipeWire exposes
only `Dummy Output`/no capture source. WirePlumber logs identify this case:

    spa.alsa: Failed to get the verb HiFi
    spa.alsa: No UCM verb is valid for <<<SplitPCM=1>>>hw:0

Bluetooth did not disable the microphone in this state; it only exposed the already-invalid
internal fallback. Regenerate the overlay as the desktop user (not with `sudo`):

    ~/dotfiles/omarchy/hardware/surface-laptop-7/audio/install-ucm-override.sh

The installer validates the HiFi verb, restarts WirePlumber, waits for the internal source and
enables all four `rt1320-2 FU Capture Switch` channels. Confirm recovery with:

    pactl get-default-source
    pactl list cards | grep 'Active Profile'
    amixer -D hw:0 cget "name='rt1320-2 FU Capture Switch'"

The expected results are `HiFi__Mic__source`, `Active Profile: HiFi`, and
`values=on,on,on,on`. Once repaired, repeated WirePlumber restarts and ordinary Bluetooth
connect/disconnect cycles should preserve the internal fallback while retaining the headset as
the preferred device whenever it is available.

### After an update
The module is tied to one exact `linux-omarchy` ABI. The restore script discovers the exact
`omarchy-pkgs` source recipe from the installed package version and build timestamp, reapplies
that recipe's SoundWire backports, and then applies the Surface patch. If the source changed
incompatibly, it stops rather than installing a questionable module. Use the ordered
post-update procedure in §8. Rerun the UCM installer after `alsa-ucm-conf` updates so its
symlink overlay and two patched files are refreshed.

### Rollback
    sudo rm /lib/modules/$(uname -r)/updates/snd-soc-sdw-utils.ko
    sudo depmod -a
    rm -rf ~/.local/share/sl7-ucm2
    rm ~/.config/systemd/user/wireplumber.service.d/sl7-ucm.conf
    systemctl --user daemon-reload
    reboot

---

## 4. Intel Bluetooth — recover a firmware-download timeout at boot

### Symptom and diagnosis

The Omarchy Bluetooth panel (`Super+Ctrl+B`) reported **No Bluetooth adapters** even though
`bluetooth.service` was active, `rfkill` showed an unblocked `hci0`, and PCI enumeration
found the onboard Intel controller at `00:14.7` using `btintel_pcie`. `bluetoothctl show`
reported `No default controller available`, and `btmgmt --index 0 info` returned
`Invalid Index`.

The kernel log identified a firmware-startup race rather than missing hardware or a blocked
radio:

    Bluetooth: hci0: command 0xfc09 tx timeout
    Bluetooth: hci0: Failed to send firmware data (-110)

The firmware was present in `linux-firmware-intel`; reloading `btintel_pcie` made the same
firmware load successfully and registered controller `38:18:68:B3:03:70`.

### Automatic recovery

`bluetooth-recover.service` runs once after `bluetooth.service` on every boot. It gives normal
startup five seconds to complete and exits without touching a healthy adapter. Only when
`bluetoothctl list` has no controller does it stop BlueZ, reload `btintel_pcie`, restart
BlueZ, and verify that a controller appears. Install or restore it with:

    sudo ~/dotfiles/omarchy/hardware/surface-laptop-7/bluetooth/install-bluetooth-recovery.sh

Source and installed files:

    hardware/surface-laptop-7/bluetooth/bluetooth-recover
        -> /usr/local/sbin/bluetooth-recover
    hardware/surface-laptop-7/bluetooth/bluetooth-recover.service
        -> /etc/systemd/system/bluetooth-recover.service

The recovery path was tested live by stopping BlueZ, unloading `btintel_pcie`, and starting
the recovery unit. It restored the adapter, left `bluetooth.service` active, and passed
`btmgmt --index 0 info`.

Because this is a `Type=oneshot` unit, `inactive (dead)` after a successful run is normal.
Inspect the current boot with:

    journalctl -u bluetooth-recover.service -b
    systemctl is-enabled bluetooth-recover.service
    bluetoothctl list

### Rollback

    sudo systemctl disable --now bluetooth-recover.service
    sudo rm /etc/systemd/system/bluetooth-recover.service \
            /usr/local/sbin/bluetooth-recover
    sudo systemctl daemon-reload

---

## 5. Internal camera — IPU7/libcamera and on-demand Slack access

### Symptom and cause

The OV02C10 internal sensor is connected through Intel IPU7 rather than USB/UVC. The kernel
finds it and libcamera can capture it, but ordinary V4L2 applications see the IPU7 plumbing
nodes instead of a directly usable webcam. Libcamera 0.7.2 uses its generic
`simple/uncalibrated.yaml` software-ISP profile because there is no OV02C10 sensor helper or
calibrated profile; warnings about missing crop rectangles and sensor properties are therefore
expected. The image works but is noisier and less accurately tone-mapped than the Logitech C920.

### Preferred Slack setup — native PipeWire, camera opened only on demand

Slack's Electron build contains `WebRtcPipeWireCamera`, but it is not enabled by default. A
per-user desktop-file override enables it:

    ~/.local/share/applications/slack.desktop
    Exec=/usr/bin/slack --gtk-version=3 -s --enable-features=WebRtcPipeWireCamera %U

Completely quit and relaunch Slack after changing the desktop file. Confirm the running process
contains the feature flag:

    ps -eo pid,args | grep '[W]ebRtcPipeWireCamera'

PipeWire/WirePlumber publishes the sensor as the libcamera device `ov02c10`. With the native
path, Slack enumerates that device without a continuously running capture process. The physical
privacy LED remains off while Slack is idle and turns on only when Slack opens camera preview or
uses video in a call. Do not suppress the LED: it correctly reports that the sensor is active.

The final live state is intentionally:

    systemctl --user disable --now builtin-camera-bridge.service
    # Slack running with --enable-features=WebRtcPipeWireCamera

This native path bypasses the color correction from the fallback bridge below.

### Fallback for applications requiring a conventional V4L2 webcam

`v4l2loopback` exposes `/dev/video42` as `Built-in Front Camera`:

    /etc/modules-load.d/surface-camera-loopback.conf
        v4l2loopback

    /etc/modprobe.d/surface-camera-loopback.conf
        options v4l2loopback video_nr=42 card_label="Built-in Front Camera" exclusive_caps=1 max_buffers=4

The disabled user service `~/.config/systemd/user/builtin-camera-bridge.service` runs
`~/.local/bin/builtin-camera-bridge.sh`, whose tested GStreamer pipeline is:

    gst-launch-1.0 -e \
      libcamerasrc camera-name='\\_SB_.PC00.I2C5.CAMF' \
      ! video/x-raw,width=1280,height=720 \
      ! videobalance contrast=1.50 saturation=1.25 brightness=-0.04 \
      ! videoconvert ! video/x-raw,format=YUY2 \
      ! v4l2sink device=/dev/video42 sync=false

That pipeline was verified with a real 1280x720 JPEG capture. `exclusive_caps=1` means consumers
see `/dev/video42` as a capture device only while the pipeline has its producer side open. As a
result, enabling the bridge also opens the physical sensor continuously and keeps the privacy LED
on. Use it only as a compatibility fallback:

    systemctl --user enable --now builtin-camera-bridge.service
    systemctl --user disable --now builtin-camera-bridge.service

Useful checks:

    cam -l
    wpctl status
    v4l2-ctl --list-devices
    systemctl --user status builtin-camera-bridge.service

Required packages include `libcamera`, `libcamera-ipa`, `libcamera-tools`, `pipewire-libcamera`,
GStreamer's libcamera/V4L2 plugins, `v4l-utils`, and `v4l2loopback-dkms`.

---

## 6. Also done on this host

    google-chrome 153.0.8010.47-1   AUR package built to a local package, then pacman -U
    ~/.config/chrome-flags.conf     --ozone-platform-hint=auto (native Wayland)
    build deps installed: meson, ninja, cmake

## 7. Caveats that matter

- **Secure Boot must stay OFF** (it is off; efivar value 0). The keyboard module is
  unsigned and taints the kernel (taint 13312 = O|E|C).
- The keyboard/battery module and the audio module need a rebuild after every kernel update
  (see §1 and §3). The touchpad does not.
- The touchpad fix depends on a personal, unmerged "vibe coded" fork. It was diff-reviewed
  before building, but it is not the official project; if upstream iptsd ever ships
  MSHW0551/grace support, prefer upstream.
- AUR access from this host is IPv6-flaky: plain `curl`/`yay` prefer the AAAA record and
  stall (~20 s, never connects) while IPv4 works. If `yay` hangs:
      echo 'precedence ::ffff:0:0/96  100' | sudo tee -a /etc/gai.conf
- `~/dotfiles` is synced to macOS. Everything here is Linux/Omarchy-only; `install.sh`
  does not link any of it, so it cannot affect the Mac.

## 8. Verification

### After every `linux-omarchy` update

The order matters because module scripts build for `uname -r`, while pacman installs the new
kernel before it becomes the running kernel:

1. Finish the normal system update, including matching `linux-omarchy` and
   `linux-omarchy-headers` packages.
2. Reboot into the new stock kernel. The keyboard at LUKS and internal audio may be broken for
   this one boot; use a USB keyboard if needed.
3. Run the single restore command:

       sudo ~/dotfiles/omarchy/hardware/surface-laptop-7/restore-after-kernel-update.sh

   It refuses to proceed if the running kernel and installed kernel/headers do not match. It
   then rebuilds the keyboard module and UKI, reconstructs and rebuilds the exact Omarchy
   audio module, and refreshes the UCM overlay as the desktop user.
4. Reboot again so the rebuilt keyboard module in the UKI and the rebuilt audio module load.
5. Run the full end-to-end verification:

       sudo ~/dotfiles/omarchy/hardware/surface-laptop-7/verify.sh

The verifier executes all four restore paths and checks the keyboard, the battery/AC supplies
(`BAT1`/`ADP1` plus UPower), touchpad, audio module, ALSA card/capture PCM, WirePlumber UCM
environment, PipeWire default microphone, RT1320 capture switches, SoundWire attachment state,
Voxtype service state, and the Bluetooth recovery unit/controller.

### Routine verification

Run the same end-to-end check after a restore or whenever hardware stops working:

    sudo bash ~/dotfiles/omarchy/hardware/surface-laptop-7/verify.sh

Or by hand:

    grep -i keyboard /proc/bus/input/devices        # Microsoft Surface 045E:0C9A Keyboard
    ls /sys/bus/surface_aggregator/devices/         # 6 SAM nodes
    ls /sys/class/power_supply/                     # BAT1  ADP1
    upower -e                                       # .../battery_BAT1, .../line_power_ADP1
    systemctl is-active iptsd@dev-hidraw2.service   # active
    grep -i 'IPTSD Virtual Touchpad' /proc/bus/input/devices
    systemctl is-enabled bluetooth-recover.service # enabled
    bluetoothctl list                               # Controller 38:18:68:B3:03:70 ...
    # and by hand: two-finger scroll, two-finger tap (right click), physical click,
    #              repeat with the two fingers held close together
