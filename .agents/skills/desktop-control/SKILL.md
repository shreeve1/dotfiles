---
name: desktop-control
description: Use when an agent needs Windows desktop UI access from WSL on wrk, including Kaseya Live Connect or native application dialogs.
---

# Desktop control on wrk

Use Cua Driver for native Windows UI. **Preserve James's pointer, focus and clipboard.**

## Start

1. Try the matching connector/API first (ITAStack for client operations); desktop is last resort. For web pages, use **browser-cdp**. Use shell/API file operations: File Explorer renames steal focus.
2. Desktop agents must run on `cliproxy/gpt-6.1-sol`. Name that model when spawning; Fabric alias `computer` selects it with medium thinking. Otherwise hand desktop work to that model before acting.
3. Run directly from WSL, with a Windows working directory to avoid UNC warnings. Repeat these first two lines in each fresh shell:

   ```bash
   cd /mnt/c/Windows
   CUA=/mnt/c/Users/james/AppData/Local/Programs/Cua/cua-driver/bin/cua-driver.exe
   "$CUA" list-tools
   "$CUA" describe click
   "$CUA" call get_guide '{}'
   "$CUA" call list_windows '{}'
   ```

   Login task `cua-driver-serve` starts the service. Use `describe` for schemas and `get_guide` for on-demand guidance topics/sources.

## Observe → target → act → verify

- Record the exact `pid`, `window_id` and title. Read `get_window_state` with **both IDs**, `include_screenshot:false`, and a unique public `session` label. Repeat that label on state/action calls to retain the CLI token cache.
- Before typing, verify the intended window **and element** in the current tree. Prefer element-index actions: row `[N]` becomes `element_token:"<snapshot_id>:N"`. Use `set_value` for supported fields and background input otherwise; never use the operator's clipboard.
- Keep `delivery_mode:"background"`; leave `foreground_fallback` off. Use `run_steps` with `observe:{}` for known actions plus readback. Read the resulting state/text, not just the success flag. Refresh targets after UI changes.
- Use screenshot-coordinate clicks only when the tree lacks the target. If background input fails or is a verified no-op, ask James before moving his pointer or taking focus; fallback is not permission.

## Recovery and finish

| Symptom | Next action |
| --- | --- |
| `stale_element_token` / no current snapshot | Re-read the exact window using the same explicit session; use its new tokens. |
| Missing `window_id` / wrong arguments | Re-enumerate windows; inspect the tool's schema instead of guessing fields. |
| Minimized Calculator has empty or unrelated controls | Launch without `start_minimized`; track every created window. Do not act on another app's rows. |
| Action says success, result unchanged | Inspect state before retrying; repeated clicks can double-fire. |

**Completion includes cleanup:** close only windows you created, using each window's fresh Close-button token in background mode. Then `list_windows` must confirm **every recorded window ID is absent**, including earlier launches. Never kill a shared `ApplicationFrameHost.exe` PID: it can also own VPN/Settings windows. Force termination is a last resort only for a verified dedicated, task-owned process with no unsaved work; otherwise report the blocker.

## Live Connect

Read `/home/james/Documents/itastack/memory/workflows/workstation/drive-kaseya-live-connect-from-wrk.md` before client-console work. Confirm the selected `Document "<host> - Commands"` matches the task before typing; never send input to an unnamed client tab. After reconnect, re-check endpoint, shell and execution context; do not assume the previous command ran. Destructive client actions require James's explicit go-ahead.
