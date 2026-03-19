---
description: Automate the cmux in-app browser — reference, execution, and guided workflows
agent: build
---

Perform browser automation tasks using the cmux built-in browser. $ARGUMENTS

## Phase 1 — Determine Intent

If `$ARGUMENTS` is provided, classify the request:

1. **Execute** — User describes a specific task (e.g., "open example.com and screenshot it") — go to Phase 3
2. **Guide** — User wants help building an automation (e.g., "help me scrape a page") — go to Phase 4
3. **Reference** — User asks about a specific command or capability — answer from the API Reference below

If no arguments, ask:
- What do you want to automate? (URL, workflow description, or "show me the API")

## Phase 2 — Verify Environment

1. Run `which cmux` to confirm the CLI is available
2. If missing, instruct: `sudo ln -sf "/Applications/cmux.app/Contents/Resources/bin/cmux" /usr/local/bin/cmux`
3. Run `cmux browser identify` to discover the focused browser surface ID
4. If no browser surface exists, run `cmux browser open <url>` to create one

Store the surface ID for subsequent commands (use `--surface surface:N` targeting).

## Phase 3 — Execute Automation

Run the automation using `cmux browser` subcommands. Follow this pattern for every task:

### Step 1: Navigate
```bash
cmux browser open "<url>"
cmux browser wait --load-state networkidle
```

### Step 2: Inspect
```bash
cmux browser snapshot --interactive --compact
```
Read the accessibility tree to identify selectors for target elements.

**Selector strategy** — in priority order:
1. `data-testid` attributes: most stable (`[data-testid="submit-btn"]`)
2. ARIA roles + labels from snapshot: (`role=button[name="Submit"]`)
3. Placeholder or label text: (`[placeholder="Email"]`)
4. CSS selectors as last resort: (`#login-form .btn-primary`)

Never guess selectors. Always derive them from `snapshot` or `find` output.

### Step 3: Interact
Use the appropriate command for each action:
```bash
cmux browser click "<selector>"
cmux browser fill "<selector>" "<value>"
cmux browser press "Enter"
cmux browser select "<selector>" "<option>"
cmux browser check "<selector>"
cmux browser scroll "<selector>" --down 500
```

### Step 4: Wait and Verify
```bash
cmux browser wait --text "expected text" --timeout-ms 10000
cmux browser get text "<selector>"
cmux browser screenshot --out /tmp/result.png
```

### Step 5: Persist State (optional)
For resumable workflows, save session state after key milestones:
```bash
cmux browser state save /tmp/session.json
```
To resume later:
```bash
cmux browser state load /tmp/session.json
```

### Step 6: Handle Failures
If a step fails:
1. `cmux browser screenshot --out /tmp/debug.png` — capture current state
2. `cmux browser snapshot --interactive --compact` — dump DOM tree
3. `cmux browser console list` — check for JS errors
4. `cmux browser errors list` — check for page errors
5. Report the failure with artifacts and suggest fixes

## Phase 4 — Guided Workflow Builder

Walk the user through building an automation step-by-step:

1. **Ask** what URL and goal they have
2. **Open** the URL and take a snapshot
3. **Show** the accessibility tree and ask which elements to interact with
4. **Build** the command sequence incrementally, running each step and showing results
5. **Collect** the full command sequence and present it as a reusable script

Format the final script as a shell script:
```bash
#!/bin/bash
set -euo pipefail

# <description of what this does>
cmux browser open "<url>"
cmux browser wait --load-state networkidle
cmux browser snapshot --interactive --compact
# ... remaining steps
```

## Common Patterns

### Multi-Tab Workflow
When automation spans multiple tabs (e.g., compare two pages, copy data between apps):
```bash
# Open tabs
cmux browser open "https://source.example.com"
cmux browser wait --load-state networkidle
cmux browser tab new "https://dest.example.com"
cmux browser wait --load-state networkidle

# Work in tab 1 (index 0)
cmux browser tab switch 0
cmux browser get text "#data-field"

# Switch to tab 1 and paste
cmux browser tab switch 1
cmux browser fill "#input-field" "<extracted value>"

# Clean up
cmux browser tab close 0
```

### Frame Navigation (SPAs with iframes)
Many apps embed content in iframes. You must switch frame context before interacting:
```bash
# Enter an iframe
cmux browser frame "#content-iframe"
cmux browser snapshot --interactive --compact
cmux browser click "#button-inside-iframe"

# Return to main document
cmux browser frame main
cmux browser click "#button-in-main-page"
```
If nested iframes, chain `frame` calls. Always `frame main` before interacting with elements outside the iframe.

## API Quick Reference

### Navigation
| Command | Purpose |
|---------|---------|
| `open <url>` | Open URL in new browser tab |
| `open-split <url>` | Open URL in a split pane |
| `navigate <url>` | Navigate current tab to URL |
| `back` / `forward` | History navigation |
| `reload` | Reload current page |
| `url` | Get current URL |
| `focus-webview` | Focus the browser webview |
| `is-webview-focused` | Check if browser webview has focus |

### Waiting
```
cmux browser wait --load-state <load|domcontentloaded|networkidle>
cmux browser wait --selector "<selector>"
cmux browser wait --text "<text>"
cmux browser wait --url-contains "<substring>"
cmux browser wait --function "<js expression>"
cmux browser wait --timeout-ms <ms>
```
Flags are combinable. Default timeout is 30000ms.

