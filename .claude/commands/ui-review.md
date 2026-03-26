---
name: ui-review
description: AI-powered UI review with vision - captures screenshots and provides design analysis
argument-hint: "[pages...] [--click selector] [--fill selector=value] [--submit selector]"
subagent: ui-reviewer
disallowed-tools: []
---

# Purpose

Perform AI-powered UI reviews by capturing screenshots of web pages and analyzing them with vision capabilities. This command gives Claude "vision" when working on UI designs, providing actionable design feedback.

## Variables

`you`: you — The pages to review (paths like "/about", "/dashboard" or full URLs like "http://localhost:3000/about"). Multiple pages can be specified separated by spaces or commas. The AI will also attempt to derive URLs from the context of your prompt.

`help`: help — Optional additional context or specific aspects to focus on in the review (e.g., "check accessibility", "focus on mobile layout", "compare with previous design")

`--click`: click — CSS selector of element(s) to click before capturing (can be used multiple times, e.g., `--click #menu-btn --click .dropdown`)

`--fill`: fill — Fill form fields before capturing, format: `--fill "selector=value"` (can be used multiple times, e.g., `--fill "#email=test@example.com" --fill "#password=secret"`)

`--submit`: submit — CSS selector of form to submit after filling (e.g., `--submit #login-form`)

`--hover`: hover — CSS selector of element(s) to hover before capturing (can be used multiple times)

## Instructions

When this command is invoked, follow these steps:

### 1. Load Configuration

Check for configuration file at `.claude/ui-review.json`. If it exists, load these defaults:
- `serverCommand`: Command to start the dev server (e.g., "npm run dev")
- `baseUrl`: Base URL for the dev server (e.g., "http://localhost:3000")
- `viewports`: Array of viewport configurations (default: desktop, tablet, mobile)
- `outputDir`: Where to save screenshots (default: "screenshots/ui-review-{timestamp}/")

### 2. Parse Arguments

Extract the following from the user's prompt:

**Page URLs:**
- If user provides paths like "/about" or "dashboard", prepend the base URL
- If user provides full URLs (with protocol), use them as-is
- If no explicit pages found, look for contextual clues (e.g., "review the homepage" → "/")
- If still unclear, ask the user which page(s) to review

**Interaction Options:**
- `--click selector`: Extract all click selectors (can appear multiple times)
- `--fill "selector=value"`: Extract all fill operations (can appear multiple times)
- `--submit selector`: Extract form submit selector
- `--hover selector`: Extract all hover selectors (can appear multiple times)

Store these interactions in order - they will be executed sequentially before capturing screenshots.

### 3. Ensure Server is Running

Check if the development server is already running:
- Try to fetch the base URL
- If successful, server is already running
- If failed, attempt to auto-detect and start the server:
  1. Check `package.json` for common scripts: `dev`, `start`, `serve`
  2. If config has `serverCommand`, use that
  3. Start the server in the background
  4. Wait for server to be ready (poll for 30 seconds max)

### 4. Create Output Directory

Create the screenshots directory with timestamp:
```
screenshots/ui-review-{YYYY-MM-DD-HHMMSS}/
```

### 5. Spawn Parallel Screenshot Agents

For each page specified, spawn a `ui-reviewer` subagent in parallel:

**Agent Configuration:**
- Type: `ui-reviewer`
- Task: Execute interactions then capture screenshots at all configured viewports
- Parameters per agent:
  - `url`: Full URL to capture
  - `viewports`: Array of {name, width, height} objects
  - `outputDir`: Directory to save screenshots
  - `sessionName`: Derived from page name (e.g., "home", "about")
  - `interactions`: Array of interaction objects in execution order:
    - `{ type: "click", selector: "..." }`
    - `{ type: "fill", selector: "...", value: "..." }`
    - `{ type: "submit", selector: "..." }`
    - `{ type: "hover", selector: "..." }`

**Default Viewports:**
- Desktop: 1280x720
- Tablet: 768x1024
- Mobile: 375x667

