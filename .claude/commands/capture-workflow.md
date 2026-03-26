---
name: capture-workflow
description: Record Chrome browser interactions and generate reusable automation slash commands
argument-hint: "[workflow-name]"
model: sonnet
---

# Capture Workflow

Record browser interactions in Chrome via Chrome DevTools MCP, capture each step intelligently, then generate a reusable skill file that becomes its own invocable `/command`.

## Variables

WORKFLOW_NAME: $1 — Optional kebab-case name for the workflow (e.g., "login-admin"). If not provided, ask the user.

## Architecture

This command uses a **snapshot-diff approach**:
1. Take an accessibility snapshot BEFORE user acts
2. User performs action in browser and describes it
3. Take an accessibility snapshot AFTER
4. Diff the two snapshots to detect exactly what changed
5. Translate changes into a reproducible automation step with semantic selectors

This produces high-quality selectors naturally because the accessibility tree contains roles, names, and states.

## Workflow Data Model

Maintain this internal representation throughout the session:

```
Workflow:
  name: string              # kebab-case identifier
  description: string       # human-readable summary (ask user at end)
  startUrl: string          # URL when recording started
  steps: Step[]             # ordered captured actions

Step:
  number: number
  action: navigate | click | fill | select | wait_for_text | wait_for_element | assert_text | assert_element | screenshot | press_key
  selector: string          # semantic selector (ARIA role + name preferred)
  selectorFallback: string  # CSS fallback selector
  value: string | null      # for fill/select actions
  description: string       # human-readable description
  isSensitive: boolean      # true for password/secret fields
  screenshotAfter: boolean  # capture screenshot after this step
```

## Phase 1: Initialization

Execute these steps in order:

### 1. Test Browser Connection

Call `mcp__chrome_devtools__list_pages` to verify Chrome DevTools MCP is connected and a browser is available.

**If connection fails:**
```
I couldn't connect to a browser. To use /cc-capture-workflow:

1. Make sure Chrome is running
2. The Chrome DevTools MCP server should auto-connect on the next tool call

Let me try connecting again...
```

Try `mcp__chrome_devtools__take_snapshot` as a second attempt. If that also fails, tell the user to check their MCP configuration and stop.

### 2. Get Workflow Name

If `WORKFLOW_NAME` was provided as an argument, use it. Otherwise ask:

```
What should we call this workflow?
Use lowercase-with-hyphens (e.g., "login-admin", "submit-report", "check-inventory")
```

Validate the name:
- Must be kebab-case (lowercase letters, numbers, hyphens only)
- No spaces, underscores, or special characters
- 2-50 characters
- If invalid, explain the format and ask again

### 3. Take Initial Snapshot and Record Start URL

Call `mcp__chrome_devtools__take_snapshot` to capture the initial state.

Extract the current URL from the snapshot. Store it as `startUrl`.

Call `mcp__chrome_devtools__take_screenshot` to capture the visual starting state.

Display to user:
```
Recording: /[workflow-name]

Current page: [URL]
Browser state captured.

Start interacting with your browser. After each action, tell me what you did.

Examples:
  "clicked the login button"
  "typed my email in the username field"
  "selected 'United States' from the country dropdown"
  "navigated to /settings"
  "pressed Enter"

Say "done" when finished recording.
```

## Phase 2: Capture Loop

This is the core recording loop. Repeat until the user says "done":

### For Each User Action:

**Step A: User describes what they did**

Wait for user input. The user will describe their browser action in natural language.

If user says "done", "finished", "that's it", or "stop" -> go to Phase 3 (Review).
If user says "screenshot" -> take a screenshot with `mcp__chrome_devtools__take_screenshot`, add a screenshot step, continue loop.
If user says "undo" or "remove last" -> remove the last captured step, continue loop.

**Step B: Take a new snapshot**

Call `mcp__chrome_devtools__take_snapshot` to capture the current browser state AFTER the user's action.

**Step C: Diff the snapshots**

Compare the BEFORE snapshot (from previous iteration or initialization) with the AFTER snapshot:

