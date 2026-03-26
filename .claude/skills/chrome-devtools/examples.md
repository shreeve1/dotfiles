# Chrome DevTools MCP Workflow Examples

Practical diagnostic workflows using Chrome DevTools MCP tools. Each example shows the complete sequence of tool calls for a real diagnostic scenario.

---

## Example 1: Console Error Investigation

**Scenario:** An application loads and renders, but interactive features are broken. Users report buttons not working and form submissions failing silently.

**Goal:** Find and diagnose JavaScript errors causing the broken behavior.

### Steps

**1. Connect and identify the page**

Call `mcp__chrome_devtools__list_pages` to see all open tabs and find the target application.

**2. Select the target page**

Call `mcp__chrome_devtools__select_page` with the page ID of the application tab.

**3. Navigate to the problematic page**

Call `mcp__chrome_devtools__navigate_page` with `url: "http://localhost:3000/dashboard"`.

**4. Wait for the page to settle**

Call `mcp__chrome_devtools__wait_for` with `event: "networkidle"` to ensure all resources have loaded.

**5. List all console messages**

Call `mcp__chrome_devtools__list_console_messages` with `type: "error"` to get only error messages.

**6. Get details on each error**

For each error returned, call `mcp__chrome_devtools__get_console_message` with the `messageId` to get full error text, source location, and stack trace.

**7. Inspect related DOM state**

Call `mcp__chrome_devtools__evaluate_script` with an expression to check the state of affected elements:

```javascript
JSON.stringify({
  submitBtn: document.querySelector('#submit-btn')?.disabled,
  formAction: document.querySelector('form')?.action,
  eventListeners: typeof document.querySelector('#submit-btn')?.onclick
})
```

**8. Check for unhandled promise rejections**

Call `mcp__chrome_devtools__list_console_messages` without a type filter and look for "Unhandled" or "UnhandledPromiseRejection" in the results.

**9. Summarize findings**

Compile the errors, their source locations, stack traces, and DOM state into a diagnostic report identifying root causes and suggested fixes.

---

## Example 2: Network Failure Diagnosis

**Scenario:** A single-page application loads its shell but API data is missing. Components show loading spinners indefinitely or display "failed to load" messages.

**Goal:** Identify which API calls are failing and why.

### Steps

**1. Connect and select the page**

Call `mcp__chrome_devtools__list_pages`, then `mcp__chrome_devtools__select_page`.

**2. Navigate to the page**

Call `mcp__chrome_devtools__navigate_page` with `url: "http://localhost:3000/products"`.

**3. Wait for network activity to complete**

Call `mcp__chrome_devtools__wait_for` with `event: "networkidle"`.

**4. List all network requests**

Call `mcp__chrome_devtools__list_network_requests` to get the full request list.

**5. Identify failures**

Review the results for:
- Status codes 4xx (client errors) and 5xx (server errors)
- Status code 0 (network failures, CORS blocks)
- Requests with unusually long response times (>1s)

**6. Get details on failed requests**

For each failed request, call `mcp__chrome_devtools__get_network_request` with the `requestId`. Examine:
- Request headers (missing Authorization, incorrect Content-Type)
- Response headers (CORS headers: Access-Control-Allow-Origin)
- Response body (error messages from the server)
- Timing breakdown (DNS, connection, TLS, waiting, download)

**7. Check client-side error handling**

Call `mcp__chrome_devtools__evaluate_script` to inspect how the app handles failed fetches:

```javascript
JSON.stringify({
  errorBoundaries: document.querySelectorAll('[data-error]').length,
  retryButtons: document.querySelectorAll('[data-retry]').length,
  loadingSpinners: document.querySelectorAll('.loading, .spinner, [aria-busy="true"]').length
})
```

**8. Check console for related errors**

Call `mcp__chrome_devtools__list_console_messages` with `type: "error"` to catch any fetch-related console errors.

**9. Summarize findings**

Report each failing endpoint with: URL, status code, error message, missing headers, and recommended fix (e.g., add CORS headers, fix auth token, handle timeout).

---

## Example 3: Performance Trace and Analysis

**Scenario:** Users report that a page feels sluggish -- slow initial load, janky scrolling, and delayed interactions.

**Goal:** Profile the page and identify performance bottlenecks.

### Steps

**1. Connect and select the page**

Call `mcp__chrome_devtools__list_pages`, then `mcp__chrome_devtools__select_page`.

**2. Navigate to the page**

Call `mcp__chrome_devtools__navigate_page` with `url: "http://localhost:3000"`.

**3. Start performance recording**

Call `mcp__chrome_devtools__performance_start_trace` to begin capturing performance data.

