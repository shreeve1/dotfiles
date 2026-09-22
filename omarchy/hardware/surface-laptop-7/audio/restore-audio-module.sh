#!/usr/bin/env bash
# Restore the Surface Laptop 7 SoundWire fix after a linux-omarchy update.
#
# This script reconstructs the exact sound/soc/sdw_utils source used by the
# installed linux-omarchy package. It finds the matching omarchy-pkgs commit by
# package version and package build timestamp, applies that recipe's sound
# backports, applies the Surface ghost-device patch, builds, and installs the
# module into /lib/modules/<running-kernel>/updates/.
#
# Run this only after rebooting into the newly installed kernel:
#   sudo ./restore-audio-module.sh
#
# Rollback:
#   sudo rm /lib/modules/$(uname -r)/updates/snd-soc-sdw-utils.ko
#   sudo depmod -a
#   reboot
set -euo pipefail

say() { printf '==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root: sudo bash $0"

HERE=$(cd -- "$(dirname -- "$0")" && pwd)
PATCH="$HERE/0001-sdw-utils-skip-unattached-sdca-endpoints.patch"
KREL=$(uname -r)
KVER=${KREL%%-*}
PKGVER=$(pacman -Q linux-omarchy 2>/dev/null | awk '{print $2}')
HEADER_PKGVER=$(pacman -Q linux-omarchy-headers 2>/dev/null | awk '{print $2}')
EXPECTED_KREL="${PKGVER}-omarchy"
BUILD="/tmp/sl7-audio-$KREL"
UPDATES="/lib/modules/$KREL/updates"
PKG_DESC="/var/lib/pacman/local/linux-omarchy-$PKGVER/desc"
OMARCHY_REPO=https://github.com/omacom/omarchy-pkgs
OMARCHY_RAW=https://raw.githubusercontent.com/omacom/omarchy-pkgs
STABLE_RAW="https://raw.githubusercontent.com/gregkh/linux/v$KVER"

[[ $KREL == "$EXPECTED_KREL" ]] ||
  die "running $KREL but installed linux-omarchy is $PKGVER; reboot into $EXPECTED_KREL first"
[[ $HEADER_PKGVER == "$PKGVER" ]] ||
  die "linux-omarchy-headers is $HEADER_PKGVER but kernel package is $PKGVER"
[[ -d /lib/modules/$KREL/build ]] || die "matching linux-omarchy-headers are not installed"
[[ -f $PATCH ]] || die "missing patch: $PATCH"
[[ -f $PKG_DESC ]] || die "missing package metadata: $PKG_DESC"
for command in curl jq git patch make modinfo; do
  command -v "$command" >/dev/null || die "$command is required"
done

# Package releases have occasionally retained the same pkgrel across recipe
# commits. Select the newest matching recipe commit that predates the package's
# own build timestamp, rather than merely selecting the newest matching pkgrel.
BUILD_DATE=$(awk '/^%BUILDDATE%$/{getline; print; exit}' "$PKG_DESC")
[[ $BUILD_DATE =~ ^[0-9]+$ ]] || die "could not read package build timestamp"

say "locating the exact omarchy-pkgs recipe for linux-omarchy $PKGVER"
rm -rf -- "$BUILD"
mkdir -p "$BUILD/sound/soc/sdw_utils" "$BUILD/sound/soc/codecs" "$BUILD/recipe"

OMARCHY_COMMIT=
for page in 1 2 3; do
  commits_json="$BUILD/commits-$page.json"
  curl -4 -fsSL --retry 3 --max-time 60 \
    "https://api.github.com/repos/omacom/omarchy-pkgs/commits?path=pkgbuilds/linux-omarchy/PKGBUILD&per_page=100&page=$page" \
    -o "$commits_json" || die "could not query omarchy-pkgs history"
  [[ $(jq 'length' "$commits_json") -gt 0 ]] || break

  while IFS=$'\t' read -r sha commit_date; do
    (( commit_date <= BUILD_DATE )) || continue
    candidate="$BUILD/recipe/PKGBUILD.$sha"
    curl -4 -fsSL --retry 3 --max-time 60 \
      "$OMARCHY_RAW/$sha/pkgbuilds/linux-omarchy/PKGBUILD" -o "$candidate" || continue
    candidate_ver=$(awk -F= '/^pkgver=/{print $2; exit}' "$candidate")
    candidate_rel=$(awk -F= '/^pkgrel=/{print $2; exit}' "$candidate")
    if [[ "$candidate_ver-$candidate_rel" == "$PKGVER" ]]; then
      OMARCHY_COMMIT=$sha
      cp "$candidate" "$BUILD/PKGBUILD"
      break 2
    fi
  done < <(jq -r '.[] | [.sha, (.commit.committer.date | fromdateiso8601)] | @tsv' "$commits_json")
done

[[ -n $OMARCHY_COMMIT ]] ||
  die "could not find the $PKGVER source recipe built before epoch $BUILD_DATE in omarchy-pkgs history"
say "using omarchy-pkgs commit $OMARCHY_COMMIT"

say "fetching stable v$KVER SoundWire utility sources"
curl -4 -fsSL --retry 3 --max-time 60 \
  "https://api.github.com/repos/gregkh/linux/contents/sound/soc/sdw_utils?ref=v$KVER" \
  -o "$BUILD/files.json" || die "stable tag v$KVER is unavailable"

jq -r '.[] | select(.type == "file") | [.download_url, .name] | @tsv' "$BUILD/files.json" |
while IFS=$'\t' read -r url name; do
  curl -4 -fsSL --retry 3 --max-time 60 "$url" -o "$BUILD/sound/soc/sdw_utils/$name"
done

cd "$BUILD"
git init -q
git add sound
 git -c user.name=sl7-build -c user.email=sl7-build@localhost commit -qm stable-base

# Apply all 05xx audio/media patches from the exact package recipe that touch
# sdw_utils. This tracks Omarchy's backports without hard-coding patch names.
mapfile -t RECIPE_PATCHES < <(
  grep -oE '[0-9]{4}-[^[:space:]{}]+\.patch' "$BUILD/PKGBUILD" |
    grep -E '^05[0-9]{2}-' | awk '!seen[$0]++'
)
for name in "${RECIPE_PATCHES[@]}"; do
  file="$BUILD/recipe/$name"
  curl -4 -fsSL --retry 3 --max-time 60 \
    "$OMARCHY_RAW/$OMARCHY_COMMIT/pkgbuilds/linux-omarchy/$name" -o "$file" ||
    die "could not fetch recipe patch $name"
  if git apply --numstat "$file" | grep -q 'sound/soc/sdw_utils/'; then
    say "applying Omarchy source changes from $name"
    git apply --include='sound/soc/sdw_utils/**' "$file"
  fi
done

# Fetch codec headers referenced by sdw_utils after Omarchy's backports.
mapfile -t CODEC_HEADERS < <(
  grep -rhoE '#include "\.\./codecs/[^\"]+"' sound/soc/sdw_utils |
    cut -d'"' -f2 | awk '!seen[$0]++'
)
for relative in "${CODEC_HEADERS[@]}"; do
  name=${relative##*/}
  curl -4 -fsSL --retry 3 --max-time 60 \
    "$STABLE_RAW/sound/soc/codecs/$name" -o "$BUILD/sound/soc/codecs/$name" ||
    die "could not fetch referenced codec header $name"
done

if git apply --check "$PATCH"; then
  git apply "$PATCH"
elif git apply --reverse --check "$PATCH"; then
  say "the Surface patch is already present in the packaged source"
  rm -f "$UPDATES/snd-soc-sdw-utils.ko"
  depmod -a "$KREL"
  say "removed the obsolete override; reboot and verify upstream behavior"
  exit 0
else
  die "Surface audio patch no longer applies to $PKGVER; source changed and needs review"
fi

say "building snd-soc-sdw-utils for $KREL"
make -C "/lib/modules/$KREL/build" M="$BUILD/sound/soc/sdw_utils" clean >/dev/null
make -C "/lib/modules/$KREL/build" M="$BUILD/sound/soc/sdw_utils" modules -j"$(nproc)"
KO="$BUILD/sound/soc/sdw_utils/snd-soc-sdw-utils.ko"
[[ -f $KO ]] || die "module build did not produce $KO"
modinfo -F vermagic "$KO" | grep -Fq "$KREL" || die "built module vermagic does not match $KREL"

say "installing $UPDATES/snd-soc-sdw-utils.ko"
install -Dm0644 "$KO" "$UPDATES/snd-soc-sdw-utils.ko"
depmod -a "$KREL"
[[ $(modinfo -F filename snd_soc_sdw_utils) == "$UPDATES/snd-soc-sdw-utils.ko" ]] ||
  die "depmod did not prefer the updates/ module"

say "installed successfully; reboot before runtime verification"
printf '%s\n' \
  "After reboot, verify:" \
  "  cat /proc/asound/cards" \
  "  pactl get-default-source" \
  "  journalctl -b -k | grep -E 'sof_sdw|SoundWire|SmartMic'"
