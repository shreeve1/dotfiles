#!/usr/bin/env bash
# Serialized read-merge-write for a board's budget.json.
#
# A tick must never write budget.json directly. Its STEP 0 read is minutes old
# by the time it writes, and rewriting that stale object silently deletes keys
# added meanwhile -- measured 2026-09-04, when a tick erased a human's
# `parked: true` and the next tick promoted a card the human had stopped.
#
# Merging alone is not enough: re-read then write is still TOCTOU (a park
# landing in the gap is lost -- reproduced 5/5). So the whole transaction runs
# under flock, and the file is replaced atomically via rename.
#
# Usage:
#   budget-update.sh <budget.json> tick            # ticksUsed += 1 (+ window rollover)
#   budget-update.sh <budget.json> team <card-id>  # teamsByCard[card] += 1
#   budget-update.sh <budget.json> park <reason>   # set parked=true (ceilings only)
#
# Exit 0 on success. Exit 3 means the board is parked and the caller must stop.
# `parked`/`parkedReason` are never cleared here; only a human clears them.
set -euo pipefail

file="${1:?usage: budget-update.sh <budget.json> <tick|team|park> [arg]}"
op="${2:?missing op}"
arg="${3:-}"

[ -f "$file" ] || { echo "budget file missing: $file" >&2; exit 2; }

exec 9>"$file.lock"
flock 9

python3 - "$file" "$op" "$arg" <<'PY'
import json, os, sys, datetime

path, op, arg = sys.argv[1], sys.argv[2], sys.argv[3]

with open(path) as fh:
    d = json.load(fh)          # read INSIDE the lock -- this is the only read that counts

if d.get("parked"):            # a parked board stops every op, including its own ceilings
    print("board parked: %s" % d.get("parkedReason", ""))
    sys.exit(3)

if op == "tick":
    today = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d")
    if d.get("windowDate") != today:
        d["windowDate"] = today
        d["ticksUsed"] = 0
    d["ticksUsed"] = d.get("ticksUsed", 0) + 1
elif op == "team":
    if not arg:
        sys.exit("team op needs a card id")
    d.setdefault("teamsByCard", {})
    d["teamsByCard"][arg] = d["teamsByCard"].get(arg, 0) + 1
elif op == "park":
    d["parked"] = True
    d["parkedReason"] = arg or "parked by a tick ceiling"
else:
    sys.exit("unknown op: %s" % op)

tmp = path + ".tmp"
with open(tmp, "w") as fh:
    json.dump(d, fh, indent=2)
    fh.flush()
    os.fsync(fh.fileno())
os.replace(tmp, path)          # atomic: a crash leaves the old file, never a partial one
print(json.dumps({k: d[k] for k in ("ticksUsed", "windowDate") if k in d}))
PY