1. **URL Change Detection**: Compare URLs between snapshots. If different:
   - Action: `navigate`
   - Record the new URL

2. **Form Field Value Changes**: Look for text inputs, textareas, and other form elements whose values differ:
   - Action: `fill`
   - Record the element selector and the new value
   - Check if the field is a password type -> set `isSensitive: true`

3. **Focus/Selection Changes**: Look for elements that gained focus, got selected, or changed state:
   - Action: `click`
   - Record the element that was interacted with

4. **Dropdown/Select Changes**: Look for select elements or comboboxes with different selected values:
   - Action: `select`
   - Record the element and selected option

5. **New Elements Appearing**: If significant new content appeared (new page section, modal, etc.):
   - This is often the RESULT of a click or navigation
   - Note it as context but don't create a separate step unless it's a wait condition

6. **Keyboard Actions**: If user mentions pressing a key (Enter, Tab, Escape, etc.):
   - Action: `press_key`
   - Record the key name

**Step D: Generate Smart Selector**

For the target element, generate a selector using this priority order:

1. **ARIA role + accessible name** (BEST): `role: button, name: "Login"` -> selector: `button "Login"`
2. **Test ID attributes**: `[data-testid="login-btn"]`, `[data-cy="login"]`, `[data-test="login"]`
3. **Label association**: For form fields, use the associated label text
4. **Semantic HTML**: `<button>Submit</button>` -> `button "Submit"`
5. **CSS selector** (LAST RESORT): `#login-btn`, `.btn-primary`

From the accessibility snapshot, extract:
- `role` property -> maps to ARIA role
- `name` property -> maps to accessible name
- Use format: `[role] "[name]"` for the primary selector

Store a CSS fallback selector as `selectorFallback` for resilience.

**Step E: Detect and Mask Sensitive Data**

Check if the element is a password field or contains sensitive data:

- **Password fields**: If the accessibility snapshot shows a textbox associated with "password" in its name or the field type is password:
  - Set `isSensitive: true`
  - Replace the value with `***MASKED***` in the step display
  - The generated skill will prompt the user for this value at runtime

- **Credit card patterns**: If value matches `\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}`, mask it
- **SSN patterns**: If value matches `\d{3}-\d{2}-\d{4}`, mask it
- **Email in password context**: If filling a field after a password field on what looks like a signup form, warn the user

If sensitive data detected, display:
```
[Sensitive data detected - value masked for security]
```

**Step F: Check for Action Merging**

Look at the current step and the previous step. If they can be merged:

- **Click on input + Type** -> merge into single `fill` action
  - If previous step was `click` on an input/textbox AND current step is `fill` on the same element
  - Merge into: `fill [element] with "[value]"`
  - Remove the redundant click step

- **Multiple types on same element** -> merge into single `fill`
  - If previous step was `fill` on same element and current is also `fill` on same element
  - Keep only the latest value

When merging, inform the user:
```
(merged with previous click into a single fill action)
```

**Step G: Display the Captured Step**

Show the step to the user:

```
Step [N]: [action] [description]
  Selector: [role] "[name]"
  [Value: "value" | Value: ***MASKED***]
```

Example:
```
Step 3: Fill username field
  Selector: textbox "Username"
  Value: "admin@example.com"
```

**Step H: Update baseline snapshot**

The AFTER snapshot becomes the BEFORE snapshot for the next iteration.

Continue the loop.

## Phase 3: Review

When user says "done", present the complete workflow summary.

### 3.1 Ask for Description

```
What does this workflow do? (one sentence)
Example: "Logs into the admin dashboard and navigates to reports"
```

### 3.2 Present Workflow Summary

```
/[workflow-name] - "[description]"

Captured Steps:
  1. [action] - [description] [selector]
  2. [action] - [description] [selector] [value or MASKED]
  ...

```

### 3.3 Present Options

Use the `AskUserQuestion` tool to present these choices:

