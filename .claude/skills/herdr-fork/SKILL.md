---
name: herdr-fork
description: "Fork the current Pi conversation into a new parked snapshot tab in the same herdr workspace, then return control here so you keep steering the original in a different direction. The new tab boots idle at the exact forked history (a backup branch you can pick up later); focus never leaves the current tab. Invoke by name; not auto-triggered. Pi + herdr only."
disable-model-invocation: true
---

# herdr-fork — park a conversation branch, keep going here

Snapshot the current conversation into a **new herdr tab** running
`pi --fork` of this session, then leave focus **here** so you continue the
original thread in a new direction. The forked tab is a frozen backup branch:
it opens idle at the exact history-so-far and waits — you may never touch it,
or switch to it later to explore the road not taken.

This is fork-and-park, nothing more. It takes no arguments, seeds no message,
and never moves focus off the current tab.

## Model

- **Current tab (this one)** — stays focused. "Resume the original" means:
  control returns here, keep typing.
- **New tab** — a `--no-focus` parked snapshot of the conversation up to the
  moment you invoke this skill. Boots idle at the forked state.

Pi flushes the session file incrementally, so the raw file captures every turn
**through the invoking message** (already on disk when the command below runs).
That invoking turn ("fork this conversation") is noise in the parked branch, so
the skill forks a **trimmed copy** that drops the last user record and
everything after it. The parked branch then opens at the turn *before* the
invocation — no `/tree` rewind needed to diverge cleanly.

## Prerequisites (hard preflight — stop on first failure)

Fail fast with a clear message naming the failed check. Do **not** guess,
discover a session, or fall back to another harness.

- `HERDR_ENV` == `1` (running inside a herdr session).
- `PI_SESSION_FILE` non-empty AND the file exists (this is the Pi session to
  fork).
- `HERDR_WORKSPACE_ID` non-empty (target workspace for the new tab).

Pi-only by design: the fork verb is `pi --fork`. Supporting Claude Code (a
different session/resume mechanism) is a **future** extension — see the
harness seam below. If preflight fails because those vars are absent, that is
expected outside Pi-in-herdr.

## What to do

Run the preflight, then the fork. All values come from the environment; the
skill takes no arguments.

```bash
# --- preflight ---
[[ "$HERDR_ENV" == 1 ]] || { echo "herdr-fork: not inside a herdr session (HERDR_ENV != 1)"; exit 1; }
[[ -n "$PI_SESSION_FILE" && -f "$PI_SESSION_FILE" ]] || { echo "herdr-fork: PI_SESSION_FILE unset or missing ('$PI_SESSION_FILE')"; exit 1; }
[[ -n "$HERDR_WORKSPACE_ID" ]] || { echo "herdr-fork: HERDR_WORKSPACE_ID unset"; exit 1; }

# --- create the parked snapshot tab in the same workspace ---
# Create the tab first (never bare `agent start --workspace`, which would
# hijack the currently-focused tab). The tab ships with ONE auto-created root
# pane; launch pi --fork INTO that root pane via `pane run` so we don't orphan
# it. (`herdr agent start --tab <id>` would add a SECOND pane and leave the
# root pane as a dead idle shell.) pi launched via `pane run` is still
# auto-detected as a real pi agent.
src_id=$(basename "$PI_SESSION_FILE" | grep -oE '[0-9a-f]{8}' | head -1)
tab_json=$(herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$(pwd)" --no-focus)
tab_id=$(printf '%s' "$tab_json" | jq -r '.result.tab.tab_id // empty')
root_pane=$(printf '%s' "$tab_json" | jq -r '.result.root_pane.pane_id // empty')
[[ -n "$tab_id" && -n "$root_pane" ]] || { echo "herdr-fork: could not parse tab/root pane from: $tab_json"; exit 1; }
herdr tab rename "$tab_id" "fork: ${src_id:-session}" >/dev/null 2>&1 || true

# --- trim the invoking turn so the parked branch diverges cleanly ---
# The last user record is this skill's own invocation. Fork a copy that keeps
# everything BEFORE it (records 1..last_user-1) so the new tab opens at the
# prior turn, not one step past it. jq finds the boundary by parsing each
# record's message.role (immune to user text that merely contains
# '"role":"user"'); a grep would false-match on that.
last_user=$(jq -r 'select(.message.role=="user") | input_line_number' "$PI_SESSION_FILE" | tail -1)
[[ -n "$last_user" && "$last_user" -gt 1 ]] || { echo "herdr-fork: could not locate invoking turn in $PI_SESSION_FILE"; exit 1; }
fork_src=$(mktemp --suffix=.jsonl)
head -n "$((last_user - 1))" "$PI_SESSION_FILE" > "$fork_src"

# --- launch pi --fork of the trimmed copy in the tab's root pane (idle, no seed) ---
# pi --fork reads the file at startup; keep $fork_src until the pane has booted,
# then remove it (the fork created its own independent session file).
herdr pane run "$root_pane" "pi --fork '$fork_src'; rm -f '$fork_src'" >/dev/null 2>&1 \
  || { echo "herdr-fork: pane run failed for pane $root_pane"; rm -f "$fork_src"; exit 1; }

echo "herdr-fork: parked snapshot in tab $tab_id (label 'fork: ${src_id:-session}'), root pane $root_pane."
echo "herdr-fork: focus stays here — this is still the original conversation. Keep going."
```

The `pi --fork` continuation is a **real interactive session**: no
`--no-skills` / `--no-extensions`, so the parked branch has the same
environment you had. It is not a headless review process. Launching it in the
tab's root pane (not a fresh split) means the tab has exactly one pane and no
dead shell.

## Harness seam (future Claude Code support)

Keep the fork mechanism behind a single decision point so a second harness can
slot in without rewriting the flow:

1. **Detect harness** → today: assert Pi (`PI_SESSION_FILE` present). Later:
   branch on Claude Code (its own session file + resume verb).
2. **Pick fork strategy** → today: trim the invoking turn, then
   `pi --fork '<trimmed copy>'` run in the new tab's root pane. Later: the
   Claude equivalent (its own resume verb + trim rule), still launched via
   `herdr pane run` into the same root pane.

Everything else (tab create in the workspace, `--no-focus`, rename, report)
is harness-agnostic and stays as-is.

## Notes

- **No idempotency** — each invocation intentionally makes a new snapshot tab.
- **Focus** — every herdr call uses `--no-focus`; you never leave the current
  tab.
- **Output** — on success, prints the new tab id + label and confirms you're
  still in the original. On preflight/parse failure, prints exactly which
  check failed.
- **One pane, no wart** — `pi --fork` runs in the tab's auto-created root pane
  via `herdr pane run`. Do NOT use `herdr agent start --tab <id>`: it adds a
  second pane and orphans the root pane as a dead idle shell.
- **Diverge point** — the parked branch opens at the turn *before* the
  invocation because the skill forks a trimmed copy (drops the last user
  record). Without the trim you'd land one turn past the fork and have to
  `/tree` back by hand. `forkFrom` has no "fork up to entry N" option, so
  trimming a temp copy is the mechanism.
