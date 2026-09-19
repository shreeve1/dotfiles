#!/usr/bin/env bash
# Install a per-user UCM overlay for the Surface Laptop 7's sparse RT1320
# numbering. ACPI's ghost RT1320 is instance 1; the attached codec is instance
# 2, while upstream UCM assumes a one-codec system always uses instance 1.
set -euo pipefail

HERE=$(cd -- "$(dirname -- "$0")" && pwd)
PATCH="$HERE/0002-ucm-rt1320-use-attached-instance.patch"
SYSTEM_UCM=/usr/share/alsa/ucm2
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/sl7-ucm2"
DROPIN="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/wireplumber.service.d/sl7-ucm.conf"

[[ $EUID -ne 0 ]] || { printf 'Run this script as the desktop user, not root.\n' >&2; exit 1; }
[[ -d $SYSTEM_UCM ]] || { printf 'Missing %s\n' "$SYSTEM_UCM" >&2; exit 1; }
[[ -f $PATCH ]] || { printf 'Missing %s\n' "$PATCH" >&2; exit 1; }

rm -rf -- "$DEST"
mkdir -p "$DEST"
# Symlink the distribution UCM tree so package updates are inherited. Replace
# only the two RT1320 files affected by the Surface's sparse instance numbering.
cp -as "$SYSTEM_UCM/." "$DEST/"
for relative in sof-soundwire/rt1320.conf codecs/rt1320/init.conf; do
  rm -- "$DEST/$relative"
  cp -- "$SYSTEM_UCM/$relative" "$DEST/$relative"
done
patch -d "$DEST" -p1 --fuzz=0 < "$PATCH"

mkdir -p "$(dirname -- "$DROPIN")"
printf '[Service]\nEnvironment=ALSA_CONFIG_UCM2=%s\n' "$DEST" > "$DROPIN"
systemctl --user daemon-reload

# Validate immediately when the card exists. Immediately after a kernel update,
# the stock driver may have failed to register the card; in that case the
# overlay is still installed and WirePlumber will consume it after rebooting
# into the newly installed module.
if grep -q 'sofsoundwire' /proc/asound/cards 2>/dev/null; then
  ALSA_CONFIG_UCM2="$DEST" alsaucm -c '<<<SplitPCM=1>>>hw:0' set _verb HiFi
  systemctl --user restart wireplumber.service
  # systemctl considers the service started before WirePlumber has finished
  # creating ALSA nodes and running the UCM enable sequence. Wait for both the
  # PipeWire source and hardware capture switch before returning success.
  ready=false
  for _ in {1..20}; do
    if pactl get-default-source 2>/dev/null | grep -q 'HiFi__Mic__source' &&
       amixer -D hw:0 cget "name='rt1320-2 FU Capture Switch'" 2>/dev/null |
         grep -q 'values=on,on,on,on'; then
      ready=true
      break
    fi
    sleep 0.5
  done
  [[ $ready == true ]] || {
    printf 'WirePlumber did not expose and enable the internal microphone.\n' >&2
    exit 1
  }
  printf 'Validated the HiFi verb and PipeWire microphone against the live sof-soundwire card.\n'
else
  printf 'sof-soundwire is not registered; deferring live UCM validation until reboot.\n'
fi

printf 'Installed Surface UCM overlay at %s\n' "$DEST"
printf 'Installed WirePlumber drop-in at %s\n' "$DROPIN"
