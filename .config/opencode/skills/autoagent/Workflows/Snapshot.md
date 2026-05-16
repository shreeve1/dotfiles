# Workflow: Snapshot

Capture and restore SUT state for live systems. Used by `RunLoop` automatically; also invokable standalone.

When SUT is live (`sut.live: true`), `git revert` is not enough — the mutation may have already been pushed to a Temporal namespace, a cron table, a SaaS API. Snapshots let the loop discard those changes safely.

---

## mutation_id

One canonical formula, shared between this workflow and `RunLoop.md`:

```bash
mutation_id="$(date +%s)-$(git rev-parse --short HEAD)"
```

Used as the snapshot filename and as the value of the `mutation_id` column in `results.tsv`.

---

## Required tools

- `mikefarah/yq` v4+ (`yq --version` reports `v4.*`). Python `yq` is NOT compatible — its output is JSON-quoted and breaks the patterns below.
- The CLI tools required by the adapter's `capture_cmd` and `restore_cmd` (e.g. `temporal`, `jq`, `crontab`, etc.).

The driver verifies these in `RunLoop.md` preconditions.

---

## Capture

Never use `bash -c "$(yq ...)"`. Write to a temp file and execute it explicitly:

```bash
mkdir -p snapshots .autoagent
yq -r '.snapshot.capture_cmd' adapter.yaml > .autoagent/_capture.sh
bash .autoagent/_capture.sh > "snapshots/$mutation_id.snap"

# Validate the snapshot is non-empty and parseable BEFORE proceeding.
if [ ! -s "snapshots/$mutation_id.snap" ]; then
  echo "FATAL: snapshot capture produced an empty file" >&2
  exit 1
fi
```

A blank or unparseable snapshot at mutation time means rollback will be impossible later — ABORT the mutation, don't proceed.

---

## Restore

```bash
yq -r '.snapshot.restore_cmd' adapter.yaml > .autoagent/_restore.sh
bash .autoagent/_restore.sh < "snapshots/$mutation_id.snap"
```

After restore, verify the world is back:

1. Re-capture into a fresh tempfile.
2. `diff` the new capture against the original snapshot.
3. Run one known-passing probe — it should still pass.

If the diff is non-empty OR the post-restore probe fails, surface to the human IMMEDIATELY. The system is in an unknown state and the loop must not continue.

---

## Per-system snapshot patterns (reference)

### Temporal schedules

```bash
# capture
for sid in $(temporal schedule list -o json | jq -r '.[].scheduleId'); do
  echo "=== SCHEDULE: $sid ==="
  temporal schedule describe -s "$sid" -o yaml
done

# restore (parses the archive, recreates or updates each schedule)
tmpdir=$(mktemp -d) && trap 'rm -rf "$tmpdir"' EXIT
current=""
while IFS= read -r line; do
  if [[ "$line" =~ ^===\ SCHEDULE:\ (.+)\ ===$ ]]; then
    current="${BASH_REMATCH[1]}"; : > "$tmpdir/$current.yaml"
  elif [ -n "$current" ]; then printf '%s\n' "$line" >> "$tmpdir/$current.yaml"; fi
done
for spec in "$tmpdir"/*.yaml; do
  sid=$(basename "$spec" .yaml)
  if temporal schedule list -o json | jq -e --arg s "$sid" '.[] | select(.scheduleId == $s)' >/dev/null; then
    temporal schedule update -s "$sid" -f - < "$spec"
  else
    temporal schedule create -s "$sid" -f - < "$spec"
  fi
done
```

(This pattern is built into `Adapters/temporal.yaml` — listed here for reference when authoring new adapters.)

### Cron tables

```bash
# capture
crontab -l > "$snap"
# restore
crontab "$snap"
```

### Config files (already in git)

```bash
# capture: no-op, git holds state
# restore: git checkout -- <path>
```

### Database state (small tables)

```bash
# capture
pg_dump -t critical_config "$DB" > "$snap"
# restore
psql "$DB" < "$snap"
```

---

## Retention

Keep snapshots for at least the last 50 mutations **AND** at least 7 days, whichever covers more files. They're cheap to keep; restoring from a missing one isn't.

```bash
# Run from a cron / housekeeping task, NOT from the loop driver.
# Deletes only snapshots that are BOTH older than 7 days AND not among the
# newest 50. Safe with spaces in paths.
set -euo pipefail
cd snapshots
# Names of the 50 newest .snap files, regardless of age.
keep_newest=$(ls -1t -- *.snap 2>/dev/null | head -n 50 || true)
# Files older than 7 days.
while IFS= read -r -d '' old; do
  base=$(basename -- "$old")
  if ! printf '%s\n' "$keep_newest" | grep -Fxq -- "$base"; then
    rm -f -- "$old"
  fi
done < <(find . -maxdepth 1 -name '*.snap' -mtime +7 -print0)
```
