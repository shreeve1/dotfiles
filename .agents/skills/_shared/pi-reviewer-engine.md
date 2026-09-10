# Backgrounded `pi --print` Reviewer Engine

External reference — the single source of truth for launching a Pi Coding Agent
reviewer as a detached, polled subprocess. Consumed by `dev-plan` (Phase 9) and
`dev-review-pi` (Phase 3). Both skills reach it via the phrase *backgrounded-`pi
--print` engine*; change the mechanics here, not in each skill.

The engine solves two failure modes that a naive `pi --print` invocation hits:

1. **Vanish-on-background** — a blocking `timeout 600s pi ...` can SIGKILL a
   slow review mid-thought and gives no live observability.
2. **False completion** — the harness reports the *launcher* as `completed` the
   instant it returns, even though `pi` was backgrounded and may have died
   immediately (bad args, missing API key). Polls then spin against an empty
   output file for the full budget.

Historical note: this engine used to pass `--exclude-tools` for a possible
**subagent swallow** mode, but Pi 0.73.1 removed that flag. There is no supported
subagent-only denylist today; callers rely on review-only prompting, sentinels,
and failure handling instead.

The fixes below are load-bearing — do not simplify them away without
reproducing the failure they prevent (see `/tmp/handoff-mf7MKL.md` for the
vanish-on-background mode that motivated this shape).

## What the caller supplies

Before launch, set these in the caller's scope (both skills create their own):

- `$PROMPT_FILE` — temp file holding the review prompt, referenced as `@$PROMPT_FILE`.
- `$OUTPUT_FILE` — temp file pi writes stdout+stderr to.
- `$PID_FILE` — temp file the launcher writes the backgrounded pid to (separate
  Bash calls do not share shell vars, so the pid must persist on disk).
- `$COMPLETION_SENTINEL` — a **nonce** string pi prints on its own final line
  when done (e.g. `PI_REVIEW_DONE_$(date +%s)_$RANDOM`). Use a nonce, never a
  fixed word like `END_OF_FINDINGS` — a fixed word can false-match inside a
  finding's evidence/detail block. The sentinel bounds the findings region so
  preamble/thinking is easy to discard.
- `PI_MODEL_ARGS` — bash array. Empty → pi uses its configured default model;
  else e.g. `( --model "sonnet" )` or `( --model "$PATTERN" --provider "$NAME" )`.
- `$PROJECT_ROOT` — working directory for pi (usually `git rev-parse --show-toplevel`).
- (drift-detection only) `$BASE_STATUS_FILE`, `$SNAP_DIR` — see **Drift
  detection** below. Required for code/build reviews; a plan-file-only audit can
  omit them (the reviewer is review-only by instruction either way).

## Launch (one synchronous Bash call — do NOT also set `run_in_background: true`)

`setsid` puts pi in its own session/process group (PPID becomes 1 immediately
after detach), so SIGHUP on launcher exit and parent-pgid signals can't reach
it. `< /dev/null` removes stdin/tty contention. The shell-level `&` lets the
launcher return in ~1s; subsequent polls run in their own short Bash calls.

```bash
(
  cd "$PROJECT_ROOT"
  setsid pi --print \
    "${PI_MODEL_ARGS[@]}" \
    --append-system-prompt "You are an independent reviewer. Review only; do not modify files. Do all analysis yourself and emit every finding inline in your own final response, following the requested finding format exactly." \
    "@$PROMPT_FILE" \
    > "$OUTPUT_FILE" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"
)

# Sanity check: if pi died within 1s and produced no output, the launch failed
# (bad args, missing API key, etc.). Without this, downstream polls spin against
# an empty output file for the full budget while the harness reports the
# launcher as "completed".
sleep 1
PID=$(cat "$PID_FILE")
if ! kill -0 "$PID" 2>/dev/null && [ ! -s "$OUTPUT_FILE" ]; then
  echo "pi launch failed: process exited within 1s and produced no output" >&2
  cat "$OUTPUT_FILE" >&2 2>/dev/null
  exit 1
fi
echo "pi launched pid=$PID"
```

