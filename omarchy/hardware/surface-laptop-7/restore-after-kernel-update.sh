#!/usr/bin/env bash
# Reapply every kernel-dependent Surface Laptop 7 fix after a linux-omarchy
# update. Run this after the first reboot into the new kernel, then reboot once
# more and run verify.sh.
#
# Usage:
#   sudo ./restore-after-kernel-update.sh
set -euo pipefail

HERE=$(cd -- "$(dirname -- "$0")" && pwd)
KREL=$(uname -r)
PKGVER=$(pacman -Q linux-omarchy 2>/dev/null | awk '{print $2}')
HEADER_PKGVER=$(pacman -Q linux-omarchy-headers 2>/dev/null | awk '{print $2}')
EXPECTED_KREL="${PKGVER}-omarchy"

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run with sudo: sudo $0"
[[ $KREL == "$EXPECTED_KREL" ]] ||
  die "running $KREL but installed kernel is $EXPECTED_KREL; reboot first, then rerun this command"
[[ $HEADER_PKGVER == "$PKGVER" ]] ||
  die "linux-omarchy-headers is $HEADER_PKGVER but linux-omarchy is $PKGVER"

DESKTOP_USER=${SUDO_USER:-}
if [[ -z $DESKTOP_USER || $DESKTOP_USER == root ]]; then
  DESKTOP_USER=$(stat -c '%U' "$HERE")
fi
[[ $DESKTOP_USER != root ]] || die "could not determine the desktop user"
DESKTOP_UID=$(id -u "$DESKTOP_USER")
DESKTOP_HOME=$(getent passwd "$DESKTOP_USER" | cut -d: -f6)
[[ -n $DESKTOP_HOME ]] || die "could not determine home directory for $DESKTOP_USER"

say "1/3 rebuilding the internal-keyboard module and UKI"
bash "$HERE/keyboard/restore-keyboard-module.sh"

say "2/3 rebuilding the SoundWire audio module"
bash "$HERE/audio/restore-audio-module.sh"

say "3/3 refreshing the per-user RT1320 UCM overlay for $DESKTOP_USER"
runuser -u "$DESKTOP_USER" -- env \
  HOME="$DESKTOP_HOME" \
  XDG_RUNTIME_DIR="/run/user/$DESKTOP_UID" \
  DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$DESKTOP_UID/bus" \
  "$HERE/audio/install-ucm-override.sh"

printf '\n============================================================\n'
printf 'Surface kernel fixes were rebuilt for %s.\n' "$KREL"
printf 'Reboot once more, then verify with:\n\n'
printf '  sudo %s/verify.sh\n' "$HERE"
printf '============================================================\n'