- **Save** - Create the `/[workflow-name]` skill command
- **Test replay** - Run through the workflow to verify it works
- **Edit steps** - Modify, delete, or reorder captured steps
- **Add validation** - Add assertions to verify success (check for text, element, URL)
- **Discard** - Cancel without saving

### If user selects "Test replay":

Execute the workflow step-by-step using Chrome DevTools MCP tools:

For each step, call the corresponding MCP tool:
- `navigate` -> `mcp__chrome_devtools__navigate_page` with the URL
- `click` -> `mcp__chrome_devtools__click` with the selector (use ref from snapshot element, or describe the element for Chrome DevTools to find)
- `fill` -> `mcp__chrome_devtools__fill` with the text value (click the field first if needed)
- `select` -> `mcp__chrome_devtools__fill` with the value
- `wait_for_text` -> `mcp__chrome_devtools__take_snapshot` then check for the text in the snapshot
- `wait_for_element` -> `mcp__chrome_devtools__take_snapshot` then check for the element
- `assert_text` -> `mcp__chrome_devtools__take_snapshot` then verify text present
- `assert_element` -> `mcp__chrome_devtools__take_snapshot` then verify element present
- `screenshot` -> `mcp__chrome_devtools__take_screenshot`
- `press_key` -> `mcp__chrome_devtools__press_key` with the key name

For each step, report:
```
Step [N]: [description]... [PASS] or [FAIL: reason]
```

For **sensitive (masked) fields**: Ask the user for the value before replaying:
```
Step [N] requires a masked value for [field description].
Please enter the value (it will be used for replay only, not stored):
```

If any step fails:
```
Step [N] failed: [error message]

Options:
- Retry this step
- Edit the selector for this step
- Skip and continue
- Abort replay
```

After successful replay:
```
All [N] steps passed! The workflow replays correctly.
```

Then return to the options menu.

### If user selects "Edit steps":

Ask which step to edit, then present options:
- Change the selector
- Change the value
- Change the action type
- Delete this step
- Move step up/down

After editing, show the updated workflow and return to options.

### If user selects "Add validation":

Take a snapshot of the current page state with `mcp__chrome_devtools__take_snapshot`.

Analyze the page and suggest validations:

1. **URL check**: "The current URL is [url]. Add a URL validation?"
2. **Text check**: Look for prominent text in the snapshot and suggest: "I see '[text]' on the page. Add a text assertion?"
3. **Element check**: Look for notable elements (success messages, user menus, dashboards) and suggest: "Element [description] is present. Add an element assertion?"

Use `AskUserQuestion` to let the user pick which validations to add. For each selected validation, append as assertion steps to the workflow.

Then return to the options menu.

### If user selects "Discard":

Confirm with user:
```
Are you sure you want to discard this workflow? All captured steps will be lost.
```

If confirmed, end the session.

## Phase 4: Save

When user selects "Save", generate the skill file.

### 4.1 Create Skill Directory

Create the directory structure:
```
~/.claude/skills/[workflow-name]/
~/.claude/skills/[workflow-name]/screenshots/    (if any screenshots were captured)
```

Use the `Bash` tool with `mkdir -p`.

### 4.2 Generate SKILL.md

Write the skill file to `~/.claude/skills/[workflow-name]/SKILL.md` using the `Write` tool.

**IMPORTANT TEMPLATE** - Generate the SKILL.md with this structure:

