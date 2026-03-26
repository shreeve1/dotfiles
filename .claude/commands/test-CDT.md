---
name: test-CDT
description: Verify acceptance criteria against a live browser via Chrome DevTools runtime inspection
argument-hint: [plan-path-or-url]
model: sonnet
---

# Test CDT

Run targeted Chrome DevTools checks against each acceptance criterion in a plan and produce a structured pass/fail verification report.

## Variables

INPUT: $ARGUMENTS
SPECS_DIR: `specs/`

## Rules

- **NEVER edit project source files.** This command is verification only.
- **MUST use Chrome DevTools MCP** (`mcp__chrome_devtools__*`) for all browser interaction.
- **Console errors and network 4xx/5xx are automatic failures** regardless of criterion results.
- **Present findings** to the user with AskUserQuestion offering next steps.

## Input Resolution

Resolve input in this priority order:

1. **Explicit plan path** — INPUT matches a file path (e.g., `specs/my-feature.md`). Read it directly.
2. **Explicit URL** — INPUT starts with `http://` or `https://`. Use this URL as the target and derive acceptance criteria from session context. Confirm criteria with AskUserQuestion before proceeding.
3. **Auto-find plan** — INPUT is empty. Look in SPECS_DIR for the most recently modified `.md` file (excluding `*-stories.md` files). If found, use it.
4. **Session context mode** — No plan found. Infer what was built from the conversation history. Use AskUserQuestion to confirm the inferred acceptance criteria and target URL before proceeding.

## Dev Server Detection

If no URL is specified in the plan or input, detect running dev servers:

```bash
for port in 3000 3001 3002 5173 5174 8080 8081 4200 4321; do
  curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" 2>/dev/null
done
```

If multiple servers respond, use AskUserQuestion to ask which one. If none respond, ask the user for a URL.

## Chrome Debug Readiness (Phase 0)

Before any verification, ensure Chrome is running with remote debugging enabled. Run these checks **automatically** at the start of every invocation:

1. **Check CDP endpoint**: `curl -s http://localhost:9222/json/version`
2. **If responding** — proceed to Phase 1.
3. **If not responding** — auto-launch Chrome with debugging:
   ```bash
   # Gracefully quit any existing Chrome
   osascript -e 'tell application "Google Chrome" to quit' 2>/dev/null
   sleep 3
   # Force kill stragglers
   pkill -f "Google Chrome" 2>/dev/null
   sleep 2
   # Launch with remote debugging (--user-data-dir is REQUIRED on modern Chrome)
   mkdir -p /tmp/chrome-debug-profile
   nohup /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 \
     --user-data-dir=/tmp/chrome-debug-profile \
     > /dev/null 2>&1 &
   # Wait for CDP endpoint
   for i in 1 2 3 4 5 6 7 8; do
     sleep 2
     if curl -s http://localhost:9222/json/version > /dev/null 2>&1; then
       break
     fi
   done
   ```
4. **Verify**: `curl -s http://localhost:9222/json/version` must return JSON. If it still fails after retries, inform the user and abort.

**Important**: The `--user-data-dir` flag is required because modern Chrome (v145+) silently ignores `--remote-debugging-port` when using the default profile directory. The debug profile at `/tmp/chrome-debug-profile` is separate from the user's regular Chrome profile.

## Workflow

### Phase 1: Plan Analysis

1. Read the plan and extract:
   - **Testing Promise** — verbatim from `## Testing Promise` section (or derive from criteria)
   - **Acceptance Criteria** — each criterion as a discrete verifiable item
   - **Target URLs** — any URLs mentioned in the plan
2. Parse each criterion into a verifiable check. Classify each as one of:
   - **Element check** — element exists, is visible, has expected dimensions/styles
   - **Text check** — element contains expected text content
   - **Interaction check** — clicking/filling triggers expected state change
   - **Network check** — action triggers expected API call with success response
   - **State check** — localStorage, sessionStorage, cookies contain expected values
3. Build a verification matrix: criterion -> check type -> expected result

### Phase 2: Connection & Baseline

