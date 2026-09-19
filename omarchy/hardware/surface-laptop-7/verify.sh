#!/usr/bin/env bash
#
# Ad-hoc end-to-end verification for the Surface Laptop 7 host fixes.
#
# This is NOT a unit-test suite: it runs the real restore scripts (which rebuild and
# reinstall) and then asserts the resulting system state. Run it after a kernel update,
# after a restore, or when something on this host stops working.
#
# Usage:  sudo bash verify.sh
# Exit:   0 = all checks passed, 1 = something is broken (details on stdout)
#
set +e

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KREL="$(uname -r)"
UPD="/lib/modules/$KREL/updates/surface_aggregator_registry.ko"
AUDIO_UPD="/lib/modules/$KREL/updates/snd-soc-sdw-utils.ko"
CFG=/etc/iptsd.d/99-surface-laptop-7-touchpad.conf
DESKTOP_USER=${SUDO_USER:-james}
[[ $DESKTOP_USER != root ]] || DESKTOP_USER=james
DESKTOP_UID=$(id -u "$DESKTOP_USER")
DESKTOP_HOME=$(getent passwd "$DESKTOP_USER" | cut -d: -f6)
USER_ENV="HOME=$DESKTOP_HOME XDG_RUNTIME_DIR=/run/user/$DESKTOP_UID DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$DESKTOP_UID/bus"
pass=0; fail=0
ok()  { printf '  PASS  %s\n' "$*"; pass=$((pass+1)); }
bad() { printf '  FAIL  %s\n' "$*"; fail=$((fail+1)); }
chk() { if eval "$2" >/dev/null 2>&1; then ok "$1"; else bad "$1"; fi; }
head_() { printf '\n--- %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "run with sudo:  sudo bash $0"; exit 2; }

head_ "1. script syntax"
chk "bash -n keyboard/restore-keyboard-module.sh" "bash -n '$REPO/keyboard/restore-keyboard-module.sh'"
chk "bash -n touchpad/restore-touchpad.sh"        "bash -n '$REPO/touchpad/restore-touchpad.sh'"
chk "bash -n audio/restore-audio-module.sh"       "bash -n '$REPO/audio/restore-audio-module.sh'"
chk "bash -n audio/install-ucm-override.sh"       "bash -n '$REPO/audio/install-ucm-override.sh'"
chk "bash -n restore-after-kernel-update.sh"      "bash -n '$REPO/restore-after-kernel-update.sh'"

head_ "2. guard: scripts refuse to run without root"
chk "keyboard script refuses as non-root" \
    "sudo -u james bash '$REPO/keyboard/restore-keyboard-module.sh' 2>&1 | grep -q 'run me with sudo'"
chk "touchpad script refuses as non-root" \
    "sudo -u james bash '$REPO/touchpad/restore-touchpad.sh' 2>&1 | grep -q 'run me with sudo'"
chk "audio module script refuses as non-root" \
    "sudo -u james bash '$REPO/audio/restore-audio-module.sh' 2>&1 | grep -q 'run as root'"
chk "UCM installer refuses root" \
    "bash '$REPO/audio/install-ucm-override.sh' 2>&1 | grep -q 'desktop user'"

head_ "3. SAM node group (keyboard + battery): run the restore script for real"
if bash "$REPO/keyboard/restore-keyboard-module.sh" >/tmp/sl7-verify-keyboard.log 2>&1; then
    ok "script exited 0"
else
    bad "script exited non-zero - see /tmp/sl7-verify-keyboard.log"; tail -5 /tmp/sl7-verify-keyboard.log
fi
chk "patched module installed in updates/"        "[ -f '$UPD' ]"
chk "modinfo resolves to the updates/ copy"       "[ \"\$(modinfo -F filename surface_aggregator_registry)\" = '$UPD' ]"
chk "module advertises acpi MSHW0551"             "modinfo -F alias surface_aggregator_registry | grep -q MSHW0551"
chk "vermagic matches the running kernel"         "modinfo -F vermagic '$UPD' | grep -q '$KREL'"
chk "depmod reports no duplicate-name conflict"   "! depmod -a '$KREL' 2>&1 | grep -qi duplicate"
chk "modules-load.d loads registry + hid early"   "grep -q surface_aggregator_registry /etc/modules-load.d/surface-sam.conf"
chk "mkinitcpio MODULES carries the SAM stack"    "grep -q 'MODULES=(.*surface_aggregator_registry' /etc/mkinitcpio.conf"
chk "SAM stack inside the unified kernel image"   "lsinitcpio /boot/EFI/Linux/omarchy_linux-omarchy.efi 2>/dev/null | grep -q updates/surface_aggregator_registry.ko"
chk "internal keyboard registered"                "grep -q 'Surface 045E:0C9A Keyboard' /proc/bus/input/devices"
chk "SAM bus has nodes (4 + battery + AC)"         "[ \"\$(ls /sys/bus/surface_aggregator/devices/ 2>/dev/null | wc -l)\" -ge 6 ]"
chk "battery supply BAT1 registered"               "[ -d /sys/class/power_supply/BAT1 ]"
chk "AC supply ADP1 registered"                    "[ -d /sys/class/power_supply/ADP1 ]"
chk "surface_battery bound to the battery node"    "lsmod | grep -q '^surface_battery'"
chk "surface_charger bound to the AC node"         "lsmod | grep -q '^surface_charger'"
chk "UPower enumerates a battery"                  "upower -e | grep -q BAT"
chk "UPower battery reports present"               "upower -i \"\$(upower -e | grep BAT | head -1)\" | grep -q 'present: *yes'"

head_ "4. touchpad: run the restore script for real (rebuilds the package)"
if bash "$REPO/touchpad/restore-touchpad.sh" >/tmp/sl7-verify-touchpad.log 2>&1; then
    ok "script exited 0"
else
    bad "script exited non-zero - see /tmp/sl7-verify-touchpad.log"; tail -8 /tmp/sl7-verify-touchpad.log
fi
chk "iptsd-sl7 installed"                         "pacman -Q iptsd-sl7"
chk "config: thresholds 24/20 (close-finger fix)" "grep -q '^ActivationThreshold = 24' $CFG && grep -q '^DeactivationThreshold = 20' $CFG"
chk "config: LiftGraceMs 80 (flicker fix)"        "grep -q '^LiftGraceMs = 80' $CFG"
chk "config: ButtonDebounceMs 30"                 "grep -q '^ButtonDebounceMs = 30' $CFG"
chk "config: scoped to this pad via [Device]"     "grep -q '^Vendor = 0x045E' $CFG"
chk "palm-rejection quirk installed"              "grep -q AttrPalmSizeThreshold=1400 /etc/libinput/local-overrides.quirks"
chk "binary carries LiftGraceMs (patch applied)"  "strings /usr/bin/iptsd | grep -q LiftGraceMs"
chk "iptsd service active"                        "systemctl is-active iptsd@dev-hidraw2.service"
chk "virtual touchpad device published"           "grep -q 'IPTSD Virtual Touchpad 045E:0C9F' /proc/bus/input/devices"
chk "udev still tags hidraw2 for autostart"       "udevadm info /dev/hidraw2 | grep -q 'SYSTEMD_WANTS=iptsd@dev-hidraw2.service'"

head_ "5. audio: rebuild module, refresh UCM, and test live capture"
if bash "$REPO/audio/restore-audio-module.sh" >/tmp/sl7-verify-audio.log 2>&1; then
    ok "audio restore script exited 0"
else
    bad "audio restore failed - see /tmp/sl7-verify-audio.log"; tail -8 /tmp/sl7-verify-audio.log
fi
if runuser -u "$DESKTOP_USER" -- env $USER_ENV "$REPO/audio/install-ucm-override.sh" \
        >>/tmp/sl7-verify-audio.log 2>&1; then
    ok "UCM installer exited 0"
else
    bad "UCM installer failed - see /tmp/sl7-verify-audio.log"; tail -8 /tmp/sl7-verify-audio.log
fi
chk "patched audio module installed in updates/"   "[ -f '$AUDIO_UPD' ]"
chk "modinfo resolves to audio updates/ copy"      "[ \"\$(modinfo -F filename snd_soc_sdw_utils)\" = '$AUDIO_UPD' ]"
chk "audio module vermagic matches kernel"         "modinfo -F vermagic '$AUDIO_UPD' | grep -Fq '$KREL'"
chk "sof-soundwire ALSA card registered"           "grep -q sofsoundwire /proc/asound/cards"
chk "internal microphone capture PCM registered"  "arecord -l | grep -q 'device 4: Microphone'"
chk "WirePlumber uses Surface UCM overlay"         "runuser -u '$DESKTOP_USER' -- env $USER_ENV systemctl --user show wireplumber.service -p Environment --value | grep -q 'ALSA_CONFIG_UCM2=.*/sl7-ucm2'"
chk "PipeWire default source is internal mic"      "runuser -u '$DESKTOP_USER' -- env $USER_ENV pactl get-default-source | grep -q 'HiFi__Mic__source'"
chk "RT1320 capture channels are enabled"          "amixer -D hw:0 cget name='rt1320-2 FU Capture Switch' | grep -q 'values=on,on,on,on'"
chk "SoundWire ghost is skipped, real codec attached" "grep -qx UNATTACHED /sys/bus/soundwire/devices/sdw:0:0:025d:1320:00/status && grep -qx Attached /sys/bus/soundwire/devices/sdw:0:0:025d:1320:01/status"
chk "Voxtype service active"                       "runuser -u '$DESKTOP_USER' -- env $USER_ENV systemctl --user is-active voxtype.service"

printf '\n================ verification result ================\n'
printf 'passed: %d   failed: %d\n' "$pass" "$fail"
if (( fail > 0 )); then
    printf 'Something is broken. Logs: /tmp/sl7-verify-keyboard.log /tmp/sl7-verify-touchpad.log /tmp/sl7-verify-audio.log\n'
    printf 'Fix order: rerun the failing restore script, then re-run this.\n'
fi
printf '\nNot covered (needs hands, not assertions): two-finger scroll, two-finger tap,\n'
printf 'physical click, close-finger gestures, microphone quality, and Voxtype transcription.\n'
exit $(( fail > 0 ))