**Do NOT pass `run_in_background: true` on this Bash call.** The shell-level
`setsid ... &` is the backgrounding mechanism; combining the two with the old
`... &; disown` pattern caused the harness to report `completed` while pi
vanished — see `/tmp/handoff-mf7MKL.md`.

### Why these exact flags

- No tool-denylist flag is passed. `--exclude-tools` was removed from Pi by
  0.73.1, and `--tools` is an allowlist, not a denylist substitute. Keep normal
  Pi tools/extensions here; callers that need a narrower plan-file audit can add
  supported flags to `PI_MODEL_ARGS` explicitly.
- `--append-system-prompt "..."` — review-only framing by **instruction, not by
  permission**. Pi keeps normal capabilities; the caller verifies read-only
  behavior separately (drift detection) rather than trusting the prompt.
- `@$PROMPT_FILE` — prompt as a file arg so the prompt body can be large without
  shell-quoting pain.

## Poll for completion (each poll its own short Bash call)

Do not block in one call — a single blocking call can't show progress and dies
on a hard `timeout`. Each poll is its own invocation so the review stays
observable.

```bash
PID=$(cat "$PID_FILE")
if grep -q "$COMPLETION_SENTINEL" "$OUTPUT_FILE" 2>/dev/null; then
  echo "done"        # sentinel present → findings region complete
elif kill -0 "$PID" 2>/dev/null; then
  echo "running"     # poll again after a short wait
else
  echo "exited"      # process gone; read $OUTPUT_FILE, check for the sentinel
fi
```

**Soft cap (default 600s wall-clock across polls):** marks elapsed time only —
keep polling (autonomous skills do not prompt the user mid-review). It must
**never SIGKILL** the review.

## Completion and output

Treat the run as complete when `$COMPLETION_SENTINEL` appears in `$OUTPUT_FILE`,
or when the PID has exited (sentinel absent → output was truncated → treat as a
reviewer failure). The sentinel bounds the findings region: everything before it
is the review; discard preamble/thinking after it. The caller parses findings
with its own severity schema (the caller's prompt dictates the finding format —
this engine is format-agnostic).

## Drift detection (code/build reviews only)

Review-only is enforced by instruction, not permission, so verify it. A
plan-file-only audit can skip this; any review where pi could touch the working
tree must do it.

Before launch, snapshot the pre-review tree:
```bash
git -C "$PROJECT_ROOT" status --short > "$BASE_STATUS_FILE" 2>/dev/null || true
SNAP_DIR=$(mktemp -d /tmp/pi-review-snap-XXXXXX)
git -C "$PROJECT_ROOT" status --short | cut -c4- | while read -r p; do
  [ -f "$PROJECT_ROOT/$p" ] || continue
  mkdir -p "$SNAP_DIR/$(dirname "$p")"
  cp "$PROJECT_ROOT/$p" "$SNAP_DIR/$p"
done
```

After completion, compare and restore any newly-drifted path from the snapshot
so findings are applied on a clean tree:
```bash
git -C "$PROJECT_ROOT" status --short > "$AFTER_STATUS_FILE" 2>/dev/null || true
if ! cmp -s "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE"; then
  diff -u "$BASE_STATUS_FILE" "$AFTER_STATUS_FILE" || true
  # DRIFT = unauthorized reviewer edits. Restore every path present in AFTER
  # but not BASE from $SNAP_DIR. Caveat: paths with spaces or mid-review
  # renames need manual restoration.
fi
```

## Cleanup

Pi runs backgrounded across separate Bash calls, so there is no EXIT trap. The
caller removes its temp files explicitly **only after findings are parsed and
the read-only check is done** (cleaning earlier would delete `$PROMPT_FILE` /
`$OUTPUT_FILE` mid-run).

## Reviewer failure modes (caller handles)

- **`pi` not on PATH** (`which pi` empty) → caller reports; for `dev-plan` this
  is `reviewer_unavailable`, plan is kept as-is; for `dev-review-pi` the user is
  asked to check their Pi install.
- **pi exits non-zero** → show `$OUTPUT_FILE`; offer retry / fallback per caller.
- **No sentinel / empty output / poll budget exhausted** → reviewer failure; the
  plan-file or review proceeds without findings (caller-specific policy).
