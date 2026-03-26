---
name: cc-chrome-devtools
description: Chrome DevTools Protocol automation via MCP. Use for runtime inspection, console monitoring, network analysis, performance profiling, DOM evaluation, and deep browser diagnostics.
allowed-tools: ["Bash", "Read", "Write", "Glob", "Grep"]
---

# Chrome DevTools Skill

## When to Use This Skill

Use Chrome DevTools MCP when you need to diagnose what is happening inside a running browser:

- **Runtime inspection**: Console errors, JS exceptions, unhandled promise rejections
- **Network analysis**: Failed requests, slow responses, CORS errors, missing assets
- **Performance profiling**: Core Web Vitals, long tasks, layout shifts, memory leaks
- **DOM/CSS inspection**: Computed styles, layout debugging, element visibility
- **Multi-viewport testing**: Responsive behavior at different screen sizes
- **Accessibility auditing**: Heading hierarchy, ARIA attributes, focus order

**Key distinction: Playwright drives the browser. DevTools inspects it.**

Use Playwright for UI flow automation (click buttons, fill forms, navigate workflows). Use DevTools for runtime diagnostics -- pages that pass visual checks but are still broken underneath. If you need to test a user journey, use Playwright. If you need to investigate why something is failing at runtime, use DevTools.

## Key Principles

- **MCP tool-based (not CLI)** -- all interaction via `mcp__chrome_devtools__*` tool calls
- **Requires running Chrome** -- tools connect to a live browser instance
- **Page-oriented** -- work with tabs, not files
- **Snapshot-first** -- take `take_snapshot` before and after actions for state diffing
- **`evaluate_script` for custom queries** -- run arbitrary JS in page context
- **No persistent sessions** -- connects to live browser, no state files

## Quick Reference Table

| Task | Tool | Key Parameters |
|------|------|----------------|
| Open a URL | `navigate_page` | `url` |
| Capture page state | `take_snapshot` | -- |
| Capture visual | `take_screenshot` | optional path |
| Click an element | `click` | `selector` |
| Fill an input | `fill` | `selector`, `value` |
| Submit a form | `fill_form` | form data object |
| Run JavaScript | `evaluate_script` | `expression` |
| List open tabs | `list_pages` | -- |
| Switch tab | `select_page` | page ID/index |
| Check console | `list_console_messages` | optional type filter |
| Inspect request | `get_network_request` | request ID |
| Start profiling | `performance_start_trace` | optional categories |
| Resize viewport | `resize_page` | `width`, `height` |
| Simulate device | `emulate` | device name or viewport settings |
| Wait for state | `wait_for` | event or selector |

## Tool Domains

### Navigation & Interaction
`navigate_page`, `click`, `fill`, `fill_form`, `hover`, `press_key`, `drag`, `wait_for`, `handle_dialog`, `upload_file`

### Visual Capture
`take_screenshot`, `take_snapshot`, `resize_page`, `emulate`

### Console Monitoring
`list_console_messages`, `get_console_message`

### Network Analysis
`list_network_requests`, `get_network_request`

### Performance Profiling
`performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`

### Page/Tab Management
`list_pages`, `select_page`, `new_page`, `close_page`, `navigate_page_history`

### Scripting
`evaluate_script`

## Page Management

- Always `list_pages` first to see available tabs
- Use `select_page` to switch between tabs
- Use `new_page` for parallel inspection (e.g., comparing two pages)
- Use `close_page` to clean up when done
- Use `navigate_page_history` to go back/forward

## Common Patterns

### Console Error Triage
1. `list_console_messages` -- get all console output
2. Filter for errors and warnings
3. `get_console_message` for full details on each error
4. `evaluate_script` to inspect related DOM state or variable values

### Network Waterfall
1. `list_network_requests` -- get all network activity
2. Filter by status code (4xx/5xx) or response time (>1s)
3. `get_network_request` for headers, body, and timing on flagged requests
4. Check for CORS headers, missing auth tokens, redirect chains

### Performance Trace
1. `performance_start_trace` -- begin recording
2. Interact with the page (navigate, click, scroll)
3. `performance_stop_trace` -- end recording
4. `performance_analyze_insight` -- get analysis of the trace
5. `evaluate_script` to read Core Web Vitals (LCP, CLS, FID/INP)

### DOM/CSS Extraction
1. `evaluate_script` with `getComputedStyle()` queries
2. `evaluate_script` with `document.querySelector()` chains
3. Compare element dimensions, visibility, z-index across states

### Multi-Viewport Testing
1. `resize_page` to target dimensions (desktop, tablet, mobile)
2. `take_screenshot` at each size
3. `take_snapshot` for structural comparison
4. `evaluate_script` to check for horizontal overflow

## Connection Verification

Always verify connection with `list_pages` first. If it fails:

1. Check that Chrome is running
2. Chrome DevTools MCP server should auto-connect on next tool call
3. Try `take_snapshot` as a second attempt
4. If still failing, check MCP server configuration

## Best Practices

1. **Snapshots before screenshots** -- snapshots are text-based and token-efficient; use screenshots only when visual layout matters
2. **Batch queries via `evaluate_script`** -- one script call that returns multiple values beats multiple separate DOM queries
3. **Filter before diving deep** -- `list_console_messages` before `get_console_message`; `list_network_requests` before `get_network_request`
4. **Save artifacts to disk** -- screenshots and traces can be large; write them to files rather than keeping in context
5. **Use `emulate` for device simulation** -- provides user agent and touch events, not just viewport resize
6. **Check console after every navigation** -- catch errors early before they cascade
7. **Use `wait_for` before inspecting dynamic content** -- ensure the page has settled before reading state

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Chrome not connected | Verify Chrome is running; check MCP server config |
| Stale page references | Re-call `list_pages` to refresh page list |
| Script execution timing | Use `wait_for` before `evaluate_script` on dynamic content |
| Missing network data | Start monitoring before navigation, not after |
| Performance traces too large | Keep trace duration short; focus on specific interactions |
| Element not found | Use `take_snapshot` to verify element exists in accessibility tree |
| Dialog blocking execution | Use `handle_dialog` to accept/dismiss before continuing |