**4. Simulate user interactions**

Perform typical user actions to capture their performance impact:

Call `mcp__chrome_devtools__wait_for` with `event: "load"`.

Call `mcp__chrome_devtools__click` with `selector: "#main-nav a:nth-child(2)"` to trigger a navigation.

Call `mcp__chrome_devtools__evaluate_script` with `expression: "window.scrollBy(0, 1000)"` to simulate scrolling.

Call `mcp__chrome_devtools__wait_for` with `event: "networkidle"`.

**5. Stop the trace**

Call `mcp__chrome_devtools__performance_stop_trace` to end recording and capture the trace.

**6. Analyze the trace**

Call `mcp__chrome_devtools__performance_analyze_insight` to get automated analysis of the trace, including long tasks, layout shifts, and rendering bottlenecks.

**7. Measure Core Web Vitals**

Call `mcp__chrome_devtools__evaluate_script` to extract Web Vitals data:

```javascript
JSON.stringify({
  navigation: performance.getEntriesByType('navigation')[0],
  lcp: performance.getEntriesByType('largest-contentful-paint').slice(-1)[0],
  cls: performance.getEntriesByType('layout-shift').reduce((sum, e) => sum + e.value, 0),
  longTasks: performance.getEntriesByType('longtask').map(t => ({
    duration: t.duration,
    startTime: t.startTime,
    name: t.name
  })),
  resourceCount: performance.getEntriesByType('resource').length,
  totalTransferSize: performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.transferSize || 0), 0)
})
```

**8. Check for render-blocking resources**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify({
  blockingScripts: [...document.querySelectorAll('script:not([async]):not([defer])[src]')].map(s => s.src),
  blockingStyles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href),
  largeImages: [...document.images].filter(i => i.naturalWidth * i.naturalHeight > 1000000).map(i => ({src: i.src, width: i.naturalWidth, height: i.naturalHeight}))
})
```

**9. Summarize findings**

Report: LCP value, CLS score, long task count and durations, render-blocking resources, total transfer size, and specific optimization recommendations.

---

## Example 4: Responsive Layout Check

**Scenario:** A feature has been implemented and needs to be verified across desktop, tablet, and mobile viewports before release.

**Goal:** Check that layout adapts correctly at each breakpoint and identify any overflow or alignment issues.

### Steps

**1. Navigate to the target page**

Call `mcp__chrome_devtools__navigate_page` with `url: "http://localhost:3000/feature-page"`.

Call `mcp__chrome_devtools__wait_for` with `event: "networkidle"`.

**2. Desktop viewport (1920x1080)**

Call `mcp__chrome_devtools__resize_page` with `width: 1920`, `height: 1080`.

Call `mcp__chrome_devtools__take_screenshot` with `filename: "/tmp/desktop-1920x1080.png"`.

Call `mcp__chrome_devtools__take_snapshot` to capture the accessibility tree at this viewport.

**3. Tablet viewport (768x1024)**

Call `mcp__chrome_devtools__resize_page` with `width: 768`, `height: 1024`.

Call `mcp__chrome_devtools__take_screenshot` with `filename: "/tmp/tablet-768x1024.png"`.

Call `mcp__chrome_devtools__take_snapshot` to capture the accessibility tree at this viewport.

**4. Mobile viewport (375x667)**

Call `mcp__chrome_devtools__resize_page` with `width: 375`, `height: 667`.

Call `mcp__chrome_devtools__take_screenshot` with `filename: "/tmp/mobile-375x667.png"`.

Call `mcp__chrome_devtools__take_snapshot` to capture the accessibility tree at this viewport.

**5. Check for horizontal overflow**

At the mobile viewport, call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify({
  bodyScrollWidth: document.body.scrollWidth,
  viewportWidth: window.innerWidth,
  hasOverflow: document.body.scrollWidth > window.innerWidth,
  overflowingElements: [...document.querySelectorAll('*')].filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.right > window.innerWidth || rect.left < 0;
  }).map(el => ({
    tag: el.tagName,
    class: el.className,
    id: el.id,
    width: el.getBoundingClientRect().width,
    right: el.getBoundingClientRect().right
  })).slice(0, 20)
})
```

