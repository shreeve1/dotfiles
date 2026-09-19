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
CFG=/etc/iptsd.d/99-surface-laptop-7-touchpad.conf
pass=0; fail=0
ok()  { printf '  PASS  %s\n' "$*"; pass=$((pass+1)); }
bad() { printf '  FAIL  %s\n' "$*"; fail=$((fail+1)); }
chk() { if eval "$2" >/dev/null 2>&1; then ok "$1"; else bad "$1"; fi; }
head_() { printf '\n--- %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "run with sudo:  sudo bash $0"; exit 2; }

head_ "1. script syntax"
chk "bash -n keyboard/restore-keyboard-module.sh" "bash -n '$REPO/keyboard/restore-keyboard-module.sh'"
chk "bash -n touchpad/restore-touchpad.sh"        "bash -n '$REPO/touchpad/restore-touchpad.sh'"

head_ "2. guard: scripts refuse to run without root"
chk "keyboard script refuses as non-root" \
    "sudo -u james bash '$REPO/keyboard/restore-keyboard-module.sh' 2>&1 | grep -q 'run me with sudo'"
chk "touchpad script refuses as non-root" \
    "sudo -u james bash '$REPO/touchpad/restore-touchpad.sh' 2>&1 | grep -q 'run me with sudo'"

head_ "3. keyboard: run the restore script for real"
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
chk "SAM bus has nodes"                           "[ \"\$(ls /sys/bus/surface_aggregator/devices/ 2>/dev/null | wc -l)\" -ge 4 ]"

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

printf '\n================ verification result ================\n'
printf 'passed: %d   failed: %d\n' "$pass" "$fail"
if (( fail > 0 )); then
    printf 'Something is broken. Logs: /tmp/sl7-verify-keyboard.log /tmp/sl7-verify-touchpad.log\n'
    printf 'Fix order: rerun the failing restore script, then re-run this.\n'
fi
printf '\nNot covered (needs hands, not assertions): two-finger scroll, two-finger tap,\n'
printf 'physical click, and the same with two fingers held close together.\n'
exit $(( fail > 0 ))
