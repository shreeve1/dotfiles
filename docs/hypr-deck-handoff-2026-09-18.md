# Hyprland Deck Mode handoff — 2026-09-18

## Purpose

This document is a fresh-session handoff for investigating the unresolved Hyprland Deck Mode geometry bug. Do not assume the current implementation is correct merely because its scripted checks pass: the user has repeatedly reproduced real visual failures after those checks.

## Checkpoint update — 2026-09-18 (working much better)

This update supersedes the status assumptions below where they conflict. The
user reported a substantial improvement after the changes described here, but
manual normal-use confirmation remains the authority for any claim of a full
fix.

### Root cause established: native swap fought saved Deck ownership

The core reproducible failure was not only a compositor geometry race. Omarchy's
native `Super + Shift + Arrow` handler swapped **live floating geometry** while
Deck retained the old saved left/right ownership. The next `Super + Arrow`
focus promotion correctly reapplied the stale Deck state, which looked like the
swap immediately reversing on every workspace.

The bindings now replace those native swaps with `hypr-deck swap
left/right/up/down`. A Deck-aware swap exchanges the selected addresses in the
persisted split tree, rebuilds their saved background slots, and reapplies the
still-focused client once in its new slot. A live workspace-2 reproduction
passed: swap left, then focus right; the saved tree stayed swapped and the
right peer promoted without restoring the old ownership.

### State v3: reversible workspace split trees

State version `3` adds `layouts[workspace]`, a binary split tree whose leaves
are managed window addresses and whose branches hold a horizontal (`x`) or
vertical (`y`) split. Background rectangles are derived from that tree, rather
than being unrelated address-to-rectangle entries.

- One window owns the full Deck work area.
- Two windows retain the columns-or-rows orientation captured from Dwindle.
- A later window replaces the focused leaf and splits it along that leaf's
  longer axis.
- Closing a leaf collapses its parent onto the surviving sibling/subtree and
  recomputes the expanded slots.
- The migration repaired workspace 2's malformed stacked-left state into two
  full-height vertical columns with the 14px internal gap.

The migration backup is machine-local at:
`~/.local/state/hypr-deck/state.json.before-v3-20260918T115906`.

### Focus-path improvements and verification

- Layout recomputation and monitor/gap queries are cached unless a tree changes.
- No-op geometry writes and duplicate background restoration are skipped.
- Separate targeted resize then move IPC calls remain in place.
- Measured Deck right-promotion reached its final anchored geometry in about
  `0.648 s` in this VM after the redundant-work removal.

Verified during this checkpoint:

```text
python3 -m py_compile omarchy/bin/hypr-deck        PASS
hypr-deck self-test                                PASS
systemd-analyze --user verify hypr-deck.service    PASS
hyprctl configerrors                               empty
hypr-deck.service                                  enabled + active
```

A temporary ad-hoc test also verified the swap-tree helper, runtime Deck swap
bindings, current workspace-2 vertical saved slots, active foreground geometry,
service state, and empty config errors. The temporary file was removed.

### Current controls (updated)

- `Super + Arrow` → Deck directional focus/promotion.
- `Super + Shift + Arrow` → Deck-aware persistent slot swap.
- `Super + T` → temporarily expand and raise the focused Deck window; press again to
  restore its saved slot and promote it.
- `Super + O` → temporarily float and pin the focused Deck window; press again
  to unpin it, restore its saved slot, and promote it.
- `Super + Alt + Prior/Next` → adjust foreground scale.
- `Super + Alt + D` → toggle Deck Mode.
- `Super + Shift + Alt + D` → restore normal tiling and pause Deck Mode.

Entering Deck reconstructs its split tree from the live tiled rectangles rather
than forcing a two-window workspace into columns. Restoring normal tiling uses
Dwindle's one-shot `preselect` layout message to rebuild that saved tree before
discarding Deck state, so a rows layout returns as rows and a columns layout
returns as columns.

The first orientation-preservation attempt still flipped layouts during bulk
adoption. `adopt_workspace()` appended the first newly discovered tiled window
to its `existing` list, then incorrectly treated the second newly discovered
window as a late arrival whose peers were already floating. It split the first
window along its longer axis instead of inferring the two live tiled rectangles.
Bulk adoption now distinguishes windows managed before the batch from windows
being captured in that batch. Deck commands and daemon applies also share an
`flock` lock, and enabling Deck captures all tiled workspaces while holding it,
so the keybinding process and socket daemon cannot overwrite each other's
layout transition.

