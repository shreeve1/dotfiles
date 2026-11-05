#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
python3 -I - "$ROOT" <<'PY'
import json
from pathlib import Path
import sys

root = Path(sys.argv[1])
settings = json.loads((root / ".pi/agent/settings.json.template").read_text())
assert "-extensions/verify-final.ts" in settings["extensions"], "verify-final must stay disabled in the seed template"
assert "-extensions/fabric-auto-start.ts" in settings["extensions"], "Fabric automatic reviewers must stay disabled until re-enabled"
assert (root / ".pi/agent/extensions/fabric-auto-start.ts").is_file(), "retain automatic reviewer source for re-enabling"
assert (root / ".pi/agent/extensions/verify-final.ts").is_file(), "disable the extension without deleting its source"
print("Pi verify-final and automatic Fabric reviewers stay disabled by default; sources retained.")
PY
