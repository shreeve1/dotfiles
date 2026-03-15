---
name: web-browser
description: Allows to interact with web pages by performing actions such as clicking buttons, filling out forms, and navigating links. It works by remote controlling Google Chrome or Chromium browsers using the Chrome DevTools Protocol (CDP). When Claude needs to browse the web, it can use this skill to do so.
compatibility: adapted-for-opencode
metadata:
  source: /Users/james/.pi/agent/skills/web-browser/SKILL.md
  original_name: web-browser
---

# Web Browser Skill

Converted from `/Users/james/.pi/agent/skills/web-browser/SKILL.md`. Imported as `web-browser` for OpenCode.

## Compatibility Notes

- This is an imported OpenCode-adapted copy of a skill from `~/.opencode/agent/skills/`.
- Tool names were rewritten to the closest OpenCode equivalents where possible.
- If this skill mentions pi-only capabilities such as persistent vector memory, background subagents, or plan-state helpers, use local files, `task`, `todowrite`, and `read`/`grep` as the closest OpenCode-native substitutes.

---

Minimal CDP tools for collaborative site exploration.

## Start Chrome

```bash
./scripts/start.js              # Fresh profile
./scripts/start.js --profile    # Copy your profile (cookies, logins)
```

Start Chrome on `:9222` with remote debugging.

## Navigate

```bash
./scripts/nav.js https://example.com
./scripts/nav.js https://example.com --new
```

Navigate current tab or open new tab.

## Evaluate JavaScript

```bash
./scripts/eval.js 'document.title'
./scripts/eval.js 'document.querySelectorAll("a").length'
./scripts/eval.js 'JSON.stringify(Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent.trim(), href: a.href })).filter(link => !link.href.startsWith("https://")))'
```

Execute JavaScript in active tab (async context).  Be careful with string escaping, best to use single quotes.

## Screenshot

```bash
./scripts/screenshot.js
```

Screenshot current viewport, returns temp file path

## Pick Elements

```bash
./scripts/pick.js "Click the submit button"
```

Interactive element picker. Click to select, Cmd/Ctrl+Click for multi-select, Enter to finish.

## Dismiss Cookie Dialogs

```bash
./scripts/dismiss-cookies.js          # Accept cookies
./scripts/dismiss-cookies.js --reject # Reject cookies (where possible)
```

Automatically dismisses EU cookie consent dialogs.

Run after navigating to a page:
```bash
./scripts/nav.js https://example.com && ./scripts/dismiss-cookies.js
```

## Background Logging (Console + Errors + Network)

Automatically started by `start.js` and writes JSONL logs to:

```
~/.cache/agent-web/logs/YYYY-MM-DD/<targetId>.jsonl
```

Manually start:
```bash
./scripts/watch.js
```

Tail latest log:
```bash
./scripts/logs-tail.js           # dump current log and exit
./scripts/logs-tail.js --follow  # keep following
```

Summarize network responses:
```bash
./scripts/net-summary.js
```