```markdown
---
name: [workflow-name]
description: [user's description of what the workflow does]
---

# [Workflow Name in Title Case]

[Description]. Recorded with /cc-capture-workflow.

## Prerequisites

- Chrome DevTools MCP server must be running (configured in settings.json)
- Chrome browser available for automation

## Workflow Steps

Execute these steps in order using Chrome DevTools MCP tools. Take a `take_snapshot` before the first step to establish baseline state.

[For each captured step, generate a subsection:]

### Step [N]: [Human-readable description]

**Action:** [action type]
**Tool:** `mcp__chrome_devtools__[tool_name]`
**Selector:** [semantic selector] (fallback: [CSS selector])
[If has value:] **Value:** [value or "PROMPT_USER" for masked fields]
[If sensitive:] **SENSITIVE:** This field contains masked data. Ask the user for the value at runtime. Do NOT store or log the value.

[For navigate steps:]
### Step [N]: Navigate to [url]

**Action:** navigate
**Tool:** `mcp__chrome_devtools__navigate_page`
**URL:** `[url]`

Wait for the page to fully load. Take a snapshot to confirm navigation succeeded.

[For fill steps:]
### Step [N]: Fill [field description]

**Action:** fill
**Tool:** `mcp__chrome_devtools__click` then `mcp__chrome_devtools__fill`
**Selector:** [semantic selector]
**Value:** "[value]"

Click the field first to focus it, then type the value.

[For click steps:]
### Step [N]: Click [element description]

**Action:** click
**Tool:** `mcp__chrome_devtools__click`
**Selector:** [semantic selector]

[For select steps:]
### Step [N]: Select "[value]" from [element description]

**Action:** select
**Tool:** `mcp__chrome_devtools__fill`
**Selector:** [semantic selector]
**Value:** "[selected value]"

[For wait/assert steps:]
### Step [N]: Verify [condition]

**Action:** [assert_text/assert_element/wait_for_text/wait_for_element]
**Tool:** `mcp__chrome_devtools__take_snapshot`
**Check for:** [text content or element description]

Take a snapshot and verify that [condition]. If not found within 10 seconds, report failure.

[For screenshot steps:]
### Step [N]: Take screenshot

**Action:** screenshot
**Tool:** `mcp__chrome_devtools__take_screenshot`

Save for verification.

[For press_key steps:]
### Step [N]: Press [key name]

**Action:** press_key
**Tool:** `mcp__chrome_devtools__press_key`
**Key:** "[key name]"
```

## Completion

After all steps execute successfully:
1. Take a final screenshot with `mcp__chrome_devtools__take_screenshot`
2. Report: "Workflow /[workflow-name] completed successfully. [N] steps executed."

## Error Handling

- If any step fails, immediately take a screenshot for debugging
- Report which step failed and the specific error message
- For element-not-found errors: try the fallback CSS selector
- For timeout errors: wait an additional 5 seconds and retry once
- If a step requires masked/sensitive data and none is provided, ask the user

## Notes

- Recorded: [current date]
- Start URL: [startUrl]
[If has sensitive fields:] - Contains masked sensitive fields that require user input at runtime
- Selectors use semantic/accessible identifiers for resilience
```

## Error Handling Throughout

### Browser Disconnection
If any Chrome DevTools MCP tool call fails with a connection error during capture:
```
Lost connection to the browser. This can happen if:
- Chrome was closed
- The tab was navigated away
- The Chrome DevTools MCP server stopped

Options:
- Try reconnecting (I'll call browser_tabs to test)
- Save what we have so far ([N] steps captured)
- Discard and start over
```

### No Changes Detected
If the BEFORE and AFTER snapshots are identical:
```
I didn't detect any changes in the browser state.

Possible reasons:
- The action might not have completed yet (try waiting a moment)
- The change might be visual only (not reflected in accessibility tree)
- The action might have failed

What would you like to do?
- Describe the action again (I'll take a fresh snapshot)
- Skip this action and continue
- Manually specify the step (I'll ask for action type, selector, and value)
```

### Empty Workflow
If user says "done" with zero steps captured:
```
No steps were captured yet. Would you like to:
- Continue recording (interact with browser and tell me what you do)
- Discard this session
```

## Important Rules

1. **NEVER store passwords or sensitive values in plain text** - Always mask with `***MASKED***`
2. **NEVER include API keys, tokens, or secrets in generated files**
3. **Always prefer semantic selectors** (ARIA roles + names) over CSS selectors
4. **Always take snapshots** before and after actions for accurate diffing
5. **Be conversational** - Guide the user through each step, explain what you detected
6. **Handle errors gracefully** - Never leave the user in a broken state
7. **Validate before saving** - Offer test replay to catch issues early
