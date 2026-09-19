#!/usr/bin/env bash
#
# Restore the Surface Laptop 7 (Intel) internal keyboard after a kernel update,
# or on a fresh install of this dotfiles repo on this machine.
#
# The keyboard needs a two-line addition to
#   drivers/platform/surface/surface_aggregator_registry.c
# registering ACPI hub id MSHW0551 against ssam_node_group_sl7 (upstream only maps
# that group to the ARM device-tree compatibles, so on the Intel model the SAM bus
# comes up with zero nodes and no keyboard). We build it as an out-of-tree module
# and install it into /lib/modules/<ver>/updates/, which takes precedence over the
# stock module.
#
# Usage:  sudo bash restore-keyboard-module.sh
#
# Why this is needed after kernel updates: the module is compiled against one exact
# kernel version, so a new linux-omarchy leaves you with the unpatched stock module
# until you rerun this. See also 95-sl7-keyboard.hook (optional pacman automation).
#
# Rollback:
#   sudo rm /lib/modules/$(uname -r)/updates/surface_aggregator_registry.ko
#   sudo depmod -a && sudo limine-mkinitcpio
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCHF="$HERE/sl7-mshw0551-keyboard.patch"
KREL="$(uname -r)"
VERSION="${KREL%%-*}"          # 7.2.5-3-omarchy -> 7.2.5
UPD="/lib/modules/$KREL/updates"
MODS="8250_dw surface_aggregator surface_aggregator_hub surface_aggregator_registry surface_hid surface_hid_core surface_kbd"

die() { printf '\n!! %s\n' "$*" >&2; exit 1; }
say() { printf '\n==> %s\n' "$*"; }

[[ $EUID -eq 0 ]] || die "run me with sudo:  sudo bash $0"
[[ -f "$PATCHF" ]] || die "patch not found: $PATCHF"
[[ -d "/lib/modules/$KREL/build" ]] || die "no kernel headers/build dir for $KREL"
say "kernel $KREL  (upstream stable tag v$VERSION)"

WORK="$(mktemp -d /tmp/sl7-kbd-XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

# --- 1. get the exact upstream source file for this kernel -----------------
SRCURL="https://raw.githubusercontent.com/gregkh/linux/v$VERSION/drivers/platform/surface/surface_aggregator_registry.c"
say "fetching $SRCURL"
curl -4 -sfL --max-time 60 -o "$WORK/src.c" "$SRCURL" \
    || die "could not fetch source for v$VERSION (kernel too new, or no network) - nothing changed"

if grep -q 'MSHW0551' "$WORK/src.c"; then
    say "upstream already contains MSHW0551 - the override module is no longer needed"
    rm -f "$UPD/surface_aggregator_registry.ko"
    depmod -a "$KREL"
    echo "   removed the override; rebuild the initramfs next:  sudo limine-mkinitcpio"
    exit 0
fi

# --- 2. patch --------------------------------------------------------------
mkdir -p "$WORK/stage/drivers/platform/surface"
cp "$WORK/src.c" "$WORK/stage/drivers/platform/surface/surface_aggregator_registry.c"
( cd "$WORK/stage" && patch -p1 --forward <"$PATCHF" )
grep -q 'MSHW0551' "$WORK/stage/drivers/platform/surface/surface_aggregator_registry.c" \
    || die "patch did not apply (upstream context changed) - nothing changed"
say "patch applied"

# --- 3. build --------------------------------------------------------------
mkdir -p "$WORK/mod"
cp "$WORK/stage/drivers/platform/surface/surface_aggregator_registry.c" "$WORK/mod/"
printf 'obj-m := surface_aggregator_registry.o\n' >"$WORK/mod/Makefile"
say "building against /lib/modules/$KREL/build"
make -C "/lib/modules/$KREL/build" M="$WORK/mod" modules >/dev/null
KO="$WORK/mod/surface_aggregator_registry.ko"
[[ -f "$KO" ]] || die "build produced no module"
modinfo -F vermagic "$KO" | grep -q "$KREL" || die "vermagic mismatch"
modinfo -F alias "$KO" | grep -q 'MSHW0551' || die "MSHW0551 alias missing from build"

# --- 4. install + depmod ---------------------------------------------------
say "installing to $UPD"
install -d "$UPD"
install -m 0644 "$KO" "$UPD/surface_aggregator_registry.ko"
depmod -a "$KREL"
RESOLVED="$(modinfo -F filename surface_aggregator_registry)"
echo "   resolves to: $RESOLVED"
[[ "$RESOLVED" == "$UPD/surface_aggregator_registry.ko" ]] || die "depmod did not prefer the updates/ copy"

# --- 5. load early (module-load race at the greeter) -----------------------
say "writing /etc/modules-load.d/surface-sam.conf"
cat > /etc/modules-load.d/surface-sam.conf <<'EOF'
# Load the SAM keyboard early. Without this the internal keyboard can come up
# dead at the display-manager greeter (a USB keyboard hotplug revives it).
surface_aggregator_registry
surface_hid
EOF

# --- 6. get the keyboard into the initramfs (LUKS passphrase prompt) -------
say "ensuring the SAM stack is in the initramfs"
if [[ ! -f /etc/mkinitcpio.conf.bak ]]; then
    cp -a /etc/mkinitcpio.conf /etc/mkinitcpio.conf.bak
    echo "   backed up /etc/mkinitcpio.conf -> /etc/mkinitcpio.conf.bak"
fi
if ! grep -q 'surface_aggregator_registry' /etc/mkinitcpio.conf; then
    if grep -qE '^MODULES=\(\)' /etc/mkinitcpio.conf; then
        sed -i "s|^MODULES=()|MODULES=($MODS)|" /etc/mkinitcpio.conf
    else
        sed -i -E "s|^(MODULES=\([^)]*)\)|\1 $MODS)|" /etc/mkinitcpio.conf
    fi
fi
grep -E '^MODULES' /etc/mkinitcpio.conf

say "regenerating initramfs / unified kernel image"
if command -v limine-mkinitcpio >/dev/null 2>&1; then
    limine-mkinitcpio
else
    mkinitcpio -P
fi

say "DONE - reboot to confirm the keyboard works at the LUKS prompt"
echo "   verify after reboot:  grep -i keyboard /proc/bus/input/devices"
echo "                         ls /sys/bus/surface_aggregator/devices/"
