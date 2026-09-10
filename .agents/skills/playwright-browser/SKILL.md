---
disable-model-invocation: true
name: playwright-browser
description: Browser automation using Playwright CLI. Use for web scraping, UI testing, and browser automation tasks. Activates when the user needs to automate browser interactions, take screenshots, extract web data, or run Playwright tests with named sessions.
---

# Playwright Browser Automation

Browser automation using Playwright CLI with named session persistence for web scraping, UI testing, and general browser control.

## Tools Required

- **Bash** - To execute Playwright CLI commands
- **Read, Write** - To create and manage scripts/config files
- **Glob** - To find test files and session state files

## When to Use This Skill

Use this skill when you need to:
- **Scrape data from websites** - Extract content, screenshots, or structured data
- **Test UI with user stories** - Automate browser interactions for validation
- **Automate browser tasks** - Navigate, click, fill forms, export PDFs
- **Run parallel browser sessions** - Multiple agents with isolated state

## Key Principles

- **Headless by default** - pass `--headed` to see the browser window
- **Parallel sessions** - use separate `--storage-state` files for independent browser instances
- **Persistent profiles** - cookies and storage state preserved between calls via state files
- **Token-efficient** - CLI-based, no accessibility trees or tool schemas in context
- **Vision mode** (opt-in) - set `PLAYWRIGHT_MCP_CAPS=vision` to receive screenshots as image responses in context instead of just saving to disk

## Sessions

**Always use a named session.** Derive a short, descriptive kebab-case name from the user's prompt (e.g., `hn-scrape`, `login-test`, `checkout-flow`). This gives each task a persistent browser profile (cookies, localStorage) that accumulates across calls.

Session state is managed via Playwright's `--storage-state` flag, which saves and restores cookies, localStorage, and session data to a JSON file.

## Quick Reference

| Task | Command Pattern |
|------|-----------------|
| Open URL | `npx playwright open --storage-state=.playwright-sessions/{name}-state.json {url}` |
| Screenshot | `npx playwright screenshot --storage-state=.playwright-sessions/{name}-state.json {url} {output}` |
| Run tests | `npx playwright test --project={name} {file}` |
| PDF export | `npx playwright pdf --storage-state=.playwright-sessions/{name}-state.json {url} {output}` |
| Codegen | `npx playwright codegen --storage-state=.playwright-sessions/{name}-state.json {url}` |

## Session Management

Sessions are stored in `.playwright-sessions/` (project-local, gitignored).

Each session has:
- A **state file**: `.playwright-sessions/{session-name}-state.json` (cookies, localStorage, IndexedDB)
- An **output folder**: `.playwright-sessions/{session-name}/` (screenshots, downloads, extracted data)

### Creating/Using a Session

```bash
# Ensure session directory exists
mkdir -p .playwright-sessions/{session-name}

# Launch browser with storage state (creates state file on first run)
npx playwright open --storage-state=.playwright-sessions/{session-name}-state.json {url}

# State is automatically saved to the state file on browser close
```

### Session State Files

**WARNING**: State files contain authentication tokens. Treat them as secrets.
- Never commit `.playwright-sessions/` to git
- Add `.playwright-sessions/` to `.gitignore`

## Common Patterns

### Navigate and Screenshot

```bash
# Navigate to URL with session state, capture screenshot
npx playwright screenshot \
  --browser=chromium \
  --viewport-size=1280,720 \
  --storage-state=.playwright-sessions/{session-name}-state.json \
  {url} \
  .playwright-sessions/{session-name}/screenshot-{timestamp}.png
```

### Extract Page Content

```bash
# Generate a script to extract data
npx playwright codegen --storage-state=.playwright-sessions/{session-name}-state.json {url}

# Or write a Node.js script using the Playwright API:
node extract.js
```

### Run UI Tests from User Stories

```bash
# Execute a test file with session context
npx playwright test \
  --project={session-name} \
  --output=.playwright-sessions/{session-name}/test-results/ \
  {test-file}.spec.ts
```

### Write Automation Scripts

When CLI one-liners aren't sufficient, write a Node.js script using the Playwright API:

```javascript
// example: extract-data.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: '.playwright-sessions/{session-name}-state.json'
  });
  const page = await context.newPage();

  await page.goto('https://example.com');
  // ... perform actions ...

  await context.storageState({ path: '.playwright-sessions/{session-name}-state.json' });
  await browser.close();
})();
```

### Parallel Execution

```bash
# Run multiple tests in parallel
npx playwright test --workers=4 --fully-parallel

# Each session maintains isolation through separate state files
```

## Token-Efficient Output Handling

Always save outputs to disk, return references:

```bash
# GOOD: Save screenshot, return path
echo "Screenshot saved: .playwright-sessions/{session}/screenshot-001.png"

# BAD: Don't output base64 or raw HTML to terminal
```

## Directory Structure

```
.playwright-sessions/
├── work-state.json          # Session: "work" - cookies, storage
├── work/
│   ├── screenshot-001.png   # Screenshots from work session
│   ├── screenshot-002.png
│   └── extracted-data.json  # Scraped data
├── personal-state.json      # Session: "personal"
└── personal/
    └── ...
```

## Best Practices

1. **Use descriptive session names** - `hn-scrape`, `admin-login`, `checkout-flow`
2. **Clean up old sessions** - Remove `.playwright-sessions/` contents periodically
3. **Prefer API auth when possible** - 10-100x faster than UI-based login
4. **Use `--viewport-size`** for consistent screenshots across agents
5. **Handle dynamic content** - Add waits for SPA loading: `--wait-for-timeout=5000`
6. **Prefer CLI for simple tasks** - Use `npx playwright screenshot` / `pdf` / `open` for one-shot operations
7. **Use scripts for complex flows** - Write Node.js scripts with the Playwright API for multi-step interactions

## Troubleshooting

**Playwright not installed**: Run `npx playwright install chromium` to install browsers. If Playwright itself is missing, run `npm install -D playwright` first.

**Session conflicts**: Each session state file can only be used by one browser instance at a time. Use different session names for parallel agents.

**Missing auth**: If sessionStorage is used for auth (common in SPAs), it won't be captured by `--storage-state`. Use API-based auth or re-authenticate per session.

**Large outputs**: Screenshots and PDFs can be large. Always save to disk, never output raw content.