Native floating and pop-out toggles are also incompatible with Deck ownership:
they alter only the live floating/pinned state, so returning a window can leave
it behind the foreground stack. In particular, tiling a Deck window puts it
underneath its still-floating peers. The `Super + T` and `Super + O` overrides now
mark a managed window as temporarily detached while retaining its split-tree
leaf. `Super + T` keeps the window floating, expands it to the work area, and
raises it; `Super + O` uses a centered pinned rectangle. Detached windows are
excluded from Deck focus/swap candidates. A second press clears the detached
state, reasserts floating/tag ownership, restores the saved slot, and explicitly
promotes that window. When Deck is disabled or the active window is unmanaged,
both commands retain their normal Omarchy behavior.

Do not re-enable native Hyprland/Omarchy directional window-swap bindings while
Deck Mode owns the workspace; they only alter live floating geometry and will
again conflict with the saved split tree.

### Workspace-transfer reflow fixed

Moving a managed window to another workspace exposed a separate gap: the
daemon ignored every `movewindowv2` event to avoid reacting to its own geometry
writes, so the saved split tree continued to own the window on its old
workspace. Neither the source tree nor the destination tree was recomputed.

The daemon now compares the moved client's live workspace with its persisted
workspace before reacting. A real workspace transfer removes and collapses the
source leaf, inserts the window by splitting the destination's remembered or
most recently focused leaf, recomputes both workspaces' saved slots, and updates
foreground memory. Same-workspace geometry events remain ignored, preserving
the idle-loop safeguard. The daemon also reconciles once immediately after
connecting to socket2 so a move during service startup cannot be missed.

Verification included a deterministic source/destination tree test and a live,
silent move of the sole workspace-1 client through `1 -> 8 -> 1`. Both socket2
events were processed, workspace 1 was restored to its original one-leaf tree,
workspace 8 was removed after the return, workspace 2's four-window topology
was byte-for-byte unchanged, and the active workspace did not change.

Final verification also exposed and fixed an older `restore-tiling` persistence
bug: its intentional bulk window removal is now recorded before `write_state()`
merges concurrent disk state, so paused/restored clients are not resurrected in
the JSON state after their tags and floating status have been removed. Daemon
startup now also skips `adopt_all()` while Deck is disabled; previously a
service restart briefly re-adopted and re-floated restored windows before the
disabled check in `apply()` took effect.

### Dynamic monitor/work-area reflow

Deck no longer assumes the monitor geometry present when its service started.
On monitor add/remove, workspace-to-monitor moves, and Hyprland config reloads,
it invalidates cached monitor/gap data and re-derives every saved slot from the
current monitor's live work area while preserving split-tree ownership. It also
updates persisted monitor IDs when Hyprland migrates clients after a disconnect.
Startup and socket reconnection force the same full derivation so a display
change missed while the daemon was unavailable cannot leave widescreen-sized
rectangles on the laptop panel. Event-driven reflow waits for two matching
monitor/work-area snapshots after a minimum settling delay because
`configreloaded` can arrive before the shell restores its top-panel reservation.
Monitor pixel dimensions are divided by Hyprland's output scale before Deck
combines them with logical window coordinates, reserved edges, and gaps; this
keeps fractional-scale laptop layouts inside the visible logical work area.

## User-visible requirements

The user wants a system-wide Hyprland "Deck" mode for normal application windows:

- Regular windows retain a saved tiled/background rectangle.
- The focused window overlaps peers as a foreground card at scale `0.67`.
- Full-height columns expand horizontally only; full-width rows expand vertically only; quadrant tiles expand on both axes.
- `Super + Arrow` selects a Deck window from its saved background position and promotes it.
- Hover must not promote a window; click and keyboard navigation should.
- Switching workspaces must not exchange windows' saved left/right/background roles.
- Windows must never move on their own while the user is idle.

The user originally confirmed the two side-by-side vertical-column layout looked correct, but the following regressions remain:

1. **Workspace switch exchange:** on workspace 2 (also seen on workspaces 3 and 4), leave the workspace and return. A client that belonged to the left slot can visually acquire the right foreground geometry while the right client acquires the left/background geometry. The user reports this still happens with fresh windows on a fresh workspace.
2. **Unprompted movement:** the user reports windows sometimes move without a workspace switch.
3. **Directional-focus exchange:** `Super + Left` / `Super + Right` can make an anchored window take another window's geometry and retain it. A most recent attempted fix removes a second geometry writer from the one-shot focus command, but the user had already reported this behavior before the handoff and it is not user-confirmed fixed.

