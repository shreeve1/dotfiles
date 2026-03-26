# Chrome DevTools MCP Tool Reference

All tools are invoked as `mcp__chrome_devtools__<tool_name>`. They require a running Chrome browser connected via the Chrome DevTools MCP server.

---

## Navigation & Interaction

### navigate_page

Navigate to a URL in the current page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The URL to navigate to |

**Example:**
`mcp__chrome_devtools__navigate_page` with `url: "http://localhost:3000"`

**Returns:** Page title, URL, and load status.

---

### click

Click on an element in the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selector | string | Yes | CSS selector or element descriptor to click |

**Example:**
`mcp__chrome_devtools__click` with `selector: "#submit-button"`

**Returns:** Confirmation of click action.

---

### fill

Fill a value into an input element.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selector | string | Yes | CSS selector for the input element |
| value | string | Yes | The value to fill into the input |

**Example:**
`mcp__chrome_devtools__fill` with `selector: "#email"`, `value: "user@example.com"`

**Returns:** Confirmation of fill action.

---

### fill_form

Fill multiple form fields at once.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| formData | object | Yes | Key-value pairs mapping selectors to values |

**Example:**
`mcp__chrome_devtools__fill_form` with `formData: {"#name": "Jane Doe", "#email": "jane@example.com", "#message": "Hello"}`

**Returns:** Confirmation of form fill with field count.

---

### hover

Hover over an element in the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selector | string | Yes | CSS selector or element descriptor to hover over |

**Example:**
`mcp__chrome_devtools__hover` with `selector: ".dropdown-trigger"`

**Returns:** Confirmation of hover action.

---

### press_key

Press a keyboard key.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | Key name (e.g., "Enter", "Tab", "Escape", "ArrowDown") |

**Example:**
`mcp__chrome_devtools__press_key` with `key: "Enter"`

**Returns:** Confirmation of key press.

---

### drag

Drag an element or from one position to another.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startSelector | string | Yes | CSS selector or coordinates for the drag start |
| endSelector | string | Yes | CSS selector or coordinates for the drag end |

**Example:**
`mcp__chrome_devtools__drag` with `startSelector: "#draggable"`, `endSelector: "#drop-zone"`

**Returns:** Confirmation of drag action.

---

### wait_for

Wait for a specific condition before proceeding.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| event | string | Yes | What to wait for: a CSS selector, text content, or event type ("networkidle", "load", "domcontentloaded") |
| timeout | number | No | Maximum wait time in milliseconds |

**Example:**
`mcp__chrome_devtools__wait_for` with `event: "networkidle"`

**Example:**
`mcp__chrome_devtools__wait_for` with `event: "#results-table"`, `timeout: 5000`

**Returns:** Confirmation that the condition was met.

---

### handle_dialog

Handle a browser dialog (alert, confirm, prompt).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accept | boolean | Yes | Whether to accept (true) or dismiss (false) the dialog |
| text | string | No | Text to enter into a prompt dialog |

**Example:**
`mcp__chrome_devtools__handle_dialog` with `accept: true`

**Example:**
`mcp__chrome_devtools__handle_dialog` with `accept: true`, `text: "user input"`

**Returns:** Confirmation of dialog handling.

---

### upload_file

Upload a file via a file input element.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selector | string | Yes | CSS selector for the file input element |
| filePaths | array | Yes | Array of absolute file paths to upload |

**Example:**
`mcp__chrome_devtools__upload_file` with `selector: "#file-input"`, `filePaths: ["/Users/james/test-data/image.png"]`

**Returns:** Confirmation of file upload.

---

## Visual Capture

### take_screenshot

Capture a screenshot of the current page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filename | string | No | File path to save the screenshot |

**Example:**
`mcp__chrome_devtools__take_screenshot` with `filename: "/tmp/homepage.png"`

**Returns:** Screenshot image data or file path confirmation.

---

### take_snapshot

Capture the accessibility tree snapshot of the current page. This is a text-based representation of the page structure -- more token-efficient than screenshots for understanding page state.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | -- | -- | No required parameters |

**Example:**
`mcp__chrome_devtools__take_snapshot`

**Returns:** Text representation of the page accessibility tree including roles, names, values, and hierarchy.

---

### resize_page

Resize the browser viewport to specific dimensions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| width | number | Yes | Viewport width in pixels |
| height | number | Yes | Viewport height in pixels |

**Example:**
`mcp__chrome_devtools__resize_page` with `width: 375`, `height: 667`

**Returns:** Confirmation of viewport resize.

---

### emulate

Emulate a specific device with viewport, user agent, and device capabilities.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| deviceName | string | No | Predefined device name (e.g., "iPhone 12", "iPad Pro", "Pixel 5") |
| viewport | object | No | Custom viewport: `{width, height}` |
| userAgent | string | No | Custom user agent string |