1. `mcp__chrome_devtools__list_pages` — verify CDT connection
2. `mcp__chrome_devtools__navigate_page` — go to target URL
3. `mcp__chrome_devtools__wait_for` — wait for page load
4. `mcp__chrome_devtools__take_snapshot` — capture baseline accessibility tree
5. `mcp__chrome_devtools__list_console_messages` — record pre-existing console state
6. `mcp__chrome_devtools__list_network_requests` — record pre-existing network state

### Phase 3: Criterion-by-Criterion Verification

For each criterion, execute the appropriate verification strategy:

**Element checks:**
```javascript
// via evaluate_script
(() => {
  const el = document.querySelector('SELECTOR');
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    found: true,
    visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
    dimensions: { width: rect.width, height: rect.height },
    text: el.innerText?.substring(0, 200)
  };
})()
```

**Text checks:**
```javascript
// via evaluate_script
(() => {
  const el = document.querySelector('SELECTOR');
  return { found: !!el, text: el?.innerText?.substring(0, 500), includes: el?.innerText?.includes('EXPECTED_TEXT') };
})()
```

**Interaction checks:**
1. `mcp__chrome_devtools__click` or `mcp__chrome_devtools__fill` to perform action
2. `mcp__chrome_devtools__wait_for` to wait for result
3. `mcp__chrome_devtools__evaluate_script` to verify resulting state
4. `mcp__chrome_devtools__list_console_messages` to check for errors after action

**Network checks:**
1. Perform the triggering action
2. `mcp__chrome_devtools__list_network_requests` — verify expected endpoint was called
3. Check that the response status is 2xx

**State checks:**
```javascript
// via evaluate_script
(() => {
  return {
    localStorage: JSON.parse(JSON.stringify(localStorage)),
    sessionStorage: JSON.parse(JSON.stringify(sessionStorage)),
    cookies: document.cookie
  };
})()
```

Record PASS or FAIL for each criterion with evidence (what was found vs. what was expected).

### Phase 4: Health Checks (Automatic)

These run regardless of criterion results:

1. **Console health** — `mcp__chrome_devtools__list_console_messages`, filter for errors. Zero JS errors = CLEAN. Any errors = report count and details.
2. **Network health** — `mcp__chrome_devtools__list_network_requests`, filter for 4xx/5xx status codes. Zero failures = CLEAN. Any failures = report count and URLs.
3. **Performance baseline** (conditional) — If the plan mentions performance, load time, or speed:
   ```javascript
   // via evaluate_script
   (() => {
     const entries = performance.getEntriesByType('navigation');
     const paint = performance.getEntriesByType('paint');
     const lcp = performance.getEntriesByType('largest-contentful-paint');
     return {
       domContentLoaded: entries[0]?.domContentLoadedEventEnd,
       load: entries[0]?.loadEventEnd,
       firstPaint: paint.find(e => e.name === 'first-paint')?.startTime,
       firstContentfulPaint: paint.find(e => e.name === 'first-contentful-paint')?.startTime,
       lcp: lcp[lcp.length - 1]?.startTime
     };
   })()
   ```

### Phase 5: Report & Next Steps

Compile the verification report (see format below), then present to the user with AskUserQuestion:

- **Fix failures** — "Investigate and fix the failing criteria"
- **Run /cc-test-Playwright** — "Run full user story workflows via Playwright"
- **Run /devtools-diagnose** — "Run comprehensive runtime diagnostics"
- **Run /test** — "Write and run code-level tests"
- **Accept** — "Results acknowledged, no action needed"

## Report Format

```
CDT Verification Report

Plan: <path or "Session Context">
Testing Promise: <text>
URL: <url>
Status: PASSED | FAILED | PARTIAL

Acceptance Criteria Results:
| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | <text> | PASS | <what was found> |
| 2 | <text> | FAIL | Expected: <x>, Found: <y> |

Health Checks:
- Console: CLEAN | N errors
- Network: CLEAN | N failed requests
- Performance: LCP Xms, CLS X (if checked)

Summary: N/total criteria passed, N health issues
```

**Status logic:**
- **PASSED** — all criteria pass AND health checks are clean
- **FAILED** — any criterion fails OR critical health issues found
- **PARTIAL** — some criteria pass, some fail, no critical health issues