## Important honesty note

Several automated tests were written and passed, including live `2 -> 3 -> 2` transitions and focus-left/focus-right transitions. Those tests have produced false confidence: the user subsequently reproduced the bug. Treat the actual desktop behavior as authoritative.

## Repository and runtime locations

- Repository root: `/home/james/dotfiles`
- Main implementation: `/home/james/dotfiles/omarchy/bin/hypr-deck`
- Runtime executable: `/home/james/.local/bin/hypr-deck` → repository file above
- Service source: `/home/james/dotfiles/omarchy/config/systemd/user/hypr-deck.service`
- Runtime service link: `/home/james/.config/systemd/user/hypr-deck.service`
- Runtime state: `/home/james/.local/state/hypr-deck/state.json`
- Bindings source: `/home/james/dotfiles/omarchy/config/hypr/bindings.lua`
- Input source: `/home/james/dotfiles/omarchy/config/hypr/input.lua`
- Installer: `/home/james/dotfiles/install.sh`

The service is currently enabled/active and uses:

```ini
ExecStart=%h/.local/bin/hypr-deck daemon
Restart=on-failure
RestartSec=1
TimeoutStopSec=3
```

## Current controls

From `bindings.lua`:

- `Super + Left/Right/Up/Down` → `hypr-deck focus left/right/up/down`
- `Super + Alt + Prior/Next` → adjust foreground scale by `+/-0.05`
- `Super + Alt + D` → toggle Deck Mode
- `Super + Shift + Alt + D` → restore tracked Deck windows to normal tiling and pause Deck Mode

`input.follow_mouse = 0` is configured in `omarchy/config/hypr/input.lua`; hovering should not focus/promote a window.

## Current state snapshot

Collected near the time this handoff was written. State version is `2`, Deck is enabled, and scale is `0.67`.

Saved Deck background slots:

| Workspace | Address | Stable ID | Saved background |
|---|---|---|---|
| 1 | `0xaaaac7e1cbf0` | `1800001e` | `x=12 y=38 w=2536 h=1390` |
| 2 | `0xaaaac7e1c010` | `18000009` | `x=12 y=38 w=1261 h=1390` |
| 2 | `0xaaaac7e7e920` | `18000012` | `x=1287 y=38 w=1261 h=695` |
| 3 | `0xaaaac7f66c60` | `18000017` | `x=12 y=38 w=1261 h=1390` |
| 3 | `0xaaaac7f8e480` | `18000018` | `x=1287 y=38 w=1261 h=1390` |
| 4 | `0xaaaac8478e40` | `1800002b` | `x=12 y=38 w=1268 h=1390` |
| 4 | `0xaaaac84573a0` | `1800002c` | `x=1280 y=38 w=1268 h=1390` |

Current remembered foreground addresses in persisted `workspace_focus`:

```json
{
  "2": "0xaaaac7e7e920",
  "3": "0xaaaac7f8e480",
  "4": "0xaaaac84573a0"
}
```

Live monitor/work-area values previously measured:

- Monitor: `2560x1440`
- Top reserved area: `26 px`
- Outer gap: `10 px`
- Border: `2 px`
- Deck outer inset: `12 px` on all sides
- Usable Deck work area: `x=12 y=38 w=2536 h=1390`

## Architecture

`hypr-deck` is a Python Hyprland socket2/JSON-IPC daemon.

Relevant behavior:

- Persists saved background rectangles and ownership tags (`hypr-deck`).
- Converts managed tiled windows into floating windows and tags them.
- Uses `anchor_rect()` to turn a saved background rectangle into foreground geometry.
- Uses `move_resize()` for each geometry update.
- Receives socket2 events in `Deck.handle()`.
- Uses Hyprland Lua dispatch/eval calls for float/tag/focus/move/resize/bring-to-top.

The main `apply()` flow currently:

1. Reloads state from disk.
2. Gets live clients and cleans stale state.
3. Obtains focused address (event payload or active window).
4. Adopts previously untracked tiled windows on the target workspace.
5. Restores `last_active_address` to its saved background rectangle.
6. If entering another workspace, may override Hyprland's selected target with persisted `workspace_focus[workspace]`.
7. Restores background peers on the current workspace.
8. Resizes/moves the focused target to `anchor_rect(saved_background, monitor, scale)` and raises it.
9. Persists `last_active_address`, `last_workspace`, and `workspace_focus`.

## Changes attempted during this session

