#!/usr/bin/env bash
# Install the boot-time recovery for the Surface Laptop 7 Intel Bluetooth adapter.
set -euo pipefail

HERE=$(cd -- "$(dirname -- "$0")" && pwd)

if [[ $EUID -ne 0 ]]; then
  printf 'Run with sudo: sudo %s\n' "$0" >&2
  exit 1
fi

install -o root -g root -m 0755 \
  "$HERE/bluetooth-recover" /usr/local/sbin/bluetooth-recover
install -o root -g root -m 0644 \
  "$HERE/bluetooth-recover.service" /etc/systemd/system/bluetooth-recover.service

systemctl daemon-reload
systemctl enable --now bluetooth-recover.service

printf '\nBluetooth recovery installed and enabled. Current controller:\n'
bluetoothctl list || true
printf '\nBoot log command: journalctl -u bluetooth-recover.service -b\n'
