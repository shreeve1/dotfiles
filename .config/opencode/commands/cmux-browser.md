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

### Step 5: Handle Failures
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
cmux browser storage session get "<key>"
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
Use `--surface surface:N` on any command to target a specific browser pane.
Run `cmux browser identify` to discover surface IDs.

## Rules

- Always `wait` after `open` or `navigate` before interacting with the page
- Use `snapshot --interactive --compact` to discover selectors — do NOT guess
- On failure, always capture screenshot + snapshot + console before reporting
- Use `--timeout-ms` on waits to avoid indefinite hangs (default: 10000ms for automation)
- Prefer `fill` over `type` for input fields (fill clears first)
- Prefer `--snapshot-after` on interaction commands to track page state changes
- Never hardcode surface IDs — always discover via `identify` first