These are implemented in the current working tree, but none should be considered confirmed fixes for the user's real bug.

1. **New-window slot splitting**
   - New windows appear full-workspace because Deck peers are floating.
   - `split_slot()` splits the previously focused saved background rectangle on its longer axis.
   - This was introduced to avoid a new window becoming a full-workspace background slot.

2. **State-write changes**
   - Older code wrote a fixed `state.tmp`; logs showed errors such as:
     `No such file or directory: '/home/james/.local/state/hypr-deck/state.tmp' -> '/home/james/.local/state/hypr-deck/state.json'`
   - Current code uses `tempfile.mkstemp()` and merges latest on-disk windows before replacing state.
   - This may still be architecturally unsafe: read-modify-write merging can preserve stale data or lose intentional deletions. It should be reviewed rather than assumed correct.

3. **Targeted restore rather than restoring all hidden workspaces**
   - The old implementation moved every non-focused managed client on every workspace.
   - Current code restores only `last_active_address` plus peers on the current workspace.
   - This did not stop the user-reported swaps.

4. **Persisted per-workspace foreground (`workspace_focus`)**
   - Added so Hyprland's workspace return focus would not change which window is foreground.
   - This adds another state and focus override path and may itself be a contributor. Review critically; consider removing it to reduce statefulness while debugging.

5. **Separate resize and move IPC calls**
   - `move_resize()` previously sent resize and move in a single Lua eval string.
   - Current code sends resize, waits `0.015 s`, then sends move in a separate eval call.
   - This was hypothesized to prevent command ordering issues. The user continued to observe problems after earlier changes, so it is not confirmed.

6. **Ignore `movewindowv2`**
   - The daemon previously called `apply(force=True)` for `movewindowv2`.
   - Since Deck's own geometry updates emit move events, that created a clear self-triggering feedback-loop possibility:
     Deck move → `movewindowv2` → apply → Deck moves.
   - Current handler ignores `movewindowv2` and only reacts to `activewindowv2`, `openwindow`, and `closewindow`.
   - A five-second idle geometry observation after this change was stable, but the user had already reported spontaneous movement before this handoff; longer/manual observation is required.

7. **Single-writer directional focus attempt**
   - `hypr-deck focus left/right` formerly called `self.apply(target, force=True)` after focusing the target, while the daemon also handled `activewindowv2` and applied geometry.
   - Current code changed the one-shot command to only issue focus; the daemon is intended to be the only geometry writer.
   - User-visible `Super + Left/Right` swapping prompted this change. It is not user-confirmed fixed.

## Key evidence and observations

### Confirmed raw socket event order for workspace switch

A temporary second socket2 client captured this exact sequence during `2 -> 3 -> 2`:

```text
activewindow>>com.mitchellh.ghostty,hermes
activewindowv2>>aaaac7e7e920
activewindow>>com.mitchellh.ghostty,[mosh] aidev: ~
activewindowv2>>aaaac7f8e480
workspace>>3
workspacev2>>3,3
activewindow>>com.mitchellh.ghostty,hermes
activewindowv2>>aaaac7e7e920
workspace>>2
workspacev2>>2,2
```

Important: `activewindowv2` occurs before `workspacev2`. Any design that assumes workspace events arrive first is incorrect.

### Confirmed bad live geometry seen during investigation

At one point workspace 2 saved state said:

- `0xaaaac7e1c010` = left full-height background (`x=12`, `w=1261`, `h=1390`)
- `0xaaaac7e7e920` = top-right background (`x=1287`, `w=1261`, `h=695`)

But live geometry was observed as:

- `0xaaaac7e1c010` physically at a right foreground rectangle (`x=849`, `w=1699`, `h=931`)
- `0xaaaac7e7e920` physically at a left/background rectangle (`x=12`, `w=1261`, `h≈1390`)

This is an actual geometry/ownership exchange, not merely a changed z-order or focus illusion.

### Targeted dispatcher sanity check

A direct manual Hyprland Lua call targeting an address successfully moved/resized the intended addressed window. This suggests address targeting itself works in isolation; the issue is likely ordering, event timing, concurrent writers, or inaccurate application state.

### Logs

The current service logs do not contain enough per-apply context to diagnose the race. Older logs show fixed-temp-file state collisions. Recent logs mainly show repeated service restarts from debugging. There are no useful geometry-transition records.

## Strong next steps for a fresh reviewer

Do not add more speculative fixes first. Instrument and reproduce.

