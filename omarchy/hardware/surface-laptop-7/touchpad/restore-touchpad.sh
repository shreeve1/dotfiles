#!/usr/bin/env bash
#
# Restore the Surface Laptop 7 (Intel) touchpad, or rebuild it on a fresh install.
#
# The pad (QuickSPI 045E:0C9F) stays in a dumb relative-mouse fallback mode: its
# precision-touchpad collection never emits events and nothing writes the vendor
# feature report that would switch it on. The fix is iptsd (userspace): it reads
# raw HID reports from /dev/hidraw2 and publishes a real touchpad via uinput.
#
# We build the alex-lentz fork (personal fork of linux-surface/iptsd v3.1.0,
# reviewed before use: 444 diff lines, no network/exec/privilege escalation) plus
# the community LiftGraceMs patch, and package it as `iptsd-sl7` so it does not
# claim the official `iptsd` name.
#
# Usage:  sudo bash restore-touchpad.sh
#
# This is userspace, so kernel updates do NOT break it - unlike the keyboard.
#
# Rollback:
#   sudo pacman -R iptsd-sl7
#   sudo rm /etc/iptsd.d/99-surface-laptop-7-touchpad.conf /etc/libinput/local-overrides.quirks
#
set -euo pipefail

FORK_URL="https://github.com/alex-lentz/iptsd.git"
FORK_COMMIT="3663e96e758145801c3cb1ce7c72f362d0d4a5f5"
FORK_VER="3.1.0"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

die() { printf '\n!! %s\n' "$*" >&2; exit 1; }
say() { printf '\n==> %s\n' "$*"; }

[[ $EUID -eq 0 ]] || die "run me with sudo:  sudo bash $0"

for f in 0004-iptsd-add-Touchpad-LiftGraceMs-option.patch \
         99-surface-laptop-7-touchpad.conf local-overrides.quirks; do
    [[ -f "$HERE/$f" ]] || die "missing $HERE/$f"
done

WORK="$(mktemp -d /tmp/iptsd-sl7-build.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
say "building iptsd-sl7 in $WORK"
cd "$WORK"

git clone -q "$FORK_URL" iptsd-fork
git -C iptsd-fork checkout -q "$FORK_COMMIT"
say "applying LiftGraceMs patch"
( cd iptsd-fork && patch -p1 --forward <"$HERE/0004-iptsd-add-Touchpad-LiftGraceMs-option.patch" )
grep -q 'lift_grace' iptsd-fork/src/core/generic/config.hpp || die "patch did not apply"

say "packaging"
tar czf "iptsd-fork-$FORK_VER.tar.gz" iptsd-fork
SUM="$(sha256sum "iptsd-fork-$FORK_VER.tar.gz" | cut -d' ' -f1)"
cat >PKGBUILD <<EOF
pkgname=iptsd-sl7
pkgver=$FORK_VER
pkgrel=1
pkgdesc='Intel Precise Touch & Stylus daemon - fork with Surface Laptop 7 Intel haptic touchpad fixes'
arch=('x86_64')
url='$FORK_URL'
license=('GPL-2.0-or-later')
depends=('gcc-libs' 'systemd-libs')
makedepends=('meson' 'gcc' 'cmake' 'systemd' 'udev' 'git')
backup=('etc/iptsd.conf')
source=('iptsd-fork-$FORK_VER.tar.gz')
sha256sums=('$SUM')
build() {
  cd "\$srcdir/iptsd-fork"
  meson setup build --prefix=/usr --buildtype=release --default-library=static \\
    --wrap-mode=forcefallback -Ddebug_tools=calibrate,dump,perf
  meson compile -C build
}
package() {
  cd "\$srcdir/iptsd-fork"
  DESTDIR="\$pkgdir" meson install -C build --skip-subprojects
}
EOF

PACMAN_USER="${SUDO_USER:-james}"
chown -R "$PACMAN_USER" "$WORK"
say "running makepkg as $PACMAN_USER (downloads meson subprojects, takes a few minutes)"
sudo -u "$PACMAN_USER" makepkg -f --noconfirm
PKG="$(ls iptsd-sl7-*-x86_64.pkg.tar.zst | head -1)"
[[ -f "$PKG" ]] || die "makepkg produced no package"

say "installing $PKG"
pacman -U --noconfirm "$PKG"

say "installing configuration"
install -Dm644 "$HERE/99-surface-laptop-7-touchpad.conf" /etc/iptsd.d/99-surface-laptop-7-touchpad.conf
install -Dm644 "$HERE/local-overrides.quirks" /etc/libinput/local-overrides.quirks

say "starting iptsd via udev"
# The unit is StopWhenUnneeded + BindsTo the device, so it must be pulled in by the
# device (udev sets SYSTEMD_WANTS on hidraw2). A bare `systemctl start` stops again
# immediately - that is expected, not a failure.
systemctl stop 'iptsd@dev-hidraw2.service' 2>/dev/null || true
udevadm trigger --action=add --sysname-match=hidraw2
sleep 4
systemctl is-active 'iptsd@dev-hidraw2.service' || die "iptsd did not start"

say "DONE"
cat <<'EOF'

Expected state:
  systemctl is-active iptsd@dev-hidraw2.service      -> active
  grep -i 'IPTSD Virtual Touchpad' /proc/bus/input/devices

Tuning (edit /etc/iptsd.d/99-surface-laptop-7-touchpad.conf, then restart as above):
  LiftGraceMs        80 daily. 70 still let rare ghosts through, 110 was fully clean.
  ButtonDebounceMs   30; raise to ~45 to catch 32-48 ms firmware ghost clicks.
  Activation/Deactivation 24/20 separates two close fingers; lower (20/16) is more
                     flicker-tolerant but merges close fingers.
  Do NOT enable PeakSuppressionRadius >= 2 - it suppresses the real second finger.

Palm rejection lives in /etc/libinput/local-overrides.quirks (AttrPalmSizeThreshold=1400;
fingertips measure ~850-1100, palm/thumb ~1550-1650).
EOF
