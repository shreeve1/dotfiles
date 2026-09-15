#!/usr/bin/env bash
# Install the real-Chrome Browser Control bridge into an existing dsh web profile.
# Chrome still requires one manual Load unpacked approval per machine.

set -euo pipefail

VERSION="1.0.7"
EXTENSION_SHA256="1836b20ea9b5d85291606fde2b3a809d87f88c60edd27922cc9c92e243694ad7"
PROFILE="${DSH_PROFILE:-web}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
EXTENSION_DIR="$DSH_HOME/browser-control-extension"
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ENGLISH_PATCH="$SCRIPT_DIR/../bin/dsh-browser-control-english"
DRY_RUN=0
REMOVE_PILOT=0

case "${1:-}" in
  "") ;;
  --dry-run) DRY_RUN=1 ;;
  --remove-pilot) REMOVE_PILOT=1 ;;
  *) echo "usage: $0 [--dry-run|--remove-pilot]" >&2; exit 2 ;;
esac
[ "$#" -le 1 ] || { echo "usage: $0 [--dry-run|--remove-pilot]" >&2; exit 2; }

command -v dsh >/dev/null 2>&1 || { echo "dsh is not installed" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 is required" >&2; exit 1; }
[ -f "$PROFILE_DIR/package.json" ] || { echo "missing dsh profile: $PROFILE_DIR" >&2; exit 1; }
[ -x "$ENGLISH_PATCH" ] || { echo "missing English patch helper: $ENGLISH_PATCH" >&2; exit 1; }

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Would install @caob23/dsh-browser-control@$VERSION into profile $PROFILE"
  echo "Would download the extension to $EXTENSION_DIR"
  echo "Would enable browser-bridge on 127.0.0.1:9777"
  echo "Chrome manual step: load unpacked $EXTENSION_DIR"
  exit 0
fi

if [ "$REMOVE_PILOT" -eq 1 ]; then
  STATUS=$(curl -fsS http://127.0.0.1:9777/api/status) || {
    echo "Browser Control bridge is not reachable; keeping dsh-pilot" >&2
    exit 1
  }
  printf '%s' "$STATUS" | grep -q '"extensionConnected":true' || {
    echo "Browser Control extension is not connected; keeping dsh-pilot" >&2
    exit 1
  }
  if node -e "const p=require(process.argv[1]); process.exit(p.dependencies?.['dsh-pilot'] ? 0 : 1)" "$PROFILE_DIR/package.json"; then
    echo "Browser Control is connected; removing dsh-pilot"
    dsh plugin --profile "$PROFILE" remove dsh-pilot
  else
    echo "Browser Control is connected; dsh-pilot is already absent"
  fi
  echo "Restart dsh-web.service, then confirm extensionConnected remains true."
  exit 0
fi

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
cp "$PROFILE_DIR/package.json" "$PROFILE_DIR/package.json.bak.browser-control-$STAMP"
cp "$PROFILE_DIR/cordis.patch.yml" "$PROFILE_DIR/cordis.patch.yml.bak.browser-control-$STAMP"

echo "[1/4] Installing @caob23/dsh-browser-control@$VERSION"
dsh plugin --profile "$PROFILE" add "@caob23/dsh-browser-control@$VERSION"

echo "[2/4] Downloading the Chrome extension"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
ZIP="$TMP_DIR/browser-control.zip"
URL="https://github.com/caob23/dsh-browser-control/releases/download/v$VERSION/DSH-Browser-Control-v$VERSION.zip"
python3 - "$URL" "$ZIP" <<'PY'
import sys, urllib.request
urllib.request.urlretrieve(sys.argv[1], sys.argv[2])
PY
printf '%s  %s\n' "$EXTENSION_SHA256" "$ZIP" | sha256sum -c -
rm -rf "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR"
python3 - "$ZIP" "$EXTENSION_DIR" <<'PY'
import sys
from pathlib import Path
from zipfile import ZipFile
archive, destination = Path(sys.argv[1]), Path(sys.argv[2])
with ZipFile(archive) as source:
    for item in source.infolist():
        name = item.filename.replace('\\', '/')
        if not name or name.endswith('/'):
            continue
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read(item))
PY

echo "[3/4] Enabling the local bridge and applying English UI"
python3 - "$PROFILE_DIR/cordis.patch.yml" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
text = path.read_text()
marker = "\n- id: browser-bridge\n"
block = """

# Real Chrome bridge. Load the companion unpacked extension from
# ~/.dsh/browser-control-extension in the dedicated browser profile.
- id: browser-bridge
  config:
    enabled: true
    port: 9777
    token: dsh-local
"""
if marker not in text:
    path.write_text(text.rstrip() + block + "\n")
PY
"$ENGLISH_PATCH"

echo "[4/4] Verifying files"
node --check "$EXTENSION_DIR/popup.js"
node --check "$EXTENSION_DIR/background.js"
node --check "$PROFILE_DIR/node_modules/@caob23/dsh-browser-control/lib/index.js"

cat <<EOF
Browser Control is installed.

Restart dsh-web.service, then in the intended Chrome profile:
  1. Open chrome://extensions
  2. Enable Developer mode
  3. Click Load unpacked
  4. Select $EXTENSION_DIR

Verify after restart:
  curl -fsS http://127.0.0.1:9777/api/status
EOF