### DOM Interaction
| Command | Purpose |
|---------|---------|
| `click "<sel>"` | Click element |
| `dblclick "<sel>"` | Double-click |
| `hover "<sel>"` | Hover over element |
| `focus "<sel>"` | Focus element |
| `fill "<sel>" "<val>"` | Clear and type into input |
| `type "<sel>" "<val>"` | Type without clearing |
| `press "<key>"` | Press key (Enter, Tab, Escape, etc.) |
| `keydown` / `keyup` | Individual key events |
| `select "<sel>" "<opt>"` | Select dropdown option |
| `check` / `uncheck "<sel>"` | Toggle checkbox |
| `scroll "<sel>"` | Scroll element (--up/--down/--left/--right N) |
| `scroll-into-view "<sel>"` | Scroll element into viewport |

All interaction commands support `--snapshot-after` to auto-dump DOM after action.

### Inspection
| Command | Purpose |
|---------|---------|
| `snapshot` | Accessibility tree (`--interactive --compact`) |
| `screenshot --out <path>` | Capture screenshot |
| `get title` | Page title |
| `get url` | Current URL |
| `get text "<sel>"` | Element text content |
| `get html "<sel>"` | Element HTML |
| `get value "<sel>"` | Input value |
| `get attr "<sel>" "<attr>"` | Element attribute |
| `get count "<sel>"` | Number of matching elements |
| `get box "<sel>"` | Bounding box |
| `get styles "<sel>"` | Computed styles |
| `is visible "<sel>"` | Check visibility |
| `is enabled "<sel>"` | Check if enabled |
| `is checked "<sel>"` | Check if checked |

### Finding Elements
```
cmux browser find --role "<role>"
cmux browser find --text "<text>"
cmux browser find --label "<label>"
cmux browser find --placeholder "<text>"
cmux browser find --alt "<text>"
cmux browser find --title "<text>"
cmux browser find --testid "<id>"
cmux browser find --first | --last | --nth <N>
cmux browser highlight "<selector>"
```

### JavaScript
```
cmux browser eval "<js expression>"
cmux browser addinitscript "<js code>"
cmux browser addscript "<url or path>"
cmux browser addstyle "<css or url>"
```

### State & Storage
```
cmux browser cookies get [--name <n>] [--domain <d>]
cmux browser cookies set --name <n> --value <v> [--domain <d>]
cmux browser cookies clear
cmux browser storage local get "<key>"
cmux browser storage local set "<key>" "<value>"
cmux browser storage local clear
cmux browser storage session get "<key>"
cmux browser storage session set "<key>" "<value>"
cmux browser storage session clear
cmux browser state save <path.json>
cmux browser state load <path.json>
```

### Tabs
```
cmux browser tab list
cmux browser tab new [<url>]
cmux browser tab switch <index>
cmux browser tab close [<index>]
```

### Frames, Dialogs, Downloads
```
cmux browser frame "<selector>"
cmux browser frame main
cmux browser dialog accept ["<text>"]
cmux browser dialog dismiss
cmux browser download --path <dir> --timeout-ms <ms>
```

### Console & Errors
```
cmux browser console list
cmux browser console clear
cmux browser errors list
cmux browser errors clear
```

### Surface Targeting
Two syntaxes — flag or positional:
```
cmux browser click "#btn" --surface surface:2
cmux browser click surface:2 "#btn"
```
Run `cmux browser identify` to discover surface IDs.

## cmux General API

These terminal-level commands complement browser automation for hybrid workflows.

### Notifications & Status
```
cmux notify "<message>"
cmux set-status "<text>"
cmux clear-status
cmux set-progress <0-100>
cmux clear-progress
```

### Surfaces & Workspaces
```
cmux list-surfaces
cmux focus-surface <id>
cmux new-split
cmux list-workspaces
cmux current-workspace
cmux new-workspace
cmux select-workspace <id>
cmux close-workspace <id>
```

### Send Input to Terminal Panes
```
cmux send "<text>"
cmux send-key "<key>"
cmux send-surface <surface-id> "<text>"
cmux send-key-surface <surface-id> "<key>"
```

### Logging
```
cmux log "<message>"
cmux list-log
cmux clear-log
```

### Other
```
cmux ping
cmux capabilities
cmux identify
cmux sidebar-state
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CMUX_SOCKET_PATH` | Override socket path (default: `/tmp/cmux.sock`) |
| `CMUX_SOCKET_ENABLE` | Enable/disable socket communication |
| `CMUX_SOCKET_MODE` | Socket permission mode |
| `CMUX_WORKSPACE_ID` | Current workspace ID (set automatically in cmux shells) |
| `CMUX_SURFACE_ID` | Current surface ID (set automatically in cmux shells) |

Use these in scripts to detect if running inside cmux and to target the correct surface without `identify`.

## Rules

- Always `wait` after `open` or `navigate` before interacting with the page
- Use `snapshot --interactive --compact` to discover selectors — do NOT guess
- On failure, always capture screenshot + snapshot + console before reporting
- Use `--timeout-ms` on waits to avoid indefinite hangs (default: 10000ms for automation)
- Prefer `fill` over `type` for input fields (fill clears first)
- Prefer `--snapshot-after` on interaction commands to track page state changes
- Never hardcode surface IDs — always discover via `identify` first
