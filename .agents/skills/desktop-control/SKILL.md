---
name: desktop-control
description: Use when an agent needs Windows desktop UI access from WSL on wrk, including Kaseya Live Connect or native application dialogs.
---

# Desktop control on wrk

Use Cua Driver for native Windows UI. **Prefer background input; never use James's clipboard.**

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
- Try `delivery_mode:"background"` first. Use `run_steps` with `observe:{}` for known actions plus readback; apply the separate-call sequence below for Live Connect. Verify resulting state/text, not just success flags; refresh targets after UI changes.
- Use screenshot-coordinate clicks only when the tree lacks the target. Live Connect has standing foreground approval below; other focus-taking work still needs James's go-ahead.

## Recovery and finish

| Symptom | Next action |
| --- | --- |
| `stale_element_token` / no current snapshot | Re-read the exact window using the same explicit session; use its new tokens. |
| Missing `window_id` / wrong arguments | Re-enumerate windows; inspect the tool's schema instead of guessing fields. |
| Minimized Calculator has empty or unrelated controls | Launch without `start_minimized`; track every created window. Do not act on another app's rows. |
| Action says success, result unchanged | Inspect state before retrying; repeated clicks can double-fire. |

**Completion includes cleanup:** close only windows you created, using each window's fresh Close-button token in background mode. Then `list_windows` must confirm **every recorded window ID is absent**, including earlier launches. Never kill a shared `ApplicationFrameHost.exe` PID: it can also own VPN/Settings windows. Force termination is a last resort only for a verified dedicated, task-owned process with no unsaved work; otherwise report the blocker.

## Live Connect

Read `/home/james/Documents/itastack/memory/workflows/workstation/drive-kaseya-live-connect-from-wrk.md` before client-console work. Confirm selected `Document "<host> - Commands"` matches the named endpoint before typing; never send input to an unnamed client tab.

1. Background sequence: `run_steps` click the named `TabItem`; separately `run_steps` click `role:"Edit"`; re-check the selected Document; a **separate `type_text` call** sends the command with exact `pid`/`window_id`; then `run_steps` sends `press_key` with `key:"return"`. Retain the same session throughout. Read fresh console rows for command **and new output/prompt**; old output is not proof. A combined element-token click/type/Return batch can silently do nothing.
2. If background is refused or a **verified no-op**, James's standing OK allows foreground control **for Live Connect**: retry only the undelivered action with `delivery_mode:"foreground"` or `foreground_fallback:true`. Activate the exact Live Connect window if needed, without typing. Before **each foreground keystroke action**, re-read the selected Document and compare Live Connect's `window_id` (HWND) with Win32 `GetForegroundWindow` (not merely an activation success flag). If either check fails, send nothing. Keep foreground time minimal and state in the result that focus was taken. Inspect partial input first to avoid duplicate commands.

After reconnect, re-check endpoint, shell and execution context; do not assume the previous command ran. Destructive client actions still require James's explicit go-ahead.