**6. Check touch target sizes on mobile**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify(
  [...document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]')]
    .map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: el.textContent?.substring(0, 30),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        tooSmall: rect.width < 44 || rect.height < 44
      };
    })
    .filter(el => el.tooSmall)
    .slice(0, 20)
)
```

**7. Compare snapshots**

Review the three accessibility tree snapshots. Check that:
- Navigation collapses to a hamburger menu on mobile
- Content reflows to single column on narrow viewports
- No elements are hidden that should be visible
- Interactive elements remain accessible at all sizes

**8. Summarize findings**

Report: viewport-specific layout issues, overflow problems, touch target violations, and screenshots for visual reference.

---

## Example 5: Accessibility Inspection

**Scenario:** A page needs an accessibility audit before launch to identify WCAG compliance issues.

**Goal:** Check heading hierarchy, alt text, form labels, focus order, and ARIA usage.

### Steps

**1. Navigate to the page**

Call `mcp__chrome_devtools__navigate_page` with `url: "http://localhost:3000/landing"`.

Call `mcp__chrome_devtools__wait_for` with `event: "networkidle"`.

**2. Capture the accessibility tree**

Call `mcp__chrome_devtools__take_snapshot` to get the full accessibility tree. This reveals how assistive technologies see the page -- roles, names, states, and hierarchy.

**3. Audit heading hierarchy**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify(
  [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h, i) => ({
    index: i,
    level: parseInt(h.tagName[1]),
    text: h.textContent.trim().substring(0, 80),
    visible: h.offsetParent !== null
  }))
)
```

Check for: single h1, no skipped levels (h1 to h3 without h2), logical nesting.

**4. Audit image alt text**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify(
  [...document.images].map(img => ({
    src: img.src.split('/').pop(),
    alt: img.alt,
    hasAlt: img.hasAttribute('alt'),
    isDecorative: img.alt === '',
    role: img.getAttribute('role'),
    width: img.naturalWidth,
    height: img.naturalHeight
  }))
)
```

Check for: missing alt attributes, empty alt on non-decorative images, meaningful alt text.

**5. Audit form labels**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify(
  [...document.querySelectorAll('input, select, textarea')].map(el => ({
    type: el.type,
    id: el.id,
    name: el.name,
    hasLabel: !!document.querySelector(`label[for="${el.id}"]`),
    ariaLabel: el.getAttribute('aria-label'),
    ariaLabelledBy: el.getAttribute('aria-labelledby'),
    placeholder: el.placeholder,
    isLabelled: !!(
      document.querySelector(`label[for="${el.id}"]`) ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.closest('label')
    )
  }))
)
```

Check for: inputs without any label mechanism, reliance on placeholder only.

**6. Audit focus order and keyboard accessibility**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify({
  focusableElements: [...document.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )].map((el, i) => ({
    index: i,
    tag: el.tagName,
    text: (el.textContent || el.value || el.placeholder || '').substring(0, 40),
    tabIndex: el.tabIndex,
    visible: el.offsetParent !== null,
    disabled: el.disabled
  })),
  negativeTabIndex: [...document.querySelectorAll('[tabindex]')]
    .filter(el => el.tabIndex < 0)
    .map(el => ({tag: el.tagName, id: el.id, class: el.className})),
  positiveTabIndex: [...document.querySelectorAll('[tabindex]')]
    .filter(el => el.tabIndex > 0)
    .map(el => ({tag: el.tagName, id: el.id, tabIndex: el.tabIndex}))
})
```

Check for: positive tabindex values (anti-pattern), interactive elements with tabindex="-1", logical focus order.

**7. Audit ARIA usage**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify({
  landmarks: [...document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="search"], header, nav, main, footer, aside')]
    .map(el => ({tag: el.tagName, role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label')})),
  liveRegions: [...document.querySelectorAll('[aria-live], [role="alert"], [role="status"], [role="log"]')]
    .map(el => ({tag: el.tagName, role: el.getAttribute('role'), ariaLive: el.getAttribute('aria-live')})),
  ariaHidden: [...document.querySelectorAll('[aria-hidden="true"]')]
    .filter(el => el.offsetParent !== null)
    .map(el => ({tag: el.tagName, id: el.id, text: el.textContent?.substring(0, 40)}))
    .slice(0, 10)
})
```

Check for: missing landmarks, visible elements with aria-hidden, appropriate live regions for dynamic content.

**8. Check color contrast data**

Call `mcp__chrome_devtools__evaluate_script`:

```javascript
JSON.stringify(
  [...document.querySelectorAll('p, span, a, button, label, h1, h2, h3, h4, h5, h6, li, td, th')]
    .slice(0, 30)
    .map(el => {
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.textContent?.substring(0, 30),
        color: style.color,
        background: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight
      };
    })
)
```

Extract foreground and background color pairs for contrast ratio checking.

**9. Summarize findings**

Compile a report organized by category:
- Heading hierarchy issues
- Missing or inadequate alt text
- Unlabelled form controls
- Focus order problems
- ARIA misuse
- Potential contrast issues
- Recommended fixes with WCAG success criteria references
