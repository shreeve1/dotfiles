# Surface Laptop 7 (Intel) — host hardware fixes

Host properties, not portable config. These two fixes are machine-specific work done
after the Omarchy bare-metal bring-up; the buildable sources and scripts live in
`omarchy/hardware/surface-laptop-7/` so both are reproducible on a fresh install and
recoverable after a kernel update.

    Machine:  Microsoft "Surface Laptop for Business 7th Edition with Intel"
    Kernel:   7.2.5-3-omarchy (linux-omarchy)
    Boot:     Limine, unified kernel image /boot/EFI/Linux/omarchy_linux-omarchy.efi
    Root:     LUKS (nvme0n1p2 -> /dev/mapper/root, btrfs)   <- needs a keyboard in initramfs
    Session:  Wayland / Hyprland

Both fixes were verified live before being written down: keyboard at the boot log level
(module loads pre-switch-root, device registers ~5 s before the greeter) and touchpad at
the event level (see the measurement table below).

---

## 1. Internal keyboard — needs ACPI hub MSHW0551 registered

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

Result: 4 SAM nodes appear (`surface_platform_profile`, `surface_fan`, 2x `surface_hid`),
keyboard registers as `Microsoft Surface 045E:0C9A Keyboard`, and the
`surface_serial_hub ... dropping unexpected command message (rqid = 0x0101)` dmesg flood
stops entirely (was dozens per second).

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

Optional automation (not currently installed):

    sudo cp ~/dotfiles/omarchy/hardware/surface-laptop-7/keyboard/95-sl7-keyboard.hook \
            /etc/pacman.d/hooks/

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

### Tuning knobs (config only; `restore-touchpad.sh` instructions repeat these)
    LiftGraceMs       80 daily; 70 still let rare ghosts through, 110 was fully clean
    ButtonDebounceMs  30; ~45 catches short (32-48 ms) firmware ghost clicks
    Thresholds        24/20 separates close fingers; 20/16 merges them but tolerates flicker
    Do NOT enable PeakSuppressionRadius >= 2 — it suppresses the real second finger

### Rollback
    sudo pacman -R iptsd-sl7
    sudo rm /etc/iptsd.d/99-surface-laptop-7-touchpad.conf /etc/libinput/local-overrides.quirks

---

## 3. Also done on this host

    google-chrome 153.0.8010.47-1   AUR package built to a local package, then pacman -U
    ~/.config/chrome-flags.conf     --ozone-platform-hint=auto (native Wayland)
    build deps installed: meson, ninja, cmake

## 4. Caveats that matter

- **Secure Boot must stay OFF** (it is off; efivar value 0). The keyboard module is
  unsigned and taints the kernel (taint 13312 = O|E|C).
- The keyboard module needs a rebuild after every kernel update (see §1). The touchpad does not.
- The touchpad fix depends on a personal, unmerged "vibe coded" fork. It was diff-reviewed
  before building, but it is not the official project; if upstream iptsd ever ships
  MSHW0551/grace support, prefer upstream.
- AUR access from this host is IPv6-flaky: plain `curl`/`yay` prefer the AAAA record and
  stall (~20 s, never connects) while IPv4 works. If `yay` hangs:
      echo 'precedence ::ffff:0:0/96  100' | sudo tee -a /etc/gai.conf
- `~/dotfiles` is synced to macOS. Everything here is Linux/Omarchy-only; `install.sh`
  does not link any of it, so it cannot affect the Mac.

## 5. Verification

Run the end-to-end check — it executes both restore scripts and asserts the resulting
system state (26 assertions):

    sudo bash ~/dotfiles/omarchy/hardware/surface-laptop-7/verify.sh

Or by hand:

    grep -i keyboard /proc/bus/input/devices        # Microsoft Surface 045E:0C9A Keyboard
    ls /sys/bus/surface_aggregator/devices/         # 4 SAM nodes
    systemctl is-active iptsd@dev-hidraw2.service   # active
    grep -i 'IPTSD Virtual Touchpad' /proc/bus/input/devices
    # and by hand: two-finger scroll, two-finger tap (right click), physical click,
    #              repeat with the two fingers held close together