1. **Add structured temporary trace logging before every geometry operation.**
   Include monotonic timestamp, process PID, triggering event/payload, active window, active workspace, selected address, saved background, intended rectangle, actual live rectangle before/after, `last_active_address`, `last_workspace`, and `workspace_focus`.
   - Log to a separate file under `/tmp` or `$XDG_RUNTIME_DIR`, not only journald.
   - Log every `move_resize`, `bring_to_top`, state reload/write, and `apply` entry/exit.

2. **Capture socket2 events and daemon trace together while reproducing with workspace 2.**
   The user can reproduce the issue on workspace 2. Avoid automated restart loops during capture.
   - Begin capture.
   - Record `hyprctl clients -j` and state JSON.
   - Use the user's normal `Super + 3`, then `Super + 2` (not a custom dispatcher substitute if possible).
   - Capture immediate and delayed geometries for each address.
   - Compare event order against trace operations.

3. **Prove number of geometry writers.**
   Search for every call to `move_resize`, every invocation of the executable, and whether bindings/other shell helpers invoke it. Verify only the daemon writes geometry after the latest changes.
   - `hypr-deck focus` should only focus after the current change.
   - `scale`, `toggle`, startup, open/close events, and service restarts still can write geometry.

4. **Consider simplifying the design.**
   The implementation has accumulated stateful mitigations (`workspace_focus`, `last_active_address`, state merge, delayed separate IPC). A clean approach may be safer:
   - Keep a single daemon as the only geometry writer.
   - Treat all external commands as intent messages only; do not let CLI commands directly run `apply`.
   - Serialize events through a queue/debounce generation number.
   - On each coalesced event, query the *current* active workspace/window rather than trusting stale event payloads.
   - Avoid persisting transient foreground state until slot stability is proven.
   - Consider deleting/rebuilding `workspace_focus` and `last_active_address` behavior if traces show they cause wrong target selection.

5. **Make updates idempotent before applying geometry.**
   Before moving a client, compare actual geometry with intended geometry and skip a no-op. This reduces emitted move events and helps trace only meaningful changes.

6. **Do not use test pass/fail based only on saved state.**
   The saved state has often remained correct while live geometry was wrong. Assertions must check live `hyprctl clients -j` geometry per address after a settle period.

7. **Be careful with service restart and address reuse.**
   Restarting the service has repeatedly changed the runtime situation and can hide/recreate the bug. Stable IDs are stored but the code is still keyed primarily by address.

## Suggested immediate reproduction commands

Use these only after adding tracing. They intentionally leave the user on workspace 2.

```bash
# State snapshot
hypr-deck status | jq .
hyprctl clients -j | jq '[.[] | select((.tags // []) | index("hypr-deck")) | {address,stableId,workspace:.workspace.id,at,size,focusHistoryID,title}]'

# Reproduce workspace route with Hyprland's Lua dispatcher used in prior testing.
hyprctl eval 'hl.dispatch(hl.dsp.focus({ workspace = "3" }))'
sleep 1
hyprctl eval 'hl.dispatch(hl.dsp.focus({ workspace = "2" }))'
sleep 1

# Better: have the user use the normal Super+3 / Super+2 bindings while trace is active.
```

## Useful operational commands

```bash
# Status / logs
systemctl --user status hypr-deck.service
journalctl --user -u hypr-deck.service -f
hypr-deck status | jq .

# Reload or restart during controlled tests only
systemctl --user restart hypr-deck.service
hyprctl reload
hyprctl configerrors

# Escape hatch: restore normal Hyprland tiling and pause Deck Mode
hypr-deck restore-tiling
# Equivalent user binding: Super + Shift + Alt + D
```

## Configuration integration notes

- `install.sh` creates the symlinks for the executable and service.
- `input.follow_mouse = 0` was added to avoid hover-driven focus; this is unrelated to the geometry race.
- The user asked about Vimarchy but did **not** install it during this work. Vimarchy's swap/pair/move/maximize functions are not compatible with the current floating Deck ownership model; it is not considered the source of this issue.

## Completion criteria

Do not claim this bug is fixed until the user manually confirms all of the following under normal keyboard use:

1. Repeated `Super + 2` / `Super + 3` round trips preserve each window's live geometry by address.
2. Repeated `Super + Left` / `Super + Right` promotion changes only foreground/background state, never slot ownership.
3. Managed windows remain stationary during several minutes of idle use.
4. New windows join without full-workspace slot corruption.
5. No regressions in the previously working two-side-by-side Deck layout.