### 6. Collect Screenshot Results

Wait for all parallel agents to complete. Collect:
- Screenshot file paths for each viewport
- Any errors encountered

### 7. Analyze Screenshots with Vision

For each captured screenshot, use vision capabilities to analyze:
- Overall layout and visual hierarchy
- Typography choices and readability
- Color scheme and contrast
- Spacing and alignment
- Component consistency
- Mobile responsiveness issues
- Visual polish and attention to detail

### 8. Generate Report

Create a comprehensive markdown report with:
- Executive summary of findings
- Per-page analysis with embedded screenshots
- Specific recommendations with severity (critical, warning, suggestion)
- Positive highlights (what's working well)

Save report to:
```
screenshots/ui-review-{timestamp}/report.md
```

### 9. Output Summary to Terminal

Print a concise summary including:
- Pages reviewed
- Viewports captured
- Screenshot directory location
- Key findings (top 3-5 items)
- Link to full report

## Output Format

### Terminal Summary

```
UI Review Complete
==================

Pages Reviewed: <count>
- <page 1>: <url>
- <page 2>: <url>
...

Viewports: Desktop (1280x720), Tablet (768x1024), Mobile (375x667)

Screenshots: <absolute-path>/screenshots/ui-review-<timestamp>/

Key Findings:
🔴 Critical: <critical issue 1>
🟡 Warning: <warning 1>
🟡 Warning: <warning 2>
💡 Suggestion: <suggestion 1>

Full Report: <path-to-report.md>
```

### Report File Structure

```markdown
# UI Review Report

Generated: <timestamp>
Pages: <count>
Viewports: <list>

## Summary

<executive summary>

## Page: <page-name>

URL: <url>

### Desktop (1280x720)
![Desktop Screenshot](./<page>-desktop.png)

**Analysis:**
- <finding 1>
- <finding 2>

### Tablet (768x1024)
![Tablet Screenshot](./<page>-tablet.png)

**Analysis:**
- <finding 1>

### Mobile (375x667)
![Mobile Screenshot](./<page>-mobile.png)

**Analysis:**
- <finding 1>

## Recommendations

### Critical
1. <recommendation with rationale>

### Warnings
1. <recommendation>

### Suggestions
1. <recommendation>

## Positive Highlights

- <what's working well>
```

## Configuration File

Example `.claude/ui-review.json`:

```json
{
  "serverCommand": "npm run dev",
  "baseUrl": "http://localhost:3000",
  "viewports": [
    { "name": "desktop", "width": 1280, "height": 720 },
    { "name": "tablet", "width": 768, "height": 1024 },
    { "name": "mobile", "width": 375, "height": 667 }
  ],
  "outputDir": "screenshots/ui-review"
}
```

## Examples

### Review single page
```
/cc-ui-review home
/cc-ui-review /
/cc-ui-review http://localhost:3000/dashboard
```

### Review multiple pages
```
/cc-ui-review home about contact
/cc-ui-review / /about /dashboard /settings
```

### With interactions (click, fill, submit)
```
/cc-ui-review /login --fill "#email=test@example.com" --fill "#password=demo123" --submit "form"
/cc-ui-review /dashboard --click "#menu-btn" --click ".dropdown-item"
/cc-ui-review /products --hover ".product-card" --click ".product-card:first-child"
```

### With additional context
```
/cc-ui-review dashboard -- check the new chart components
/cc-ui-review home about -- focus on mobile layout issues
```

## Validation

- Configuration file is valid JSON (if present)
- At least one page URL is resolved
- Server is running or successfully started
- All screenshots are captured successfully
- Report file is created and contains expected sections

## Report

After completion, provide:

```
UI Review Complete

Pages Reviewed: <count>
Screenshots: <count> (<count> per page × <viewport-count> viewports)
Output Directory: <path>

Key Findings:
- <finding 1>
- <finding 2>
- ...

Full report saved to: <report-path>
```