**Example:**
`mcp__chrome_devtools__emulate` with `deviceName: "iPhone 12"`

**Example:**
`mcp__chrome_devtools__emulate` with `viewport: {"width": 1024, "height": 768}`, `userAgent: "CustomBot/1.0"`

**Returns:** Confirmation of device emulation settings applied.

---

## Console Monitoring

### list_console_messages

List console messages captured from the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by message type: "log", "warning", "error", "info", "debug" |

**Example:**
`mcp__chrome_devtools__list_console_messages`

**Example:**
`mcp__chrome_devtools__list_console_messages` with `type: "error"`

**Returns:** Array of console messages with type, text preview, and message ID.

---

### get_console_message

Get full details of a specific console message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messageId | string | Yes | The ID of the console message to retrieve |

**Example:**
`mcp__chrome_devtools__get_console_message` with `messageId: "msg-42"`

**Returns:** Full message text, type, source location (file, line, column), stack trace if available, and timestamp.

---

## Network Analysis

### list_network_requests

List network requests captured from the page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| statusCode | number | No | Filter by HTTP status code |
| resourceType | string | No | Filter by type: "document", "stylesheet", "script", "image", "fetch", "xhr", "font", "websocket" |

**Example:**
`mcp__chrome_devtools__list_network_requests`

**Example:**
`mcp__chrome_devtools__list_network_requests` with `statusCode: 404`

**Returns:** Array of requests with URL, method, status code, resource type, and request ID.

---

### get_network_request

Get full details of a specific network request.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requestId | string | Yes | The ID of the network request to retrieve |

**Example:**
`mcp__chrome_devtools__get_network_request` with `requestId: "req-17"`

**Returns:** Full request and response details: URL, method, request headers, response headers, status code, response body (if available), timing information.

---

## Performance Profiling

### performance_start_trace

Start recording a performance trace.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categories | array | No | Trace categories to enable (e.g., ["loading", "scripting", "rendering"]) |

**Example:**
`mcp__chrome_devtools__performance_start_trace`

**Example:**
`mcp__chrome_devtools__performance_start_trace` with `categories: ["loading", "scripting"]`

**Returns:** Confirmation that tracing has started.

---

### performance_stop_trace

Stop the current performance trace recording.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | -- | -- | No required parameters |

**Example:**
`mcp__chrome_devtools__performance_stop_trace`

**Returns:** Trace data summary or reference for use with `performance_analyze_insight`.

---

### performance_analyze_insight

Analyze a captured performance trace and provide insights.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| traceData | string | No | Reference to trace data from `performance_stop_trace` |

**Example:**
`mcp__chrome_devtools__performance_analyze_insight`

**Returns:** Analysis results including long tasks, layout shifts, resource loading bottlenecks, and optimization suggestions.

---

## Page/Tab Management

### list_pages

List all open pages/tabs in the connected Chrome instance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | -- | -- | No required parameters |

**Example:**
`mcp__chrome_devtools__list_pages`

**Returns:** Array of pages with page ID, title, URL, and active status.

---

### select_page

Switch to a specific page/tab.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pageId | string | Yes | The ID of the page to select (from `list_pages`) |

**Example:**
`mcp__chrome_devtools__select_page` with `pageId: "page-3"`

**Returns:** Confirmation of page switch with new page title and URL.

---

### new_page

Open a new tab, optionally navigating to a URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | No | URL to navigate to in the new tab |

**Example:**
`mcp__chrome_devtools__new_page` with `url: "http://localhost:3000/admin"`

**Returns:** New page ID, title, and URL.

---

### close_page

Close a page/tab.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pageId | string | No | The ID of the page to close (defaults to current page) |

**Example:**
`mcp__chrome_devtools__close_page` with `pageId: "page-3"`

**Returns:** Confirmation of page closure.

---

### navigate_page_history

Navigate forward or backward in the current page's history.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| direction | string | Yes | Navigation direction: "back" or "forward" |

**Example:**
`mcp__chrome_devtools__navigate_page_history` with `direction: "back"`

**Returns:** New page URL and title after navigation.

---

## Scripting

### evaluate_script

Execute JavaScript in the context of the current page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| expression | string | Yes | JavaScript expression or code to evaluate |

**Example:**
`mcp__chrome_devtools__evaluate_script` with `expression: "document.title"`

**Example:**
`mcp__chrome_devtools__evaluate_script` with `expression: "JSON.stringify(performance.getEntriesByType('navigation')[0])"`

**Example (batch DOM queries):**
`mcp__chrome_devtools__evaluate_script` with `expression: "JSON.stringify({title: document.title, h1Count: document.querySelectorAll('h1').length, brokenImages: [...document.images].filter(i => !i.complete || !i.naturalHeight).map(i => i.src)})"`

**Returns:** The result of the JavaScript expression. Objects and arrays are serialized. Errors return the error message and stack trace.
